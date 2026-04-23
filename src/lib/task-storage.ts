import type { ApiResponse, TaskRequest, TaskResponse } from '../types/app'
import { readStoredUserToken, handleForbiddenResponse } from './auth-storage'

export const ROOT_TASK_ENDPOINT = '/api/tasks'
export const TASKS_BY_PROJECT_ENDPOINT = (id: number) => ROOT_TASK_ENDPOINT + `/project/${id}`
export const DELETE_TASK_ENDPOINT = ROOT_TASK_ENDPOINT + '/delete'
export const CANCEL_TASK_ENDPOINT = ROOT_TASK_ENDPOINT + '/cancel'
export const UPDATE_TASK_ENDPOINT = ROOT_TASK_ENDPOINT + '/updatetask'

function getAuthHeaders(): HeadersInit {
  const token = readStoredUserToken()
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  }
}

function handleResponse(response: Response, redirectOnForbidden = true) {
  console.log('API Response Status:', response)
  if (redirectOnForbidden && response.status === 403) {
    handleForbiddenResponse()
  }
  return response.json()
}

export async function fetchAllTasks(): Promise<ApiResponse<TaskResponse[]>> {
  const response = await fetch(ROOT_TASK_ENDPOINT, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })
  return handleResponse(response, false)
}

export async function fetchTasksByProject(projectId: number): Promise<ApiResponse<TaskResponse[]>> {
  const response = await fetch(TASKS_BY_PROJECT_ENDPOINT(projectId), {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })
  return handleResponse(response, false)
}

export async function fetchTaskById(taskId: number): Promise<ApiResponse<TaskResponse>> {
  const response = await fetch(`${ROOT_TASK_ENDPOINT}/${taskId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })
  return handleResponse(response, false)
}

export async function createTask(task: TaskRequest): Promise<ApiResponse<TaskResponse>> {
  const response = await fetch(ROOT_TASK_ENDPOINT, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(task),
  })
  return handleResponse(response)
}

export async function updateTask(task: TaskRequest & { id: number }): Promise<ApiResponse<TaskResponse>> {
  const response = await fetch(UPDATE_TASK_ENDPOINT, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(task),
  })
  return handleResponse(response)
}

export async function deleteTask(taskId: number): Promise<ApiResponse<TaskResponse>> {
  const response = await fetch(DELETE_TASK_ENDPOINT, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(taskId),
  })
  return handleResponse(response)
}

export async function cancelTask(taskId: number): Promise<ApiResponse<TaskResponse>> {
  const response = await fetch(CANCEL_TASK_ENDPOINT, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(taskId),
  })
  return handleResponse(response)
}
