export const DELIVERY_MODELS = [
  'Store Managed',
  'ApnaCart Managed',
  'Hybrid',
] as const

export const ESTIMATED_DELIVERY_TIMES = [
  '15 Minutes',
  '30 Minutes',
  '45 Minutes',
  '60 Minutes',
  '90 Minutes',
] as const

export type DeliveryModel = (typeof DELIVERY_MODELS)[number]
export type EstimatedDeliveryTime = (typeof ESTIMATED_DELIVERY_TIMES)[number]

export const MAX_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024

export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
] as const

export const REVIEW_STATUS_OPTIONS = [
  'SUBMITTED',
  'UNDER_REVIEW',
  'APPROVED',
  'REJECTED',
  'GO_LIVE',
] as const

export const GO_LIVE_STATUS_OPTIONS = ['PENDING', 'READY', 'LIVE'] as const
