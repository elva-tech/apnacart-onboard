import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MAX_PRODUCT_FILE_BYTES } from '../../constants/catalog'
import { useCatalog } from '../../context/CatalogContext'
import { CatalogLayout } from '../../components/catalog/CatalogLayout'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { generateProductTemplate, parseProductFile } from '../../utils/excelParser'
import { validateProducts } from '../../utils/productValidation'

export function ProductUploadPage() {
  const navigate = useNavigate()
  const { importProducts } = useCatalog()
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<{ row: number; message: string; productName: string }[]>([])
  const [parsedCount, setParsedCount] = useState(0)
  const [loading, setLoading] = useState(false)

  const handleFile = async (file: File) => {
    setError(null)
    setValidationErrors([])
    setParsedCount(0)

    if (file.size > MAX_PRODUCT_FILE_BYTES) {
      setError(`File exceeds maximum size of ${MAX_PRODUCT_FILE_BYTES / (1024 * 1024)} MB`)
      return
    }

    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!ext || !['xlsx', 'csv'].includes(ext)) {
      setError('Only .xlsx and .csv files are supported.')
      return
    }

    setLoading(true)
    try {
      const buffer = await file.arrayBuffer()
      const products = parseProductFile(buffer, file.name)
      const issues = validateProducts(products)

      setParsedCount(products.length)
      if (issues.length > 0) {
        setValidationErrors(
          issues.map((i) => ({ row: i.row, message: i.message, productName: i.productName })),
        )
      }

      importProducts(products)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse product file.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <CatalogLayout
      title="Upload Products"
      subtitle="Upload Products.xlsx or CSV. All validation errors are shown before import."
    >
      <div className="space-y-4">
        <Card>
          <h2 className="text-sm font-semibold text-slate-900">Product Template</h2>
          <p className="mt-1 text-sm text-slate-600">
            Required: Product Name, Category, Description, Unit, Selling Price, MRP, Stock Quantity.
            Optional: SKU, HSN Code, Tax Percentage, Brand, Weight.
          </p>
          <Button className="mt-4" variant="outline" size="sm" onClick={generateProductTemplate}>
            Download Template
          </Button>
        </Card>

        <Card>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void handleFile(file)
              e.target.value = ''
            }}
          />
          <div
            className="flex cursor-pointer flex-col items-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-10 transition-colors hover:border-primary-400 hover:bg-primary-50"
            onClick={() => inputRef.current?.click()}
          >
            <p className="text-sm font-medium text-slate-700">Click to upload Products.xlsx or CSV</p>
            <p className="mt-1 text-xs text-slate-500">Max 20 MB · .xlsx, .csv</p>
          </div>
          {loading && <p className="mt-3 text-sm text-slate-500">Parsing file...</p>}
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          {parsedCount > 0 && (
            <p className="mt-3 text-sm text-green-700">
              Parsed {parsedCount} product{parsedCount !== 1 ? 's' : ''}.
            </p>
          )}
        </Card>

        {validationErrors.length > 0 && (
          <Card className="border-amber-200 bg-amber-50">
            <h3 className="text-sm font-semibold text-amber-900">
              Validation Errors ({validationErrors.length})
            </h3>
            <div className="mt-3 max-h-64 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-amber-200">
                    <th className="py-1 pr-2">Row</th>
                    <th className="py-1 pr-2">Product</th>
                    <th className="py-1">Error</th>
                  </tr>
                </thead>
                <tbody>
                  {validationErrors.map((v, i) => (
                    <tr key={i} className="border-b border-amber-100">
                      <td className="py-1 pr-2">{v.row}</td>
                      <td className="py-1 pr-2">{v.productName || '—'}</td>
                      <td className="py-1">{v.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-amber-800">
              Products with errors are imported but marked Invalid Data. Fix them on the Review page.
            </p>
          </Card>
        )}

        {parsedCount > 0 && (
          <div className="flex gap-3">
            <Button onClick={() => navigate('/catalog/images')}>Continue to Images</Button>
            <Button variant="outline" onClick={() => navigate('/catalog/review')}>
              Review Products
            </Button>
          </div>
        )}
      </div>
    </CatalogLayout>
  )
}
