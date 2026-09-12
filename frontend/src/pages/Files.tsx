import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Search, Upload } from 'lucide-react'
import { FileCard } from '@/components/files/FileCard'
import { ShareDialog } from '@/components/files/ShareDialog'
import { UploadZone } from '@/components/files/UploadZone'
import { ManageAccessDialog } from '@/components/permissions/ManageAccessDialog'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import { CardSkeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/hooks/useToast'
import { ApiError } from '@/services/api'
import { fileApi } from '@/services/fileService'
import type { FileItem, FileListResponse } from '@/types/api'
import { MAX_FILENAME_LENGTH, MAX_UPLOAD_BYTES } from '@/utils/format'

export function FilesPage() {
  const { toast } = useToast()
  const [data, setData] = useState<FileListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [uploading, setUploading] = useState(false)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [shareFile, setShareFile] = useState<FileItem | null>(null)
  const [accessFile, setAccessFile] = useState<FileItem | null>(null)
  const [deleteFile, setDeleteFile] = useState<FileItem | null>(null)
  const [updateFile, setUpdateFile] = useState<FileItem | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [updating, setUpdating] = useState(false)
  const updateInputRef = useRef<HTMLInputElement>(null)
  const uploadAnchorRef = useRef<HTMLDivElement>(null)

  const refresh = useCallback(async () => {
    const response = await fileApi.getFiles()
    setData(response)
  }, [])

  useEffect(() => {
    let active = true
    setLoading(true)
    refresh()
      .catch((err: unknown) => {
        if (active) setError(err instanceof ApiError ? err.message : 'Failed to load files.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [refresh])

  const filteredOwned = useMemo(() => {
    const files = data?.owned_files ?? []
    const q = query.trim().toLowerCase()
    const filtered = q ? files.filter((file) => file.filename.toLowerCase().includes(q)) : files
    return [...filtered].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
  }, [data, query])

  const filteredShared = useMemo(() => {
    const files = data?.shared_files ?? []
    const q = query.trim().toLowerCase()
    const filtered = q ? files.filter((file) => file.filename.toLowerCase().includes(q)) : files
    return [...filtered].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
  }, [data, query])

  const handleUpload = async (file: File) => {
    setUploading(true)
    try {
      await fileApi.uploadFile(file)
      toast('File uploaded successfully.', 'success')
      await refresh()
    } catch (err: unknown) {
      toast(err instanceof ApiError ? err.message : 'Failed to upload file.', 'error')
      throw err
    } finally {
      setUploading(false)
    }
  }

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

  const confirmDelete = async () => {
    if (!deleteFile) return
    setDeleting(true)
    try {
      await fileApi.deleteFile(deleteFile.id)
      toast('File deleted successfully.', 'success')
      setDeleteFile(null)
      await refresh()
    } catch (err: unknown) {
      toast(err instanceof ApiError ? err.message : 'Failed to delete file.', 'error')
    } finally {
      setDeleting(false)
    }
  }

  const handleUpdatePick = async (file: File | null) => {
    if (!updateFile || !file) return
    if (file.size > MAX_UPLOAD_BYTES) {
      toast('File is too large. Maximum allowed size is 20 MB.', 'error')
      return
    }
    if (file.name.length > MAX_FILENAME_LENGTH) {
      toast(`Filename must be ${MAX_FILENAME_LENGTH} characters or fewer.`, 'error')
      return
    }
    setUpdating(true)
    try {
      await fileApi.updateFile(updateFile.id, file)
      toast('File updated successfully.', 'success')
      setUpdateFile(null)
      await refresh()
    } catch (err: unknown) {
      toast(err instanceof ApiError ? err.message : 'Failed to update file.', 'error')
    } finally {
      setUpdating(false)
      if (updateInputRef.current) updateInputRef.current.value = ''
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">My Files</h1>
          <p className="mt-1 text-[var(--color-ink-muted)]">
            Upload, download, and manage access for your files.
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={() => uploadAnchorRef.current?.scrollIntoView({ behavior: 'smooth' })}
        >
          <Upload className="h-4 w-4" />
          Upload File
        </Button>
      </div>

      <div ref={uploadAnchorRef}>
        <UploadZone onUpload={handleUpload} uploading={uploading} />
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-ink-subtle)]" />
        <Input
          className="pl-11"
          placeholder="Search files..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Search files"
        />
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : error ? (
        <div className="neo-card p-5 text-[var(--color-danger)]">{error}</div>
      ) : (
        <>
          <section className="space-y-4">
            <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold">Owned Files</h2>
            {filteredOwned.length === 0 ? (
              <EmptyState
                title="No files yet"
                description="Upload your first file to start using SecureShare."
                actionLabel="Upload File"
                onAction={() => uploadAnchorRef.current?.scrollIntoView({ behavior: 'smooth' })}
                icon={<Upload className="h-8 w-8" />}
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {filteredOwned.map((file) => (
                  <FileCard
                    key={file.id}
                    file={file}
                    owned
                    busy={busyId === file.id}
                    onDownload={handleDownload}
                    onShare={setShareFile}
                    onManageAccess={setAccessFile}
                    onUpdate={setUpdateFile}
                    onDelete={setDeleteFile}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="space-y-4">
            <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold">Shared With Me</h2>
            {filteredShared.length === 0 ? (
              <EmptyState
                title="Nothing has been shared with you yet."
                description="Files shared with your account or groups will appear here."
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {filteredShared.map((file) => (
                  <FileCard
                    key={file.id}
                    file={file}
                    busy={busyId === file.id}
                    onDownload={handleDownload}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      <ShareDialog open={Boolean(shareFile)} file={shareFile} onClose={() => setShareFile(null)} />
      <ManageAccessDialog
        open={Boolean(accessFile)}
        file={accessFile}
        onClose={() => setAccessFile(null)}
      />

      <Modal open={Boolean(deleteFile)} title="Delete file?" onClose={() => setDeleteFile(null)}>
        <p className="text-sm text-[var(--color-ink-muted)]">This action cannot be undone.</p>
        {deleteFile ? (
          <p className="mt-2 font-semibold">{deleteFile.filename}</p>
        ) : null}
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" disabled={deleting} onClick={() => setDeleteFile(null)}>
            Cancel
          </Button>
          <Button variant="danger" disabled={deleting} onClick={confirmDelete}>
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </Modal>

      <Modal open={Boolean(updateFile)} title="Update file" onClose={() => setUpdateFile(null)}>
        <p className="mb-4 text-sm text-[var(--color-ink-muted)]">
          Choose a replacement file. The backend will overwrite the existing content.
        </p>
        <input
          ref={updateInputRef}
          type="file"
          className="neo-input"
          disabled={updating}
          onChange={(event) => void handleUpdatePick(event.target.files?.[0] || null)}
        />
        <div className="mt-4 flex justify-end">
          <Button variant="secondary" disabled={updating} onClick={() => setUpdateFile(null)}>
            {updating ? 'Updating...' : 'Close'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
