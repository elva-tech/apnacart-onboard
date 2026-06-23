import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { adminAccountSchema, type AdminAccountForm } from '../schemas/onboarding'
import { useOnboarding } from '../context/OnboardingContext'
import { useWorkflowFormSubmit } from '../hooks/useWorkflowFormSubmit'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { WorkflowFormLayout } from '../components/workflow/WorkflowFormLayout'
import { WorkflowFormNavigation } from '../components/workflow/WorkflowFormNavigation'

export function AdminAccountPage() {
  const { state } = useOnboarding()
  const { saving, saveError, submitAndReturn, returnToHub } = useWorkflowFormSubmit(2)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AdminAccountForm>({
    resolver: zodResolver(adminAccountSchema),
    defaultValues: {
      adminName: state.formData.adminName,
      adminEmail: state.formData.adminEmail,
      adminPhone: state.formData.adminPhone,
    },
  })

  const onSubmit = (data: AdminAccountForm) => submitAndReturn(data)

  return (
    <WorkflowFormLayout
      workflowStepId={2}
      title="Store Administrator"
      subtitle="Primary contact person who will manage this store on ApnaCart."
    >
      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Administrator Name" required {...register('adminName')} error={errors.adminName?.message} />
          <Input
            label="Administrator Email"
            required
            type="email"
            placeholder="manager@example.com"
            {...register('adminEmail')}
            error={errors.adminEmail?.message}
          />
          <Input
            label="Administrator Phone"
            required
            type="tel"
            placeholder="9876543210"
            {...register('adminPhone')}
            error={errors.adminPhone?.message}
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
