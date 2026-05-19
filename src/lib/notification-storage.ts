import type { ApiResponse, Notification } from '../types/app'
import { readStoredUserToken, handleForbiddenResponse } from './auth-storage'

export const NOTIFICATION_ROOT_ENDPOINT = '/api/notifications'

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

export async function fetchNotifications(): Promise<ApiResponse<Notification[]>> {
  const response = await fetch(NOTIFICATION_ROOT_ENDPOINT, {
    method: 'GET',
    headers: getAuthHeaders(),
  })
  return handleResponse(response)
}

export async function markNotificationAsRead(id: number): Promise<ApiResponse<void>> {
  const response = await fetch(`${NOTIFICATION_ROOT_ENDPOINT}/${id}/read`, {
    method: 'PUT',
    headers: getAuthHeaders(),
  })
  return handleResponse(response)
}
