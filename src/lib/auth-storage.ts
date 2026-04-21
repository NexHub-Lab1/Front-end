import type { ApiResponse, AuthUser, User } from '../types/app'

const AUTH_STORAGE_KEY = 'nexhub-auth-user'
export const AUTH_ROOT_ENDPOINT = '/api/auth'
export const AUTH_SIGN_UP_ENDPOINT = AUTH_ROOT_ENDPOINT + '/signup'
export const AUTH_LOG_IN_ENDPOINT = AUTH_ROOT_ENDPOINT + '/login'
export const AUTH_UPDATE_ENDPOINT = AUTH_ROOT_ENDPOINT + '/updateaccount'
export const AUTH_DELETE_ENDPOINT = AUTH_ROOT_ENDPOINT + '/deleteaccount'

// Local Storage Functions
export function readStoredAuthUser(): AuthUser | null {
  const stored = window.localStorage.getItem(AUTH_STORAGE_KEY)
  if (!stored) {
    return null
  }

  try {
    return (JSON.parse(stored) as AuthUser)
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY)
    return null
  }
}

export function readStoredUserToken(): string | null {
  const data = readStoredAuthUser()
  return data ? data.token : null
}

export function readStoredUser(): User | null {
  const data = readStoredAuthUser()
  return data ? data.user : null
}

export function persistUser(user: AuthUser | null) {
  if (!user) {
    window.localStorage.removeItem(AUTH_STORAGE_KEY)
    return
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user))
}

export function handleForbiddenResponse() {
  persistUser(null)
  window.location.href = '/auth/login'
}

// API Functions
function getAuthHeaders(): HeadersInit {
  const token = readStoredUserToken()
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  }
}

function handleResponse(response: Response) {
  if (response.status === 403) {
    handleForbiddenResponse()
  }
  return response.json()
}

export async function login(email: string, password: string): Promise<ApiResponse<AuthUser>> {
  const response = await fetch(AUTH_LOG_IN_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  })
  return response.json()
}

export async function signup(username: string, email: string, password: string): Promise<ApiResponse<User>> {
  const response = await fetch(AUTH_SIGN_UP_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, email, password }),
  })
  return response.json()
}

export async function updateAccount(user: User): Promise<ApiResponse<User>> {
  const response = await fetch(AUTH_UPDATE_ENDPOINT, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(user),
  })
  return handleResponse(response)
}

export async function deleteAccount(): Promise<ApiResponse<null>> {
  const response = await fetch(AUTH_DELETE_ENDPOINT, {
    method: 'POST',
    headers: getAuthHeaders(),
  })
  return handleResponse(response)
}
