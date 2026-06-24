export const WIZARD_STEPS = [
  { id: 0, path: '/', title: 'Welcome', shortTitle: 'Welcome' },
  { id: 1, path: '/business', title: 'Business Information', shortTitle: 'Business' },
  { id: 2, path: '/location', title: 'Store Location', shortTitle: 'Location' },
  { id: 3, path: '/delivery', title: 'Delivery Configuration', shortTitle: 'Delivery' },
  { id: 4, path: '/branding', title: 'Branding', shortTitle: 'Branding' },
  { id: 5, path: '/store-admin', title: 'Store Administrator', shortTitle: 'Store Admin' },
  { id: 6, path: '/operations', title: 'Merchant Operations', shortTitle: 'Operations' },
  { id: 7, path: '/documents', title: 'Legal Documents', shortTitle: 'Documents' },
  { id: 8, path: '/banking', title: 'Banking Information', shortTitle: 'Banking' },
  { id: 9, path: '/assets', title: 'Store Assets', shortTitle: 'Assets' },
  { id: 10, path: '/review', title: 'Review & Submit', shortTitle: 'Review' },
  { id: 11, path: '/success', title: 'Success', shortTitle: 'Success' },
] as const

export const FORM_STEP_COUNT = 10
export const LAST_FORM_STEP_ID = 10

export const STORAGE_KEY = 'apnacart_onboarding_state'

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024
export const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
