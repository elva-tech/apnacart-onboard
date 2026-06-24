import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { SESSION_STORAGE_KEY, isWorkflowReadOnlyStatus } from '../constants/workflow'
import {
  adminLogin as apiAdminLogin,
  getDashboard,
  getSession,
  login as apiLogin,
  logout as apiLogout,
  register as apiRegister,
  sessionToAuth,
} from '../api/workflowApi'
import type { AuthSession, DashboardData } from '../types/workflow'
import { mergeApiFormData } from '../utils/onboarding'
import { useOnboarding } from './OnboardingContext'

interface AuthContextValue {
  session: AuthSession | null
  dashboard: DashboardData | null
  loading: boolean
  signIn: (phone: string, password: string) => Promise<'ADMIN' | 'CUSTOMER'>
  login: (phone: string, password: string) => Promise<void>
  adminLogin: (phone: string, password: string) => Promise<void>
  register: (phone: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshDashboard: () => Promise<void>
  isReadOnly: boolean
  canEdit: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

function loadSession(): AuthSession | null {
  try {
    const stored = localStorage.getItem(SESSION_STORAGE_KEY)
    if (stored) return JSON.parse(stored) as AuthSession
  } catch {
    // ignore
  }
  return null
}

function saveSession(session: AuthSession | null) {
  if (session) localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
  else localStorage.removeItem(SESSION_STORAGE_KEY)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(loadSession)
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(!!loadSession())
  const { updateFormData, markSubmitted } = useOnboarding()

  const applySession = useCallback(
    (auth: AuthSession) => {
      setSession(auth)
      saveSession(auth)
      if (auth.merchantCode) {
        markSubmitted({
          onboardingId: auth.onboardingId || '',
          merchantCode: auth.merchantCode,
          storeCode: auth.storeCode || '',
        })
      }
    },
    [markSubmitted],
  )

  const refreshDashboard = useCallback(async () => {
    if (!session?.sessionToken || session.role !== 'CUSTOMER') return
    const result = await getDashboard(session.sessionToken)
    setDashboard(result.dashboard)
    if (result.formData) {
      const formData = result.formData as Record<string, unknown>
      updateFormData(mergeApiFormData(formData))
    }
    setSession((prev) =>
      prev
        ? {
            ...prev,
            workflowStatus: result.dashboard.workflowStatus,
            isReadOnly: result.dashboard.isReadOnly,
          }
        : prev,
    )
    saveSession({
      ...session,
      workflowStatus: result.dashboard.workflowStatus,
      isReadOnly: result.dashboard.isReadOnly,
    })
  }, [session, updateFormData])

  useEffect(() => {
    if (!session?.sessionToken) {
      setLoading(false)
      return
    }

    let cancelled = false
    ;(async () => {
      try {
        const valid = await getSession(session.sessionToken)
        if (cancelled) return
        const updated = {
          ...session,
          workflowStatus: valid.workflowStatus as AuthSession['workflowStatus'],
          isReadOnly: valid.isReadOnly,
          merchantCode: valid.merchantCode || session.merchantCode,
          storeCode: valid.storeCode || session.storeCode,
          onboardingId: valid.onboardingId || session.onboardingId,
        }
        setSession(updated)
        saveSession(updated)
        if (updated.role === 'CUSTOMER') await refreshDashboard()
      } catch {
        if (!cancelled) {
          setSession(null)
          saveSession(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const login = useCallback(
    async (phone: string, password: string) => {
      const result = await apiLogin(phone, password)
      applySession(
        sessionToAuth({
          sessionToken: result.sessionToken,
          expiresAt: result.expiresAt,
          role: result.role,
          phone,
          merchantCode: result.merchantCode,
          storeCode: result.storeCode,
          onboardingId: result.onboardingId,
          workflowStatus: result.workflowStatus,
          isReadOnly: isWorkflowReadOnlyStatus(result.workflowStatus),
        }),
      )
    },
    [applySession],
  )

  const adminLogin = useCallback(async (phone: string, password: string) => {
    const result = await apiAdminLogin(phone, password)
    applySession(
      sessionToAuth({
        sessionToken: result.sessionToken,
        expiresAt: result.expiresAt,
        role: 'ADMIN',
        phone,
        name: result.name,
        workflowStatus: 'DRAFT',
        isReadOnly: false,
      }),
    )
  }, [applySession])

  const signIn = useCallback(
    async (phone: string, password: string): Promise<'ADMIN' | 'CUSTOMER'> => {
      try {
        const result = await apiLogin(phone, password)
        applySession(
          sessionToAuth({
            sessionToken: result.sessionToken,
            expiresAt: result.expiresAt,
            role: result.role,
            phone,
            merchantCode: result.merchantCode,
            storeCode: result.storeCode,
            onboardingId: result.onboardingId,
            workflowStatus: result.workflowStatus,
            isReadOnly:
              result.role === 'CUSTOMER' && isWorkflowReadOnlyStatus(result.workflowStatus),
          }),
        )
        return result.role === 'ADMIN' ? 'ADMIN' : 'CUSTOMER'
      } catch {
        try {
          await adminLogin(phone, password)
          return 'ADMIN'
        } catch {
          throw new Error('Invalid phone or password')
        }
      }
    },
    [applySession, adminLogin],
  )

  const register = useCallback(
    async (phone: string, password: string) => {
      const result = await apiRegister(phone, password)
      applySession(
        sessionToAuth({
          sessionToken: result.sessionToken,
          expiresAt: result.expiresAt,
          role: 'CUSTOMER',
          phone,
          merchantCode: result.merchantCode,
          storeCode: result.storeCode,
          onboardingId: result.onboardingId,
          workflowStatus: result.workflowStatus,
          isReadOnly: false,
        }),
      )
    },
    [applySession],
  )

  const logout = useCallback(async () => {
    if (session?.sessionToken) {
      try {
        await apiLogout(session.sessionToken)
      } catch {
        // ignore
      }
    }
    setSession(null)
    setDashboard(null)
    saveSession(null)
  }, [session])

  const isReadOnly = dashboard?.isReadOnly ?? session?.isReadOnly ?? false
  const canEdit =
    session?.role === 'CUSTOMER' && (dashboard?.canEdit ?? !isReadOnly)

  const value = useMemo(
    () => ({
      session,
      dashboard,
      loading,
      signIn,
      login,
      adminLogin,
      register,
      logout,
      refreshDashboard,
      isReadOnly,
      canEdit,
    }),
    [session, dashboard, loading, signIn, login, adminLogin, register, logout, refreshDashboard, isReadOnly, canEdit],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
