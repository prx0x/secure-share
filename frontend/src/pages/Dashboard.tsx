import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FolderOpen, Share2, Upload, Users } from 'lucide-react'
import { FileTypeIcon } from '@/components/files/FileTypeIcon'
import { CardSkeleton } from '@/components/ui/Skeleton'
import { ApiError } from '@/services/api'
import { fileApi } from '@/services/fileService'
import type { FileItem, FileListResponse } from '@/types/api'
import { formatDate } from '@/utils/format'

export function DashboardPage() {
  const [data, setData] = useState<FileListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    fileApi
      .getFiles()
      .then((response) => {
        if (active) setData(response)
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof ApiError ? err.message : 'Failed to load dashboard.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const recent = useMemo(() => {
    if (!data) return [] as FileItem[]
    return [...data.owned_files, ...data.shared_files]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)
  }, [data])

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="neo-card p-6 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--color-accent)]">
          Welcome back
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight sm:text-4xl">
          Securely manage and share your files.
        </h1>
        <p className="mt-3 max-w-2xl text-[var(--color-ink-muted)]">
          Secure file sharing with permission-controlled access. Statistics below come from your live file list.
        </p>
      </motion.section>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : error ? (
        <div className="neo-card p-5 text-[var(--color-danger)]">{error}</div>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2">
            <StatCard title="My Files" value={data?.owned_files.length ?? 0} icon={<FolderOpen className="h-5 w-5" />} />
            <StatCard
              title="Shared With Me"
              value={data?.shared_files.length ?? 0}
              icon={<Share2 className="h-5 w-5" />}
            />
          </section>

          <section className="neo-card p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold">Recent files</h2>
              <Link to="/files" className="text-sm font-semibold text-[var(--color-accent)] hover:underline">
                View all
              </Link>
            </div>
            {recent.length === 0 ? (
              <p className="text-sm text-[var(--color-ink-muted)]">No files yet. Upload your first file to get started.</p>
            ) : (
              <ul className="divide-y divide-[var(--color-border)]">
                {recent.map((file) => (
                  <li key={`${file.id}-${file.filename}`} className="flex items-center gap-3 py-3">
                    <div className="neo-inset flex h-10 w-10 items-center justify-center text-[var(--color-accent)]">
                      <FileTypeIcon filename={file.filename} className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{file.filename}</p>
                      <p className="text-sm text-[var(--color-ink-muted)]">{formatDate(file.created_at)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <QuickAction to="/files" label="Upload File" icon={<Upload className="h-4 w-4" />} />
            <QuickAction to="/files" label="View My Files" icon={<FolderOpen className="h-4 w-4" />} />
            <QuickAction to="/shared" label="View Shared Files" icon={<Share2 className="h-4 w-4" />} />
            <QuickAction to="/groups" label="Manage Groups" icon={<Users className="h-4 w-4" />} />
          </section>
        </>
      )}
    </div>
  )
}

function StatCard({ title, value, icon }: { title: string; value: number; icon: ReactNode }) {
  return (
    <div className="neo-card p-5">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-[rgba(47,111,106,0.12)] text-[var(--color-accent)]">
        {icon}
      </div>
      <p className="text-sm text-[var(--color-ink-muted)]">{title}</p>
      <p className="mt-1 font-[family-name:var(--font-display)] text-3xl font-bold">{value}</p>
    </div>
  )
}

function QuickAction({ to, label, icon }: { to: string; label: string; icon: ReactNode }) {
  return (
    <Link to={to} className="neo-button neo-button-secondary w-full justify-start">
      {icon}
      {label}
    </Link>
  )
}
