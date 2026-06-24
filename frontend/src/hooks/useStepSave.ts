import { useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { saveWorkflowStep } from '../api/workflowApi'
import { getWorkflowStepIdForPath } from '../constants/workflow'
import { useAuth } from '../context/AuthContext'
import { useOnboarding } from '../context/OnboardingContext'
import type { OnboardingFormData } from '../types/onboarding'
import { stripUnchangedFileFields } from '../utils/onboarding'

export function useStepSave() {
  const location = useLocation()
  const { session, canEdit, refreshDashboard } = useAuth()
  const { state } = useOnboarding()

  const getStepForRoute = useCallback((path: string = location.pathname) => {
    return getWorkflowStepIdForPath(path)
  }, [location.pathname])

  const saveStep = useCallback(
    async (partial?: Partial<OnboardingFormData>, step?: number) => {
      if (!session?.sessionToken || !canEdit) return
      const merged = { ...state.formData, ...partial }
      const stepNum = step ?? getStepForRoute()
      const payload = stripUnchangedFileFields(merged, partial)
      try {
        await saveWorkflowStep(session.sessionToken, stepNum, payload)
        await refreshDashboard()
      } catch (err) {
        console.error('Save failed:', err)
        throw err
      }
    },
    [session, canEdit, state.formData, getStepForRoute, refreshDashboard],
  )

  return { saveStep, getStepForRoute, canEdit, isReadOnly: !canEdit }
}
