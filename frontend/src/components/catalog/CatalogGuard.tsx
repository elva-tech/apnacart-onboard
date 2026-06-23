import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useCatalog } from '../../context/CatalogContext'
import { getCatalogAccess } from '../../api/catalogApi'
import { useEffect, useState } from 'react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'

interface CatalogGuardProps {
  children: ReactNode
}

export function CatalogGuard({ children }: CatalogGuardProps) {
  const { session } = useAuth()
  const { state: catalogState, setMerchant } = useCatalog()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const merchantCode = session?.merchantCode || catalogState.merchant?.merchantCode

  useEffect(() => {
    if (!merchantCode) {
      setLoading(false)
      return
    }

    if (catalogState.merchant?.merchantCode === merchantCode) {
      setLoading(false)
      return
    }

    let cancelled = false
    ;(async () => {
      try {
        const merchant = await getCatalogAccess(merchantCode)
        if (!cancelled) {
          setMerchant(merchant)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unable to verify catalog access.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [merchantCode, catalogState.merchant?.merchantCode, setMerchant])

  if (!session || session.role !== 'CUSTOMER' || !merchantCode) {
    return <Navigate to="/" replace />
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-600">Loading catalog...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <Card className="max-w-md text-center">
          <p className="text-sm text-red-700">{error}</p>
          <Button className="mt-4" variant="outline" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}
