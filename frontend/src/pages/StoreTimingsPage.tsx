import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { DAYS_OF_WEEK } from '../types/onboarding'
import { storeTimingsSchema, type StoreTimingsForm } from '../schemas/onboarding'
import { useOnboarding } from '../context/OnboardingContext'
import { useWorkflowFormSubmit } from '../hooks/useWorkflowFormSubmit'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { WorkflowFormLayout } from '../components/workflow/WorkflowFormLayout'
import { WorkflowFormNavigation } from '../components/workflow/WorkflowFormNavigation'

export function StoreTimingsPage() {
  const { state } = useOnboarding()
  const { saving, saveError, submitAndReturn, returnToHub } = useWorkflowFormSubmit(1)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<StoreTimingsForm>({
    resolver: zodResolver(storeTimingsSchema),
    defaultValues: {
      timings: state.formData.timings,
    },
  })

  const timings = watch('timings')

  const copyMondayToAll = () => {
    const monday = timings.monday
    DAYS_OF_WEEK.forEach((day) => {
      if (day !== 'monday') {
        setValue(`timings.${day}.openTime`, monday.openTime)
        setValue(`timings.${day}.closeTime`, monday.closeTime)
        setValue(`timings.${day}.closed`, monday.closed)
      }
    })
  }

  const onSubmit = (data: StoreTimingsForm) => submitAndReturn({ timings: data.timings })

  return (
    <WorkflowFormLayout
      workflowStepId={1}
      title="Store Timings"
      subtitle="Set your store's operating hours for each day of the week."
    >
      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex justify-end">
            <Button type="button" variant="outline" size="sm" onClick={copyMondayToAll}>
              Copy Monday Timings To All Days
            </Button>
          </div>

          <div className="space-y-3">
            {DAYS_OF_WEEK.map((day) => {
              const label = day.charAt(0).toUpperCase() + day.slice(1)
              const dayErrors = errors.timings?.[day]
              const isClosed = timings[day]?.closed

              return (
                <div
                  key={day}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-800">{label}</span>
                    <label className="flex items-center gap-2 text-sm text-slate-600">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                        {...register(`timings.${day}.closed`)}
                      />
                      Closed
                    </label>
                  </div>

                  {!isClosed && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Input
                        label="Open Time"
                        type="time"
                        {...register(`timings.${day}.openTime`)}
                        error={dayErrors?.openTime?.message}
                      />
                      <Input
                        label="Close Time"
                        type="time"
                        {...register(`timings.${day}.closeTime`)}
                        error={dayErrors?.closeTime?.message}
                      />
                    </div>
                  )}
                </div>
              )
            })}
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
