import type { DayOfWeek, OnboardingFormData, StoredFile, SubmitFilePayload } from '../types/onboarding'

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
  if (!file) return null
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
