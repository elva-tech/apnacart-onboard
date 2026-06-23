import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getCatalogStats, getCategories, getProducts } from '../../api/catalogApi'
import { useCatalog } from '../../context/CatalogContext'
import { CatalogLayout } from '../../components/catalog/CatalogLayout'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'

function StatCard({ label, value, accent }: { label: string; value: number | string; accent?: string }) {
  return (
    <Card className="text-center">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${accent || 'text-slate-900'}`}>{value}</p>
    </Card>
  )
}

export function CatalogDashboardPage() {
  const { state, loadFromServer, stats } = useCatalog()
  const [serverStats, setServerStats] = useState(stats)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!state.merchant) return
    let cancelled = false
    ;(async () => {
      try {
        const [products, categories, remoteStats] = await Promise.all([
          getProducts(state.merchant!.merchantCode),
          getCategories(state.merchant!.merchantCode),
          getCatalogStats(state.merchant!.merchantCode),
        ])
        if (!cancelled) {
          if (products.length > 0 || state.products.length === 0) {
            loadFromServer(products, categories)
          }
          setServerStats(remoteStats)
        }
      } catch {
        if (!cancelled) setServerStats(stats)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [state.merchant, loadFromServer, state.products.length, stats])

  const displayStats = state.products.length > 0 ? stats : serverStats

  return (
    <CatalogLayout
      title="Catalog Dashboard"
      subtitle="Upload products, match images, and prepare your catalog for go-live."
    >
      {loading ? (
        <p className="text-sm text-slate-500">Loading dashboard...</p>
      ) : (
        <div className="space-y-6">
          <Card className="border-primary-200 bg-primary-50">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-primary-800">Catalog Completion</p>
                <p className="text-3xl font-bold text-primary-900">{displayStats.completionPercentage}%</p>
                <p className="mt-1 text-xs text-primary-700">Complete</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link to="/catalog/upload">
                  <Button size="sm">Upload Products</Button>
                </Link>
                <Link to="/catalog/images">
                  <Button size="sm" variant="outline">
                    Upload Images
                  </Button>
                </Link>
                <Link to="/catalog/review">
                  <Button size="sm" variant="outline">
                    Review Products
                  </Button>
                </Link>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <StatCard label="Total Products" value={displayStats.totalProducts} />
            <StatCard label="With Images" value={displayStats.productsWithImages} accent="text-green-700" />
            <StatCard label="Missing Images" value={displayStats.productsMissingImages} accent="text-amber-700" />
            <StatCard label="Duplicates" value={displayStats.duplicateProducts} accent="text-red-700" />
            <StatCard label="Validation Errors" value={displayStats.validationErrors} accent="text-red-700" />
          </div>

          <Card>
            <h2 className="text-lg font-semibold text-slate-900">Getting Started</h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-slate-600">
              <li>Download the product template and fill in your catalog</li>
              <li>Upload Products.xlsx or CSV file</li>
              <li>Upload Images.zip — images are auto-matched to products</li>
              <li>Review and fix any validation issues</li>
              <li>Submit catalog for ELVA approval</li>
            </ol>
          </Card>
        </div>
      )}
    </CatalogLayout>
  )
}
