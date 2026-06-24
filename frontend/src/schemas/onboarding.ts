import { z } from 'zod'
import { DELIVERY_MODELS, ESTIMATED_DELIVERY_TIMES } from '../constants/phase2'
import type { DayOfWeek } from '../types/onboarding'

const INDIAN_MOBILE_REGEX = /^(\+91[\s-]?)?[6-9]\d{9}$/
const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/
const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/
const UPI_REGEX = /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z]{2,64}$/

export const indianMobileSchema = z
  .string()
  .min(1, 'Phone number is required')
  .refine(
    (val) => INDIAN_MOBILE_REGEX.test(val.replace(/\s/g, '')),
    'Enter a valid Indian mobile number (10 digits starting with 6-9)',
  )

export const optionalIndianMobileSchema = z
  .string()
  .refine(
    (val) => val === '' || INDIAN_MOBILE_REGEX.test(val.replace(/\s/g, '')),
    'Enter a valid Indian mobile number (10 digits starting with 6-9)',
  )

export const emailSchema = z.string().min(1, 'Email is required').email('Enter a valid email address')

export const optionalGstSchema = z
  .string()
  .transform((val) => val.toUpperCase().replace(/\s/g, ''))
  .refine(
    (val) => val === '' || GST_REGEX.test(val),
    'Enter a valid 15-character GST number',
  )

export const gstSchema = optionalGstSchema

export const optionalPanSchema = z
  .string()
  .refine(
    (val) => val === '' || PAN_REGEX.test(val.toUpperCase()),
    'Enter a valid PAN number (e.g. ABCDE1234F)',
  )

export const businessInfoSchema = z.object({
  storeName: z.string().min(1, 'Store name is required'),
  businessName: z.string().min(1, 'Business name is required'),
  ownerName: z.string().min(1, 'Owner name is required'),
  gstNumber: optionalGstSchema,
  panNumber: optionalPanSchema,
  primaryPhone: indianMobileSchema,
  secondaryPhone: optionalIndianMobileSchema,
  emailAddress: emailSchema,
})

export const storeLocationSchema = z.object({
  storeAddress: z.string().min(1, 'Store address is required'),
  landmark: z.string(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  pincode: z
    .string()
    .min(1, 'Pincode is required')
    .regex(/^\d{6}$/, 'Enter a valid 6-digit pincode'),
  latitude: z.number({ message: 'Please select your store location on the map' }),
  longitude: z.number({ message: 'Please select your store location on the map' }),
})

const positiveNumberString = z
  .string()
  .min(1, 'This field is required')
  .refine((val) => !isNaN(Number(val)) && Number(val) > 0, 'Enter a positive number')

const optionalPositiveNumberString = z
  .string()
  .refine(
    (val) => val === '' || (!isNaN(Number(val)) && Number(val) > 0),
    'Enter a positive number or leave empty',
  )

export const deliveryConfigSchema = z.object({
  deliveryRadius: positiveNumberString,
  minimumOrderAmount: positiveNumberString,
  deliveryCharge: positiveNumberString,
  freeDeliveryAbove: optionalPositiveNumberString,
  codEnabled: z.boolean(),
  onlinePaymentEnabled: z.boolean(),
}).refine((data) => data.codEnabled || data.onlinePaymentEnabled, {
  message: 'At least one payment option must be enabled',
  path: ['onlinePaymentEnabled'],
})

const dayTimingSchema = z
  .object({
    openTime: z.string(),
    closeTime: z.string(),
    closed: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (!data.closed) {
      if (!data.openTime) {
        ctx.addIssue({ code: 'custom', message: 'Open time is required', path: ['openTime'] })
      }
      if (!data.closeTime) {
        ctx.addIssue({ code: 'custom', message: 'Close time is required', path: ['closeTime'] })
      }
      if (data.openTime && data.closeTime && data.openTime >= data.closeTime) {
        ctx.addIssue({
          code: 'custom',
          message: 'Close time must be after open time',
          path: ['closeTime'],
        })
      }
    }
  })

export const storeTimingsSchema = z.object({
  timings: z.object({
    monday: dayTimingSchema,
    tuesday: dayTimingSchema,
    wednesday: dayTimingSchema,
    thursday: dayTimingSchema,
    friday: dayTimingSchema,
    saturday: dayTimingSchema,
    sunday: dayTimingSchema,
  }),
})

const imageFileSchema = z.object({
  name: z.string(),
  type: z.string(),
  dataUrl: z.string(),
})

const nullableImageFileSchema = imageFileSchema.nullable()

export const brandingSchema = z
  .object({
    storeDescription: z.string(),
    brandColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Select a valid brand color'),
    logo: nullableImageFileSchema,
    banner: nullableImageFileSchema,
  })
  .superRefine((data, ctx) => {
    if (!data.logo) {
      ctx.addIssue({ code: 'custom', message: 'Store logo is required', path: ['logo'] })
    }
  })

export function createBrandingSchema(existing?: { logoUrl?: string }) {
  return z
    .object({
      storeDescription: z.string(),
      brandColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Select a valid brand color'),
      logo: nullableImageFileSchema,
      banner: nullableImageFileSchema,
    })
    .superRefine((data, ctx) => {
      if (!data.logo && !existing?.logoUrl?.trim()) {
        ctx.addIssue({ code: 'custom', message: 'Store logo is required', path: ['logo'] })
      }
    })
}

export const adminAccountSchema = z.object({
  adminName: z.string().min(1, 'Admin name is required'),
  adminEmail: emailSchema,
  adminPhone: indianMobileSchema,
})

export const merchantOperationsSchema = z.object({
  whatsappNumber: indianMobileSchema,
  supportPhone: indianMobileSchema,
  supportEmail: emailSchema,
  deliveryModel: z.enum(DELIVERY_MODELS, { message: 'Select a delivery model' }),
  estimatedDeliveryTime: z.enum(ESTIMATED_DELIVERY_TIMES, {
    message: 'Select estimated delivery time',
  }),
})

const storedFileSchema = z.object({
  name: z.string(),
  type: z.string(),
  dataUrl: z.string(),
})

const nullableStoredFileSchema = storedFileSchema.nullable()

export const legalDocumentsSchema = z
  .object({
    gstCertificate: nullableStoredFileSchema,
    panCard: nullableStoredFileSchema,
    fssaiLicense: nullableStoredFileSchema,
    businessRegistration: nullableStoredFileSchema,
  })
  .superRefine((data, ctx) => {
    if (!data.panCard) {
      ctx.addIssue({ code: 'custom', message: 'PAN card is required', path: ['panCard'] })
    }
  })

export function createLegalDocumentsSchema(existing?: { panCardUrl?: string }) {
  return z
    .object({
      gstCertificate: nullableStoredFileSchema,
      panCard: nullableStoredFileSchema,
      fssaiLicense: nullableStoredFileSchema,
      businessRegistration: nullableStoredFileSchema,
    })
    .superRefine((data, ctx) => {
      if (!data.panCard && !existing?.panCardUrl?.trim()) {
        ctx.addIssue({ code: 'custom', message: 'PAN card is required', path: ['panCard'] })
      }
    })
}

export const bankingInformationSchema = z.object({
  accountHolderName: z.string().min(1, 'Account holder name is required'),
  bankName: z.string().min(1, 'Bank name is required'),
  accountNumber: z
    .string()
    .min(1, 'Account number is required')
    .regex(/^\d{9,18}$/, 'Enter a valid account number (9–18 digits)'),
  ifscCode: z
    .string()
    .min(1, 'IFSC code is required')
    .transform((val) => val.toUpperCase().replace(/\s/g, ''))
    .refine((val) => IFSC_REGEX.test(val), 'Enter a valid IFSC code (e.g. SBIN0001234)'),
  upiId: z
    .string()
    .min(1, 'UPI ID is required')
    .refine((val) => UPI_REGEX.test(val), 'Enter a valid UPI ID (e.g. name@bank)'),
})

export const storeAssetsSchema = z.object({
  storeFrontPhoto: nullableStoredFileSchema,
  storeInteriorPhoto: nullableStoredFileSchema,
})

export function createStoreAssetsSchema(_existing?: {
  storeFrontPhotoUrl?: string
  storeInteriorPhotoUrl?: string
}) {
  return storeAssetsSchema
}

export type BusinessInfoForm = z.infer<typeof businessInfoSchema>
export type StoreLocationForm = z.infer<typeof storeLocationSchema>
export type DeliveryConfigForm = z.infer<typeof deliveryConfigSchema>
export type StoreTimingsForm = z.infer<typeof storeTimingsSchema>
export type BrandingForm = z.infer<typeof brandingSchema>
export type AdminAccountForm = z.infer<typeof adminAccountSchema>
export type MerchantOperationsForm = z.infer<typeof merchantOperationsSchema>
export type LegalDocumentsForm = z.infer<typeof legalDocumentsSchema>
export type BankingInformationForm = z.infer<typeof bankingInformationSchema>
export type StoreAssetsForm = z.infer<typeof storeAssetsSchema>

export const STEP_SCHEMAS = [
  null,
  businessInfoSchema,
  storeLocationSchema,
  deliveryConfigSchema,
  storeTimingsSchema,
  brandingSchema,
  adminAccountSchema,
  merchantOperationsSchema,
  legalDocumentsSchema,
  bankingInformationSchema,
  storeAssetsSchema,
] as const

export function getDayTimingFields(day: DayOfWeek) {
  const label = day.charAt(0).toUpperCase() + day.slice(1)
  return {
    openKey: `${day}Open` as const,
    closeKey: `${day}Close` as const,
    label,
  }
}
