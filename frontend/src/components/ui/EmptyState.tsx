import type { ReactNode } from 'react'
import { Button } from '@/components/ui/Button'

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon,
}: {
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  icon?: ReactNode
}) {
  return (
    <div className="neo-inset flex flex-col items-center justify-center px-6 py-14 text-center">
      {icon ? <div className="mb-4 text-[var(--color-accent)]">{icon}</div> : null}
      <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--color-ink)]">
        {title}
      </h3>
      <p className="mt-2 max-w-md text-sm text-[var(--color-ink-muted)]">{description}</p>
      {actionLabel && onAction ? (
        <Button className="mt-5" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  )
}
