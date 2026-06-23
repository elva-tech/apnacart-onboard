import { Link, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { CATALOG_NAV } from '../../constants/catalog'
import { useCatalog } from '../../context/CatalogContext'

interface CatalogLayoutProps {
  title: string
  subtitle?: string
  children: ReactNode
}

export function CatalogLayout({ title, subtitle, children }: CatalogLayoutProps) {
  const location = useLocation()
  const { state } = useCatalog()
  const merchant = state.merchant

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600 text-sm font-bold text-white">
              AC
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">ApnaCart Product Catalog</p>
              {merchant && (
                <p className="text-xs text-slate-500">
                  {merchant.storeName} · {merchant.merchantCode} · {merchant.storeCode}
                </p>
              )}
            </div>
          </div>
          <Link to="/dashboard" className="text-sm text-primary-600 hover:text-primary-700">
            Dashboard
          </Link>
          <Link to="/workflow/catalog" className="text-sm text-slate-600 hover:text-slate-800">
            Catalog Hub
          </Link>
        </div>
        <nav className="mx-auto max-w-6xl overflow-x-auto px-4 sm:px-6">
          <div className="flex gap-1 border-t border-slate-100 pt-2 pb-3">
            {CATALOG_NAV.map((item) => {
              const active = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? 'bg-primary-100 text-primary-800'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-slate-600 sm:text-base">{subtitle}</p>}
        </div>
        {children}
      </main>
    </div>
  )
}
