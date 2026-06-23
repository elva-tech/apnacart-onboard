import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { storeLocationSchema, type StoreLocationForm } from '../schemas/onboarding'
import { INDIAN_STATES } from '../constants/indianStates'
import { useOnboarding } from '../context/OnboardingContext'
import { useWorkflowFormSubmit } from '../hooks/useWorkflowFormSubmit'
import { MapPicker } from '../components/MapPicker'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Textarea } from '../components/ui/Textarea'
import { WorkflowFormLayout } from '../components/workflow/WorkflowFormLayout'
import { WorkflowFormNavigation } from '../components/workflow/WorkflowFormNavigation'

export function StoreLocationPage() {
  const { state } = useOnboarding()
  const { saving, saveError, submitAndReturn, returnToHub } = useWorkflowFormSubmit(1)

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<StoreLocationForm>({
    resolver: zodResolver(storeLocationSchema),
    defaultValues: {
      storeAddress: state.formData.storeAddress,
      landmark: state.formData.landmark,
      city: state.formData.city,
      state: state.formData.state,
      pincode: state.formData.pincode,
      latitude: state.formData.latitude ?? undefined,
      longitude: state.formData.longitude ?? undefined,
    },
  })

  const latitude = watch('latitude')
  const longitude = watch('longitude')

  const onSubmit = (data: StoreLocationForm) => submitAndReturn(data)

  return (
    <WorkflowFormLayout
      workflowStepId={1}
      title="Store Location"
      subtitle="Enter your store address and pin the exact location on the map."
    >
      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Textarea
            label="Store Address"
            required
            rows={3}
            {...register('storeAddress')}
            error={errors.storeAddress?.message}
          />
          <Input label="Landmark" {...register('landmark')} error={errors.landmark?.message} />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="City" required {...register('city')} error={errors.city?.message} />
            <Select
              label="State"
              required
              options={INDIAN_STATES}
              placeholder="Select state"
              {...register('state')}
              error={errors.state?.message}
            />
          </div>

          <Input
            label="Pincode"
            required
            maxLength={6}
            inputMode="numeric"
            {...register('pincode')}
            error={errors.pincode?.message}
          />

          <Controller
            name="latitude"
            control={control}
            render={() => (
              <MapPicker
                latitude={latitude ?? null}
                longitude={longitude ?? null}
                onLocationChange={(lat, lng) => {
                  setValue('latitude', lat, { shouldValidate: true })
                  setValue('longitude', lng, { shouldValidate: true })
                }}
                error={errors.latitude?.message || errors.longitude?.message}
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
