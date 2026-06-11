import type {
  ApiResponse,
  PaginatedResponse,
  PaginationParams,
  TaskInvitationRequest,
  TaskInvitationResponse,
} from '../types/app'
import { readStoredUserToken, handleForbiddenResponse } from './auth-storage'
import { buildPaginationQuery, normalizePaginatedApiResponse } from './pagination'

const INVITATION_ROOT_ENDPOINT = '/api/task-invitations'
export const GET_PENDING_INVITATIONS_ENDPOINT = INVITATION_ROOT_ENDPOINT + '/pending'
export const GET_INVITATIONS_BY_TASK_ENDPOINT = (taskId: number) => INVITATION_ROOT_ENDPOINT + '/task/' + String(taskId)
export const ACCEPT_INVITATION_ENDPOINT = (id: number) => `${INVITATION_ROOT_ENDPOINT}/${id}/accept`
export const REJECT_INVITATION_ENDPOINT = (id: number) => `${INVITATION_ROOT_ENDPOINT}/${id}/reject`

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

export async function createInvitation(request: TaskInvitationRequest): Promise<ApiResponse<TaskInvitationResponse>> {
  const response = await fetch(INVITATION_ROOT_ENDPOINT, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(request),
  })
  return handleResponse(response)
}

export async function acceptInvitation(id: number): Promise<ApiResponse<TaskInvitationResponse>> {
  const response = await fetch(ACCEPT_INVITATION_ENDPOINT(id), {
    method: 'PUT',
    headers: getAuthHeaders(),
  })
  return handleResponse(response)
}

export async function rejectInvitation(id: number): Promise<ApiResponse<TaskInvitationResponse>> {
  const response = await fetch(REJECT_INVITATION_ENDPOINT(id), {
    method: 'PUT',
    headers: getAuthHeaders(),
  })
  return handleResponse(response)
}

export async function fetchPendingInvitations(
  params?: PaginationParams,
): Promise<ApiResponse<PaginatedResponse<TaskInvitationResponse>>> {
  const token = readStoredUserToken()
  if (!token) {
    return {
      status: 'error',
      message: 'No authentication token',
      data: null,
      timestamp: new Date().toISOString(),
    }
  }

  const page = params?.page ?? 0
  const size = params?.size ?? 10
  const response = await fetch(`${GET_PENDING_INVITATIONS_ENDPOINT}${buildPaginationQuery(params)}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  })
  return normalizePaginatedApiResponse(await handleResponse(response), page, size)
}

export async function fetchInvitationsByTask(taskId: number): Promise<ApiResponse<TaskInvitationResponse[]>> {
  const token = readStoredUserToken()
  if (!token) {
    return {
      status: 'error',
      message: 'No authentication token',
      data: null,
      timestamp: new Date().toISOString(),
    }
  }

  const response = await fetch(GET_INVITATIONS_BY_TASK_ENDPOINT(taskId), {
    method: 'GET',
    headers: getAuthHeaders(),
  })
  return handleResponse(response)
}
