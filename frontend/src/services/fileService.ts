import { apiRequest } from '@/services/api'
import type {
  FileItem,
  FileListResponse,
  MessageResponse,
} from '@/types/api'

interface UploadSignature {
  cloud_name: string
  api_key: string
  resource_type: string
  timestamp: number
  signature: string
  public_id: string
  type: string
  asset_folder?: string
  folder?: string
}

async function uploadToCloudinary(
  file: File,
  signature: UploadSignature,
): Promise<string> {
  const formData = new FormData()

  formData.append('file', file)
  formData.append('api_key', signature.api_key)
  formData.append('timestamp', String(signature.timestamp))
  formData.append('signature', signature.signature)
  formData.append('public_id', signature.public_id)
  formData.append('type', signature.type)

  if (signature.asset_folder) {
    formData.append('asset_folder', signature.asset_folder)
  }

  if (signature.folder) {
    formData.append('folder', signature.folder)
  }

  const endpoint =
    `https://api.cloudinary.com/v1_1/` +
    `${signature.cloud_name}/` +
    `${signature.resource_type}/upload`

  const response = await fetch(endpoint, {
    method: 'POST',
    body: formData,
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(
      result.error?.message || 'Cloudinary upload failed.',
    )
  }

  return result.public_id
}

export const fileApi = {
  getFiles() {
    return apiRequest<FileListResponse>('/files')
  },

  async uploadFile(file: File) {
    const signature = await apiRequest<UploadSignature>(
      '/files/upload/signature',
      {
        method: 'POST',
        body: {
          filename: file.name,
          size: file.size,
        },
      },
    )

    const publicId = await uploadToCloudinary(file, signature)

    return apiRequest<FileItem>('/files/upload/complete', {
      method: 'POST',
      body: {
        filename: file.name,
        public_id: publicId,
      },
    })
  },

  async downloadFile(fileId: number, _fallbackFilename: string) {
    const result = await apiRequest<{ download_url: string }>(
      `/files/${fileId}`,
    )

    const anchor = document.createElement('a')
    anchor.href = result.download_url
    anchor.rel = 'noopener'
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
  },

  async updateFile(fileId: number, file: File) {
    const signature = await apiRequest<UploadSignature>(
      `/files/${fileId}/update/signature`,
      {
        method: 'POST',
        body: {
          filename: file.name,
          size: file.size,
        },
      },
    )

    const publicId = await uploadToCloudinary(file, signature)

    return apiRequest<MessageResponse>(
      `/files/${fileId}/update/complete`,
      {
        method: 'POST',
        body: {
          filename: file.name,
          public_id: publicId,
        },
      },
    )
  },

  deleteFile(fileId: number) {
    return apiRequest<MessageResponse>(`/files/${fileId}`, {
      method: 'DELETE',
    })
  },
}
