import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { brandingSchema, type BrandingForm } from '../schemas/onboarding'
import { useOnboarding } from '../context/OnboardingContext'
import { useWorkflowFormSubmit } from '../hooks/useWorkflowFormSubmit'
import { ImageUpload } from '../components/ImageUpload'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Textarea } from '../components/ui/Textarea'
import { WorkflowFormLayout } from '../components/workflow/WorkflowFormLayout'
import { WorkflowFormNavigation } from '../components/workflow/WorkflowFormNavigation'

export function BrandingPage() {
  const { state } = useOnboarding()
  const { saving, saveError, submitAndReturn, returnToHub } = useWorkflowFormSubmit(1)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<BrandingForm>({
    resolver: zodResolver(brandingSchema),
    defaultValues: {
      storeDescription: state.formData.storeDescription,
      brandColor: state.formData.brandColor,
      logo: state.formData.logo,
      banner: state.formData.banner,
    },
  })

  const onSubmit = (data: BrandingForm) => {
    if (!data.logo) return
    submitAndReturn({
      storeDescription: data.storeDescription,
      brandColor: data.brandColor,
      logo: data.logo,
      banner: data.banner,
    })
  }

  return (
    <WorkflowFormLayout workflowStepId={1} title="Branding" subtitle="Upload your store logo and customize your brand appearance.">
      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Controller
            name="logo"
            control={control}
            render={({ field }) => (
              <ImageUpload
                label="Store Logo"
                required
                value={field.value}
                onChange={field.onChange}
                error={errors.logo?.message as string | undefined}
              />
            )}
          />

          <Controller
            name="banner"
            control={control}
            render={({ field }) => (
              <ImageUpload
                label="Store Banner"
                value={field.value}
                onChange={field.onChange}
                error={errors.banner?.message as string | undefined}
              />
            )}
          />

          <Textarea
            label="Store Description"
            rows={4}
            placeholder="Tell customers about your store..."
            {...register('storeDescription')}
            error={errors.storeDescription?.message}
          />

          <Input
            label="Brand Color"
            type="color"
            className="h-12 w-full cursor-pointer p-1 sm:w-32"
            {...register('brandColor')}
            error={errors.brandColor?.message}
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
