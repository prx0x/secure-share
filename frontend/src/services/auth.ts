import { apiRequest } from '@/services/api'
import type { TokenResponse, UserCreate, UserLogin, UserResponse } from '@/types/api'

export const authApi = {
  login(payload: UserLogin) {
    return apiRequest<TokenResponse>('/login', {
      method: 'POST',
      body: payload,
      auth: false,
    })
  },

  register(payload: UserCreate) {
    return apiRequest<UserResponse>('/users', {
      method: 'POST',
      body: payload,
      auth: false,
    })
  },
}
