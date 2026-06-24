import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE_BYTES } from '../constants/steps'
import type { StoredFile } from '../types/onboarding'
import { FileUpload } from './FileUpload'

interface ImageUploadProps {
  label: string
  required?: boolean
  value: StoredFile | null
  onChange: (file: StoredFile | null) => void
  error?: string
  existingUrl?: string
}

export function ImageUpload({ label, required, value, onChange, error, existingUrl }: ImageUploadProps) {
  return (
    <FileUpload
      label={label}
      required={required}
      value={value}
      onChange={onChange}
      error={error}
      existingUrl={existingUrl}
      allowedTypes={ALLOWED_IMAGE_TYPES}
      maxSizeBytes={MAX_IMAGE_SIZE_BYTES}
      acceptHint="PNG, JPG, JPEG, WEBP — max 5 MB"
      imagePreview
    />
  )
}
