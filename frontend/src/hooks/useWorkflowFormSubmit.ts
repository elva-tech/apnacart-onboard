import { useCallback, useState } from 'react'
import type { OnboardingFormData } from '../types/onboarding'
import { useOnboarding } from '../context/OnboardingContext'
import { useStepSave } from './useStepSave'
import { useWorkflowFormActions } from './useWorkflowFormActions'

export function useWorkflowFormSubmit(workflowStepId: number) {
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const { updateFormData } = useOnboarding()
  const { saveStep } = useStepSave()
  const { returnToDashboard, returnToHub } = useWorkflowFormActions(workflowStepId)

  const submitAndReturn = useCallback(
    async (partial: Partial<OnboardingFormData>) => {
      setSaving(true)
      setSaveError(null)
      try {
        updateFormData(partial)
        await saveStep(partial, workflowStepId)
        returnToDashboard()
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : 'Failed to save. Please try again.')
      } finally {
        setSaving(false)
      }
    },
    [updateFormData, saveStep, workflowStepId, returnToDashboard],
  )

  return { saving, saveError, submitAndReturn, returnToHub }
}
