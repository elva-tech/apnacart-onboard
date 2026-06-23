import { Link, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { WORKFLOW_STEPS, isWorkflowStepActive } from '../../constants/workflow'
import { useAuth } from '../../context/AuthContext'
import { AppShell } from '../layout/AppShell'
import { getProgressBadgeClasses } from '../../utils/progressColors'

interface WorkflowLayoutProps {
  title: string
  subtitle?: string
  currentStep?: number
  children: ReactNode
}

export function WorkflowLayout({ title, subtitle, currentStep, children }: WorkflowLayoutProps) {
  const location = useLocation()
  const { dashboard } = useAuth()

  const nav = (
    <nav className="mx-auto max-w-6xl overflow-x-auto px-4 sm:px-6">
      <div className="flex gap-1 py-2">
        {WORKFLOW_STEPS.map((step) => {
          const active = currentStep === step.id || isWorkflowStepActive(step, location.pathname)
          const progress = dashboard?.steps.find((s) => s.step === step.id)?.progress ?? 0
          return (
            <Link
              key={step.id}
              to={step.path}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active ? 'bg-primary-100 text-primary-800' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {step.shortTitle}
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${getProgressBadgeClasses(progress)}`}
              >
                {progress}%
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )

  return (
    <AppShell variant="merchant" headerNav={nav}>
      {dashboard?.adminComments && dashboard.workflowStatus === 'REJECTED' && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <strong>Admin feedback:</strong> {dashboard.adminComments}
        </div>
      )}
      {dashboard?.isReadOnly && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          This submission is read-only ({dashboard.workflowStatus}). You cannot edit until rejected by admin.
        </div>
      )}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-2 text-sm text-slate-600 sm:text-base">{subtitle}</p>}
      </div>
      {children}
    </AppShell>
  )
}
