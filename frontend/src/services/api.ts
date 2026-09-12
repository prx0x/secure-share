import { clearStoredToken, getStoredToken } from '@/utils/authStorage'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

if (!API_BASE_URL) {
  console.warn('VITE_API_BASE_URL is not set. API requests will fail.')
}

export class ApiError extends Error {
  status: number
  detail: unknown

  constructor(status: number, message: string, detail?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.detail = detail
  }
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

interface RequestOptions {
  method?: HttpMethod
  body?: unknown
  formData?: FormData
  auth?: boolean
  signal?: AbortSignal
}

function friendlyMessage(status: number, detail: unknown): string {
  const detailText =
    typeof detail === 'string'
      ? detail
      : detail && typeof detail === 'object' && 'detail' in detail
        ? typeof (detail as { detail: unknown }).detail === 'string'
          ? ((detail as { detail: string }).detail)
          : Array.isArray((detail as { detail: unknown }).detail)
            ? 'Please check the information you entered.'
            : null
        : null

  if (status === 401) return 'Session expired. Please log in again.'
  if (status === 403) return detailText || "You don't have permission to perform this action."
  if (status === 404) return detailText || 'The requested file or resource was not found.'
  if (status === 409) return detailText || 'This permission or resource already exists.'
  if (status === 413) return detailText || 'File is too large. Maximum allowed size is 20 MB.'
  if (status === 422) return detailText || 'Please check the information you entered.'
  if (status === 400) return detailText || 'Please check the information you entered.'
  if (detailText) return detailText
  return 'Something went wrong. Please try again.'
}

async function parseError(response: Response): Promise<ApiError> {
  let detail: unknown
  try {
    detail = await response.json()
  } catch {
    detail = await response.text().catch(() => null)
  }
  return new ApiError(response.status, friendlyMessage(response.status, detail), detail)
}

let onUnauthorized: (() => void) | null = null

export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, formData, auth = true, signal } = options
  const headers = new Headers()

  if (auth) {
    const token = getStoredToken()
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }
  }

  let requestBody: BodyInit | undefined
  if (formData) {
    requestBody = formData
  } else if (body !== undefined) {
    headers.set('Content-Type', 'application/json')
    requestBody = JSON.stringify(body)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: requestBody,
    signal,
  })

  if (response.status === 401 && auth) {
    clearStoredToken()
    onUnauthorized?.()
    throw await parseError(response)
  }

  if (!response.ok) {
    throw await parseError(response)
  }

  if (response.status === 204) {
    return undefined as T
  }

  const contentType = response.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    return (await response.json()) as T
  }

  return (await response.text()) as T
}

export async function apiDownload(
  path: string,
  fallbackFilename: string,
): Promise<{ blob: Blob; filename: string }> {
  const headers = new Headers()
  const token = getStoredToken()
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'GET',
    headers,
  })

  if (response.status === 401) {
    clearStoredToken()
    onUnauthorized?.()
    throw await parseError(response)
  }

  if (!response.ok) {
    throw await parseError(response)
  }

  const blob = await response.blob()
  const disposition = response.headers.get('content-disposition')
  let filename = fallbackFilename
  if (disposition) {
    const utfMatch = /filename\*=UTF-8''([^;]+)/i.exec(disposition)
    const plainMatch = /filename="?([^";]+)"?/i.exec(disposition)
    if (utfMatch?.[1]) {
      try {
        filename = decodeURIComponent(utfMatch[1])
      } catch {
        filename = utfMatch[1]
      }
    } else if (plainMatch?.[1]) {
      filename = plainMatch[1].trim()
    }
  }

  return { blob, filename }
}

export function getApiBaseUrl(): string {
  return API_BASE_URL || ''
}
