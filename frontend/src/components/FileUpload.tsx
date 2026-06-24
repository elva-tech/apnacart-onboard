import { useRef, useState } from 'react'
import type { StoredFile } from '../types/onboarding'
import { useWorkflowFormLocked } from '../context/WorkflowFormEditContext'
import { fileToStoredFile } from '../utils/onboarding'
import { Button } from './ui/Button'

interface FileUploadProps {
  label: string
  required?: boolean
  value: StoredFile | null
  onChange: (file: StoredFile | null) => void
  error?: string
  allowedTypes: readonly string[]
  maxSizeBytes: number
  acceptHint: string
  imagePreview?: boolean
  existingUrl?: string
}

export function FileUpload({
  label,
  required,
  value,
  onChange,
  error,
  allowedTypes,
  maxSizeBytes,
  acceptHint,
  imagePreview = true,
  existingUrl,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [localError, setLocalError] = useState<string | null>(null)
  const locked = useWorkflowFormLocked()

  const handleFile = async (file: File | undefined) => {
    if (locked) return
    setLocalError(null)
    if (!file) return

    if (!allowedTypes.includes(file.type)) {
      setLocalError(`Only ${acceptHint} files are supported`)
      return
    }

    if (file.size > maxSizeBytes) {
      setLocalError(`File size must be ${Math.round(maxSizeBytes / (1024 * 1024))} MB or less`)
      return
    }

    try {
      const stored = await fileToStoredFile(file)
      onChange(stored)
    } catch {
      setLocalError('Failed to read file. Please try again.')
    }
  }

  const displayError = error || localError
  const isImage = value?.type.startsWith('image/') || (existingUrl && !value)
  const isPdf = value?.type === 'application/pdf'
  const previewSrc = value?.dataUrl || existingUrl

  return (
    <div className="w-full">
      <label className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>

      <div
        className={`rounded-lg border-2 border-dashed p-4 transition-colors ${
          displayError ? 'border-red-300 bg-red-50' : 'border-slate-300 bg-slate-50'
        }`}
      >
        {value || existingUrl ? (
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
            {imagePreview && isImage && previewSrc ? (
              <img
                src={previewSrc}
                alt={`${label} preview`}
                className="h-24 w-24 rounded-lg border border-slate-200 object-cover"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-lg border border-slate-200 bg-white">
                <span className="text-xs font-medium text-slate-600">
                  {isPdf ? 'PDF' : value || existingUrl ? 'FILE' : 'FILE'}
                </span>
              </div>
            )}
            <div className="flex-1 text-center sm:text-left">
              <p className="text-sm font-medium text-slate-800">{value?.name || 'Uploaded file'}</p>
              <p className="text-xs text-slate-500">{value ? 'Ready to save' : 'Saved on server'}</p>
              {!locked && (
                <div className="mt-2 flex flex-wrap justify-center gap-2 sm:justify-start">
                  <Button size="sm" variant="outline" onClick={() => inputRef.current?.click()}>
                    Replace
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => onChange(null)}>
                    Remove
                  </Button>
                </div>
              )}
            </div>
          </div>
        ) : locked ? (
          <div className="text-center">
            <p className="text-sm text-slate-500">No file uploaded</p>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-sm text-slate-600">Drag and drop or click to upload</p>
            <p className="mt-1 text-xs text-slate-500">{acceptHint}</p>
            <Button size="sm" variant="outline" className="mt-3" onClick={() => inputRef.current?.click()}>
              Choose File
            </Button>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={allowedTypes.join(',')}
        className="hidden"
        onChange={(e) => {
          handleFile(e.target.files?.[0])
          e.target.value = ''
        }}
      />

      {displayError && <p className="mt-1 text-sm text-red-600">{displayError}</p>}
    </div>
  )
}
