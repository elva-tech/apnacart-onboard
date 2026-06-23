import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import { WORKFLOW_STEPS } from '../../constants/workflow'
import { useAuth } from '../../context/AuthContext'
import { WorkflowLayout } from '../../components/workflow/WorkflowLayout'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { ProgressBadge } from '../../components/ui/ProgressBadge'
import { getProgressBarClasses, getProgressLabel } from '../../utils/progressColors'

export function DashboardPage() {
  const { dashboard, refreshDashboard, canEdit } = useAuth()

  useEffect(() => {
    void refreshDashboard()
  }, [refreshDashboard])

  if (!dashboard) {
    return (
      <WorkflowLayout title="Dashboard" subtitle="Loading your onboarding progress...">
        <p className="text-sm text-slate-500">Loading...</p>
      </WorkflowLayout>
    )
  }

  const overall = dashboard.overallProgress

  return (
    <WorkflowLayout
      title="Onboarding Dashboard"
      subtitle={`${dashboard.storeName || 'Your store'} · ${overall}% complete`}
    >
      <div className="space-y-6">
        <Card className="border-primary-200 bg-primary-50">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium text-primary-800">Overall Progress</p>
                <ProgressBadge progress={overall} />
              </div>
              <p className="mt-1 text-3xl font-bold text-primary-900">{overall}%</p>
              <p className="mt-1 text-xs text-primary-700">
                Status: {dashboard.workflowStatus} · {getProgressLabel(overall)}
              </p>
              <div className="mt-3 h-2.5 w-full max-w-md overflow-hidden rounded-full bg-primary-200/60">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${getProgressBarClasses(overall)}`}
                  style={{ width: `${Math.min(overall, 100)}%` }}
                />
              </div>
            </div>
            <div className="text-right text-xs text-primary-700">
              <p>{dashboard.merchantCode}</p>
              <p>{dashboard.onboardingId}</p>
            </div>
          </div>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {WORKFLOW_STEPS.map((step) => {
            const progress = dashboard.steps.find((s) => s.step === step.id)
            const value = progress?.progress ?? 0
            const catalogSkipped = step.id === 3 && dashboard.catalogSkipped
            return (
              <Card key={step.id} className="flex flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Step {step.id}</p>
                    <h3 className="mt-1 font-semibold text-slate-900">{step.title}</h3>
                    <p className="mt-1 text-xs text-slate-500">{step.description}</p>
                    {catalogSkipped && (
                      <p className="mt-1 text-xs font-medium text-amber-700">Skipped — add products later in admin portal</p>
                    )}
                  </div>
                  <ProgressBadge progress={value} />
                </div>
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${getProgressBarClasses(value)}`}
                    style={{ width: `${Math.min(value, 100)}%` }}
                  />
                </div>
                <Link to={step.path} className="mt-4 block">
                  <Button size="sm" variant="outline" className="w-full" disabled={!canEdit && !progress?.complete}>
                    {progress?.complete ? 'View' : 'Continue'}
                  </Button>
                </Link>
              </Card>
            )
          })}
        </div>

        {dashboard.workflowStatus === 'REJECTED' && (
          <Card className="border-red-200 bg-red-50">
            <p className="text-sm font-medium text-red-800">Submission Rejected</p>
            <p className="mt-1 text-sm text-red-700">{dashboard.adminComments}</p>
            <Link to="/workflow/store" className="mt-3 inline-block">
              <Button size="sm">Edit & Resubmit</Button>
            </Link>
          </Card>
        )}
      </div>
    </WorkflowLayout>
  )
}
