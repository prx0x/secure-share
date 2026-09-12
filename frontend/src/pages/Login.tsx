import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Shield } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Field'
import { useAuth } from '@/hooks/useAuth'
import { ApiError } from '@/services/api'

export function LoginPage() {
  const { login, sessionMessage, clearSessionMessage } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    clearSessionMessage()
    setError(null)
    setSubmitting(true)
    try {
      await login({ username, password })
      navigate('/dashboard', { replace: true })
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 401) {
        setError('Invalid username or password.')
      } else {
        setError(err instanceof ApiError ? err.message : 'Unable to log in. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="neo-card w-full max-w-md p-6 sm:p-8"
      >
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-accent)] text-white">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">SecureShare</h1>
            <p className="text-sm text-[var(--color-ink-muted)]">Secure file sharing</p>
          </div>
        </div>

        <h2 className="mb-1 font-[family-name:var(--font-display)] text-xl font-semibold">Sign in</h2>
        <p className="mb-6 text-sm text-[var(--color-ink-muted)]">
          Access your files with permission-controlled sharing.
        </p>

        {sessionMessage ? (
          <div className="mb-4 rounded-2xl bg-[var(--color-danger-soft)] px-4 py-3 text-sm text-[var(--color-danger)]">
            {sessionMessage}
          </div>
        ) : null}

        <form className="space-y-4" onSubmit={onSubmit}>
          <Field label="Username" htmlFor="login-username">
            <Input
              id="login-username"
              autoComplete="username"
              required
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
          </Field>
          <Field label="Password" htmlFor="login-password">
            <Input
              id="login-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </Field>
          {error ? <p className="text-sm text-[var(--color-danger)]">{error}</p> : null}
          <Button className="w-full" disabled={submitting} type="submit">
            {submitting ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--color-ink-muted)]">
          Need an account?{' '}
          <Link className="font-semibold text-[var(--color-accent)] hover:underline" to="/register">
            Register
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
