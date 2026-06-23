import { useNavigate } from 'react-router-dom'
import { useOnboarding } from '../context/OnboardingContext'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { WizardLayout } from '../components/layout/WizardLayout'

export function SuccessPage() {
  const navigate = useNavigate()
  const { state, resetOnboarding } = useOnboarding()
  const { onboardingId, merchantCode, storeCode } = state

  if (!onboardingId) {
    return (
      <WizardLayout currentStep={12} title="Submission Not Found" showProgress={false}>
        <Card>
          <p className="text-sm text-slate-600">
            No onboarding submission was found. Please complete the onboarding process first.
          </p>
          <Button className="mt-4" onClick={() => navigate('/')}>
            Go to Welcome
          </Button>
        </Card>
      </WizardLayout>
    )
  }

  return (
    <WizardLayout currentStep={12} title="Onboarding Submitted Successfully" showProgress={false}>
      <Card className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <p className="text-sm text-slate-600">
          Thank you for completing your merchant onboarding. Our team will review your information and
          configure your store for go-live.
        </p>

        <div className="my-6 space-y-3">
          <div className="rounded-lg border border-primary-200 bg-primary-50 px-4 py-4">
            <p className="text-xs font-medium uppercase tracking-wide text-primary-600">Onboarding ID</p>
            <p className="mt-1 font-mono text-xl font-bold text-primary-800">{onboardingId}</p>
          </div>
          {merchantCode && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Merchant Code</p>
              <p className="mt-1 font-mono text-lg font-semibold text-slate-800">{merchantCode}</p>
            </div>
          )}
          {storeCode && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Store Code</p>
              <p className="mt-1 font-mono text-lg font-semibold text-slate-800">{storeCode}</p>
            </div>
          )}
        </div>

        <p className="text-sm text-slate-500">
          Please save these reference codes. You will be contacted once your store is ready for activation.
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button onClick={() => navigate('/catalog')}>Set Up Product Catalog</Button>
          <Button
            variant="outline"
            onClick={() => {
              resetOnboarding()
              navigate('/')
            }}
          >
            Start New Onboarding
          </Button>
        </div>
      </Card>
    </WizardLayout>
  )
}
