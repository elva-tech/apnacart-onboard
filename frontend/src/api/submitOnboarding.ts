import type { OnboardingFormData, SubmitOnboardingPayload } from '../types/onboarding'
import { storedFileToPayload } from '../utils/onboarding'

function timingValue(day: { openTime: string; closeTime: string; closed: boolean }, field: 'open' | 'close'): string {
  if (day.closed) return 'CLOSED'
  return field === 'open' ? day.openTime : day.closeTime
}

export function buildSubmitPayload(data: OnboardingFormData): SubmitOnboardingPayload {
  return {
    storeName: data.storeName,
    businessName: data.businessName,
    ownerName: data.ownerName,
    gstNumber: data.gstNumber.toUpperCase(),
    panNumber: data.panNumber.toUpperCase(),
    primaryPhone: data.primaryPhone,
    secondaryPhone: data.secondaryPhone,
    emailAddress: data.emailAddress,
    storeAddress: data.storeAddress,
    landmark: data.landmark,
    city: data.city,
    state: data.state,
    pincode: data.pincode,
    latitude: data.latitude!,
    longitude: data.longitude!,
    deliveryRadius: Number(data.deliveryRadius),
    minimumOrderAmount: Number(data.minimumOrderAmount),
    deliveryCharge: Number(data.deliveryCharge),
    freeDeliveryAbove: data.freeDeliveryAbove ? Number(data.freeDeliveryAbove) : null,
    codEnabled: data.codEnabled,
    onlinePaymentEnabled: data.onlinePaymentEnabled,
    mondayOpen: timingValue(data.timings.monday, 'open'),
    mondayClose: timingValue(data.timings.monday, 'close'),
    tuesdayOpen: timingValue(data.timings.tuesday, 'open'),
    tuesdayClose: timingValue(data.timings.tuesday, 'close'),
    wednesdayOpen: timingValue(data.timings.wednesday, 'open'),
    wednesdayClose: timingValue(data.timings.wednesday, 'close'),
    thursdayOpen: timingValue(data.timings.thursday, 'open'),
    thursdayClose: timingValue(data.timings.thursday, 'close'),
    fridayOpen: timingValue(data.timings.friday, 'open'),
    fridayClose: timingValue(data.timings.friday, 'close'),
    saturdayOpen: timingValue(data.timings.saturday, 'open'),
    saturdayClose: timingValue(data.timings.saturday, 'close'),
    sundayOpen: timingValue(data.timings.sunday, 'open'),
    sundayClose: timingValue(data.timings.sunday, 'close'),
    storeDescription: data.storeDescription,
    brandColor: data.brandColor,
    adminName: data.adminName,
    adminEmail: data.adminEmail,
    adminPhone: data.adminPhone,
    logo: storedFileToPayload(data.logo),
    banner: storedFileToPayload(data.banner),
    whatsappNumber: data.whatsappNumber,
    supportPhone: data.supportPhone,
    supportEmail: data.supportEmail,
    deliveryModel: data.deliveryModel,
    estimatedDeliveryTime: data.estimatedDeliveryTime,
    gstCertificate: storedFileToPayload(data.gstCertificate),
    panCard: storedFileToPayload(data.panCard),
    fssaiLicense: storedFileToPayload(data.fssaiLicense),
    businessRegistration: storedFileToPayload(data.businessRegistration),
    accountHolderName: data.accountHolderName,
    bankName: data.bankName,
    accountNumber: data.accountNumber,
    ifscCode: data.ifscCode.toUpperCase(),
    upiId: data.upiId,
    storeFrontPhoto: storedFileToPayload(data.storeFrontPhoto),
    storeInteriorPhoto: storedFileToPayload(data.storeInteriorPhoto),
  }
}

export async function submitOnboarding(data: OnboardingFormData) {
  const apiUrl = import.meta.env.VITE_APPS_SCRIPT_URL || '/api/onboarding'

  if (apiUrl.includes('YOUR_DEPLOYMENT_ID')) {
    throw new Error(
      'API URL is not configured. Set VITE_APPS_SCRIPT_URL in your environment variables.',
    )
  }

  const payload = buildSubmitPayload(data)

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify({ action: 'submitOnboarding', data: payload }),
  })

  const responseText = await response.text()

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error(
        'Submission unauthorized (401). In Apps Script go to Deploy → Manage deployments, set "Who has access" to Anyone (not "Anyone with Google account"), create a new version, and redeploy.',
      )
    }
    throw new Error(`Submission failed with status ${response.status}`)
  }

  let result: {
    success: boolean
    onboardingId?: string
    merchantCode?: string
    storeCode?: string
    completionPercentage?: number
    apiVersion?: number
    error?: string
  }
  try {
    result = JSON.parse(responseText)
  } catch {
    throw new Error(
      'Invalid response from server. Verify the Apps Script Web App is deployed with access set to Anyone.',
    )
  }

  if (!result.success) {
    throw new Error(result.error || 'Submission failed. Please try again.')
  }

  if (!result.merchantCode || !result.storeCode) {
    throw new Error(
      'Submission reached the server but Phase 2 fields were not saved. Redeploy Apps Script: paste the latest Code.gs, run setupOnboardingInfrastructure(), then Deploy → Manage deployments → New version → Deploy. Ensure vercel.json and VITE_APPS_SCRIPT_TARGET use the same deployment URL.',
    )
  }

  return result
}
