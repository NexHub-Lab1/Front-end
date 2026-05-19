import type { ApiResponse, ProfileDashboardDTO } from '../types/app'
import { readStoredUserToken, handleForbiddenResponse } from './auth-storage'

export const DASHBOARD_ENDPOINT = '/api/dashboard'
export const PROFILE_DASHBOARD_ENDPOINT = (userId: number) => `${DASHBOARD_ENDPOINT}/profile/${userId}`

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

const DASHBOARD_STORAGE_KEY = 'nexhub-profile-dashboard'
const DASHBOARD_UPDATE_EVENT = 'nexhub-dashboard-updated'

export function persistProfileDashboard(data: ProfileDashboardDTO | null) {
  if (!data) {
    window.localStorage.removeItem(DASHBOARD_STORAGE_KEY)
    return
  }
  window.localStorage.setItem(DASHBOARD_STORAGE_KEY, JSON.stringify(data))
  window.dispatchEvent(new Event(DASHBOARD_UPDATE_EVENT))
}

export function readStoredProfileDashboard(): ProfileDashboardDTO | null {
  const stored = window.localStorage.getItem(DASHBOARD_STORAGE_KEY)
  if (!stored) return null
  try {
    return JSON.parse(stored) as ProfileDashboardDTO
  } catch {
    window.localStorage.removeItem(DASHBOARD_STORAGE_KEY)
    return null
  }
}

export function useDashboardData() {
  // This is a simple version, we'll implement the actual hook usage in components
  return readStoredProfileDashboard()
}

export async function fetchProfileDashboard(userId: number): Promise<ApiResponse<ProfileDashboardDTO>> {
  const response = await fetch(PROFILE_DASHBOARD_ENDPOINT(userId), {
    method: 'GET',
    headers: getAuthHeaders(),
  })
  
  const result = await handleResponse(response)
  if (result.status === 'success' && result.data) {
    persistProfileDashboard(result.data)
  }
  return result
}
