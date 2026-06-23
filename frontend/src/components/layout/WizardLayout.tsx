import type { ReactNode } from 'react'
import { LAST_FORM_STEP_ID } from '../../constants/steps'
import { ProgressBar } from './ProgressBar'

interface WizardLayoutProps {
  currentStep: number
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
  showProgress?: boolean
}

export function WizardLayout({
  currentStep,
  title,
  subtitle,
  children,
  footer,
  showProgress = true,
}: WizardLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-4 sm:px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600 text-sm font-bold text-white">
            AC
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">ApnaCart Merchant Onboarding</p>
            <p className="text-xs text-slate-500">Configure your store before launch</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
        {showProgress && currentStep > 0 && currentStep <= LAST_FORM_STEP_ID && (
          <div className="mb-6">
            <ProgressBar currentStep={currentStep} />
          </div>
        )}

        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-slate-600 sm:text-base">{subtitle}</p>}
        </div>

        {children}

        {footer && <div className="mt-8">{footer}</div>}
      </main>
    </div>
  )
}
