export const SESSION_STORAGE_KEY = 'apnacart_session'

export const WORKFLOW_STATUSES = [
  'DRAFT',
  'IN_PROGRESS',
  'SUBMITTED',
  'UNDER_REVIEW',
  'REJECTED',
  'RESUBMITTED',
  'APPROVED',
  'GO_LIVE',
] as const

export const WORKFLOW_STEPS = [
  {
    id: 1,
    path: '/workflow/store',
    title: 'Store Information',
    shortTitle: 'Store',
    description: 'Location, delivery, timings, branding, and store photos',
    subRoutes: ['/business', '/location', '/delivery', '/timings', '/branding', '/assets'],
  },
  {
    id: 2,
    path: '/workflow/compliance',
    title: 'Business & Compliance',
    shortTitle: 'Compliance',
    description: 'Business details, legal documents, banking, and operations',
    subRoutes: ['/store-admin', '/operations', '/documents', '/banking'],
  },
  {
    id: 3,
    path: '/workflow/catalog',
    title: 'Product Catalog',
    shortTitle: 'Catalog',
    description: 'Upload products, images, and manage categories',
    subRoutes: ['/catalog', '/catalog/upload', '/catalog/images', '/catalog/review'],
  },
  {
    id: 4,
    path: '/workflow/agreements',
    title: 'Agreements',
    shortTitle: 'Agreements',
    description: 'Terms of service and merchant agreement',
    subRoutes: ['/workflow/agreements'],
  },
  {
    id: 5,
    path: '/workflow/review',
    title: 'Review & Submit',
    shortTitle: 'Review',
    description: 'Final review and submission',
    subRoutes: ['/review'],
  },
] as const

export const ROUTE_TO_WORKFLOW_STEP: Record<string, number> = {
  '/workflow/store': 1,
  '/business': 1,
  '/location': 1,
  '/delivery': 1,
  '/timings': 1,
  '/branding': 1,
  '/assets': 1,
  '/workflow/compliance': 2,
  '/store-admin': 2,
  '/operations': 2,
  '/documents': 2,
  '/banking': 2,
  '/workflow/catalog': 3,
  '/catalog': 3,
  '/catalog/upload': 3,
  '/catalog/images': 3,
  '/catalog/review': 3,
  '/catalog/categories': 3,
  '/catalog/reports': 3,
  '/workflow/agreements': 4,
  '/workflow/review': 5,
  '/review': 5,
}

export function getWorkflowStepIdForPath(path: string): number {
  if (ROUTE_TO_WORKFLOW_STEP[path]) return ROUTE_TO_WORKFLOW_STEP[path]
  const routes = Object.keys(ROUTE_TO_WORKFLOW_STEP).sort((a, b) => b.length - a.length)
  const match = routes.find((route) => path === route || path.startsWith(`${route}/`))
  return match ? ROUTE_TO_WORKFLOW_STEP[match] : 1
}

export function getHubPathForWorkflowStep(stepId: number): string {
  return WORKFLOW_STEPS.find((step) => step.id === stepId)?.path ?? '/dashboard'
}

export function isWorkflowStepActive(step: (typeof WORKFLOW_STEPS)[number], pathname: string): boolean {
  if (pathname === step.path || pathname.startsWith(`${step.path}/`)) return true
  return step.subRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`))
}

export const AGREEMENT_VERSION = '1.0'

export const READ_ONLY_STATUSES = ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'GO_LIVE'] as const

export const EDITABLE_STATUSES = ['DRAFT', 'IN_PROGRESS', 'REJECTED', 'RESUBMITTED'] as const
