import { DAYS_OF_WEEK, type DayOfWeek, type DayTiming } from '../types/onboarding'
import { normalizeTimingsFromApi } from './timings'

export interface AdminMerchantForm {
  onboardingId: string
  merchantCode: string
  storeCode: string
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
  latitude: string
  longitude: string
  deliveryRadius: string
  minimumOrderAmount: string
  deliveryCharge: string
  freeDeliveryAbove: string
  codEnabled: boolean
  onlinePaymentEnabled: boolean
  timings: Record<DayOfWeek, DayTiming>
  storeDescription: string
  brandColor: string
  adminName: string
  adminEmail: string
  adminPhone: string
  whatsappNumber: string
  supportPhone: string
  supportEmail: string
  deliveryModel: string
  estimatedDeliveryTime: string
  accountHolderName: string
  bankName: string
  accountNumber: string
  ifscCode: string
  upiId: string
  logoUrl: string
  bannerUrl: string
  gstCertificateUrl: string
  panCardUrl: string
  fssaiLicenseUrl: string
  businessRegistrationUrl: string
  storeFrontPhotoUrl: string
  storeInteriorPhotoUrl: string
  catalogSkipped: boolean
  agreementsAccepted: boolean
  adminComments: string
  submittedAt: string
  goLiveStatus: string
  goLiveDate: string
}

function defaultTimings(): Record<DayOfWeek, DayTiming> {
  return DAYS_OF_WEEK.reduce(
    (acc, day) => {
      acc[day] = { openTime: '09:00', closeTime: '21:00', closed: false }
      return acc
    },
    {} as Record<DayOfWeek, DayTiming>,
  )
}

export function emptyAdminMerchantForm(): AdminMerchantForm {
  return {
    onboardingId: '',
    merchantCode: '',
    storeCode: '',
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
    latitude: '',
    longitude: '',
    deliveryRadius: '',
    minimumOrderAmount: '',
    deliveryCharge: '',
    freeDeliveryAbove: '',
    codEnabled: true,
    onlinePaymentEnabled: true,
    timings: defaultTimings(),
    storeDescription: '',
    brandColor: '#2563eb',
    adminName: '',
    adminEmail: '',
    adminPhone: '',
    whatsappNumber: '',
    supportPhone: '',
    supportEmail: '',
    deliveryModel: '',
    estimatedDeliveryTime: '',
    accountHolderName: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    upiId: '',
    logoUrl: '',
    bannerUrl: '',
    gstCertificateUrl: '',
    panCardUrl: '',
    fssaiLicenseUrl: '',
    businessRegistrationUrl: '',
    storeFrontPhotoUrl: '',
    storeInteriorPhotoUrl: '',
    catalogSkipped: false,
    agreementsAccepted: false,
    adminComments: '',
    submittedAt: '',
    goLiveStatus: '',
    goLiveDate: '',
  }
}

export function apiToAdminForm(data: Record<string, unknown>): AdminMerchantForm {
  const base = emptyAdminMerchantForm()
  const timings = normalizeTimingsFromApi(data)

  return {
    ...base,
    onboardingId: String(data.onboardingId || ''),
    merchantCode: String(data.merchantCode || ''),
    storeCode: String(data.storeCode || ''),
    storeName: String(data.storeName || ''),
    businessName: String(data.businessName || ''),
    ownerName: String(data.ownerName || ''),
    gstNumber: String(data.gstNumber || ''),
    panNumber: String(data.panNumber || ''),
    primaryPhone: String(data.primaryPhone || ''),
    secondaryPhone: String(data.secondaryPhone || ''),
    emailAddress: String(data.emailAddress || ''),
    storeAddress: String(data.storeAddress || ''),
    landmark: String(data.landmark || ''),
    city: String(data.city || ''),
    state: String(data.state || ''),
    pincode: String(data.pincode || ''),
    latitude: data.latitude != null ? String(data.latitude) : '',
    longitude: data.longitude != null ? String(data.longitude) : '',
    deliveryRadius: String(data.deliveryRadius || ''),
    minimumOrderAmount: String(data.minimumOrderAmount || ''),
    deliveryCharge: String(data.deliveryCharge || ''),
    freeDeliveryAbove: String(data.freeDeliveryAbove || ''),
    codEnabled: Boolean(data.codEnabled),
    onlinePaymentEnabled: Boolean(data.onlinePaymentEnabled),
    timings,
    storeDescription: String(data.storeDescription || ''),
    brandColor: String(data.brandColor || '#2563eb'),
    adminName: String(data.adminName || ''),
    adminEmail: String(data.adminEmail || ''),
    adminPhone: String(data.adminPhone || ''),
    whatsappNumber: String(data.whatsappNumber || ''),
    supportPhone: String(data.supportPhone || ''),
    supportEmail: String(data.supportEmail || ''),
    deliveryModel: String(data.deliveryModel || ''),
    estimatedDeliveryTime: String(data.estimatedDeliveryTime || ''),
    accountHolderName: String(data.accountHolderName || ''),
    bankName: String(data.bankName || ''),
    accountNumber: String(data.accountNumber || ''),
    ifscCode: String(data.ifscCode || ''),
    upiId: String(data.upiId || ''),
    logoUrl: String(data.logoUrl || ''),
    bannerUrl: String(data.bannerUrl || ''),
    gstCertificateUrl: String(data.gstCertificateUrl || ''),
    panCardUrl: String(data.panCardUrl || ''),
    fssaiLicenseUrl: String(data.fssaiLicenseUrl || ''),
    businessRegistrationUrl: String(data.businessRegistrationUrl || ''),
    storeFrontPhotoUrl: String(data.storeFrontPhotoUrl || ''),
    storeInteriorPhotoUrl: String(data.storeInteriorPhotoUrl || ''),
    catalogSkipped: Boolean(data.catalogSkipped),
    agreementsAccepted: Boolean(data.agreementsAccepted),
    adminComments: String(data.adminComments || ''),
    submittedAt: String(data.submittedAt || ''),
    goLiveStatus: String(data.goLiveStatus || ''),
    goLiveDate: String(data.goLiveDate || ''),
  }
}

function timingValue(day: DayTiming, field: 'open' | 'close'): string {
  if (day.closed) return 'CLOSED'
  return field === 'open' ? day.openTime : day.closeTime
}

export function adminFormToPayload(form: AdminMerchantForm) {
  return {
    storeName: form.storeName,
    businessName: form.businessName,
    ownerName: form.ownerName,
    gstNumber: form.gstNumber,
    panNumber: form.panNumber,
    primaryPhone: form.primaryPhone,
    secondaryPhone: form.secondaryPhone,
    emailAddress: form.emailAddress,
    storeAddress: form.storeAddress,
    landmark: form.landmark,
    city: form.city,
    state: form.state,
    pincode: form.pincode,
    latitude: form.latitude ? Number(form.latitude) : 0,
    longitude: form.longitude ? Number(form.longitude) : 0,
    deliveryRadius: form.deliveryRadius ? Number(form.deliveryRadius) : 0,
    minimumOrderAmount: form.minimumOrderAmount ? Number(form.minimumOrderAmount) : 0,
    deliveryCharge: form.deliveryCharge ? Number(form.deliveryCharge) : 0,
    freeDeliveryAbove: form.freeDeliveryAbove ? Number(form.freeDeliveryAbove) : null,
    codEnabled: form.codEnabled,
    onlinePaymentEnabled: form.onlinePaymentEnabled,
    mondayOpen: timingValue(form.timings.monday, 'open'),
    mondayClose: timingValue(form.timings.monday, 'close'),
    tuesdayOpen: timingValue(form.timings.tuesday, 'open'),
    tuesdayClose: timingValue(form.timings.tuesday, 'close'),
    wednesdayOpen: timingValue(form.timings.wednesday, 'open'),
    wednesdayClose: timingValue(form.timings.wednesday, 'close'),
    thursdayOpen: timingValue(form.timings.thursday, 'open'),
    thursdayClose: timingValue(form.timings.thursday, 'close'),
    fridayOpen: timingValue(form.timings.friday, 'open'),
    fridayClose: timingValue(form.timings.friday, 'close'),
    saturdayOpen: timingValue(form.timings.saturday, 'open'),
    saturdayClose: timingValue(form.timings.saturday, 'close'),
    sundayOpen: timingValue(form.timings.sunday, 'open'),
    sundayClose: timingValue(form.timings.sunday, 'close'),
    storeDescription: form.storeDescription,
    brandColor: form.brandColor,
    adminName: form.adminName,
    adminEmail: form.adminEmail,
    adminPhone: form.adminPhone,
    whatsappNumber: form.whatsappNumber,
    supportPhone: form.supportPhone,
    supportEmail: form.supportEmail,
    deliveryModel: form.deliveryModel,
    estimatedDeliveryTime: form.estimatedDeliveryTime,
    accountHolderName: form.accountHolderName,
    bankName: form.bankName,
    accountNumber: form.accountNumber,
    ifscCode: form.ifscCode,
    upiId: form.upiId,
    logoUrl: form.logoUrl,
    bannerUrl: form.bannerUrl,
    gstCertificateUrl: form.gstCertificateUrl,
    panCardUrl: form.panCardUrl,
    fssaiLicenseUrl: form.fssaiLicenseUrl,
    businessRegistrationUrl: form.businessRegistrationUrl,
    storeFrontPhotoUrl: form.storeFrontPhotoUrl,
    storeInteriorPhotoUrl: form.storeInteriorPhotoUrl,
    catalogSkipped: form.catalogSkipped,
    adminComments: form.adminComments,
    goLiveStatus: form.goLiveStatus,
  }
}
