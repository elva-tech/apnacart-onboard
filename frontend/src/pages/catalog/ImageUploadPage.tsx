import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MAX_IMAGE_ZIP_BYTES } from '../../constants/catalog'
import { useCatalog } from '../../context/CatalogContext'
import { CatalogLayout } from '../../components/catalog/CatalogLayout'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { extractImagesFromZip } from '../../utils/zipImages'

export function ImageUploadPage() {
  const navigate = useNavigate()
  const { state, setImageFiles, runImageMatching } = useCatalog()
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const report = state.imageMatchReport

  const handleZip = async (file: File) => {
    setError(null)
    if (!file.name.toLowerCase().endsWith('.zip')) {
      setError('Only .zip files are supported.')
      return
    }
    if (file.size > MAX_IMAGE_ZIP_BYTES) {
      setError(`ZIP exceeds maximum size of ${MAX_IMAGE_ZIP_BYTES / (1024 * 1024)} MB`)
      return
    }
    if (state.products.length === 0) {
      setError('Upload products first before uploading images.')
      return
    }

    setLoading(true)
    try {
      const images = await extractImagesFromZip(file)
      setImageFiles(images)
      runImageMatching()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extract images.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <CatalogLayout
      title="Upload Product Images"
      subtitle="Upload Images.zip. The system auto-matches images to products by name."
    >
      <div className="space-y-4">
        {state.products.length === 0 && (
          <Card className="border-amber-200 bg-amber-50">
            <p className="text-sm text-amber-800">Upload your product file first.</p>
            <Button className="mt-3" size="sm" variant="outline" onClick={() => navigate('/catalog/upload')}>
              Go to Product Upload
            </Button>
          </Card>
        )}

        <Card>
          <input
            ref={inputRef}
            type="file"
            accept=".zip"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void handleZip(file)
              e.target.value = ''
            }}
          />
          <div
            className="flex cursor-pointer flex-col items-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-10 transition-colors hover:border-primary-400 hover:bg-primary-50"
            onClick={() => inputRef.current?.click()}
          >
            <p className="text-sm font-medium text-slate-700">Click to upload Images.zip</p>
            <p className="mt-1 text-xs text-slate-500">
              jpg, jpeg, png, webp · Example: milk_500ml.jpg ↔ Milk 500ML
            </p>
          </div>
          {loading && <p className="mt-3 text-sm text-slate-500">Extracting and matching images...</p>}
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          {state.imageFiles.length > 0 && (
            <p className="mt-3 text-sm text-green-700">
              {state.imageFiles.length} image{state.imageFiles.length !== 1 ? 's' : ''} extracted.
            </p>
          )}
        </Card>

        {report && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Card>
                <h3 className="text-sm font-semibold text-green-800">Matched ({report.matched.length})</h3>
                <ul className="mt-2 max-h-40 overflow-y-auto text-xs text-slate-600">
                  {report.matched.map((m) => (
                    <li key={m.productId}>
                      {m.productName} ↔ {m.fileName}
                    </li>
                  ))}
                </ul>
              </Card>
              <Card>
                <h3 className="text-sm font-semibold text-amber-800">
                  Missing Images ({report.missingImages.length})
                </h3>
                <ul className="mt-2 max-h-40 overflow-y-auto text-xs text-slate-600">
                  {report.missingImages.map((m) => (
                    <li key={m.productId}>{m.productName}</li>
                  ))}
                </ul>
              </Card>
              <Card>
                <h3 className="text-sm font-semibold text-red-800">
                  Duplicate Images ({report.duplicateImages.length})
                </h3>
                <ul className="mt-2 max-h-40 overflow-y-auto text-xs text-slate-600">
                  {report.duplicateImages.map((d) => (
                    <li key={d.fileName}>
                      {d.fileName} → {d.productNames.join(', ')}
                    </li>
                  ))}
                </ul>
              </Card>
              <Card>
                <h3 className="text-sm font-semibold text-slate-700">
                  Unused Images ({report.unusedImages.length})
                </h3>
                <ul className="mt-2 max-h-40 overflow-y-auto text-xs text-slate-600">
                  {report.unusedImages.map((name) => (
                    <li key={name}>{name}</li>
                  ))}
                </ul>
                {report.unsupportedFormats.length > 0 && (
                  <p className="mt-2 text-xs text-red-600">
                    Unsupported: {report.unsupportedFormats.join(', ')}
                  </p>
                )}
              </Card>
            </div>

            <Button onClick={() => navigate('/catalog/review')}>Continue to Review</Button>
          </>
        )}
      </div>
    </CatalogLayout>
  )
}
