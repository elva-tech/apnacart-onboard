import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { submitOnboarding } from '../api/submitOnboarding'
import { submitWorkflow } from '../api/workflowApi'
import { DAYS_OF_WEEK } from '../types/onboarding'
import { useOnboarding } from '../context/OnboardingContext'
import { useAuth } from '../context/AuthContext'
import { formatCurrency, formatDayTiming } from '../utils/onboarding'
import { ReviewItem, ReviewSection } from '../components/ReviewSection'
import { Card } from '../components/ui/Card'
import { WizardLayout } from '../components/layout/WizardLayout'
import { WizardNavigation } from '../components/layout/WizardNavigation'

export function ReviewPage() {
  const navigate = useNavigate()
  const { state, setCurrentStep, markSubmitted } = useOnboarding()
  const { session, canEdit, refreshDashboard } = useAuth()
  const { formData } = state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const goBack = () => {
    setCurrentStep(10)
    navigate('/assets')
  }

  const handleEdit = (path: string) => {
    const stepMap: Record<string, number> = {
      '/business': 1,
      '/location': 2,
      '/delivery': 3,
      '/timings': 4,
      '/branding': 5,
      '/store-admin': 6,
      '/operations': 7,
      '/documents': 8,
      '/banking': 9,
      '/assets': 10,
    }
    setCurrentStep(stepMap[path] ?? 1)
    navigate(path)
  }

  const handleSubmit = async () => {
    if (!canEdit) return
    setLoading(true)
    setError(null)

    try {
      if (session?.sessionToken) {
        const result = await submitWorkflow(session.sessionToken, formData)
        markSubmitted({
          onboardingId: result.onboardingId,
          merchantCode: result.merchantCode,
          storeCode: result.storeCode,
        })
        await refreshDashboard()
      } else {
        const result = await submitOnboarding(formData)
        markSubmitted({
          onboardingId: result.onboardingId!,
          merchantCode: result.merchantCode,
          storeCode: result.storeCode,
        })
      }
      navigate('/success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const filePreview = (file: { dataUrl: string; name: string } | null, className: string) =>
    file ? (
      <img src={file.dataUrl} alt={file.name} className={className} />
    ) : (
      '—'
    )

  return (
    <WizardLayout
      currentStep={11}
      title="Review & Submit"
      subtitle="Please review all information before submitting your onboarding."
    >
      <div className="space-y-4">
        <ReviewSection title="Business Information" stepPath="/business" onEdit={handleEdit}>
          <ReviewItem label="Store Name" value={formData.storeName} />
          <ReviewItem label="Business Name" value={formData.businessName} />
          <ReviewItem label="Owner Name" value={formData.ownerName} />
          <ReviewItem label="GST Number" value={formData.gstNumber} />
          <ReviewItem label="PAN Number" value={formData.panNumber || '—'} />
          <ReviewItem label="Primary Phone" value={formData.primaryPhone} />
          <ReviewItem label="Secondary Phone" value={formData.secondaryPhone || '—'} />
          <ReviewItem label="Email" value={formData.emailAddress} />
        </ReviewSection>

        <ReviewSection title="Store Location" stepPath="/location" onEdit={handleEdit}>
          <ReviewItem label="Address" value={formData.storeAddress} />
          <ReviewItem label="Landmark" value={formData.landmark || '—'} />
          <ReviewItem label="City" value={formData.city} />
          <ReviewItem label="State" value={formData.state} />
          <ReviewItem label="Pincode" value={formData.pincode} />
          <ReviewItem
            label="Coordinates"
            value={
              formData.latitude !== null && formData.longitude !== null
                ? `${formData.latitude.toFixed(6)}, ${formData.longitude.toFixed(6)}`
                : '—'
            }
          />
        </ReviewSection>

        <ReviewSection title="Delivery Configuration" stepPath="/delivery" onEdit={handleEdit}>
          <ReviewItem label="Delivery Radius" value={`${formData.deliveryRadius} KM`} />
          <ReviewItem label="Minimum Order" value={formatCurrency(formData.minimumOrderAmount)} />
          <ReviewItem label="Delivery Charge" value={formatCurrency(formData.deliveryCharge)} />
          <ReviewItem
            label="Free Delivery Above"
            value={formData.freeDeliveryAbove ? formatCurrency(formData.freeDeliveryAbove) : '—'}
          />
          <ReviewItem label="COD Enabled" value={formData.codEnabled ? 'Yes' : 'No'} />
          <ReviewItem label="Online Payment" value={formData.onlinePaymentEnabled ? 'Yes' : 'No'} />
        </ReviewSection>

        <ReviewSection title="Store Timings" stepPath="/timings" onEdit={handleEdit}>
          {DAYS_OF_WEEK.map((day) => {
            const timing = formData.timings[day]
            const label = day.charAt(0).toUpperCase() + day.slice(1)
            return (
              <ReviewItem
                key={day}
                label={label}
                value={formatDayTiming(timing.openTime, timing.closeTime, timing.closed)}
              />
            )
          })}
        </ReviewSection>

        <ReviewSection title="Branding" stepPath="/branding" onEdit={handleEdit}>
          <ReviewItem
            label="Store Logo"
            value={filePreview(formData.logo, 'mt-1 h-12 w-12 rounded border object-cover')}
          />
          <ReviewItem
            label="Store Banner"
            value={filePreview(formData.banner, 'mt-1 h-16 w-full max-w-xs rounded border object-cover')}
          />
          <ReviewItem label="Description" value={formData.storeDescription || '—'} />
          <ReviewItem
            label="Brand Color"
            value={
              <span className="inline-flex items-center gap-2">
                <span
                  className="inline-block h-5 w-5 rounded border"
                  style={{ backgroundColor: formData.brandColor }}
                />
                {formData.brandColor}
              </span>
            }
          />
        </ReviewSection>

        <ReviewSection title="Store Administrator" stepPath="/store-admin" onEdit={handleEdit}>
          <ReviewItem label="Admin Name" value={formData.adminName} />
          <ReviewItem label="Admin Email" value={formData.adminEmail} />
          <ReviewItem label="Admin Phone" value={formData.adminPhone} />
        </ReviewSection>

        <ReviewSection title="Merchant Operations" stepPath="/operations" onEdit={handleEdit}>
          <ReviewItem label="WhatsApp Number" value={formData.whatsappNumber} />
          <ReviewItem label="Support Phone" value={formData.supportPhone} />
          <ReviewItem label="Support Email" value={formData.supportEmail} />
          <ReviewItem label="Delivery Model" value={formData.deliveryModel} />
          <ReviewItem label="Estimated Delivery Time" value={formData.estimatedDeliveryTime} />
        </ReviewSection>

        <ReviewSection title="Legal Documents" stepPath="/documents" onEdit={handleEdit}>
          <ReviewItem label="GST Certificate" value={formData.gstCertificate?.name || '—'} />
          <ReviewItem label="PAN Card" value={formData.panCard?.name || '—'} />
          <ReviewItem label="FSSAI License" value={formData.fssaiLicense?.name || '—'} />
          <ReviewItem
            label="Business Registration"
            value={formData.businessRegistration?.name || '—'}
          />
        </ReviewSection>

        <ReviewSection title="Banking Information" stepPath="/banking" onEdit={handleEdit}>
          <ReviewItem label="Account Holder" value={formData.accountHolderName} />
          <ReviewItem label="Bank Name" value={formData.bankName} />
          <ReviewItem label="Account Number" value={formData.accountNumber} />
          <ReviewItem label="IFSC Code" value={formData.ifscCode} />
          <ReviewItem label="UPI ID" value={formData.upiId} />
        </ReviewSection>

        <ReviewSection title="Store Assets" stepPath="/assets" onEdit={handleEdit}>
          <ReviewItem
            label="Store Front Photo"
            value={filePreview(formData.storeFrontPhoto, 'mt-1 h-16 w-full max-w-xs rounded border object-cover')}
          />
          <ReviewItem
            label="Store Interior Photo"
            value={filePreview(formData.storeInteriorPhoto, 'mt-1 h-16 w-full max-w-xs rounded border object-cover')}
          />
        </ReviewSection>

        {error && (
          <Card className="border-red-200 bg-red-50">
            <p className="text-sm text-red-700">{error}</p>
          </Card>
        )}

        <Card>
          <WizardNavigation
            onPrevious={goBack}
            onNext={handleSubmit}
            nextLabel="Submit Onboarding"
            nextLoading={loading}
            nextDisabled={!canEdit}
          />
        </Card>
      </div>
    </WizardLayout>
  )
}
