import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react'

export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
}: {
  label: string
  htmlFor: string
  hint?: string
  error?: string
  children: ReactNode
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={htmlFor} className="block text-sm font-semibold text-[var(--color-ink)]">
        {label}
      </label>
      {children}
      {hint && !error ? <p className="text-xs text-[var(--color-ink-muted)]">{hint}</p> : null}
      {error ? <p className="text-xs text-[var(--color-danger)]">{error}</p> : null}
    </div>
  )
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`neo-input ${props.className || ''}`} />
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`neo-input ${props.className || ''}`} />
}
