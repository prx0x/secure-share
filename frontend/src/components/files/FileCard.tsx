import { useState, type ReactNode } from 'react'
import {
  Download,
  MoreHorizontal,
  Pencil,
  Share2,
  Shield,
  Trash2,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { FileTypeIcon } from '@/components/files/FileTypeIcon'
import { Button } from '@/components/ui/Button'
import type { FileItem } from '@/types/api'
import { formatDate } from '@/utils/format'

interface FileCardProps {
  file: FileItem
  owned?: boolean
  onDownload: (file: FileItem) => void
  onShare?: (file: FileItem) => void
  onManageAccess?: (file: FileItem) => void
  onUpdate?: (file: FileItem) => void
  onDelete?: (file: FileItem) => void
  busy?: boolean
}

export function FileCard({
  file,
  owned = false,
  onDownload,
  onShare,
  onManageAccess,
  onUpdate,
  onDelete,
  busy,
}: FileCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="neo-card relative flex min-w-0 flex-col gap-4 p-5"
    >
      <div className="flex items-start gap-3">
        <div className="neo-inset flex h-12 w-12 shrink-0 items-center justify-center text-[var(--color-accent)]">
          <FileTypeIcon filename={file.filename} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-[var(--color-ink)]" title={file.filename}>
            {file.filename}
          </h3>
          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
            Created {formatDate(file.created_at)}
          </p>
        </div>
        {owned ? (
          <div className="relative">
            <button
              type="button"
              className="rounded-xl p-2 text-[var(--color-ink-muted)] hover:bg-black/5"
              aria-label={`More actions for ${file.filename}`}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <MoreHorizontal className="h-5 w-5" />
            </button>
            {menuOpen ? (
              <div className="absolute right-0 z-20 mt-1 w-48 overflow-hidden rounded-2xl bg-[var(--color-surface-raised)] p-1 shadow-[var(--shadow-neo-out-sm)]">
                <MenuItem
                  icon={<Share2 className="h-4 w-4" />}
                  label="Share"
                  onClick={() => {
                    setMenuOpen(false)
                    onShare?.(file)
                  }}
                />
                <MenuItem
                  icon={<Shield className="h-4 w-4" />}
                  label="Manage Access"
                  onClick={() => {
                    setMenuOpen(false)
                    onManageAccess?.(file)
                  }}
                />
                <MenuItem
                  icon={<Pencil className="h-4 w-4" />}
                  label="Update"
                  onClick={() => {
                    setMenuOpen(false)
                    onUpdate?.(file)
                  }}
                />
                <MenuItem
                  icon={<Trash2 className="h-4 w-4" />}
                  label="Delete"
                  danger
                  onClick={() => {
                    setMenuOpen(false)
                    onDelete?.(file)
                  }}
                />
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          disabled={busy}
          onClick={() => onDownload(file)}
          aria-label={`Download ${file.filename}`}
        >
          <Download className="h-4 w-4" />
          Download
        </Button>
        {owned ? (
          <>
            <Button variant="secondary" disabled={busy} onClick={() => onShare?.(file)}>
              <Share2 className="h-4 w-4" />
              Share
            </Button>
            <Button variant="secondary" disabled={busy} onClick={() => onManageAccess?.(file)}>
              <Shield className="h-4 w-4" />
              Access
            </Button>
          </>
        ) : null}
      </div>
    </motion.article>
  )
}

function MenuItem({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: ReactNode
  label: string
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium ${
        danger
          ? 'text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)]'
          : 'text-[var(--color-ink)] hover:bg-black/5'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}
