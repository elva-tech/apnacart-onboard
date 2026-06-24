import type { OnboardingFormData } from '../types/onboarding'
import type { DashboardData } from '../types/workflow'
import {
  adminAccountSchema,
  bankingInformationSchema,
  businessInfoSchema,
  createBrandingSchema,
  createLegalDocumentsSchema,
  deliveryConfigSchema,
  merchantOperationsSchema,
  storeLocationSchema,
} from '../schemas/onboarding'
import { isNewFileUpload } from './onboarding'

export const STORE_INFORMATION_LINKS = [
  { to: '/business', label: 'Business & Contact' },
  { to: '/location', label: 'Store Location' },
  { to: '/delivery', label: 'Delivery Configuration' },
  { to: '/branding', label: 'Branding' },
  { to: '/assets', label: 'Store Assets' },
] as const

export const COMPLIANCE_LINKS = [
  { to: '/store-admin', label: 'Store Administrator' },
  { to: '/operations', label: 'Merchant Operations' },
  { to: '/documents', label: 'Legal Documents' },
  { to: '/banking', label: 'Banking Information' },
] as const

export const WORKFLOW_HUB_LINKS: Record<number, readonly { to: string; label: string }[]> = {
  1: STORE_INFORMATION_LINKS,
  2: COMPLIANCE_LINKS,
}

export function getHubStepProgress(stepId: number, formData: OnboardingFormData): number {
  const links = WORKFLOW_HUB_LINKS[stepId]
  if (!links?.length) return 0
  const done = links.filter((link) => isHubSectionComplete(link.to, formData)).length
  return Math.round((done / links.length) * 100)
}

export function getWorkflowStepProgress(
  stepId: number,
  formData: OnboardingFormData,
  dashboard?: DashboardData | null,
): number {
  if (stepId === 1 || stepId === 2) {
    return getHubStepProgress(stepId, formData)
  }
  if (stepId === 3) {
    if (dashboard?.catalogSkipped) return 100
    return dashboard?.steps.find((s) => s.step === 3)?.progress ?? 0
  }
  if (stepId === 4) {
    return dashboard?.agreementsAccepted ? 100 : 0
  }
  if (stepId === 5) {
    if (dashboard?.reviewConfirmed) return 100
    return dashboard?.steps.find((s) => s.step === 5)?.progress ?? 0
  }
  return 0
}

export function getOverallWorkflowProgress(
  formData: OnboardingFormData,
  dashboard?: DashboardData | null,
): number {
  const total = [1, 2, 3, 4, 5].reduce(
    (sum, stepId) => sum + getWorkflowStepProgress(stepId, formData, dashboard),
    0,
  )
  return Math.round(total / 5)
}

export function isHubSectionComplete(path: string, formData: OnboardingFormData): boolean {
  switch (path) {
    case '/business':
      return businessInfoSchema.safeParse({
        storeName: formData.storeName,
        businessName: formData.businessName,
        ownerName: formData.ownerName,
        gstNumber: formData.gstNumber,
        panNumber: formData.panNumber,
        primaryPhone: formData.primaryPhone,
        secondaryPhone: formData.secondaryPhone,
        emailAddress: formData.emailAddress,
      }).success
    case '/location':
      return storeLocationSchema.safeParse({
        storeAddress: formData.storeAddress,
        landmark: formData.landmark,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        latitude: formData.latitude,
        longitude: formData.longitude,
      }).success
    case '/delivery':
      return deliveryConfigSchema.safeParse({
        deliveryRadius: formData.deliveryRadius,
        minimumOrderAmount: formData.minimumOrderAmount,
        deliveryCharge: formData.deliveryCharge,
        freeDeliveryAbove: formData.freeDeliveryAbove,
        codEnabled: formData.codEnabled,
        onlinePaymentEnabled: formData.onlinePaymentEnabled,
      }).success
    case '/branding':
      return createBrandingSchema({ logoUrl: formData.logoUrl }).safeParse({
        storeDescription: formData.storeDescription,
        brandColor: formData.brandColor,
        logo: formData.logo,
        banner: formData.banner,
      }).success
    case '/assets':
      if (formData.storeAssetsSkipped) return true
      return (
        Boolean(formData.storeFrontPhotoUrl?.trim()) ||
        Boolean(formData.storeInteriorPhotoUrl?.trim()) ||
        isNewFileUpload(formData.storeFrontPhoto) ||
        isNewFileUpload(formData.storeInteriorPhoto)
      )
    case '/store-admin':
      return adminAccountSchema.safeParse({
        adminName: formData.adminName,
        adminEmail: formData.adminEmail,
        adminPhone: formData.adminPhone,
      }).success
    case '/operations':
      return merchantOperationsSchema.safeParse({
        whatsappNumber: formData.whatsappNumber,
        supportPhone: formData.supportPhone,
        supportEmail: formData.supportEmail,
        deliveryModel: formData.deliveryModel,
        estimatedDeliveryTime: formData.estimatedDeliveryTime,
      }).success
    case '/documents':
      return createLegalDocumentsSchema({ panCardUrl: formData.panCardUrl }).safeParse({
        gstCertificate: formData.gstCertificate,
        panCard: formData.panCard,
        fssaiLicense: formData.fssaiLicense,
        businessRegistration: formData.businessRegistration,
      }).success
    case '/banking':
      return bankingInformationSchema.safeParse({
        accountHolderName: formData.accountHolderName,
        bankName: formData.bankName,
        accountNumber: formData.accountNumber,
        ifscCode: formData.ifscCode,
        upiId: formData.upiId,
      }).success
    default:
      return false
  }
}

export function hubSectionCardClasses(complete: boolean): string {
  return complete
    ? 'border-green-300 bg-green-50 ring-1 ring-green-200 hover:border-green-400 hover:bg-green-100/80'
    : 'border-slate-200 bg-white hover:border-primary-200 hover:bg-primary-50/50'
}

export function hubSectionBadgeClasses(complete: boolean): string {
  return complete
    ? 'bg-green-100 text-green-800 ring-green-200'
    : 'bg-amber-50 text-amber-800 ring-amber-200'
}
