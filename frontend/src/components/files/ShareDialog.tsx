import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import { groupApi } from '@/services/groupService'
import { permissionApi } from '@/services/permissionService'
import type { FileItem, GroupResponse, Permission } from '@/types/api'
import { ApiError } from '@/services/api'
import { useToast } from '@/hooks/useToast'

const PERMISSIONS: Permission[] = ['READ', 'WRITE', 'DELETE']

interface ShareDialogProps {
  open: boolean
  file: FileItem | null
  onClose: () => void
}

export function ShareDialog({ open, file, onClose }: ShareDialogProps) {
  const { toast } = useToast()
  const [tab, setTab] = useState<'user' | 'group'>('user')
  const [userId, setUserId] = useState('')
  const [groupId, setGroupId] = useState('')
  const [permission, setPermission] = useState<Permission>('READ')
  const [groups, setGroups] = useState<GroupResponse[]>([])
  const [loadingGroups, setLoadingGroups] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setTab('user')
    setUserId('')
    setGroupId('')
    setPermission('READ')
    setError(null)
    setLoadingGroups(true)
    groupApi
      .listGroups()
      .then((data) => {
        setGroups(data)
        if (data[0]) setGroupId(String(data[0].id))
      })
      .catch((err: unknown) => {
        const message = err instanceof ApiError ? err.message : 'Failed to load groups.'
        setError(message)
      })
      .finally(() => setLoadingGroups(false))
  }, [open])

  const submit = async () => {
    if (!file) return
    setSubmitting(true)
    setError(null)
    try {
      if (tab === 'user') {
        const parsed = Number(userId)
        if (!Number.isInteger(parsed) || parsed <= 0) {
          setError('Enter a valid numeric user ID.')
          return
        }
        await permissionApi.shareWithUser(file.id, {
          user_id: parsed,
          permission,
        })
        toast('File shared successfully.', 'success')
      } else {
        const parsed = Number(groupId)
        if (!Number.isInteger(parsed) || parsed <= 0) {
          setError('Select a group.')
          return
        }
        await permissionApi.shareWithGroup(file.id, {
          group_id: parsed,
          permission,
        })
        toast('File shared with group successfully.', 'success')
      }
      onClose()
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : 'Failed to share file.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} title="Share file" onClose={onClose}>
      {file ? (
        <p className="mb-4 text-sm text-[var(--color-ink-muted)]">
          Sharing <span className="font-semibold text-[var(--color-ink)]">{file.filename}</span>
        </p>
      ) : null}

      <div className="mb-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          className={`rounded-2xl px-3 py-2 text-sm font-semibold ${
            tab === 'user'
              ? 'bg-[var(--color-accent)] text-white'
              : 'neo-inset text-[var(--color-ink-muted)]'
          }`}
          onClick={() => setTab('user')}
        >
          User
        </button>
        <button
          type="button"
          className={`rounded-2xl px-3 py-2 text-sm font-semibold ${
            tab === 'group'
              ? 'bg-[var(--color-accent)] text-white'
              : 'neo-inset text-[var(--color-ink-muted)]'
          }`}
          onClick={() => setTab('group')}
        >
          Group
        </button>
      </div>

      <div className="space-y-4">
        {tab === 'user' ? (
          <Field
            label="User ID"
            htmlFor="share-user-id"
            hint="Enter the recipient's SecureShare user ID."
          >
            <Input
              id="share-user-id"
              inputMode="numeric"
              value={userId}
              onChange={(event) => setUserId(event.target.value)}
              placeholder="123"
            />
          </Field>
        ) : (
          <Field label="Group" htmlFor="share-group-id">
            <Select
              id="share-group-id"
              value={groupId}
              disabled={loadingGroups || groups.length === 0}
              onChange={(event) => setGroupId(event.target.value)}
            >
              {groups.length === 0 ? (
                <option value="">No groups available</option>
              ) : (
                groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))
              )}
            </Select>
          </Field>
        )}

        <Field label="Permission" htmlFor="share-permission">
          <Select
            id="share-permission"
            value={permission}
            onChange={(event) => setPermission(event.target.value as Permission)}
          >
            {PERMISSIONS.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </Select>
        </Field>

        {error ? <p className="text-sm text-[var(--color-danger)]">{error}</p> : null}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={submitting || (tab === 'group' && groups.length === 0)}>
            {submitting ? 'Sharing...' : 'Share'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
