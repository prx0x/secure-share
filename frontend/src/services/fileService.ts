import { apiDownload, apiRequest } from '@/services/api'
import type { FileItem, FileListResponse, MessageResponse } from '@/types/api'

export const fileApi = {
  getFiles() {
    return apiRequest<FileListResponse>('/files')
  },

  uploadFile(file: File) {
    const formData = new FormData()
    formData.append('file', file)
    return apiRequest<FileItem>('/files/upload', {
      method: 'POST',
      formData,
    })
  },

  async downloadFile(fileId: number, fallbackFilename: string) {
    const { blob, filename } = await apiDownload(`/files/${fileId}`, fallbackFilename)
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = filename
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
  },

  updateFile(fileId: number, file: File) {
    const formData = new FormData()
    formData.append('file', file)
    return apiRequest<MessageResponse>(`/files/${fileId}`, {
      method: 'PUT',
      formData,
    })
  },

  deleteFile(fileId: number) {
    return apiRequest<MessageResponse>(`/files/${fileId}`, {
      method: 'DELETE',
    })
  },
}
