import type { DeliveryModel, EstimatedDeliveryTime } from '../constants/phase2'

export const DAYS_OF_WEEK = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const

export type DayOfWeek = (typeof DAYS_OF_WEEK)[number]

export interface DayTiming {
  openTime: string
  closeTime: string
  closed: boolean
}

export interface StoredFile {
  name: string
  type: string
  dataUrl: string
}

export interface OnboardingFormData {
  storeName: string
  businessName: string
  ownerName: string
  gstNumber: string
  panNumber: string
  primaryPhone: string
  secondaryPhone: string
  emailAddress: string

  storeAddress: string
  landmark: string
  city: string
  state: string
  pincode: string
  latitude: number | null
  longitude: number | null

  deliveryRadius: string
  minimumOrderAmount: string
  deliveryCharge: string
  freeDeliveryAbove: string
  codEnabled: boolean
  onlinePaymentEnabled: boolean

  timings: Record<DayOfWeek, DayTiming>

  storeDescription: string
  brandColor: string
  logo: StoredFile | null
  banner: StoredFile | null

  adminName: string
  adminEmail: string
  adminPhone: string

  whatsappNumber: string
  supportPhone: string
  supportEmail: string
  deliveryModel: DeliveryModel | ''
  estimatedDeliveryTime: EstimatedDeliveryTime | ''

  gstCertificate: StoredFile | null
  panCard: StoredFile | null
  fssaiLicense: StoredFile | null
  businessRegistration: StoredFile | null

  accountHolderName: string
  bankName: string
  accountNumber: string
  ifscCode: string
  upiId: string

  storeFrontPhoto: StoredFile | null
  storeInteriorPhoto: StoredFile | null
  merchantAgreement: StoredFile | null

  storeAssetsSkipped?: boolean
  reviewConfirmed?: boolean

  logoUrl?: string
  bannerUrl?: string
  gstCertificateUrl?: string
  panCardUrl?: string
  fssaiLicenseUrl?: string
  businessRegistrationUrl?: string
  storeFrontPhotoUrl?: string
  storeInteriorPhotoUrl?: string
  merchantAgreementUrl?: string
}

export interface OnboardingState {
  currentStep: number
  formData: OnboardingFormData
  submitted: boolean
  onboardingId: string | null
  merchantCode: string | null
  storeCode: string | null
}

export interface SubmitFilePayload {
  name: string
  type: string
  base64: string
}

export interface SubmitOnboardingPayload {
  storeName: string
  businessName: string
  ownerName: string
  gstNumber: string
  panNumber: string
  primaryPhone: string
  secondaryPhone: string
  emailAddress: string
  storeAddress: string
  landmark: string
  city: string
  state: string
  pincode: string
  latitude: number
  longitude: number
  deliveryRadius: number
  minimumOrderAmount: number
  deliveryCharge: number
  freeDeliveryAbove: number | null
  codEnabled: boolean
  onlinePaymentEnabled: boolean
  mondayOpen: string
  mondayClose: string
  tuesdayOpen: string
  tuesdayClose: string
  wednesdayOpen: string
  wednesdayClose: string
  thursdayOpen: string
  thursdayClose: string
  fridayOpen: string
  fridayClose: string
  saturdayOpen: string
  saturdayClose: string
  sundayOpen: string
  sundayClose: string
  storeDescription: string
  brandColor: string
  adminName: string
  adminEmail: string
  adminPhone: string
  logo: SubmitFilePayload | null
  banner: SubmitFilePayload | null
  whatsappNumber: string
  supportPhone: string
  supportEmail: string
  deliveryModel: string
  estimatedDeliveryTime: string
  gstCertificate: SubmitFilePayload | null
  panCard: SubmitFilePayload | null
  fssaiLicense: SubmitFilePayload | null
  businessRegistration: SubmitFilePayload | null
  accountHolderName: string
  bankName: string
  accountNumber: string
  ifscCode: string
  upiId: string
  storeFrontPhoto: SubmitFilePayload | null
  storeInteriorPhoto: SubmitFilePayload | null
}

export interface SubmitOnboardingResponse {
  success: boolean
  onboardingId?: string
  merchantCode?: string
  storeCode?: string
  completionPercentage?: number
  error?: string
}
