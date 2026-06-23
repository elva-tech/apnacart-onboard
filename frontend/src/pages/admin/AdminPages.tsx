import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listMerchants } from '../../api/adminApi'
import { useAuth } from '../../context/AuthContext'
import { AppShell } from '../../components/layout/AppShell'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import type { AdminMerchantSummary } from '../../types/workflow'

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  SUBMITTED: 'bg-amber-100 text-amber-800',
  UNDER_REVIEW: 'bg-purple-100 text-purple-800',
  REJECTED: 'bg-red-100 text-red-800',
  RESUBMITTED: 'bg-orange-100 text-orange-800',
  APPROVED: 'bg-green-100 text-green-800',
  GO_LIVE: 'bg-emerald-100 text-emerald-900',
}

export function AdminMerchantsPage() {
  const { session } = useAuth()
  const [merchants, setMerchants] = useState<AdminMerchantSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    if (!session?.sessionToken) return
    listMerchants(session.sessionToken)
      .then(setMerchants)
      .finally(() => setLoading(false))
  }, [session])

  const filtered = merchants.filter(
    (m) =>
      m.storeName.toLowerCase().includes(filter.toLowerCase()) ||
      m.merchantCode.toLowerCase().includes(filter.toLowerCase()) ||
      m.primaryPhone.includes(filter),
  )

  return (
    <AppShell variant="admin">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Merchants</h1>
        <p className="mt-1 text-sm text-slate-600">Review onboarding progress, edit details, and approve go-live.</p>
      </div>

      <Input label="Search" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Store, code, phone..." />

      {loading ? (
        <p className="mt-4 text-sm text-slate-500">Loading merchants...</p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Merchant</th>
                <th className="px-4 py-3">Store</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Progress</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr key={m.merchantCode} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-mono text-xs">{m.merchantCode}</td>
                  <td className="px-4 py-3">{m.storeName || '—'}</td>
                  <td className="px-4 py-3">{m.primaryPhone}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[m.workflowStatus] || 'bg-slate-100'}`}>
                      {m.workflowStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">{m.overallProgress}%</td>
                  <td className="px-4 py-3">
                    <Link to={`/admin/merchants/${m.merchantCode}`}>
                      <Button size="sm" variant="outline">
                        View
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  )
}
