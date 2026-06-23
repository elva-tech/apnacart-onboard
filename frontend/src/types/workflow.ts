import type { WORKFLOW_STATUSES } from '../constants/workflow'
import type { OnboardingFormData } from './onboarding'

export type WorkflowStatus = (typeof WORKFLOW_STATUSES)[number]

export interface AuthSession {
  sessionToken: string
  expiresAt: string
  role: 'CUSTOMER' | 'ADMIN'
  phone: string
  merchantCode: string | null
  storeCode: string | null
  onboardingId: string | null
  workflowStatus: WorkflowStatus
  isReadOnly: boolean
  adminName?: string
}

export interface WorkflowStepProgress {
  step: number
  title: string
  progress: number
  complete: boolean
}

export interface DashboardData {
  merchantCode: string
  storeCode: string
  onboardingId: string
  storeName: string
  workflowStatus: WorkflowStatus
  currentStep: number
  isReadOnly: boolean
  canEdit: boolean
  adminComments: string
  steps: WorkflowStepProgress[]
  overallProgress: number
  agreementsAccepted: boolean
  catalogSkipped?: boolean
}

export interface AdminMerchantSummary {
  merchantCode: string
  storeCode: string
  onboardingId: string
  storeName: string
  ownerName: string
  primaryPhone: string
  workflowStatus: WorkflowStatus
  overallProgress: number
  submittedAt: string
}

export interface DashboardResponse {
  dashboard: DashboardData
  formData: Partial<OnboardingFormData> & { logoUrl?: string; bannerUrl?: string }
}
