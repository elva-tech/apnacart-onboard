import JSZip from 'jszip'
import { IMAGE_EXTENSIONS, MAX_IMAGE_ZIP_BYTES } from '../constants/catalog'
import type { ImageFileEntry } from '../types/catalog'
import { normalizeForMatching } from './productNormalize'

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(',')[1] || '')
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

function mimeFromExt(ext: string): string {
  const map: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
  }
  return map[ext] || 'application/octet-stream'
}

export async function extractImagesFromZip(file: File): Promise<ImageFileEntry[]> {
  if (file.size > MAX_IMAGE_ZIP_BYTES) {
    throw new Error(`ZIP file exceeds maximum size of ${MAX_IMAGE_ZIP_BYTES / (1024 * 1024)} MB`)
  }

  const zip = await JSZip.loadAsync(file)
  const entries: ImageFileEntry[] = []

  const paths = Object.keys(zip.files).filter((path) => {
    const entry = zip.files[path]
    if (!entry || entry.dir) return false
    const name = path.split('/').pop() || path
    const ext = name.split('.').pop()?.toLowerCase() || ''
    return IMAGE_EXTENSIONS.includes(ext as (typeof IMAGE_EXTENSIONS)[number])
  })

  for (const path of paths) {
    const entry = zip.files[path]
    if (!entry) continue
    const name = path.split('/').pop() || path
    const blob = await entry.async('blob')
    const base64 = await blobToBase64(blob)
    const ext = name.split('.').pop()?.toLowerCase() || 'jpg'
    entries.push({
      name,
      base64,
      mimeType: mimeFromExt(ext),
      previewUrl: `data:${mimeFromExt(ext)};base64,${base64}`,
      normalized: normalizeForMatching(name),
    })
  }

  if (entries.length === 0) {
    throw new Error('No supported images (jpg, jpeg, png, webp) found in the ZIP file.')
  }

  return entries
}
