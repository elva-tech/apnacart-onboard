import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { DELIVERY_MODELS, ESTIMATED_DELIVERY_TIMES } from '../constants/phase2'
import { merchantOperationsSchema, type MerchantOperationsForm } from '../schemas/onboarding'
import { useOnboarding } from '../context/OnboardingContext'
import { useWorkflowFormSubmit } from '../hooks/useWorkflowFormSubmit'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { WorkflowFormLayout } from '../components/workflow/WorkflowFormLayout'
import { WorkflowFormNavigation } from '../components/workflow/WorkflowFormNavigation'

export function MerchantOperationsPage() {
  const { state } = useOnboarding()
  const { saving, saveError, submitAndReturn, returnToHub } = useWorkflowFormSubmit(2)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MerchantOperationsForm>({
    resolver: zodResolver(merchantOperationsSchema),
    defaultValues: {
      whatsappNumber: state.formData.whatsappNumber,
      supportPhone: state.formData.supportPhone,
      supportEmail: state.formData.supportEmail,
      deliveryModel: state.formData.deliveryModel || undefined,
      estimatedDeliveryTime: state.formData.estimatedDeliveryTime || undefined,
    } as MerchantOperationsForm,
  })

  const onSubmit = (data: MerchantOperationsForm) => submitAndReturn(data)

  return (
    <WorkflowFormLayout
      workflowStepId={2}
      title="Merchant Operations"
      subtitle="Contact details for customers and operations teams, plus delivery operations."
    >
      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="WhatsApp Number"
            required
            type="tel"
            placeholder="9876543210"
            {...register('whatsappNumber')}
            error={errors.whatsappNumber?.message}
          />
          <Input
            label="Support Phone"
            required
            type="tel"
            placeholder="9876543210"
            {...register('supportPhone')}
            error={errors.supportPhone?.message}
          />
          <Input
            label="Support Email"
            required
            type="email"
            placeholder="support@example.com"
            {...register('supportEmail')}
            error={errors.supportEmail?.message}
          />

          <Select
            label="Delivery Model"
            required
            options={[...DELIVERY_MODELS]}
            placeholder="Select delivery model"
            {...register('deliveryModel')}
            error={errors.deliveryModel?.message}
          />
          <Select
            label="Estimated Delivery Time"
            required
            options={[...ESTIMATED_DELIVERY_TIMES]}
            placeholder="Select estimated time"
            {...register('estimatedDeliveryTime')}
            error={errors.estimatedDeliveryTime?.message}
          />

          <WorkflowFormNavigation
            onCancel={returnToHub}
            cancelLabel="Back to Business & Compliance"
            saveLoading={saving}
            saveError={saveError}
          />
        </form>
      </Card>
    </WorkflowFormLayout>
  )
}
