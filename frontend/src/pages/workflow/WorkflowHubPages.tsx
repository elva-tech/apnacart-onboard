import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { WORKFLOW_STEPS } from '../../constants/workflow'
import { skipCatalogStep } from '../../api/workflowApi'
import { useAuth } from '../../context/AuthContext'
import { useOnboarding } from '../../context/OnboardingContext'
import { WorkflowLayout } from '../../components/workflow/WorkflowLayout'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import {
  COMPLIANCE_LINKS,
  STORE_INFORMATION_LINKS,
  hubSectionBadgeClasses,
  hubSectionCardClasses,
  isHubSectionComplete,
} from '../../utils/hubSectionStatus'

function StepHub({
  stepId,
  title,
  subtitle,
  links,
}: {
  stepId: number
  title: string
  subtitle: string
  links: readonly { to: string; label: string }[]
}) {
  const { state } = useOnboarding()
  const { refreshDashboard } = useAuth()
  const nextStep = WORKFLOW_STEPS.find((step) => step.id === stepId + 1)

  useEffect(() => {
    void refreshDashboard()
  }, [refreshDashboard])

  const completedCount = links.filter((link) => isHubSectionComplete(link.to, state.formData)).length
  const allComplete = completedCount === links.length

  return (
    <WorkflowLayout currentStep={stepId} title={title} subtitle={subtitle}>
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-slate-600">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
          Complete
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          Incomplete
        </span>
        <span className="text-slate-400">·</span>
        <span>
          {completedCount} of {links.length} sections done
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {links.map((link) => {
          const complete = isHubSectionComplete(link.to, state.formData)
          return (
            <Link key={link.to} to={link.to} className="block rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500">
              <Card className={`h-full transition-colors ${hubSectionCardClasses(complete)}`}>
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-slate-900">{link.label}</p>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ring-1 ring-inset ${hubSectionBadgeClasses(complete)}`}
                  >
                    {complete ? 'Complete' : 'Incomplete'}
                  </span>
                </div>
              </Card>
            </Link>
          )
        })}
      </div>

      {allComplete && nextStep && (
        <Card className="mt-6 border-primary-200 bg-primary-50">
          <p className="text-sm font-medium text-primary-900">All sections in this step are complete.</p>
          <p className="mt-1 text-sm text-primary-800">Continue to the next part of your onboarding.</p>
          <Link to={nextStep.path} className="mt-4 inline-block">
            <Button>Continue to {nextStep.title} →</Button>
          </Link>
        </Card>
      )}

      <div className="mt-6">
        <Link to="/dashboard">
          <Button variant="ghost">← Back to Dashboard</Button>
        </Link>
      </div>
    </WorkflowLayout>
  )
}

export function StoreInformationHub() {
  return (
    <StepHub
      stepId={1}
      title={WORKFLOW_STEPS[0].title}
      subtitle={WORKFLOW_STEPS[0].description}
      links={STORE_INFORMATION_LINKS}
    />
  )
}

export function ComplianceHub() {
  return (
    <StepHub
      stepId={2}
      title={WORKFLOW_STEPS[1].title}
      subtitle={WORKFLOW_STEPS[1].description}
      links={COMPLIANCE_LINKS}
    />
  )
}

export function CatalogHub() {
  const navigate = useNavigate()
  const { session, dashboard, canEdit, refreshDashboard } = useAuth()
  const step = WORKFLOW_STEPS[2]
  const nextStep = WORKFLOW_STEPS[3]
  const catalogStep = dashboard?.steps.find((s) => s.step === 3)
  const isComplete = catalogStep?.complete || dashboard?.catalogSkipped

  const [showSkipDialog, setShowSkipDialog] = useState(false)
  const [skipping, setSkipping] = useState(false)
  const [skipError, setSkipError] = useState<string | null>(null)

  useEffect(() => {
    void refreshDashboard()
  }, [refreshDashboard])

  const handleSkipConfirm = async () => {
    if (!session?.sessionToken) return
    setSkipping(true)
    setSkipError(null)
    try {
      await skipCatalogStep(session.sessionToken)
      await refreshDashboard()
      setShowSkipDialog(false)
      navigate('/workflow/catalog')
    } catch (err) {
      setSkipError(err instanceof Error ? err.message : 'Failed to skip catalog step')
    } finally {
      setSkipping(false)
    }
  }

  const catalogLinks = [
    { to: '/catalog', label: 'Catalog Dashboard' },
    { to: '/catalog/upload', label: 'Upload Products' },
    { to: '/catalog/images', label: 'Upload Images' },
    { to: '/catalog/review', label: 'Review Products' },
    { to: '/catalog/categories', label: 'Categories' },
  ]

  return (
    <WorkflowLayout currentStep={3} title={step.title} subtitle={step.description}>
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-slate-600">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
          Step complete
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          In progress
        </span>
        {catalogStep && (
          <>
            <span className="text-slate-400">·</span>
            <span>{catalogStep.progress}% catalog progress</span>
          </>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {catalogLinks.map((link) => {
          const complete = Boolean(isComplete)
          return (
            <Link key={link.to} to={link.to} className="block rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500">
              <Card className={`h-full transition-colors ${hubSectionCardClasses(complete)}`}>
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-slate-900">{link.label}</p>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ring-1 ring-inset ${hubSectionBadgeClasses(complete)}`}
                  >
                    {complete ? 'Complete' : 'Incomplete'}
                  </span>
                </div>
              </Card>
            </Link>
          )
        })}
      </div>

      {canEdit && !isComplete && (
        <Card className="mt-6 border-amber-200 bg-amber-50">
          <p className="text-sm font-medium text-amber-900">Don&apos;t have products ready yet?</p>
          <p className="mt-1 text-sm text-amber-800">
            You can skip catalog setup during onboarding and add products later from your admin portal.
          </p>
          {skipError && <p className="mt-2 text-sm text-red-600">{skipError}</p>}
          <Button
            type="button"
            variant="outline"
            className="mt-4 border-amber-300 bg-white hover:bg-amber-100"
            onClick={() => setShowSkipDialog(true)}
          >
            Skip and mark complete
          </Button>
        </Card>
      )}

      {dashboard?.catalogSkipped && (
        <Card className="mt-6 border-slate-200 bg-slate-50">
          <p className="text-sm font-medium text-slate-800">Product catalog skipped</p>
          <p className="mt-1 text-sm text-slate-600">
            Add products manually later in your admin portal when you are ready.
          </p>
        </Card>
      )}

      {isComplete && (
        <Card className="mt-6 border-primary-200 bg-primary-50">
          <p className="text-sm font-medium text-primary-900">Catalog step is complete.</p>
          <p className="mt-1 text-sm text-primary-800">Continue to agreements before final review.</p>
          <Link to={nextStep.path} className="mt-4 inline-block">
            <Button>Continue to {nextStep.title} →</Button>
          </Link>
        </Card>
      )}

      <div className="mt-6">
        <Link to="/dashboard">
          <Button variant="ghost">← Back to Dashboard</Button>
        </Link>
      </div>

      <ConfirmDialog
        open={showSkipDialog}
        title="Skip Product Catalog?"
        message="This step is skipped. Make sure you add products manually later in your admin portal."
        confirmLabel="Skip and mark complete"
        cancelLabel="Cancel"
        loading={skipping}
        onConfirm={() => void handleSkipConfirm()}
        onCancel={() => setShowSkipDialog(false)}
      />
    </WorkflowLayout>
  )
}
