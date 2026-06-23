import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { bankingInformationSchema, type BankingInformationForm } from '../schemas/onboarding'
import { useOnboarding } from '../context/OnboardingContext'
import { useWorkflowFormSubmit } from '../hooks/useWorkflowFormSubmit'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { WorkflowFormLayout } from '../components/workflow/WorkflowFormLayout'
import { WorkflowFormNavigation } from '../components/workflow/WorkflowFormNavigation'

export function BankingInformationPage() {
  const { state } = useOnboarding()
  const { saving, saveError, submitAndReturn, returnToHub } = useWorkflowFormSubmit(2)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BankingInformationForm>({
    resolver: zodResolver(bankingInformationSchema),
    defaultValues: {
      accountHolderName: state.formData.accountHolderName,
      bankName: state.formData.bankName,
      accountNumber: state.formData.accountNumber,
      ifscCode: state.formData.ifscCode,
      upiId: state.formData.upiId,
    },
  })

  const onSubmit = (data: BankingInformationForm) => submitAndReturn(data)

  return (
    <WorkflowFormLayout
      workflowStepId={2}
      title="Banking Information"
      subtitle="Bank account details for settlements. No payment gateway is integrated in this phase."
    >
      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Account Holder Name"
            required
            {...register('accountHolderName')}
            error={errors.accountHolderName?.message}
          />
          <Input label="Bank Name" required {...register('bankName')} error={errors.bankName?.message} />
          <Input
            label="Account Number"
            required
            inputMode="numeric"
            {...register('accountNumber')}
            error={errors.accountNumber?.message}
          />
          <Input
            label="IFSC Code"
            required
            placeholder="SBIN0001234"
            {...register('ifscCode')}
            error={errors.ifscCode?.message}
          />
          <Input
            label="UPI ID"
            required
            placeholder="merchant@bank"
            {...register('upiId')}
            error={errors.upiId?.message}
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
