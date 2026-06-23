import type { ReactNode } from 'react'
import { AppFooter } from './AppFooter'
import { AppHeader, type AppHeaderVariant } from './AppHeader'

interface AppShellProps {
  variant: AppHeaderVariant
  subtitle?: string
  headerNav?: ReactNode
  children: ReactNode
  mainClassName?: string
}

export function AppShell({ variant, subtitle, headerNav, children, mainClassName = '' }: AppShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <AppHeader variant={variant} subtitle={subtitle} nav={headerNav} />
      <main className={`mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8 ${mainClassName}`}>{children}</main>
      <AppFooter />
    </div>
  )
}
