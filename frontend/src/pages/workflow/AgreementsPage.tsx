import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AGREEMENT_VERSION } from '../../constants/workflow'
import { saveAgreements } from '../../api/workflowApi'
import { useAuth } from '../../context/AuthContext'
import { WorkflowLayout } from '../../components/workflow/WorkflowLayout'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Checkbox } from '../../components/ui/Checkbox'

export function AgreementsPage() {
  const navigate = useNavigate()
  const { session, canEdit, refreshDashboard } = useAuth()
  const [terms, setTerms] = useState(false)
  const [merchantAgreement, setMerchantAgreement] = useState(false)
  const [privacy, setPrivacy] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const allAccepted = terms && merchantAgreement && privacy

  const handleSubmit = async () => {
    if (!session?.sessionToken || !allAccepted) return
    setLoading(true)
    setError(null)
    try {
      await saveAgreements(session.sessionToken)
      await refreshDashboard()
      navigate('/dashboard')
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
          <p className="mt-2 max-h-40 overflow-y-auto text-sm text-slate-600">
            By using the ApnaCart platform, you agree to comply with all applicable laws, provide accurate
            merchant information, maintain product quality standards, and fulfill orders per your stated delivery
            commitments. ApnaCart reserves the right to suspend stores that violate platform policies.
          </p>
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
          <p className="mt-2 max-h-40 overflow-y-auto text-sm text-slate-600">
            You authorize ApnaCart to list your products, process customer orders on your behalf, and display your
            store information to customers. Commission and settlement terms will be provided separately upon approval.
          </p>
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
          <p className="mt-2 max-h-40 overflow-y-auto text-sm text-slate-600">
            Your business data, banking information, and documents will be stored securely and used only for merchant
            onboarding, store activation, and regulatory compliance. We do not sell your data to third parties.
          </p>
          <Checkbox
            className="mt-4"
            label="I accept the Privacy Policy"
            checked={privacy}
            onChange={(e) => setPrivacy(e.target.checked)}
            disabled={!canEdit}
          />
        </Card>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
          <Button onClick={handleSubmit} loading={loading} disabled={!allAccepted || !canEdit}>
            Save & Return to Dashboard
          </Button>
        </div>
      </div>
    </WorkflowLayout>
  )
}
