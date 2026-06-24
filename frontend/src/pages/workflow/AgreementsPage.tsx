import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ALLOWED_DOCUMENT_TYPES, MAX_DOCUMENT_SIZE_BYTES } from '../../constants/phase2'
import {
  MERCHANT_AGREEMENT_SUMMARY,
  PRIVACY_POLICY_POINTS,
  TERMS_OF_SERVICE_POINTS,
} from '../../constants/agreements'
import { AGREEMENT_VERSION, WORKFLOW_STEPS } from '../../constants/workflow'
import { saveAgreements } from '../../api/workflowApi'
import { useAuth } from '../../context/AuthContext'
import { useOnboarding } from '../../context/OnboardingContext'
import { storedFileToPayload } from '../../utils/onboarding'
import { WorkflowLayout } from '../../components/workflow/WorkflowLayout'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Checkbox } from '../../components/ui/Checkbox'
import { FileUpload } from '../../components/FileUpload'
import type { StoredFile } from '../../types/onboarding'

const documentAcceptHint = 'PDF, PNG, JPG, JPEG — max 10 MB'

function AgreementPoints({ points }: { points: readonly string[] }) {
  return (
    <ul className="mt-3 max-h-56 list-disc space-y-2 overflow-y-auto pl-5 text-sm text-slate-600">
      {points.map((point) => (
        <li key={point}>{point}</li>
      ))}
    </ul>
  )
}

export function AgreementsPage() {
  const navigate = useNavigate()
  const { state } = useOnboarding()
  const { session, canEdit, refreshDashboard, dashboard } = useAuth()
  const [terms, setTerms] = useState(false)
  const [merchantAgreement, setMerchantAgreement] = useState(false)
  const [privacy, setPrivacy] = useState(false)
  const [agreementFile, setAgreementFile] = useState<StoredFile | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hasExistingAgreement = Boolean(state.formData.merchantAgreementUrl?.trim())
  const hasAgreementFile = Boolean(agreementFile) || hasExistingAgreement
  const allAccepted = terms && merchantAgreement && privacy && hasAgreementFile

  const handleSubmit = async () => {
    if (!session?.sessionToken || !allAccepted) return
    setLoading(true)
    setError(null)
    try {
      await saveAgreements(session.sessionToken, storedFileToPayload(agreementFile))
      await refreshDashboard()
      navigate('/workflow/review')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save agreements')
    } finally {
      setLoading(false)
    }
  }

  return (
    <WorkflowLayout
      currentStep={4}
      title="Agreements"
      subtitle={`Please review and accept all agreements (v${AGREEMENT_VERSION}) before final submission.`}
    >
      <div className="space-y-4">
        <Card>
          <h2 className="text-sm font-semibold text-slate-900">Terms of Service</h2>
          <AgreementPoints points={TERMS_OF_SERVICE_POINTS} />
          <Checkbox
            className="mt-4"
            label="I accept the Terms of Service"
            checked={terms}
            onChange={(e) => setTerms(e.target.checked)}
            disabled={!canEdit}
          />
        </Card>

        <Card>
          <h2 className="text-sm font-semibold text-slate-900">Merchant Agreement</h2>
          <p className="mt-2 text-sm text-slate-600">
            Official agreement between your business and ELVA for use of the ApnaCart platform and applications.
          </p>
          <AgreementPoints points={MERCHANT_AGREEMENT_SUMMARY} />
          <div className="mt-4">
            <FileUpload
              label="Signed Merchant Agreement"
              required
              value={agreementFile}
              onChange={setAgreementFile}
              existingUrl={state.formData.merchantAgreementUrl}
              allowedTypes={ALLOWED_DOCUMENT_TYPES}
              maxSizeBytes={MAX_DOCUMENT_SIZE_BYTES}
              acceptHint={documentAcceptHint}
              imagePreview
            />
          </div>
          <Checkbox
            className="mt-4"
            label="I accept the Merchant Agreement"
            checked={merchantAgreement}
            onChange={(e) => setMerchantAgreement(e.target.checked)}
            disabled={!canEdit}
          />
        </Card>

        <Card>
          <h2 className="text-sm font-semibold text-slate-900">Privacy Policy</h2>
          <AgreementPoints points={PRIVACY_POLICY_POINTS} />
          <Checkbox
            className="mt-4"
            label="I accept the Privacy Policy"
            checked={privacy}
            onChange={(e) => setPrivacy(e.target.checked)}
            disabled={!canEdit}
          />
        </Card>

        {dashboard?.agreementsAccepted && (
          <Card className="border-primary-200 bg-primary-50">
            <p className="text-sm font-medium text-primary-900">Agreements already accepted.</p>
            <Link to={WORKFLOW_STEPS[4].path} className="mt-4 inline-block">
              <Button>Continue to {WORKFLOW_STEPS[4].title} →</Button>
            </Link>
          </Card>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
          <Button onClick={handleSubmit} loading={loading} disabled={!allAccepted || !canEdit}>
            Save & Continue to Review
          </Button>
        </div>
      </div>
    </WorkflowLayout>
  )
}
