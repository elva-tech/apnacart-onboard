import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Input } from '../ui/Input'

interface SignInFormProps {
  onSuccess?: (role: 'ADMIN' | 'CUSTOMER') => void
  compact?: boolean
}

export function SignInForm({ onSuccess, compact = false }: SignInFormProps) {
  const { signIn } = useAuth()
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const role = await signIn(phone, password)
      onSuccess?.(role)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className={compact ? '' : 'shadow-lg ring-1 ring-slate-200/60'}>
      <h2 className="text-lg font-semibold text-slate-900">Sign In</h2>
      <p className="mt-1 text-sm text-slate-500">Use your merchant or admin credentials — we&apos;ll route you automatically.</p>
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <Input
          label="Phone Number"
          required
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="9876543210"
        />
        <Input label="Password" required type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" loading={loading} className="w-full">
          Sign In
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-600">
        New merchant?{' '}
        <Link to="/register" className="font-medium text-primary-600 hover:text-primary-700">
          Create account
        </Link>
      </p>
    </Card>
  )
}
