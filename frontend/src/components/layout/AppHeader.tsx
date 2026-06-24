import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import { ElvaLogo } from '../branding/ElvaLogo'
import { useAuth } from '../../context/AuthContext'

export type AppHeaderVariant = 'public' | 'merchant' | 'admin'

interface AppHeaderProps {
  variant: AppHeaderVariant
  subtitle?: string
  nav?: ReactNode
}

export function AppHeader({ variant, subtitle, nav }: AppHeaderProps) {
  const { session, dashboard, logout } = useAuth()

  const title =
    variant === 'admin' ? 'ELVA Admin Portal' : variant === 'merchant' ? 'ApnaCart Onboarding' : 'ApnaCart Merchant Onboarding'

  const meta =
    subtitle ||
    (variant === 'merchant'
      ? `${session?.merchantCode || ''} · ${dashboard?.workflowStatus || session?.workflowStatus || ''}`
      : variant === 'admin'
        ? 'Manage merchant onboarding & approvals'
        : 'Configure your store before launch')

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/90">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link to={variant === 'admin' ? '/admin' : variant === 'merchant' ? '/dashboard' : '/'} className="flex min-w-0 items-center gap-3 sm:gap-4">
          <span className="inline-flex shrink-0 sm:hidden">
            <ElvaLogo height={48} linkable={false} />
          </span>
          <span className="hidden shrink-0 sm:inline-flex">
            <ElvaLogo height={56} linkable={false} />
          </span>
          <div className="min-w-0 border-l border-slate-200 pl-3 sm:pl-4">
            <p className="truncate text-sm font-semibold text-slate-900">{title}</p>
            <p className="truncate text-xs text-slate-500">{meta}</p>
          </div>
        </Link>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {variant === 'public' && (
            <Link to="/register" className="text-sm font-medium text-primary-600 hover:text-primary-700">
              Register
            </Link>
          )}
          {variant === 'merchant' && (
            <Link to="/dashboard" className="text-sm font-medium text-primary-600 hover:text-primary-700">
              Dashboard
            </Link>
          )}
          {variant !== 'public' && (
            <button type="button" onClick={() => void logout()} className="text-sm text-slate-500 hover:text-slate-700">
              Logout
            </button>
          )}
        </div>
      </div>
      {nav && <div className="border-t border-slate-100">{nav}</div>}
    </header>
  )
}
