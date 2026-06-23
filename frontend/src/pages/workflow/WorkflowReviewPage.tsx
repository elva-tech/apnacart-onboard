import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { submitWorkflow } from '../../api/workflowApi'
import { useOnboarding } from '../../context/OnboardingContext'
import { WorkflowLayout } from '../../components/workflow/WorkflowLayout'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'

export function WorkflowReviewPage() {
  const navigate = useNavigate()
  const { session, dashboard, refreshDashboard } = useAuth()
  const { state, markSubmitted } = useOnboarding()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = dashboard?.canEdit && dashboard.agreementsAccepted

  const handleSubmit = async () => {
    if (!session?.sessionToken) return
    setLoading(true)
    setError(null)
    try {
      const result = await submitWorkflow(session.sessionToken, state.formData)
      markSubmitted({
        onboardingId: result.onboardingId,
        merchantCode: result.merchantCode,
        storeCode: result.storeCode,
      })
      await refreshDashboard()
      navigate('/success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <WorkflowLayout currentStep={5} title="Review & Submit" subtitle="Review all workflow steps before final submission.">
      <div className="space-y-4">
        {dashboard?.steps.map((step) => (
          <Card key={step.step} className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-900">{step.title}</p>
              <p className="text-sm text-slate-500">{step.progress}% complete</p>
            </div>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                step.complete ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
              }`}
            >
              {step.complete ? 'Complete' : 'Incomplete'}
            </span>
          </Card>
        ))}

        <Card>
          <p className="text-sm text-slate-600">
            Use the detailed review page to verify all collected information, or submit directly if all steps are complete.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link to="/review">
              <Button variant="outline" size="sm">
                Detailed Review
              </Button>
            </Link>
            <Button size="sm" loading={loading} disabled={!canSubmit} onClick={handleSubmit}>
              Submit Onboarding
            </Button>
          </div>
          {!dashboard?.agreementsAccepted && (
            <p className="mt-2 text-xs text-amber-700">Complete agreements (Step 4) before submitting.</p>
          )}
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </Card>
      </div>
    </WorkflowLayout>
  )
}
