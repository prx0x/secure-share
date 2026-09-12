import { useEffect, useMemo, useState } from 'react'
import { Search, Share2 } from 'lucide-react'
import { FileCard } from '@/components/files/FileCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Field'
import { CardSkeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/hooks/useToast'
import { ApiError } from '@/services/api'
import { fileApi } from '@/services/fileService'
import type { FileItem } from '@/types/api'

export function SharedPage() {
  const { toast } = useToast()
  const [files, setFiles] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [busyId, setBusyId] = useState<number | null>(null)

  useEffect(() => {
    let active = true
    fileApi
      .getFiles()
      .then((response) => {
        if (active) setFiles(response.shared_files)
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof ApiError ? err.message : 'Failed to load shared files.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = q ? files.filter((file) => file.filename.toLowerCase().includes(q)) : files
    return [...list].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
  }, [files, query])

  const handleDownload = async (file: FileItem) => {
    setBusyId(file.id)
    try {
      await fileApi.downloadFile(file.id, file.filename)
    } catch (err: unknown) {
      toast(err instanceof ApiError ? err.message : 'Failed to download file.', 'error')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">Shared With Me</h1>
        <p className="mt-1 text-[var(--color-ink-muted)]">
          Files shared with your account. Download is available; higher permissions are enforced by the backend.
        </p>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-ink-subtle)]" />
        <Input
          className="pl-11"
          placeholder="Filter shared files..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Filter shared files"
        />
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : error ? (
        <div className="neo-card p-5 text-[var(--color-danger)]">{error}</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Nothing has been shared with you yet."
          description="When someone shares a file with your user ID or a group you belong to, it will show up here."
          icon={<Share2 className="h-8 w-8" />}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((file) => (
            <FileCard
              key={file.id}
              file={file}
              busy={busyId === file.id}
              onDownload={handleDownload}
            />
          ))}
        </div>
      )}
    </div>
  )
}
