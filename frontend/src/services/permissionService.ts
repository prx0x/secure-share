import { apiRequest } from '@/services/api'
import type {
  FilePermissionRevoke,
  FilePermissionsResponse,
  FilePermissionUpdate,
  FileShareRequest,
  GroupFileShareRequest,
  GroupPermissionRevoke,
  GroupPermissionUpdate,
  MessageResponse,
} from '@/types/api'

export const permissionApi = {
  shareWithUser(fileId: number, payload: FileShareRequest) {
    return apiRequest<MessageResponse>(`/files/${fileId}/share/user`, {
      method: 'POST',
      body: payload,
    })
  },

  shareWithGroup(fileId: number, payload: GroupFileShareRequest) {
    return apiRequest<MessageResponse>(`/files/${fileId}/share/group`, {
      method: 'POST',
      body: payload,
    })
  },

  getFilePermissions(fileId: number) {
    return apiRequest<FilePermissionsResponse>(`/files/${fileId}/permissions`)
  },

  updateUserPermission(fileId: number, payload: FilePermissionUpdate) {
    return apiRequest<MessageResponse>(`/files/${fileId}/permissions/user`, {
      method: 'PUT',
      body: payload,
    })
  },

  updateGroupPermission(fileId: number, payload: GroupPermissionUpdate) {
    return apiRequest<MessageResponse>(`/files/${fileId}/permissions/group`, {
      method: 'PUT',
      body: payload,
    })
  },

  revokeUserPermission(fileId: number, payload: FilePermissionRevoke) {
    return apiRequest<MessageResponse>(`/files/${fileId}/permissions/user`, {
      method: 'DELETE',
      body: payload,
    })
  },

  revokeGroupPermission(fileId: number, payload: GroupPermissionRevoke) {
    return apiRequest<MessageResponse>(`/files/${fileId}/permissions/group`, {
      method: 'DELETE',
      body: payload,
    })
  },
}
