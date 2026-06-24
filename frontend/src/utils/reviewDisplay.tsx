import type { ReactNode } from 'react'
import type { StoredFile } from '../types/onboarding'

export function toViewableFileUrl(url: string): string {
  if (!url) return ''
  const fileIdMatch = url.match(/\/file\/d\/([^/]+)/)
  if (fileIdMatch) {
    return `https://drive.google.com/uc?export=view&id=${fileIdMatch[1]}`
  }
  const idParam = url.match(/[?&]id=([^&]+)/)
  if (idParam && url.includes('drive.google')) {
    return `https://drive.google.com/uc?export=view&id=${idParam[1]}`
  }
  return url
}

function isImageSource(file: StoredFile | null, url?: string): boolean {
  if (file?.type?.startsWith('image/')) return true
  if (file?.dataUrl?.startsWith('data:image/')) return true
  if (!url) return false
  return /\.(png|jpe?g|webp|gif)(\?|$)/i.test(url) || url.includes('drive.google')
}

function fileLabel(file: StoredFile | null, url?: string, fallback = 'Uploaded file'): string {
  if (file?.name) return file.name
  if (!url) return fallback
  try {
    const segment = url.split('/').pop()?.split('?')[0]
    return segment && segment.length > 0 ? decodeURIComponent(segment) : fallback
  } catch {
    return fallback
  }
}

export function renderReviewFileValue(
  file: StoredFile | null,
  url: string | undefined,
  options?: { imageClassName?: string },
): ReactNode {
  const imageClassName = options?.imageClassName ?? 'mt-1 h-20 max-w-xs rounded border object-cover'
  const src = file?.dataUrl || (url ? toViewableFileUrl(url) : '')
  if (!src) return '—'

  const label = fileLabel(file, url)
  const isPdf = file?.type === 'application/pdf' || /\.pdf(\?|$)/i.test(url || '')

  if (isImageSource(file, url) && !isPdf) {
    return (
      <div className="space-y-1">
        <img src={src} alt={label} className={imageClassName} />
        <a
          href={url || src}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary-600 hover:underline"
        >
          Open full size
        </a>
      </div>
    )
  }

  return (
    <a
      href={url || src}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 text-sm text-primary-600 hover:underline"
    >
      <span className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-700">
        {isPdf ? 'PDF' : 'FILE'}
      </span>
      {label}
    </a>
  )
}
