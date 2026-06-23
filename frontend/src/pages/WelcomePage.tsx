import { useNavigate } from 'react-router-dom'
import { WORKFLOW_STEPS } from '../constants/workflow'
import { SignInForm } from '../components/auth/SignInForm'
import { AppShell } from '../components/layout/AppShell'
import { Card } from '../components/ui/Card'

const STEP_STYLES = [
  'border-primary-200 bg-primary-50 text-primary-900',
  'border-purple-200 bg-purple-50 text-purple-900',
  'border-amber-200 bg-amber-50 text-amber-900',
  'border-emerald-200 bg-emerald-50 text-emerald-900',
  'border-indigo-200 bg-indigo-50 text-indigo-900',
]

export function WelcomePage() {
  const navigate = useNavigate()

  const handleSignIn = (role: 'ADMIN' | 'CUSTOMER') => {
    navigate(role === 'ADMIN' ? '/admin' : '/dashboard')
  }

  return (
    <AppShell variant="public">
      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
        <div className="space-y-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-primary-600">Powered by ELVA</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Launch your store on ApnaCart
            </h1>
            <p className="mt-3 max-w-xl text-base text-slate-600">
              Complete onboarding in five guided steps. Save progress anytime, upload documents and products, and submit
              for ELVA review — all in one place.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {WORKFLOW_STEPS.map((step, index) => (
              <Card key={step.id} className={`border-l-4 ${STEP_STYLES[index]}`}>
                <p className="text-xs font-semibold uppercase opacity-70">Step {step.id}</p>
                <p className="mt-1 font-semibold">{step.title}</p>
                <p className="mt-1 text-xs opacity-80">{step.description}</p>
              </Card>
            ))}
          </div>

          <Card className="border-primary-100 bg-gradient-to-r from-primary-50 to-white">
            <ul className="grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
              <li>✓ Auto-save on every step</li>
              <li>✓ Skip catalog during onboarding</li>
              <li>✓ Admin review & go-live tracking</li>
              <li>✓ Resume from your dashboard</li>
            </ul>
          </Card>
        </div>

        <SignInForm onSuccess={handleSignIn} />
      </div>
    </AppShell>
  )
}
