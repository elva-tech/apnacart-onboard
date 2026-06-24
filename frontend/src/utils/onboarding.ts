import type { DayOfWeek, OnboardingFormData, StoredFile, SubmitFilePayload } from '../types/onboarding'
import { normalizeTimingsFromApi } from './timings'

export const FILE_FIELD_URL_KEYS = {
  logo: 'logoUrl',
  banner: 'bannerUrl',
  gstCertificate: 'gstCertificateUrl',
  panCard: 'panCardUrl',
  fssaiLicense: 'fssaiLicenseUrl',
  businessRegistration: 'businessRegistrationUrl',
  storeFrontPhoto: 'storeFrontPhotoUrl',
  storeInteriorPhoto: 'storeInteriorPhotoUrl',
  merchantAgreement: 'merchantAgreementUrl',
} as const

export type FileFieldKey = keyof typeof FILE_FIELD_URL_KEYS

const FILE_FIELD_KEYS = Object.keys(FILE_FIELD_URL_KEYS) as FileFieldKey[]

export function isNewFileUpload(file: StoredFile | null | undefined): boolean {
  return Boolean(file?.dataUrl?.startsWith('data:'))
}

/** Drop local file blobs when the server already has a Drive URL for that field. */
export function mergeApiFormData(api: Record<string, unknown>): Partial<OnboardingFormData> {
  const patch: Partial<OnboardingFormData> = {
    ...(api as Partial<OnboardingFormData>),
    timings: normalizeTimingsFromApi(api),
  }

  for (const [fileKey, urlKey] of Object.entries(FILE_FIELD_URL_KEYS) as [FileFieldKey, string][]) {
    if (String(api[urlKey] || '').trim()) {
      patch[fileKey] = null
    }
  }

  return patch
}

/** Only include file fields the user changed in this save (avoids re-uploading on every step). */
export function pickDirtyFileFields<T extends Partial<OnboardingFormData>>(
  partial: T,
): Partial<OnboardingFormData> {
  const result = { ...partial }
  for (const key of FILE_FIELD_KEYS) {
    if (!(key in partial)) {
      delete result[key]
    } else if (!isNewFileUpload(partial[key] as StoredFile | null)) {
      delete result[key]
    }
  }
  return result
}

export function stripUnchangedFileFields(
  merged: OnboardingFormData,
  partial?: Partial<OnboardingFormData>,
): Partial<OnboardingFormData> {
  const payload: Partial<OnboardingFormData> = { ...merged }
  if (!partial) return payload

  for (const key of FILE_FIELD_KEYS) {
    if (!(key in partial)) {
      payload[key] = null
    } else if (!isNewFileUpload(partial[key] as StoredFile | null)) {
      payload[key] = null
    }
  }
  return payload
}

const defaultDayTiming = () => ({
  openTime: '09:00',
  closeTime: '21:00',
  closed: false,
})

export function createDefaultFormData(): OnboardingFormData {
  const timings = {} as Record<DayOfWeek, ReturnType<typeof defaultDayTiming>>
  const days: DayOfWeek[] = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
  ]
  days.forEach((day) => {
    timings[day] = defaultDayTiming()
  })

  return {
    storeName: '',
    businessName: '',
    ownerName: '',
    gstNumber: '',
    panNumber: '',
    primaryPhone: '',
    secondaryPhone: '',
    emailAddress: '',
    storeAddress: '',
    landmark: '',
    city: '',
    state: '',
    pincode: '',
    latitude: null,
    longitude: null,
    deliveryRadius: '',
    minimumOrderAmount: '',
    deliveryCharge: '',
    freeDeliveryAbove: '',
    codEnabled: true,
    onlinePaymentEnabled: true,
    timings,
    storeDescription: '',
    brandColor: '#2563eb',
    logo: null,
    banner: null,
    adminName: '',
    adminEmail: '',
    adminPhone: '',
    whatsappNumber: '',
    supportPhone: '',
    supportEmail: '',
    deliveryModel: '',
    estimatedDeliveryTime: '',
    gstCertificate: null,
    panCard: null,
    fssaiLicense: null,
    businessRegistration: null,
    accountHolderName: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    upiId: '',
    storeFrontPhoto: null,
    storeInteriorPhoto: null,
    merchantAgreement: null,
    storeAssetsSkipped: false,
    reviewConfirmed: false,
  }
}

export function dataUrlToBase64(dataUrl: string): string {
  const parts = dataUrl.split(',')
  return parts.length > 1 ? parts[1] : dataUrl
}

export function fileToStoredFile(file: File): Promise<{ name: string; type: string; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      resolve({
        name: file.name,
        type: file.type,
        dataUrl: reader.result as string,
      })
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

export function formatDayTiming(openTime: string, closeTime: string, closed: boolean): string {
  if (closed) return 'Closed'
  if (!openTime || !closeTime) return '—'
  return `${openTime} – ${closeTime}`
}

export function storedFileToPayload(file: StoredFile | null): SubmitFilePayload | null {
  if (!file || !isNewFileUpload(file)) return null
  return {
    name: file.name,
    type: file.type,
    base64: dataUrlToBase64(file.dataUrl),
  }
}

export function formatCurrency(value: string): string {
  if (!value) return '—'
  return `₹${Number(value).toLocaleString('en-IN')}`
}
