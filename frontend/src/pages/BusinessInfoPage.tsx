import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { businessInfoSchema, type BusinessInfoForm } from '../schemas/onboarding'
import { useOnboarding } from '../context/OnboardingContext'
import { useWorkflowFormSubmit } from '../hooks/useWorkflowFormSubmit'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { WorkflowFormLayout } from '../components/workflow/WorkflowFormLayout'
import { WorkflowFormNavigation } from '../components/workflow/WorkflowFormNavigation'

export function BusinessInfoPage() {
  const { state } = useOnboarding()
  const { saving, saveError, submitAndReturn, returnToHub } = useWorkflowFormSubmit(1)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BusinessInfoForm>({
    resolver: zodResolver(businessInfoSchema),
    defaultValues: {
      storeName: state.formData.storeName,
      businessName: state.formData.businessName,
      ownerName: state.formData.ownerName,
      gstNumber: state.formData.gstNumber,
      panNumber: state.formData.panNumber,
      primaryPhone: state.formData.primaryPhone,
      secondaryPhone: state.formData.secondaryPhone,
      emailAddress: state.formData.emailAddress,
    },
  })

  const onSubmit = (data: BusinessInfoForm) => submitAndReturn(data)

  return (
    <WorkflowFormLayout
      workflowStepId={1}
      title="Business Information"
      subtitle="Tell us about your business and primary contact details."
    >
      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Store Name" required {...register('storeName')} error={errors.storeName?.message} />
          <Input
            label="Business Name"
            required
            {...register('businessName')}
            error={errors.businessName?.message}
          />
          <Input label="Owner Name" required {...register('ownerName')} error={errors.ownerName?.message} />
          <Input
            label="GST Number"
            placeholder="22AAAAA0000A1Z5"
            {...register('gstNumber')}
            error={errors.gstNumber?.message}
            hint="Optional — 15-character GSTIN if your business is registered"
          />
          <Input
            label="PAN Number"
            placeholder="ABCDE1234F"
            {...register('panNumber')}
            error={errors.panNumber?.message}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Primary Phone"
              required
              type="tel"
              placeholder="9876543210"
              {...register('primaryPhone')}
              error={errors.primaryPhone?.message}
            />
            <Input
              label="Secondary Phone"
              type="tel"
              placeholder="9876543210"
              {...register('secondaryPhone')}
              error={errors.secondaryPhone?.message}
            />
          </div>

          <Input
            label="Email Address"
            required
            type="email"
            placeholder="owner@example.com"
            {...register('emailAddress')}
            error={errors.emailAddress?.message}
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
