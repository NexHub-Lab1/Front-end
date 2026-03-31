import type { AuthUser } from '../types/app'

const AUTH_STORAGE_KEY = 'nexhub-auth-user'
export const AUTH_ROOT_ENDPOINT = '/api/auth'
export const AUTH_SIGN_UP_ENDPOINT = AUTH_ROOT_ENDPOINT + '/signup'
export const AUTH_LOG_IN_ENDPOINT = AUTH_ROOT_ENDPOINT + '/login'
export const AUTH_UPDATE_ENDPOINT = AUTH_ROOT_ENDPOINT + '/updateaccount'
export const AUTH_DELETE_ENDPOINT = AUTH_ROOT_ENDPOINT + '/deleteaccount'

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
