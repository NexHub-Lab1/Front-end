import type { ApiResponse, TaskAssignmentResponse, TaskAssignmentRequest, TaskAssignmentUpdateRequest } from '../types/app'
import { readStoredUserToken, handleForbiddenResponse } from './auth-storage'

const ASSIGNMENT_ROOT_ENDPOINT = '/api/task-assignments'
export const GET_ASSIGNMENTS_BY_USER_ENDPOINT = (user_id: number) => ASSIGNMENT_ROOT_ENDPOINT + '/user/' + String(user_id)
export const GET_ASSIGNMENTS_BY_TASK_ENDPOINT = (task_id: number) => ASSIGNMENT_ROOT_ENDPOINT + '/task/' + String(task_id)
export const UPDATE_ASSIGNMENT_ENDPOINT = ASSIGNMENT_ROOT_ENDPOINT + '/updateassignment'
export const DELETE_ASSIGNMENT_ENDPOINT = ASSIGNMENT_ROOT_ENDPOINT + '/delete'

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

export async function fetchAssignmentsByUser(userId: number): Promise<ApiResponse<TaskAssignmentResponse[]>> {
  const response = await fetch(GET_ASSIGNMENTS_BY_USER_ENDPOINT(userId), {
    method: 'GET',
    headers: getAuthHeaders(),
  })
  return handleResponse(response)
}

export async function fetchAssignmentsByTask(taskId: number): Promise<ApiResponse<TaskAssignmentResponse[]>> {
  const response = await fetch(GET_ASSIGNMENTS_BY_TASK_ENDPOINT(taskId), {
    method: 'GET',
    headers: getAuthHeaders(),
  })
  return handleResponse(response)
}

export async function updateAssignment(assignment: TaskAssignmentUpdateRequest): Promise<ApiResponse<TaskAssignmentResponse>> {
  const response = await fetch(UPDATE_ASSIGNMENT_ENDPOINT, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(assignment),
  })
  return handleResponse(response)
}

export async function deleteAssignment(assignmentId: number): Promise<ApiResponse<null>> {
  const response = await fetch(DELETE_ASSIGNMENT_ENDPOINT, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    body: JSON.stringify({ id: assignmentId }),
  })
  return handleResponse(response)
}

