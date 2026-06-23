import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getMerchant, reviewMerchant, updateMerchant } from '../../api/adminApi'
import { useAuth } from '../../context/AuthContext'
import { DELIVERY_MODELS, ESTIMATED_DELIVERY_TIMES } from '../../constants/phase2'
import { INDIAN_STATES } from '../../constants/indianStates'
import { DAYS_OF_WEEK, type DayOfWeek } from '../../types/onboarding'
import { adminFormToPayload, apiToAdminForm, type AdminMerchantForm } from '../../utils/adminMerchantForm'
import { AdminFormSection, UrlPreview } from '../../components/admin/AdminFormSection'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Checkbox } from '../../components/ui/Checkbox'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Textarea } from '../../components/ui/Textarea'
import { ProgressBadge } from '../../components/ui/ProgressBadge'
import { AppShell } from '../../components/layout/AppShell'

export function AdminMerchantDetailPage() {
  const { merchantCode } = useParams<{ merchantCode: string }>()
  const { session } = useAuth()
  const [form, setForm] = useState<AdminMerchantForm | null>(null)
  const [steps, setSteps] = useState<{ step: number; title: string; progress: number; complete: boolean }[]>([])
  const [workflowStatus, setWorkflowStatus] = useState('')
  const [overallProgress, setOverallProgress] = useState(0)
  const [productCount, setProductCount] = useState(0)
  const [products, setProducts] = useState<{ productName?: string; sku?: string; sellingPrice?: number; productStatus?: string }[]>([])
  const [comments, setComments] = useState('')
  const [loading, setLoading] = useState(true)
  const [saveLoading, setSaveLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const loadMerchant = async () => {
    if (!session?.sessionToken || !merchantCode) return
    const detail = await getMerchant(session.sessionToken, merchantCode)
    setForm(apiToAdminForm(detail.formData || {}))
    setSteps(detail.steps)
    setWorkflowStatus(detail.workflowStatus)
    setOverallProgress(detail.overallProgress)
    setProductCount(detail.productCount)
    setProducts(detail.products || [])
    setComments(String(detail.formData?.adminComments || ''))
  }

  useEffect(() => {
    if (!session?.sessionToken || !merchantCode) return
    loadMerchant()
      .catch((err) => setMessage(err instanceof Error ? err.message : 'Failed to load merchant'))
      .finally(() => setLoading(false))
  }, [session, merchantCode])

  const setField = <K extends keyof AdminMerchantForm>(key: K, value: AdminMerchantForm[K]) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev))
  }

  const setTiming = (day: DayOfWeek, key: 'openTime' | 'closeTime' | 'closed', value: string | boolean) => {
    setForm((prev) =>
      prev
        ? {
            ...prev,
            timings: {
              ...prev.timings,
              [day]: { ...prev.timings[day], [key]: value },
            },
          }
        : prev,
    )
  }

  const handleSave = async () => {
    if (!session?.sessionToken || !merchantCode || !form) return
    setSaveLoading(true)
    setMessage(null)
    try {
      const payload = adminFormToPayload({ ...form, adminComments: comments })
      const result = await updateMerchant(session.sessionToken, merchantCode, payload)
      setForm(apiToAdminForm(result.formData))
      setSteps(result.steps)
      setWorkflowStatus(result.workflowStatus)
      setOverallProgress(result.overallProgress)
      setMessage('Merchant details saved successfully.')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaveLoading(false)
    }
  }

  const runAction = async (action: 'REJECT' | 'APPROVE' | 'UNDER_REVIEW' | 'GO_LIVE') => {
    if (!session?.sessionToken || !merchantCode) return
    setActionLoading(true)
    setMessage(null)
    try {
      await reviewMerchant(session.sessionToken, merchantCode, action, comments)
      await loadMerchant()
      setMessage(`Status updated: ${action}`)
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Action failed')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading || !form) {
    return (
      <AppShell variant="admin">
        <p className="text-sm text-slate-500">Loading merchant...</p>
      </AppShell>
    )
  }

  return (
    <AppShell variant="admin" mainClassName="pb-12">
      <div className="sticky top-[4.5rem] z-30 -mx-4 mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6">
        <div>
          <Link to="/admin" className="text-sm text-primary-600 hover:text-primary-700">
            ← Back to merchants
          </Link>
          <h1 className="mt-1 text-xl font-bold text-slate-900">{form.storeName || merchantCode}</h1>
          <p className="text-sm text-slate-500">
            {merchantCode} · {workflowStatus} · {overallProgress}% · {productCount} products
          </p>
        </div>
        <Button loading={saveLoading} onClick={() => void handleSave()}>
          Save All Changes
        </Button>
      </div>

      <div className="space-y-4">
        {message && (
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">{message}</div>
        )}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {steps.map((step) => (
            <Card key={step.step}>
              <p className="text-xs text-slate-500">Step {step.step}</p>
              <p className="font-medium text-slate-900">{step.title}</p>
              <ProgressBadge progress={step.progress} className="mt-2" />
            </Card>
          ))}
        </div>

        <AdminFormSection title="Business Information">
          <Input label="Store Name" value={form.storeName} onChange={(e) => setField('storeName', e.target.value)} />
          <Input label="Business Name" value={form.businessName} onChange={(e) => setField('businessName', e.target.value)} />
          <Input label="Owner Name" value={form.ownerName} onChange={(e) => setField('ownerName', e.target.value)} />
          <Input label="GST Number" value={form.gstNumber} onChange={(e) => setField('gstNumber', e.target.value)} />
          <Input label="PAN Number" value={form.panNumber} onChange={(e) => setField('panNumber', e.target.value)} />
          <Input label="Primary Phone" value={form.primaryPhone} onChange={(e) => setField('primaryPhone', e.target.value)} />
          <Input label="Secondary Phone" value={form.secondaryPhone} onChange={(e) => setField('secondaryPhone', e.target.value)} />
          <Input label="Email" type="email" value={form.emailAddress} onChange={(e) => setField('emailAddress', e.target.value)} />
        </AdminFormSection>

        <AdminFormSection title="Store Location">
          <Input className="sm:col-span-2" label="Address" value={form.storeAddress} onChange={(e) => setField('storeAddress', e.target.value)} />
          <Input label="Landmark" value={form.landmark} onChange={(e) => setField('landmark', e.target.value)} />
          <Input label="City" value={form.city} onChange={(e) => setField('city', e.target.value)} />
          <Select label="State" options={INDIAN_STATES} value={form.state} onChange={(e) => setField('state', e.target.value)} />
          <Input label="Pincode" value={form.pincode} onChange={(e) => setField('pincode', e.target.value)} />
          <Input label="Latitude" value={form.latitude} onChange={(e) => setField('latitude', e.target.value)} />
          <Input label="Longitude" value={form.longitude} onChange={(e) => setField('longitude', e.target.value)} />
        </AdminFormSection>

        <AdminFormSection title="Delivery Configuration">
          <Input label="Delivery Radius (KM)" value={form.deliveryRadius} onChange={(e) => setField('deliveryRadius', e.target.value)} />
          <Input label="Minimum Order (₹)" value={form.minimumOrderAmount} onChange={(e) => setField('minimumOrderAmount', e.target.value)} />
          <Input label="Delivery Charge (₹)" value={form.deliveryCharge} onChange={(e) => setField('deliveryCharge', e.target.value)} />
          <Input label="Free Delivery Above (₹)" value={form.freeDeliveryAbove} onChange={(e) => setField('freeDeliveryAbove', e.target.value)} />
          <Checkbox label="COD Enabled" checked={form.codEnabled} onChange={(e) => setField('codEnabled', e.target.checked)} />
          <Checkbox label="Online Payment Enabled" checked={form.onlinePaymentEnabled} onChange={(e) => setField('onlinePaymentEnabled', e.target.checked)} />
        </AdminFormSection>

        <Card>
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Store Timings</h2>
          <div className="space-y-3">
            {DAYS_OF_WEEK.map((day) => (
              <div key={day} className="grid gap-3 rounded-lg border border-slate-200 p-3 sm:grid-cols-[100px_1fr_1fr_auto] sm:items-end">
                <p className="text-sm font-medium capitalize text-slate-800">{day}</p>
                <Input label="Open" type="time" value={form.timings[day].openTime} disabled={form.timings[day].closed} onChange={(e) => setTiming(day, 'openTime', e.target.value)} />
                <Input label="Close" type="time" value={form.timings[day].closeTime} disabled={form.timings[day].closed} onChange={(e) => setTiming(day, 'closeTime', e.target.value)} />
                <Checkbox label="Closed" checked={form.timings[day].closed} onChange={(e) => setTiming(day, 'closed', e.target.checked)} />
              </div>
            ))}
          </div>
        </Card>

        <AdminFormSection title="Branding">
          <Input className="sm:col-span-2" label="Store Description" value={form.storeDescription} onChange={(e) => setField('storeDescription', e.target.value)} />
          <Input label="Brand Color" type="color" className="h-12 w-full cursor-pointer p-1 sm:w-32" value={form.brandColor} onChange={(e) => setField('brandColor', e.target.value)} />
          <Input label="Logo URL" value={form.logoUrl} onChange={(e) => setField('logoUrl', e.target.value)} />
          <UrlPreview url={form.logoUrl} label="logo" />
          <Input label="Banner URL" value={form.bannerUrl} onChange={(e) => setField('bannerUrl', e.target.value)} />
          <UrlPreview url={form.bannerUrl} label="banner" />
        </AdminFormSection>

        <AdminFormSection title="Store Assets">
          <Input label="Store Front Photo URL" value={form.storeFrontPhotoUrl} onChange={(e) => setField('storeFrontPhotoUrl', e.target.value)} />
          <UrlPreview url={form.storeFrontPhotoUrl} label="store front" />
          <Input label="Store Interior Photo URL" value={form.storeInteriorPhotoUrl} onChange={(e) => setField('storeInteriorPhotoUrl', e.target.value)} />
          <UrlPreview url={form.storeInteriorPhotoUrl} label="store interior" />
        </AdminFormSection>

        <AdminFormSection title="Store Administrator">
          <Input label="Administrator Name" value={form.adminName} onChange={(e) => setField('adminName', e.target.value)} />
          <Input label="Administrator Email" value={form.adminEmail} onChange={(e) => setField('adminEmail', e.target.value)} />
          <Input label="Administrator Phone" value={form.adminPhone} onChange={(e) => setField('adminPhone', e.target.value)} />
        </AdminFormSection>

        <AdminFormSection title="Operations">
          <Input label="WhatsApp Number" value={form.whatsappNumber} onChange={(e) => setField('whatsappNumber', e.target.value)} />
          <Input label="Support Phone" value={form.supportPhone} onChange={(e) => setField('supportPhone', e.target.value)} />
          <Input label="Support Email" value={form.supportEmail} onChange={(e) => setField('supportEmail', e.target.value)} />
          <Select label="Delivery Model" options={[...DELIVERY_MODELS]} value={form.deliveryModel} onChange={(e) => setField('deliveryModel', e.target.value)} />
          <Select label="Estimated Delivery Time" options={[...ESTIMATED_DELIVERY_TIMES]} value={form.estimatedDeliveryTime} onChange={(e) => setField('estimatedDeliveryTime', e.target.value)} />
        </AdminFormSection>

        <AdminFormSection title="Legal Documents">
          <Input label="GST Certificate URL" value={form.gstCertificateUrl} onChange={(e) => setField('gstCertificateUrl', e.target.value)} />
          <UrlPreview url={form.gstCertificateUrl} label="GST certificate" />
          <Input label="PAN Card URL" value={form.panCardUrl} onChange={(e) => setField('panCardUrl', e.target.value)} />
          <UrlPreview url={form.panCardUrl} label="PAN card" />
          <Input label="FSSAI License URL" value={form.fssaiLicenseUrl} onChange={(e) => setField('fssaiLicenseUrl', e.target.value)} />
          <UrlPreview url={form.fssaiLicenseUrl} label="FSSAI license" />
          <Input label="Business Registration URL" value={form.businessRegistrationUrl} onChange={(e) => setField('businessRegistrationUrl', e.target.value)} />
          <UrlPreview url={form.businessRegistrationUrl} label="registration" />
        </AdminFormSection>

        <AdminFormSection title="Banking">
          <Input label="Account Holder Name" value={form.accountHolderName} onChange={(e) => setField('accountHolderName', e.target.value)} />
          <Input label="Bank Name" value={form.bankName} onChange={(e) => setField('bankName', e.target.value)} />
          <Input label="Account Number" value={form.accountNumber} onChange={(e) => setField('accountNumber', e.target.value)} />
          <Input label="IFSC Code" value={form.ifscCode} onChange={(e) => setField('ifscCode', e.target.value)} />
          <Input label="UPI ID" value={form.upiId} onChange={(e) => setField('upiId', e.target.value)} />
        </AdminFormSection>

        <AdminFormSection title="Workflow & Status">
          <Input label="Onboarding ID" value={form.onboardingId} disabled />
          <Input label="Store Code" value={form.storeCode} disabled />
          <Input label="Submitted At" value={form.submittedAt} disabled />
          <Input label="Go Live Status" value={form.goLiveStatus} onChange={(e) => setField('goLiveStatus', e.target.value)} />
          <Input label="Go Live Date" value={form.goLiveDate} disabled />
          <Checkbox label="Catalog Skipped" checked={form.catalogSkipped} onChange={(e) => setField('catalogSkipped', e.target.checked)} />
          <Checkbox label="Agreements Accepted" checked={form.agreementsAccepted} disabled />
        </AdminFormSection>

        <Card>
          <h2 className="text-sm font-semibold text-slate-900">Product Catalog ({productCount})</h2>
          {products.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">
              {form.catalogSkipped ? 'Catalog was skipped during onboarding.' : 'No products uploaded yet.'}
            </p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="py-2 pr-4">Product</th>
                    <th className="py-2 pr-4">SKU</th>
                    <th className="py-2 pr-4">Price</th>
                    <th className="py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p, i) => (
                    <tr key={i} className="border-b border-slate-100">
                      <td className="py-2 pr-4">{p.productName || '—'}</td>
                      <td className="py-2 pr-4">{p.sku || '—'}</td>
                      <td className="py-2 pr-4">{p.sellingPrice ?? '—'}</td>
                      <td className="py-2">{p.productStatus || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card>
          <h2 className="text-sm font-semibold text-slate-900">Review Actions</h2>
          <Textarea
            className="mt-3"
            label="Admin Comments (visible to merchant)"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Required for rejection. Visible to merchant."
          />
          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" variant="outline" loading={actionLoading} onClick={() => void runAction('UNDER_REVIEW')}>
              Mark Under Review
            </Button>
            <Button size="sm" variant="outline" loading={actionLoading} onClick={() => void runAction('REJECT')}>
              Reject
            </Button>
            <Button size="sm" loading={actionLoading} onClick={() => void runAction('APPROVE')}>
              Approve
            </Button>
            <Button size="sm" variant="secondary" loading={actionLoading} onClick={() => void runAction('GO_LIVE')}>
              Go Live
            </Button>
          </div>
        </Card>
      </div>
    </AppShell>
  )
}
