import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createStoreAssetsSchema, type StoreAssetsForm } from '../schemas/onboarding'
import { skipStoreAssetsStep } from '../api/workflowApi'
import { useAuth } from '../context/AuthContext'
import { useOnboarding } from '../context/OnboardingContext'
import { useWorkflowFormSubmit } from '../hooks/useWorkflowFormSubmit'
import { pickDirtyFileFields } from '../utils/onboarding'
import { ImageUpload } from '../components/ImageUpload'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { WorkflowFormLayout } from '../components/workflow/WorkflowFormLayout'
import { WorkflowFormNavigation } from '../components/workflow/WorkflowFormNavigation'

export function StoreAssetsPage() {
  const { state } = useOnboarding()
  const { session, canEdit, refreshDashboard } = useAuth()
  const { saving, saveError, submitAndReturn, returnToHub } = useWorkflowFormSubmit(1)

  const [showSkipDialog, setShowSkipDialog] = useState(false)
  const [skipping, setSkipping] = useState(false)
  const [skipError, setSkipError] = useState<string | null>(null)

  const {
    handleSubmit,
    control,
    formState: { errors, dirtyFields },
  } = useForm<StoreAssetsForm>({
    resolver: zodResolver(
      createStoreAssetsSchema({
        storeFrontPhotoUrl: state.formData.storeFrontPhotoUrl,
        storeInteriorPhotoUrl: state.formData.storeInteriorPhotoUrl,
      }),
    ),
    defaultValues: {
      storeFrontPhoto: state.formData.storeFrontPhoto,
      storeInteriorPhoto: state.formData.storeInteriorPhoto,
    },
  })

  const onSubmit = (data: StoreAssetsForm) => {
    submitAndReturn(
      pickDirtyFileFields({
        ...(dirtyFields.storeFrontPhoto ? { storeFrontPhoto: data.storeFrontPhoto } : {}),
        ...(dirtyFields.storeInteriorPhoto ? { storeInteriorPhoto: data.storeInteriorPhoto } : {}),
      }),
    )
  }

  const handleSkipConfirm = async () => {
    if (!session?.sessionToken) return
    setSkipping(true)
    setSkipError(null)
    try {
      await skipStoreAssetsStep(session.sessionToken)
      await refreshDashboard()
      setShowSkipDialog(false)
      returnToHub()
    } catch (err) {
      setSkipError(err instanceof Error ? err.message : 'Failed to skip store assets')
    } finally {
      setSkipping(false)
    }
  }

  return (
    <WorkflowFormLayout
      workflowStepId={1}
      title="Store Assets"
      subtitle="Optionally upload photos of your store. You can skip this and add photos later from your admin portal."
    >
      {state.formData.storeAssetsSkipped && (
        <Card className="mb-4 border-amber-200 bg-amber-50">
          <p className="text-sm font-medium text-amber-900">Store assets skipped</p>
          <p className="mt-1 text-sm text-amber-800">You can upload store photos later from your admin portal.</p>
        </Card>
      )}

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Controller
            name="storeFrontPhoto"
            control={control}
            render={({ field }) => (
              <ImageUpload
                label="Store Front Photo"
                value={field.value}
                onChange={field.onChange}
                existingUrl={state.formData.storeFrontPhotoUrl}
                error={errors.storeFrontPhoto?.message as string | undefined}
              />
            )}
          />
          <Controller
            name="storeInteriorPhoto"
            control={control}
            render={({ field }) => (
              <ImageUpload
                label="Store Interior Photo"
                value={field.value}
                onChange={field.onChange}
                existingUrl={state.formData.storeInteriorPhotoUrl}
                error={errors.storeInteriorPhoto?.message as string | undefined}
              />
            )}
          />

          {skipError && <p className="text-sm text-red-600">{skipError}</p>}

          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-slate-600">
              Don&apos;t have store photos ready? You can skip this step and add them later in your admin portal.
            </p>
            <Button
              type="button"
              variant="outline"
              className="mt-3"
              onClick={() => setShowSkipDialog(true)}
              disabled={!canEdit || state.formData.storeAssetsSkipped}
            >
              Skip and mark complete
            </Button>
          </div>

          <WorkflowFormNavigation
            onCancel={returnToHub}
            cancelLabel="Back to Store Information"
            saveLoading={saving}
            saveError={saveError}
          />
        </form>
      </Card>

      <ConfirmDialog
        open={showSkipDialog}
        title="Skip Store Assets?"
        message="This step will be marked complete without photos. You can upload store images later from your admin portal."
        confirmLabel="Skip and mark complete"
        cancelLabel="Cancel"
        loading={skipping}
        onConfirm={() => void handleSkipConfirm()}
        onCancel={() => setShowSkipDialog(false)}
      />
    </WorkflowFormLayout>
  )
}
