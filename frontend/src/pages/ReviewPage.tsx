import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { confirmDataReview } from '../api/workflowApi'
import { formatCurrency } from '../utils/onboarding'
import { renderReviewFileValue } from '../utils/reviewDisplay'
import { useOnboarding } from '../context/OnboardingContext'
import { useAuth } from '../context/AuthContext'
import { ReviewItem, ReviewSection } from '../components/ReviewSection'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Checkbox } from '../components/ui/Checkbox'
import { WorkflowLayout } from '../components/workflow/WorkflowLayout'

export function ReviewPage() {
  const navigate = useNavigate()
  const { state } = useOnboarding()
  const { session, canEdit, refreshDashboard } = useAuth()
  const { formData } = state
  const [confirmed, setConfirmed] = useState(Boolean(formData.reviewConfirmed))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleEdit = (path: string) => {
    navigate(path)
  }

  const handleSaveAndProceed = async () => {
    if (!session?.sessionToken || !confirmed) return
    setLoading(true)
    setError(null)
    try {
      if (!formData.reviewConfirmed) {
        await confirmDataReview(session.sessionToken)
        await refreshDashboard()
      }
      navigate('/workflow/review')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save review confirmation')
    } finally {
      setLoading(false)
    }
  }

  return (
    <WorkflowLayout
      currentStep={5}
      title="Review Your Information"
      subtitle="Verify all details below. Confirm when you are satisfied everything is correct."
    >
      <div className="space-y-4">
        <ReviewSection title="Business Information" stepPath="/business" onEdit={handleEdit}>
          <ReviewItem label="Store Name" value={formData.storeName} />
          <ReviewItem label="Business Name" value={formData.businessName} />
          <ReviewItem label="Owner Name" value={formData.ownerName} />
          <ReviewItem label="GST Number" value={formData.gstNumber || '—'} />
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

        <ReviewSection title="Branding" stepPath="/branding" onEdit={handleEdit}>
          <ReviewItem
            label="Store Logo"
            value={renderReviewFileValue(formData.logo, formData.logoUrl, {
              imageClassName: 'mt-1 h-12 w-12 rounded border object-cover',
            })}
          />
          <ReviewItem
            label="Store Banner"
            value={renderReviewFileValue(formData.banner, formData.bannerUrl, {
              imageClassName: 'mt-1 h-16 w-full max-w-xs rounded border object-cover',
            })}
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
          <ReviewItem
            label="GST Certificate"
            value={renderReviewFileValue(formData.gstCertificate, formData.gstCertificateUrl)}
          />
          <ReviewItem label="PAN Card" value={renderReviewFileValue(formData.panCard, formData.panCardUrl)} />
          <ReviewItem
            label="FSSAI License"
            value={renderReviewFileValue(formData.fssaiLicense, formData.fssaiLicenseUrl)}
          />
          <ReviewItem
            label="Business Registration"
            value={renderReviewFileValue(formData.businessRegistration, formData.businessRegistrationUrl)}
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
          {formData.storeAssetsSkipped ? (
            <ReviewItem label="Status" value="Skipped — add photos later in admin portal" />
          ) : (
            <>
              <ReviewItem
                label="Store Front Photo"
                value={renderReviewFileValue(formData.storeFrontPhoto, formData.storeFrontPhotoUrl, {
                  imageClassName: 'mt-1 h-16 w-full max-w-xs rounded border object-cover',
                })}
              />
              <ReviewItem
                label="Store Interior Photo"
                value={renderReviewFileValue(formData.storeInteriorPhoto, formData.storeInteriorPhotoUrl, {
                  imageClassName: 'mt-1 h-16 w-full max-w-xs rounded border object-cover',
                })}
              />
            </>
          )}
        </ReviewSection>

        {error && (
          <Card className="border-red-200 bg-red-50">
            <p className="text-sm text-red-700">{error}</p>
          </Card>
        )}

        {formData.reviewConfirmed && (
          <Card className="border-green-200 bg-green-50">
            <p className="text-sm font-medium text-green-900">Review already confirmed</p>
            <p className="mt-1 text-sm text-green-800">You can return to the summary to submit your onboarding.</p>
          </Card>
        )}

        <Card>
          <Checkbox
            label="I have reviewed all information above and confirm it is accurate. I am responsible for the data entered."
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            disabled={!canEdit}
          />
          <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => navigate('/workflow/review')}>
              Back to Review Summary
            </Button>
            <Button
              onClick={() => void handleSaveAndProceed()}
              loading={loading}
              disabled={!confirmed || !canEdit}
            >
              Save & Proceed
            </Button>
          </div>
        </Card>
      </div>
    </WorkflowLayout>
  )
}
