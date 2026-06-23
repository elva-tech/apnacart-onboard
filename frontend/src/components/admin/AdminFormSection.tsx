import type { ReactNode } from 'react'
import { Card } from '../ui/Card'

export function AdminFormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card>
      <h2 className="mb-4 text-sm font-semibold text-slate-900">{title}</h2>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </Card>
  )
}

export function UrlPreview({ url, label }: { url: string; label: string }) {
  if (!url) return null
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="col-span-full text-xs text-primary-600 hover:text-primary-700"
    >
      View {label} →
    </a>
  )
}
