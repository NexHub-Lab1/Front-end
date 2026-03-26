import type { AuthUser } from '../types/app'

const AUTH_STORAGE_KEY = 'nexhub-auth-user'

export function readStoredUser(): AuthUser | null {
  const stored = window.localStorage.getItem(AUTH_STORAGE_KEY)
  if (!stored) {
    return null
  }

  try {
    return JSON.parse(stored) as AuthUser
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY)
    return null
  }
}

export function persistUser(user: AuthUser | null) {
  if (!user) {
    window.localStorage.removeItem(AUTH_STORAGE_KEY)
    return
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user))
}
