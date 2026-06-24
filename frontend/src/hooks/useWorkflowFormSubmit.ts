import { useCallback, useState } from 'react'
import type { OnboardingFormData } from '../types/onboarding'
import { useOnboarding } from '../context/OnboardingContext'
import { useStepSave } from './useStepSave'
import { useWorkflowFormActions } from './useWorkflowFormActions'

export function useWorkflowFormSubmit(workflowStepId: number) {
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const { updateFormData } = useOnboarding()
  const { saveStep, canEdit } = useStepSave()
  const { returnToHub } = useWorkflowFormActions(workflowStepId)

  const submitAndReturn = useCallback(
    async (partial: Partial<OnboardingFormData>) => {
      if (!canEdit) return
      setSaving(true)
      setSaveError(null)
      try {
        updateFormData(partial)
        await saveStep(partial, workflowStepId)
        returnToHub()
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : 'Failed to save. Please try again.')
      } finally {
        setSaving(false)
      }
    },
    [canEdit, updateFormData, saveStep, workflowStepId, returnToHub],
  )

  return { saving, saveError, submitAndReturn, returnToHub, canEdit }
}
