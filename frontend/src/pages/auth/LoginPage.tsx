import { Navigate } from 'react-router-dom'
import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { AppShell } from '../../components/layout/AppShell'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'

export function LoginPage() {
  return <Navigate to="/" replace />
}

export function RegisterPage() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await register(phone, password)
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppShell variant="public">
      <div className="mx-auto max-w-md">
        <h1 className="text-2xl font-bold text-slate-900">Create Merchant Account</h1>
        <p className="mt-2 text-sm text-slate-600">Register to start your ApnaCart store onboarding.</p>
        <Card className="mt-6 shadow-lg ring-1 ring-slate-200/60">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Phone Number" required type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <Input label="Password" required type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <Input label="Confirm Password" required type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" loading={loading} className="w-full">
              Create Account
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-slate-600">
            Already registered?{' '}
            <Link to="/" className="font-medium text-primary-600 hover:text-primary-700">
              Sign in
            </Link>
          </p>
        </Card>
      </div>
    </AppShell>
  )
}
