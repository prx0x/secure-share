import { useCallback, useEffect, useState } from 'react'
import { Users } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Field, Input } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import { CardSkeleton } from '@/components/ui/Skeleton'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { ApiError } from '@/services/api'
import { groupApi } from '@/services/groupService'
import type { GroupResponse, UserResponse } from '@/types/api'
import { formatDate } from '@/utils/format'

export function GroupsPage() {
  const { userId } = useAuth()
  const { toast } = useToast()
  const [groups, setGroups] = useState<GroupResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const [membersGroup, setMembersGroup] = useState<GroupResponse | null>(null)
  const [members, setMembers] = useState<UserResponse[]>([])
  const [membersLoading, setMembersLoading] = useState(false)
  const [membersError, setMembersError] = useState<string | null>(null)
  const [addUserId, setAddUserId] = useState('')
  const [adding, setAdding] = useState(false)
  const [removeTarget, setRemoveTarget] = useState<UserResponse | null>(null)
  const [removing, setRemoving] = useState(false)

  const refresh = useCallback(async () => {
    const data = await groupApi.listGroups()
    setGroups(data)
  }, [])

  useEffect(() => {
    let active = true
    refresh()
      .catch((err: unknown) => {
        if (active) setError(err instanceof ApiError ? err.message : 'Failed to load groups.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [refresh])

  const openMembers = async (group: GroupResponse) => {
    setMembersGroup(group)
    setMembers([])
    setMembersError(null)
    setAddUserId('')
    setMembersLoading(true)
    try {
      const data = await groupApi.listMembers(group.id)
      setMembers(data)
    } catch (err: unknown) {
      setMembersError(err instanceof ApiError ? err.message : 'Failed to load members.')
    } finally {
      setMembersLoading(false)
    }
  }

  const createGroup = async () => {
    const name = groupName.trim()
    if (name.length < 3 || name.length > 100) {
      setCreateError('Group name must be between 3 and 100 characters.')
      return
    }
    setCreating(true)
    setCreateError(null)
    try {
      await groupApi.createGroup({ name })
      toast('Group created successfully.', 'success')
      setCreateOpen(false)
      setGroupName('')
      await refresh()
    } catch (err: unknown) {
      setCreateError(err instanceof ApiError ? err.message : 'Failed to create group.')
    } finally {
      setCreating(false)
    }
  }

  const addMember = async () => {
    if (!membersGroup) return
    const parsed = Number(addUserId)
    if (!Number.isInteger(parsed) || parsed <= 0) {
      toast('Enter a valid numeric user ID.', 'error')
      return
    }
    setAdding(true)
    try {
      await groupApi.addMember(membersGroup.id, parsed)
      toast('Member added.', 'success')
      setAddUserId('')
      const data = await groupApi.listMembers(membersGroup.id)
      setMembers(data)
    } catch (err: unknown) {
      toast(err instanceof ApiError ? err.message : 'Failed to add member.', 'error')
    } finally {
      setAdding(false)
    }
  }

  const removeMember = async () => {
    if (!membersGroup || !removeTarget) return
    setRemoving(true)
    try {
      await groupApi.removeMember(membersGroup.id, removeTarget.id)
      toast('Member removed.', 'success')
      setRemoveTarget(null)
      const data = await groupApi.listMembers(membersGroup.id)
      setMembers(data)
    } catch (err: unknown) {
      toast(err instanceof ApiError ? err.message : 'Failed to remove member.', 'error')
    } finally {
      setRemoving(false)
    }
  }

  const isOwner = (group: GroupResponse) => userId != null && group.owner_id === userId

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">Groups</h1>
          <p className="mt-1 text-[var(--color-ink-muted)]">
            Create groups and manage members for shared file access.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>Create Group</Button>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : error ? (
        <div className="neo-card p-5 text-[var(--color-danger)]">{error}</div>
      ) : groups.length === 0 ? (
        <EmptyState
          title="You haven't joined any groups yet."
          description="Create a group to start sharing files with a set of users."
          actionLabel="Create Group"
          onAction={() => setCreateOpen(true)}
          icon={<Users className="h-8 w-8" />}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {groups.map((group) => (
            <motion.article
              key={group.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="neo-card flex flex-col gap-4 p-5"
            >
              <div>
                <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold">
                  {group.name}
                </h2>
                <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
                  Created {formatDate(group.created_at)}
                </p>
              </div>
              <div className="neo-inset px-4 py-3 text-sm">
                <p className="text-[var(--color-ink-muted)]">Owner</p>
                <p className="font-semibold">
                  User ID {group.owner_id}
                  {isOwner(group) ? ' (you)' : ''}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => void openMembers(group)}>
                  {isOwner(group) ? 'Manage Members' : 'View Members'}
                </Button>
              </div>
            </motion.article>
          ))}
        </div>
      )}

      <Modal open={createOpen} title="Create Group" onClose={() => setCreateOpen(false)}>
        <Field
          label="Group name"
          htmlFor="group-name"
          hint="Between 3 and 100 characters."
          error={createError || undefined}
        >
          <Input
            id="group-name"
            value={groupName}
            minLength={3}
            maxLength={100}
            onChange={(event) => setGroupName(event.target.value)}
          />
        </Field>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" disabled={creating} onClick={() => setCreateOpen(false)}>
            Cancel
          </Button>
          <Button disabled={creating} onClick={createGroup}>
            {creating ? 'Creating...' : 'Create Group'}
          </Button>
        </div>
      </Modal>

      <Modal
        open={Boolean(membersGroup)}
        title={membersGroup ? `${membersGroup.name} members` : 'Members'}
        onClose={() => setMembersGroup(null)}
        wide
      >
        {membersLoading ? (
          <p className="text-sm text-[var(--color-ink-muted)]">Loading members...</p>
        ) : null}
        {membersError ? <p className="text-sm text-[var(--color-danger)]">{membersError}</p> : null}

        {membersGroup && isOwner(membersGroup) ? (
          <div className="mb-5 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <Field
              label="Add member"
              htmlFor="add-member-id"
              hint="Enter the SecureShare user ID. There is no user search API."
            >
              <Input
                id="add-member-id"
                inputMode="numeric"
                value={addUserId}
                onChange={(event) => setAddUserId(event.target.value)}
                placeholder="123"
              />
            </Field>
            <Button disabled={adding} onClick={addMember}>
              {adding ? 'Adding member...' : 'Add Member'}
            </Button>
          </div>
        ) : null}

        {members.length === 0 && !membersLoading ? (
          <p className="text-sm text-[var(--color-ink-muted)]">
            No members listed yet. Group owners are not automatically included in the members list.
          </p>
        ) : (
          <ul className="space-y-2">
            {members.map((member) => (
              <li
                key={member.id}
                className="neo-inset flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div>
                  <p className="font-semibold">{member.username}</p>
                  <p className="text-sm text-[var(--color-ink-muted)]">{member.email}</p>
                  <p className="text-xs text-[var(--color-ink-subtle)]">User ID {member.id}</p>
                </div>
                {membersGroup &&
                isOwner(membersGroup) &&
                member.id !== membersGroup.owner_id ? (
                  <Button variant="danger" onClick={() => setRemoveTarget(member)}>
                    Remove
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Modal>

      <Modal
        open={Boolean(removeTarget)}
        title="Remove this member?"
        onClose={() => setRemoveTarget(null)}
      >
        {removeTarget ? (
          <p className="text-sm text-[var(--color-ink-muted)]">
            Remove <span className="font-semibold text-[var(--color-ink)]">{removeTarget.username}</span>{' '}
            from the group?
          </p>
        ) : null}
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" disabled={removing} onClick={() => setRemoveTarget(null)}>
            Cancel
          </Button>
          <Button variant="danger" disabled={removing} onClick={removeMember}>
            {removing ? 'Removing member...' : 'Remove'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
