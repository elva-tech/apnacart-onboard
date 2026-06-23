import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../../context/AuthContext'

export function CustomerGuard({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-600">Loading...</p>
      </div>
    )
  }

  if (!session || session.role !== 'CUSTOMER') {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

export function AdminGuard({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-600">Loading...</p>
      </div>
    )
  }

  if (!session || session.role !== 'ADMIN') {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

export function GuestGuard({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth()

  if (loading) return null
  if (session?.role === 'CUSTOMER') return <Navigate to="/dashboard" replace />
  if (session?.role === 'ADMIN') return <Navigate to="/admin" replace />

  return <>{children}</>
}
