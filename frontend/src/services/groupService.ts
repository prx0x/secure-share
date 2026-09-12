import { apiRequest } from '@/services/api'
import type { GroupCreate, GroupResponse, MessageResponse, UserResponse } from '@/types/api'

export const groupApi = {
  listGroups() {
    return apiRequest<GroupResponse[]>('/groups')
  },

  createGroup(payload: GroupCreate) {
    return apiRequest<GroupResponse>('/groups', {
      method: 'POST',
      body: payload,
    })
  },

  listMembers(groupId: number) {
    return apiRequest<UserResponse[]>(`/groups/${groupId}/members`)
  },

  addMember(groupId: number, userId: number) {
    return apiRequest<MessageResponse>(`/groups/${groupId}/members/${userId}`, {
      method: 'POST',
    })
  },

  removeMember(groupId: number, userId: number) {
    return apiRequest<MessageResponse>(`/groups/${groupId}/members/${userId}`, {
      method: 'DELETE',
    })
  },
}
