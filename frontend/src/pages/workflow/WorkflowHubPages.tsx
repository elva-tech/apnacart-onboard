import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { WORKFLOW_STEPS } from '../../constants/workflow'
import { skipCatalogStep } from '../../api/workflowApi'
import { useAuth } from '../../context/AuthContext'
import { WorkflowLayout } from '../../components/workflow/WorkflowLayout'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'

function StepHub({ stepId, title, subtitle, links }: { stepId: number; title: string; subtitle: string; links: { to: string; label: string }[] }) {
  return (
    <WorkflowLayout currentStep={stepId} title={title} subtitle={subtitle}>
      <div className="grid gap-3 sm:grid-cols-2">
        {links.map((link) => (
          <Card key={link.to}>
            <Link to={link.to}>
              <Button variant="outline" className="w-full justify-start">
                {link.label}
              </Button>
            </Link>
          </Card>
        ))}
      </div>
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
      links={[
        { to: '/business', label: 'Business & Contact' },
        { to: '/location', label: 'Store Location' },
        { to: '/delivery', label: 'Delivery Configuration' },
        { to: '/timings', label: 'Store Timings' },
        { to: '/branding', label: 'Branding' },
        { to: '/assets', label: 'Store Assets' },
      ]}
    />
  )
}

export function ComplianceHub() {
  return (
    <StepHub
      stepId={2}
      title={WORKFLOW_STEPS[1].title}
      subtitle={WORKFLOW_STEPS[1].description}
      links={[
        { to: '/store-admin', label: 'Store Administrator' },
        { to: '/operations', label: 'Merchant Operations' },
        { to: '/documents', label: 'Legal Documents' },
        { to: '/banking', label: 'Banking Information' },
      ]}
    />
  )
}

export function CatalogHub() {
  const navigate = useNavigate()
  const { session, dashboard, canEdit, refreshDashboard } = useAuth()
  const step = WORKFLOW_STEPS[2]
  const catalogStep = dashboard?.steps.find((s) => s.step === 3)
  const isComplete = catalogStep?.complete || dashboard?.catalogSkipped

  const [showSkipDialog, setShowSkipDialog] = useState(false)
  const [skipping, setSkipping] = useState(false)
  const [skipError, setSkipError] = useState<string | null>(null)

  const handleSkipConfirm = async () => {
    if (!session?.sessionToken) return
    setSkipping(true)
    setSkipError(null)
    try {
      await skipCatalogStep(session.sessionToken)
      await refreshDashboard()
      setShowSkipDialog(false)
      navigate('/dashboard')
    } catch (err) {
      setSkipError(err instanceof Error ? err.message : 'Failed to skip catalog step')
    } finally {
      setSkipping(false)
    }
  }

  return (
    <WorkflowLayout currentStep={3} title={step.title} subtitle={step.description}>
      <div className="grid gap-3 sm:grid-cols-2">
        {[
          { to: '/catalog', label: 'Catalog Dashboard' },
          { to: '/catalog/upload', label: 'Upload Products' },
          { to: '/catalog/images', label: 'Upload Images' },
          { to: '/catalog/review', label: 'Review Products' },
          { to: '/catalog/categories', label: 'Categories' },
        ].map((link) => (
          <Card key={link.to}>
            <Link to={link.to}>
              <Button variant="outline" className="w-full justify-start">
                {link.label}
              </Button>
            </Link>
          </Card>
        ))}
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
