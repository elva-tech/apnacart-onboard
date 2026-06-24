import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { WORKFLOW_STEPS, getWorkflowStepIdForPath } from '../../constants/workflow'
import { WorkflowFormEditProvider } from '../../context/WorkflowFormEditContext'
import { WorkflowLayout } from './WorkflowLayout'

interface WorkflowFormLayoutProps {
  title: string
  subtitle?: string
  workflowStepId?: number
  children: ReactNode
}

export function WorkflowFormLayout({ title, subtitle, workflowStepId, children }: WorkflowFormLayoutProps) {
  const location = useLocation()
  const stepId = workflowStepId ?? getWorkflowStepIdForPath(location.pathname)
  const step = WORKFLOW_STEPS.find((item) => item.id === stepId)

  return (
    <WorkflowLayout currentStep={stepId} title={title} subtitle={subtitle}>
      {step && (
        <p className="-mt-2 mb-4 text-sm font-medium text-primary-700">
          Step {stepId} · {step.title}
        </p>
      )}
      <WorkflowFormEditProvider>{children}</WorkflowFormEditProvider>
    </WorkflowLayout>
  )
}
