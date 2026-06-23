import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { storeAssetsSchema, type StoreAssetsForm } from '../schemas/onboarding'
import { useOnboarding } from '../context/OnboardingContext'
import { useWorkflowFormSubmit } from '../hooks/useWorkflowFormSubmit'
import { ImageUpload } from '../components/ImageUpload'
import { Card } from '../components/ui/Card'
import { WorkflowFormLayout } from '../components/workflow/WorkflowFormLayout'
import { WorkflowFormNavigation } from '../components/workflow/WorkflowFormNavigation'

export function StoreAssetsPage() {
  const { state } = useOnboarding()
  const { saving, saveError, submitAndReturn, returnToHub } = useWorkflowFormSubmit(1)

  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<StoreAssetsForm>({
    resolver: zodResolver(storeAssetsSchema),
    defaultValues: {
      storeFrontPhoto: state.formData.storeFrontPhoto,
      storeInteriorPhoto: state.formData.storeInteriorPhoto,
    },
  })

  const onSubmit = (data: StoreAssetsForm) => submitAndReturn(data)

  return (
    <WorkflowFormLayout workflowStepId={1} title="Store Assets" subtitle="Upload photos of your store front and interior.">
      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Controller
            name="storeFrontPhoto"
            control={control}
            render={({ field }) => (
              <ImageUpload
                label="Store Front Photo"
                required
                value={field.value}
                onChange={field.onChange}
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
                required
                value={field.value}
                onChange={field.onChange}
                error={errors.storeInteriorPhoto?.message as string | undefined}
              />
            )}
          />

          <WorkflowFormNavigation
            onCancel={returnToHub}
            cancelLabel="Back to Store Information"
            saveLoading={saving}
            saveError={saveError}
          />
        </form>
      </Card>
    </WorkflowFormLayout>
  )
}
