import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { saveProducts, submitCatalog } from '../../api/catalogApi'
import { useCatalog } from '../../context/CatalogContext'
import { CatalogLayout } from '../../components/catalog/CatalogLayout'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import type { Product } from '../../types/catalog'

const STATUS_COLORS: Record<Product['rowStatus'], string> = {
  Matched: 'bg-green-100 text-green-800',
  'Missing Image': 'bg-amber-100 text-amber-800',
  'Duplicate Product': 'bg-red-100 text-red-800',
  'Invalid Data': 'bg-red-100 text-red-800',
}

export function ProductReviewPage() {
  const navigate = useNavigate()
  const {
    state,
    updateProduct,
    deleteSelectedProducts,
    bulkUpdateSelected,
    assignImageToSelected,
    toggleProductSelection,
    toggleAllSelection,
    markCatalogSubmitted,
    stats,
  } = useCatalog()

  const [bulkCategory, setBulkCategory] = useState('')
  const [bulkPrice, setBulkPrice] = useState('')
  const [bulkStock, setBulkStock] = useState('')
  const [bulkImage, setBulkImage] = useState('')
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const selectedCount = state.products.filter((p) => p.selected).length

  const handleSave = async () => {
    if (!state.merchant) return
    setSaving(true)
    setError(null)
    try {
      const payload = {
        merchantCode: state.merchant.merchantCode,
        storeCode: state.merchant.storeCode,
        products: state.products.map((p) => ({
          productId: p.productId,
          productName: p.productName,
          category: p.category,
          description: p.description,
          sku: p.sku,
          brand: p.brand,
          unit: p.unit,
          weight: p.weight,
          mrp: p.mrp,
          sellingPrice: p.sellingPrice,
          stockQuantity: p.stockQuantity,
          hsnCode: p.hsnCode,
          taxPercentage: p.taxPercentage,
          productStatus: p.productStatus,
          image: p.imagePreview
            ? {
                name: p.imageFileName || `${p.productName}.jpg`,
                type: 'image/jpeg',
                base64: p.imagePreview.split(',')[1] || '',
              }
            : null,
        })),
      }
      await saveProducts(payload)
      setMessage('Catalog saved successfully.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save catalog.')
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = async () => {
    if (!state.merchant) return
    if (stats.validationErrors > 0) {
      setError('Fix all validation errors before submitting.')
      return
    }
    if (stats.productsMissingImages > 0) {
      setError('All products must have images before submitting.')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      await handleSave()
      const result = await submitCatalog(state.merchant.merchantCode)
      markCatalogSubmitted()
      setMessage(`Catalog submitted. ${result.submitted} products sent for ELVA review.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit catalog.')
    } finally {
      setSubmitting(false)
    }
  }

  if (state.products.length === 0) {
    return (
      <CatalogLayout title="Review Products" subtitle="No products imported yet.">
        <Card>
          <p className="text-sm text-slate-600">Upload your product file to get started.</p>
          <Button className="mt-4" onClick={() => navigate('/catalog/upload')}>
            Upload Products
          </Button>
        </Card>
      </CatalogLayout>
    )
  }

  return (
    <CatalogLayout
      title="Review Products"
      subtitle="Review, correct inline, and submit your catalog."
    >
      <div className="space-y-4">
        <Card>
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[140px] flex-1">
              <Input
                label="Bulk Category"
                value={bulkCategory}
                onChange={(e) => setBulkCategory(e.target.value)}
                placeholder="Dairy > Milk"
              />
            </div>
            <div className="w-28">
              <Input
                label="Bulk Price"
                type="number"
                value={bulkPrice}
                onChange={(e) => setBulkPrice(e.target.value)}
              />
            </div>
            <div className="w-28">
              <Input
                label="Bulk Stock"
                type="number"
                value={bulkStock}
                onChange={(e) => setBulkStock(e.target.value)}
              />
            </div>
            <Button
              size="sm"
              variant="outline"
              disabled={selectedCount === 0}
              onClick={() => {
                const updates: Partial<Product> = {}
                if (bulkCategory) updates.category = bulkCategory
                if (bulkPrice) updates.sellingPrice = Number(bulkPrice)
                if (bulkStock) updates.stockQuantity = Number(bulkStock)
                bulkUpdateSelected(updates)
              }}
            >
              Apply to Selected ({selectedCount})
            </Button>
            <Button size="sm" variant="outline" disabled={selectedCount === 0} onClick={deleteSelectedProducts}>
              Delete Selected
            </Button>
          </div>
          {state.imageFiles.length > 0 && (
            <div className="mt-3 flex flex-wrap items-end gap-3">
              <div className="min-w-[200px] flex-1">
                <Select
                  label="Bulk Image Assignment"
                  value={bulkImage}
                  onChange={(e) => setBulkImage(e.target.value)}
                  options={state.imageFiles.map((f) => ({ value: f.name, label: f.name }))}
                  placeholder="Select image"
                />
              </div>
              <Button
                size="sm"
                variant="outline"
                disabled={selectedCount === 0 || !bulkImage}
                onClick={() => assignImageToSelected(bulkImage)}
              >
                Assign Image
              </Button>
            </div>
          )}
        </Card>

        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">
                  <input
                    type="checkbox"
                    checked={selectedCount === state.products.length && state.products.length > 0}
                    onChange={(e) => toggleAllSelection(e.target.checked)}
                  />
                </th>
                <th className="px-3 py-2">Image</th>
                <th className="px-3 py-2">Product Name</th>
                <th className="px-3 py-2">Category</th>
                <th className="px-3 py-2">Price</th>
                <th className="px-3 py-2">MRP</th>
                <th className="px-3 py-2">Stock</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {state.products.map((product) => (
                <tr key={product.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={product.selected}
                      onChange={() => toggleProductSelection(product.id)}
                    />
                  </td>
                  <td className="px-3 py-2">
                    {product.imagePreview || product.imageUrl ? (
                      <img
                        src={product.imagePreview || product.imageUrl}
                        alt={product.productName}
                        className="h-10 w-10 rounded border object-cover"
                      />
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <input
                      className="w-full min-w-[120px] rounded border border-slate-200 px-2 py-1 text-sm"
                      value={product.productName}
                      onChange={(e) => updateProduct(product.id, { productName: e.target.value })}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      className="w-full min-w-[100px] rounded border border-slate-200 px-2 py-1 text-sm"
                      value={product.category}
                      onChange={(e) => updateProduct(product.id, { category: e.target.value })}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      className="w-20 rounded border border-slate-200 px-2 py-1 text-sm"
                      value={product.sellingPrice}
                      onChange={(e) => updateProduct(product.id, { sellingPrice: Number(e.target.value) })}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      className="w-20 rounded border border-slate-200 px-2 py-1 text-sm"
                      value={product.mrp}
                      onChange={(e) => updateProduct(product.id, { mrp: Number(e.target.value) })}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      className="w-16 rounded border border-slate-200 px-2 py-1 text-sm"
                      value={product.stockQuantity}
                      onChange={(e) => updateProduct(product.id, { stockQuantity: Number(e.target.value) })}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[product.rowStatus]}`}>
                      {product.rowStatus}
                    </span>
                    {product.validationErrors.length > 0 && (
                      <p className="mt-1 text-xs text-red-600">{product.validationErrors[0]}</p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        {message && (
          <Card className="border-green-200 bg-green-50">
            <p className="text-sm text-green-800">{message}</p>
          </Card>
        )}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <p className="text-sm text-red-700">{error}</p>
          </Card>
        )}

        <div className="flex flex-wrap gap-3">
          <Button onClick={handleSave} loading={saving}>
            Save Draft
          </Button>
          <Button onClick={handleSubmit} loading={submitting} disabled={stats.validationErrors > 0}>
            Submit Catalog
          </Button>
          <p className="self-center text-sm text-slate-500">
            {stats.completionPercentage}% complete · {stats.validationErrors} errors
          </p>
        </div>
      </div>
    </CatalogLayout>
  )
}
