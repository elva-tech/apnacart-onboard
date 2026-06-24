import { createContext, useContext, type ReactNode } from 'react'
import { useAuth } from './AuthContext'

const WorkflowFormEditContext = createContext<boolean | null>(null)

export function WorkflowFormEditProvider({ children }: { children: ReactNode }) {
  const { canEdit } = useAuth()
  return <WorkflowFormEditContext.Provider value={canEdit}>{children}</WorkflowFormEditContext.Provider>
}

/** True when the merchant cannot edit workflow form fields (submitted, under review, approved, etc.). */
export function useWorkflowFormLocked(): boolean {
  const canEdit = useContext(WorkflowFormEditContext)
  if (canEdit === null) return false
  return !canEdit
}
