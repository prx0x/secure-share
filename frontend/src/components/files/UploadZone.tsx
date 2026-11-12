import { useCallback, useRef, useState } from 'react'
import { UploadCloud } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { formatBytes, MAX_FILENAME_LENGTH, MAX_UPLOAD_BYTES } from '@/utils/format'

interface UploadZoneProps {
  onUpload: (file: File) => Promise<void>
  uploading: boolean
}

export function UploadZone({ onUpload, uploading }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [selected, setSelected] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  const validate = useCallback((file: File | null) => {
    if (!file) return null
    if (file.size > MAX_UPLOAD_BYTES) {
      return 'File is too large. Maximum allowed size is 10 MB.'
    }
    if (file.name.length > MAX_FILENAME_LENGTH) {
      return `Filename must be ${MAX_FILENAME_LENGTH} characters or fewer.`
    }
    return null
  }, [])

  const pick = (file: File | null) => {
    const error = validate(file)
    setLocalError(error)
    setSelected(error ? null : file)
  }

  const handleUpload = async () => {
    if (!selected) return
    const error = validate(selected)
    if (error) {
      setLocalError(error)
      return
    }
    try {
      await onUpload(selected)
      setSelected(null)
      if (inputRef.current) inputRef.current.value = ''
    } catch {
      // Parent reports the error via toast; keep selection for retry.
    }
  }

  return (
    <div className="neo-card p-5 sm:p-6">
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload file drop zone"
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            inputRef.current?.click()
          }
        }}
        onDragOver={(event) => {
          event.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => {
          event.preventDefault()
          setDragOver(false)
          const file = event.dataTransfer.files?.[0] || null
          pick(file)
        }}
        onClick={() => inputRef.current?.click()}
        className={`neo-inset flex cursor-pointer flex-col items-center justify-center gap-3 px-4 py-10 text-center transition ${
          dragOver ? 'ring-2 ring-[var(--color-accent)]' : ''
        }`}
      >
        <UploadCloud className="h-10 w-10 text-[var(--color-accent)]" />
        <div>
          <p className="font-semibold">Drag and drop a file here</p>
          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
            or click to select · max 10 MB · filename max {MAX_FILENAME_LENGTH} characters
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          onChange={(event) => pick(event.target.files?.[0] || null)}
        />
      </div>

      {selected ? (
        <div className="mt-4 rounded-2xl bg-[rgba(47,111,106,0.08)] px-4 py-3 text-sm">
          <p className="font-semibold">{selected.name}</p>
          <p className="text-[var(--color-ink-muted)]">{formatBytes(selected.size)}</p>
        </div>
      ) : null}

      {localError ? <p className="mt-3 text-sm text-[var(--color-danger)]">{localError}</p> : null}

      <div className="mt-4 flex flex-wrap gap-3">
        <Button disabled={!selected || uploading || Boolean(localError)} onClick={handleUpload}>
          {uploading ? 'Uploading...' : 'Upload File'}
        </Button>
        {selected ? (
          <Button
            variant="secondary"
            disabled={uploading}
            onClick={() => {
              setSelected(null)
              setLocalError(null)
              if (inputRef.current) inputRef.current.value = ''
            }}
          >
            Clear
          </Button>
        ) : null}
      </div>
    </div>
  )
}
