import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { deliveryConfigSchema, type DeliveryConfigForm } from '../schemas/onboarding'
import { useOnboarding } from '../context/OnboardingContext'
import { useWorkflowFormSubmit } from '../hooks/useWorkflowFormSubmit'
import { Card } from '../components/ui/Card'
import { Checkbox } from '../components/ui/Checkbox'
import { Input } from '../components/ui/Input'
import { WorkflowFormLayout } from '../components/workflow/WorkflowFormLayout'
import { WorkflowFormNavigation } from '../components/workflow/WorkflowFormNavigation'

export function DeliveryConfigPage() {
  const { state } = useOnboarding()
  const { saving, saveError, submitAndReturn, returnToHub } = useWorkflowFormSubmit(1)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DeliveryConfigForm>({
    resolver: zodResolver(deliveryConfigSchema),
    defaultValues: {
      deliveryRadius: state.formData.deliveryRadius,
      minimumOrderAmount: state.formData.minimumOrderAmount,
      deliveryCharge: state.formData.deliveryCharge,
      freeDeliveryAbove: state.formData.freeDeliveryAbove,
      codEnabled: state.formData.codEnabled,
      onlinePaymentEnabled: state.formData.onlinePaymentEnabled,
    },
  })

  const onSubmit = (data: DeliveryConfigForm) => submitAndReturn(data)

  return (
    <WorkflowFormLayout
      workflowStepId={1}
      title="Delivery Configuration"
      subtitle="Set delivery area, charges, and accepted payment methods."
    >
      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Delivery Radius (KM)"
              required
              type="number"
              min="0"
              step="0.1"
              inputMode="decimal"
              {...register('deliveryRadius')}
              error={errors.deliveryRadius?.message}
            />
            <Input
              label="Minimum Order Amount (₹)"
              required
              type="number"
              min="0"
              step="1"
              inputMode="decimal"
              {...register('minimumOrderAmount')}
              error={errors.minimumOrderAmount?.message}
            />
            <Input
              label="Delivery Charge (₹)"
              required
              type="number"
              min="0"
              step="1"
              inputMode="decimal"
              {...register('deliveryCharge')}
              error={errors.deliveryCharge?.message}
            />
            <Input
              label="Free Delivery Above (₹)"
              type="number"
              min="0"
              step="1"
              inputMode="decimal"
              placeholder="Optional"
              {...register('freeDeliveryAbove')}
              error={errors.freeDeliveryAbove?.message}
              hint="Leave empty if not applicable"
            />
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-700">Payment Options</p>
            <Checkbox label="COD Enabled" description="Cash on Delivery" {...register('codEnabled')} />
            <Checkbox
              label="Online Payment Enabled"
              description="UPI, cards, and other online methods"
              {...register('onlinePaymentEnabled')}
            />
            {errors.onlinePaymentEnabled && (
              <p className="text-sm text-red-600">{errors.onlinePaymentEnabled.message}</p>
            )}
          </div>

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
