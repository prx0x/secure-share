import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Field, Select } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import { ApiError } from '@/services/api'
import { permissionApi } from '@/services/permissionService'
import type {
  FileItem,
  FilePermissionsResponse,
  GroupPermissionResponse,
  Permission,
  UserPermissionResponse,
} from '@/types/api'
import { useToast } from '@/hooks/useToast'

const PERMISSIONS: Permission[] = ['READ', 'WRITE', 'DELETE']

interface ManageAccessDialogProps {
  open: boolean
  file: FileItem | null
  onClose: () => void
}

export function ManageAccessDialog({ open, file, onClose }: ManageAccessDialogProps) {
  const { toast } = useToast()
  const [data, setData] = useState<FilePermissionsResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingUser, setEditingUser] = useState<UserPermissionResponse | null>(null)
  const [editingGroup, setEditingGroup] = useState<GroupPermissionResponse | null>(null)
  const [nextPermission, setNextPermission] = useState<Permission>('READ')
  const [confirmRevoke, setConfirmRevoke] = useState<
    | { kind: 'user'; item: UserPermissionResponse }
    | { kind: 'group'; item: GroupPermissionResponse }
    | null
  >(null)
  const [busy, setBusy] = useState(false)

  const load = async (fileId: number) => {
    setLoading(true)
    setError(null)
    try {
      const response = await permissionApi.getFilePermissions(fileId)
      setData(response)
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : 'Failed to load permissions.')
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!open || !file) return
    setEditingUser(null)
    setEditingGroup(null)
    setConfirmRevoke(null)
    void load(file.id)
  }, [open, file])

  const saveUserPermission = async () => {
    if (!file || !editingUser) return
    setBusy(true)
    try {
      await permissionApi.updateUserPermission(file.id, {
        user_id: editingUser.user_id,
        permission: nextPermission,
      })
      toast('Permission updated.', 'success')
      setEditingUser(null)
      await load(file.id)
    } catch (err: unknown) {
      toast(err instanceof ApiError ? err.message : 'Failed to update permission.', 'error')
    } finally {
      setBusy(false)
    }
  }

  const saveGroupPermission = async () => {
    if (!file || !editingGroup) return
    setBusy(true)
    try {
      await permissionApi.updateGroupPermission(file.id, {
        group_id: editingGroup.group_id,
        permission: nextPermission,
      })
      toast('Permission updated.', 'success')
      setEditingGroup(null)
      await load(file.id)
    } catch (err: unknown) {
      toast(err instanceof ApiError ? err.message : 'Failed to update permission.', 'error')
    } finally {
      setBusy(false)
    }
  }

  const revoke = async () => {
    if (!file || !confirmRevoke) return
    setBusy(true)
    try {
      if (confirmRevoke.kind === 'user') {
        await permissionApi.revokeUserPermission(file.id, {
          user_id: confirmRevoke.item.user_id,
          permission: confirmRevoke.item.permission as Permission,
        })
      } else {
        await permissionApi.revokeGroupPermission(file.id, {
          group_id: confirmRevoke.item.group_id,
          permission: confirmRevoke.item.permission as Permission,
        })
      }
      toast('Permission revoked.', 'success')
      setConfirmRevoke(null)
      await load(file.id)
    } catch (err: unknown) {
      toast(err instanceof ApiError ? err.message : 'Failed to revoke permission.', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Modal open={open} title="Access Management" onClose={onClose} wide>
        {file ? (
          <p className="mb-4 text-sm text-[var(--color-ink-muted)]">
            Permissions for <span className="font-semibold text-[var(--color-ink)]">{file.filename}</span>
          </p>
        ) : null}

        {loading ? <p className="text-sm text-[var(--color-ink-muted)]">Loading permissions...</p> : null}
        {error ? <p className="text-sm text-[var(--color-danger)]">{error}</p> : null}

        {data ? (
          <div className="space-y-6">
            <section>
              <h3 className="mb-3 font-[family-name:var(--font-display)] text-base font-semibold">Users</h3>
              {data.users.length === 0 ? (
                <p className="text-sm text-[var(--color-ink-muted)]">No user permissions yet.</p>
              ) : (
                <ul className="space-y-2">
                  {data.users.map((item) => (
                    <li
                      key={`${item.user_id}-${item.permission}`}
                      className="neo-inset flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                    >
                      <div>
                        <p className="font-semibold">{item.username}</p>
                        <p className="text-sm text-[var(--color-ink-muted)]">{item.permission}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setEditingUser(item)
                            setNextPermission((item.permission as Permission) || 'READ')
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() => setConfirmRevoke({ kind: 'user', item })}
                        >
                          Remove
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h3 className="mb-3 font-[family-name:var(--font-display)] text-base font-semibold">Groups</h3>
              {data.groups.length === 0 ? (
                <p className="text-sm text-[var(--color-ink-muted)]">No group permissions yet.</p>
              ) : (
                <ul className="space-y-2">
                  {data.groups.map((item) => (
                    <li
                      key={`${item.group_id}-${item.permission}`}
                      className="neo-inset flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                    >
                      <div>
                        <p className="font-semibold">{item.group_name}</p>
                        <p className="text-sm text-[var(--color-ink-muted)]">{item.permission}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setEditingGroup(item)
                            setNextPermission((item.permission as Permission) || 'READ')
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() => setConfirmRevoke({ kind: 'group', item })}
                        >
                          Remove
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={Boolean(editingUser)}
        title="Edit user permission"
        onClose={() => setEditingUser(null)}
      >
        <Field label="Permission" htmlFor="edit-user-permission">
          <Select
            id="edit-user-permission"
            value={nextPermission}
            onChange={(event) => setNextPermission(event.target.value as Permission)}
          >
            {PERMISSIONS.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </Select>
        </Field>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setEditingUser(null)} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={saveUserPermission} disabled={busy}>
            {busy ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </Modal>

      <Modal
        open={Boolean(editingGroup)}
        title="Edit group permission"
        onClose={() => setEditingGroup(null)}
      >
        <Field label="Permission" htmlFor="edit-group-permission">
          <Select
            id="edit-group-permission"
            value={nextPermission}
            onChange={(event) => setNextPermission(event.target.value as Permission)}
          >
            {PERMISSIONS.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </Select>
        </Field>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setEditingGroup(null)} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={saveGroupPermission} disabled={busy}>
            {busy ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </Modal>

      <Modal
        open={Boolean(confirmRevoke)}
        title="Revoke permission?"
        onClose={() => setConfirmRevoke(null)}
      >
        <p className="text-sm text-[var(--color-ink-muted)]">
          This will remove access immediately. This action cannot be undone from the UI without sharing again.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirmRevoke(null)} disabled={busy}>
            Cancel
          </Button>
          <Button variant="danger" onClick={revoke} disabled={busy}>
            {busy ? 'Revoking...' : 'Revoke'}
          </Button>
        </div>
      </Modal>
    </>
  )
}
