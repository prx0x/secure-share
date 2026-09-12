import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  children: ReactNode
}

export function Button({
  variant = 'primary',
  className = '',
  children,
  ...props
}: ButtonProps) {
  const base =
    variant === 'primary'
      ? 'neo-button neo-button-primary'
      : variant === 'secondary'
        ? 'neo-button neo-button-secondary'
        : variant === 'danger'
          ? 'neo-button neo-button-danger'
          : 'neo-button text-[var(--color-ink-muted)] hover:bg-black/5'

  return (
    <button type="button" className={`${base} ${className}`} {...props}>
      {children}
    </button>
  )
}
