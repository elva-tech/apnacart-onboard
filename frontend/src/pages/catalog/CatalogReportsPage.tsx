import { useCatalog } from '../../context/CatalogContext'
import { CatalogLayout } from '../../components/catalog/CatalogLayout'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { exportProductsToExcel } from '../../utils/excelParser'

export function CatalogReportsPage() {
  const { state, stats } = useCatalog()
  const report = state.imageMatchReport

  const missingImages = state.products.filter((p) => !p.imagePreview && !p.imageUrl)
  const duplicates = state.products.filter((p) => p.rowStatus === 'Duplicate Product')
  const priceIssues = state.products.filter((p) =>
    p.validationErrors.some((e) => e.includes('price') || e.includes('MRP')),
  )
  const invalidData = state.products.filter((p) => p.rowStatus === 'Invalid Data')

  const exportReport = (type: string, products: typeof state.products) => {
    exportProductsToExcel(products, `${type}_Report.xlsx`)
  }

  return (
    <CatalogLayout
      title="Catalog Reports"
      subtitle="Export validation and readiness reports as Excel."
    >
      <div className="space-y-4">
        <Card className="border-primary-200 bg-primary-50">
          <h2 className="text-sm font-semibold text-primary-900">Catalog Readiness</h2>
          <p className="mt-2 text-3xl font-bold text-primary-800">{stats.completionPercentage}% Complete</p>
          <ul className="mt-3 space-y-1 text-sm text-primary-700">
            <li>Total products: {stats.totalProducts}</li>
            <li>With images: {stats.productsWithImages}</li>
            <li>Validation errors: {stats.validationErrors}</li>
            <li>Catalog status: {state.catalogSubmitted ? 'SUBMITTED' : 'DRAFT'}</li>
          </ul>
          <Button
            className="mt-4"
            size="sm"
            onClick={() => exportReport('Catalog_Readiness', state.products)}
            disabled={state.products.length === 0}
          >
            Export Readiness Report
          </Button>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <h3 className="text-sm font-semibold text-slate-900">Missing Images ({missingImages.length})</h3>
            <ul className="mt-2 max-h-32 overflow-y-auto text-xs text-slate-600">
              {missingImages.map((p) => (
                <li key={p.id}>{p.productName}</li>
              ))}
            </ul>
            <Button
              className="mt-3"
              size="sm"
              variant="outline"
              disabled={missingImages.length === 0}
              onClick={() => exportReport('Missing_Images', missingImages)}
            >
              Export Excel
            </Button>
          </Card>

          <Card>
            <h3 className="text-sm font-semibold text-slate-900">Duplicate Products ({duplicates.length})</h3>
            <ul className="mt-2 max-h-32 overflow-y-auto text-xs text-slate-600">
              {duplicates.map((p) => (
                <li key={p.id}>{p.productName}</li>
              ))}
            </ul>
            <Button
              className="mt-3"
              size="sm"
              variant="outline"
              disabled={duplicates.length === 0}
              onClick={() => exportReport('Duplicate_Products', duplicates)}
            >
              Export Excel
            </Button>
          </Card>

          <Card>
            <h3 className="text-sm font-semibold text-slate-900">Price Validation ({priceIssues.length})</h3>
            <ul className="mt-2 max-h-32 overflow-y-auto text-xs text-slate-600">
              {priceIssues.map((p) => (
                <li key={p.id}>
                  {p.productName}: {p.validationErrors.join('; ')}
                </li>
              ))}
            </ul>
            <Button
              className="mt-3"
              size="sm"
              variant="outline"
              disabled={priceIssues.length === 0}
              onClick={() => exportReport('Price_Validation', priceIssues)}
            >
              Export Excel
            </Button>
          </Card>

          <Card>
            <h3 className="text-sm font-semibold text-slate-900">Invalid Data ({invalidData.length})</h3>
            <ul className="mt-2 max-h-32 overflow-y-auto text-xs text-slate-600">
              {invalidData.map((p) => (
                <li key={p.id}>
                  {p.productName}: {p.validationErrors.join('; ')}
                </li>
              ))}
            </ul>
            <Button
              className="mt-3"
              size="sm"
              variant="outline"
              disabled={invalidData.length === 0}
              onClick={() => exportReport('Invalid_Data', invalidData)}
            >
              Export Excel
            </Button>
          </Card>
        </div>

        {report && (
          <Card>
            <h3 className="text-sm font-semibold text-slate-900">Image Matching Summary</h3>
            <p className="mt-2 text-sm text-slate-600">
              Matched: {report.matched.length} · Missing: {report.missingImages.length} · Unused:{' '}
              {report.unusedImages.length} · Duplicate mappings: {report.duplicateImages.length}
            </p>
          </Card>
        )}
      </div>
    </CatalogLayout>
  )
}
