const TOKEN_KEY = 'secureshare_access_token'

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

/** Decode JWT payload for display/state only. Not an authorization mechanism. */
export function decodeJwtUserId(token: string): number | null {
  try {
    const parts = token.split('.')
    if (parts.length < 2) return null
    const payload = parts[1]
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=')
    const json = atob(padded)
    const data = JSON.parse(json) as { sub?: string | number }
    if (data.sub == null) return null
    const id = Number(data.sub)
    return Number.isFinite(id) ? id : null
  } catch {
    return null
  }
}
