import { buildSubmitPayload } from './submitOnboarding'
import type { OnboardingFormData, SubmitFilePayload } from '../types/onboarding'
import type { AuthSession, DashboardResponse } from '../types/workflow'

const API_URL = import.meta.env.VITE_APPS_SCRIPT_URL || '/api/onboarding'

async function workflowRequest<T>(action: string, data: Record<string, unknown>): Promise<T> {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action, data }),
  })

  const text = await response.text()
  if (!response.ok) throw new Error(`Request failed with status ${response.status}`)

  const result = JSON.parse(text) as { success: boolean; error?: string } & T
  if (!result.success) throw new Error(result.error || 'Request failed')
  return result
}

export async function register(phone: string, password: string) {
  return workflowRequest<{
    sessionToken: string
    expiresAt: string
    merchantCode: string
    storeCode: string
    onboardingId: string
    workflowStatus: string
  }>('register', { phone, password })
}

export async function login(phone: string, password: string) {
  return workflowRequest<{
    sessionToken: string
    expiresAt: string
    role: 'CUSTOMER' | 'ADMIN'
    merchantCode: string
    storeCode: string
    onboardingId: string
    workflowStatus: string
  }>('login', { phone, password })
}

export async function adminLogin(phone: string, password: string) {
  return workflowRequest<{
    sessionToken: string
    expiresAt: string
    role: 'ADMIN'
    name: string
  }>('adminLogin', { phone, password })
}

export async function logout(sessionToken: string) {
  return workflowRequest<{ success: boolean }>('logout', { sessionToken })
}

export async function getSession(sessionToken: string) {
  return workflowRequest<{
    phone: string
    role: 'CUSTOMER' | 'ADMIN'
    merchantCode: string
    storeCode: string
    onboardingId: string
    workflowStatus: string
    isReadOnly: boolean
  }>('getSession', { sessionToken })
}

export async function getDashboard(sessionToken: string) {
  return workflowRequest<DashboardResponse>('getDashboard', { sessionToken })
}

export async function saveWorkflowStep(
  sessionToken: string,
  step: number,
  formData: Partial<OnboardingFormData>,
) {
  const merged = { ...emptyForm(), ...formData, latitude: formData.latitude ?? 0, longitude: formData.longitude ?? 0 }
  const data = buildSubmitPayload(merged)
  return workflowRequest<{
    step: number
    workflowStatus: string
    steps: DashboardResponse['dashboard']['steps']
    overallProgress: number
  }>('saveWorkflowStep', { sessionToken, step, data })
}

export async function confirmDataReview(sessionToken: string) {
  return workflowRequest<{
    reviewConfirmed: boolean
    steps: DashboardResponse['dashboard']['steps']
    overallProgress: number
  }>('confirmDataReview', { sessionToken, confirmed: true })
}

export async function saveAgreements(sessionToken: string, merchantAgreement?: SubmitFilePayload | null) {
  return workflowRequest<{ steps: DashboardResponse['dashboard']['steps']; overallProgress: number }>(
    'saveAgreements',
    { sessionToken, accepted: true, merchantAgreement: merchantAgreement || null },
  )
}

export async function skipStoreAssetsStep(sessionToken: string) {
  return workflowRequest<{
    storeAssetsSkipped: boolean
    steps: DashboardResponse['dashboard']['steps']
    overallProgress: number
  }>('skipStoreAssetsStep', { sessionToken })
}

export async function skipCatalogStep(sessionToken: string) {
  return workflowRequest<{
    catalogSkipped: boolean
    steps: DashboardResponse['dashboard']['steps']
    overallProgress: number
  }>('skipCatalogStep', { sessionToken })
}

export async function submitWorkflow(sessionToken: string, formData: OnboardingFormData) {
  const merged = { ...emptyForm(), ...formData, latitude: formData.latitude ?? 0, longitude: formData.longitude ?? 0 }
  const data = buildSubmitPayload(merged)
  return workflowRequest<{
    onboardingId: string
    merchantCode: string
    storeCode: string
    workflowStatus: string
    completionPercentage: number
  }>('submitWorkflow', { sessionToken, data })
}

function emptyForm(): OnboardingFormData {
  return {
    storeName: '',
    businessName: '',
    ownerName: '',
    gstNumber: '',
    panNumber: '',
    primaryPhone: '',
    secondaryPhone: '',
    emailAddress: '',
    storeAddress: '',
    landmark: '',
    city: '',
    state: '',
    pincode: '',
    latitude: null,
    longitude: null,
    deliveryRadius: '',
    minimumOrderAmount: '',
    deliveryCharge: '',
    freeDeliveryAbove: '',
    codEnabled: true,
    onlinePaymentEnabled: true,
    timings: {
      monday: { openTime: '09:00', closeTime: '21:00', closed: false },
      tuesday: { openTime: '09:00', closeTime: '21:00', closed: false },
      wednesday: { openTime: '09:00', closeTime: '21:00', closed: false },
      thursday: { openTime: '09:00', closeTime: '21:00', closed: false },
      friday: { openTime: '09:00', closeTime: '21:00', closed: false },
      saturday: { openTime: '09:00', closeTime: '21:00', closed: false },
      sunday: { openTime: '09:00', closeTime: '21:00', closed: false },
    },
    storeDescription: '',
    brandColor: '#2563eb',
    logo: null,
    banner: null,
    adminName: '',
    adminEmail: '',
    adminPhone: '',
    whatsappNumber: '',
    supportPhone: '',
    supportEmail: '',
    deliveryModel: '',
    estimatedDeliveryTime: '',
    gstCertificate: null,
    panCard: null,
    fssaiLicense: null,
    businessRegistration: null,
    accountHolderName: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    upiId: '',
    storeFrontPhoto: null,
    storeInteriorPhoto: null,
    merchantAgreement: null,
    storeAssetsSkipped: false,
    reviewConfirmed: false,
  }
}

export function sessionToAuth(session: {
  sessionToken: string
  expiresAt?: string
  role?: 'CUSTOMER' | 'ADMIN'
  phone?: string
  merchantCode?: string | null
  storeCode?: string | null
  onboardingId?: string | null
  workflowStatus?: string
  isReadOnly?: boolean
  name?: string
}): AuthSession {
  return {
    sessionToken: session.sessionToken,
    expiresAt: session.expiresAt || '',
    role: session.role || 'CUSTOMER',
    phone: session.phone || '',
    merchantCode: session.merchantCode ?? null,
    storeCode: session.storeCode ?? null,
    onboardingId: session.onboardingId ?? null,
    workflowStatus: (session.workflowStatus as AuthSession['workflowStatus']) || 'DRAFT',
    isReadOnly: session.isReadOnly ?? false,
    adminName: session.name,
  }
}
