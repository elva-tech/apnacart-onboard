import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { STORAGE_KEY } from '../constants/steps'
import type { OnboardingFormData, OnboardingState, SubmitOnboardingResponse } from '../types/onboarding'
import { createDefaultFormData } from '../utils/onboarding'
import { useBeforeUnload } from '../hooks/useBeforeUnload'

interface OnboardingContextValue {
  state: OnboardingState
  updateFormData: (partial: Partial<OnboardingFormData>) => void
  setCurrentStep: (step: number) => void
  markSubmitted: (result: Pick<SubmitOnboardingResponse, 'onboardingId' | 'merchantCode' | 'storeCode'>) => void
  resetOnboarding: () => void
  isDirty: boolean
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null)

function loadState(): OnboardingState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored) as OnboardingState
      return {
        ...parsed,
        formData: { ...createDefaultFormData(), ...parsed.formData },
        merchantCode: parsed.merchantCode ?? null,
        storeCode: parsed.storeCode ?? null,
      }
    }
  } catch {
    // ignore corrupt storage
  }

  return {
    currentStep: 0,
    formData: createDefaultFormData(),
    submitted: false,
    onboardingId: null,
    merchantCode: null,
    storeCode: null,
  }
}

function saveState(state: OnboardingState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<OnboardingState>(loadState)

  const isDirty = useMemo(
    () => state.currentStep > 0 && !state.submitted,
    [state.currentStep, state.submitted],
  )

  useBeforeUnload(isDirty)

  useEffect(() => {
    saveState(state)
  }, [state])

  const updateFormData = useCallback((partial: Partial<OnboardingFormData>) => {
    setState((prev) => ({
      ...prev,
      formData: { ...prev.formData, ...partial },
    }))
  }, [])

  const setCurrentStep = useCallback((step: number) => {
    setState((prev) => ({ ...prev, currentStep: step }))
  }, [])

  const markSubmitted = useCallback(
    (result: Pick<SubmitOnboardingResponse, 'onboardingId' | 'merchantCode' | 'storeCode'>) => {
      setState((prev) => ({
        ...prev,
        submitted: true,
        onboardingId: result.onboardingId ?? null,
        merchantCode: result.merchantCode ?? null,
        storeCode: result.storeCode ?? null,
        currentStep: 11,
      }))
    },
    [],
  )

  const resetOnboarding = useCallback(() => {
    const fresh: OnboardingState = {
      currentStep: 0,
      formData: createDefaultFormData(),
      submitted: false,
      onboardingId: null,
      merchantCode: null,
      storeCode: null,
    }
    setState(fresh)
    saveState(fresh)
  }, [])

  const value = useMemo(
    () => ({
      state,
      updateFormData,
      setCurrentStep,
      markSubmitted,
      resetOnboarding,
      isDirty,
    }),
    [state, updateFormData, setCurrentStep, markSubmitted, resetOnboarding, isDirty],
  )

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>
}

export function useOnboarding() {
  const context = useContext(OnboardingContext)
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider')
  }
  return context
}
