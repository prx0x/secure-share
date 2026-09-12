import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Shield } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Field'
import { ApiError } from '@/services/api'
import { authApi } from '@/services/auth'
import { isValidEmail } from '@/utils/format'

export function RegisterPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const validate = () => {
    const next: Record<string, string> = {}
    if (username.trim().length < 3) next.username = 'Username must be at least 3 characters.'
    if (username.trim().length > 50) next.username = 'Username must be 50 characters or fewer.'
    if (!isValidEmail(email.trim())) next.email = 'Enter a valid email address.'
    if (password.length < 8) next.password = 'Password must be at least 8 characters.'
    setFieldErrors(next)
    return Object.keys(next).length === 0
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    if (!validate()) return
    setSubmitting(true)
    try {
      await authApi.register({
        username: username.trim(),
        email: email.trim(),
        password,
      })
      setSuccess(true)
      window.setTimeout(() => navigate('/login', { replace: true }), 1200)
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.status === 500) {
          setError('That username or email may already be taken. Try different values.')
        } else {
          setError(err.message)
        }
      } else {
        setError('Unable to register. Please try again.')
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
            <p className="text-sm text-[var(--color-ink-muted)]">Create your account</p>
          </div>
        </div>

        {success ? (
          <div className="rounded-2xl bg-[var(--color-success-soft)] px-4 py-4 text-[var(--color-success)]">
            Account created successfully. Redirecting to login...
          </div>
        ) : (
          <form className="space-y-4" onSubmit={onSubmit}>
            <Field label="Username" htmlFor="register-username" error={fieldErrors.username}>
              <Input
                id="register-username"
                autoComplete="username"
                required
                minLength={3}
                maxLength={50}
                value={username}
                onChange={(event) => setUsername(event.target.value)}
              />
            </Field>
            <Field label="Email" htmlFor="register-email" error={fieldErrors.email}>
              <Input
                id="register-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </Field>
            <Field label="Password" htmlFor="register-password" error={fieldErrors.password}>
              <Input
                id="register-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </Field>
            {error ? <p className="text-sm text-[var(--color-danger)]">{error}</p> : null}
            <Button className="w-full" disabled={submitting} type="submit">
              {submitting ? 'Creating account...' : 'Create account'}
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-[var(--color-ink-muted)]">
          Already registered?{' '}
          <Link className="font-semibold text-[var(--color-accent)] hover:underline" to="/login">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
