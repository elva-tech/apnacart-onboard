import type { ReactNode } from 'react'
import { Button } from './ui/Button'

interface ReviewSectionProps {
  title: string
  stepPath: string
  onEdit: (path: string) => void
  children: ReactNode
}

export function ReviewSection({ title, stepPath, onEdit, children }: ReviewSectionProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        <Button size="sm" variant="ghost" onClick={() => onEdit(stepPath)}>
          Edit
        </Button>
      </div>
      <dl className="grid gap-2 text-sm sm:grid-cols-2">{children}</dl>
    </div>
  )
}

export function ReviewItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-slate-500">{label}</dt>
      <dd className="mt-0.5 font-medium text-slate-900 break-words">{value || '—'}</dd>
    </div>
  )
}
