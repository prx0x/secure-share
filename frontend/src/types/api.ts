export type Permission = 'READ' | 'WRITE' | 'DELETE'

export interface TokenResponse {
  access_token: string
  token_type: string
}

export interface UserCreate {
  username: string
  email: string
  password: string
}

export interface UserLogin {
  username: string
  password: string
}

export interface UserResponse {
  id: number
  username: string
  email: string
}

export interface FileItem {
  id: number
  filename: string
  created_at: string
}

export interface FileListResponse {
  owned_files: FileItem[]
  shared_files: FileItem[]
}

export interface MessageResponse {
  message: string
}

export interface GroupResponse {
  id: number
  name: string
  owner_id: number
  created_at: string
}

export interface GroupCreate {
  name: string
}

export interface FileShareRequest {
  user_id: number
  permission: Permission
}

export interface GroupFileShareRequest {
  group_id: number
  permission: Permission
}

export interface UserPermissionResponse {
  user_id: number
  username: string
  permission: string
}

export interface GroupPermissionResponse {
  group_id: number
  group_name: string
  permission: string
}

export interface FilePermissionsResponse {
  users: UserPermissionResponse[]
  groups: GroupPermissionResponse[]
}

export interface FilePermissionUpdate {
  user_id: number
  permission: Permission
}

export interface GroupPermissionUpdate {
  group_id: number
  permission: Permission
}

export interface FilePermissionRevoke {
  user_id: number
  permission: Permission
}

export interface GroupPermissionRevoke {
  group_id: number
  permission: Permission
}
