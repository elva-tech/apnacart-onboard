import type { ReactNode } from 'react'

interface CardProps {
  title?: string
  description?: string
  children: ReactNode
  className?: string
}

export function Card({ title, description, children, className = '' }: CardProps) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 ${className}`}>
      {(title || description) && (
        <div className="mb-5">
          {title && <h2 className="text-lg font-semibold text-slate-900">{title}</h2>}
          {description && <p className="mt-1 text-sm text-slate-600">{description}</p>}
        </div>
      )}
      {children}
    </div>
  )
}
