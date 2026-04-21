import type { ApiResponse, ProjectForm, ProjectResponse, ProjectUpdateForm } from '../types/app'
import { readStoredUserToken, readStoredUser, handleForbiddenResponse } from './auth-storage'

export const PROJECT_ROOT_ENDPOINT = '/api/projects'
export const GET_PROJECTS_ENDPOINT = (user_id: number) => PROJECT_ROOT_ENDPOINT + '/owner/' + String(user_id)
export const UPDATE_PROJECT_ENDPOINT = PROJECT_ROOT_ENDPOINT + '/updateproject'
export const DELETE_PROJECT_ENDPOINT = PROJECT_ROOT_ENDPOINT + '/delete'

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

export async function fetchAllProjects(): Promise<ApiResponse<ProjectResponse[]>> {
  const response = await fetch(PROJECT_ROOT_ENDPOINT, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })
  return handleResponse(response, false)
}

export async function fetchProjectsByCurrentUser(): Promise<ApiResponse<ProjectResponse[]>> {
  const user = readStoredUser()
  if (!user) {
    return {
      status: 'error',
      message: 'No authenticated user',
      data: null,
      timestamp: new Date().toISOString(),
    }
  }

  const endpoint = GET_PROJECTS_ENDPOINT(user.id)
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: getAuthHeaders(),
  })
  return handleResponse(response)
}

export async function fetchProjectById(projectId: number): Promise<ApiResponse<ProjectResponse>> {
  const response = await fetch(`${PROJECT_ROOT_ENDPOINT}/${projectId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })
  return handleResponse(response, false)
}

export async function createProject(project: ProjectForm): Promise<ApiResponse<ProjectResponse>> {
  const user = readStoredUser()
  if (!user) {
    return {
      status: 'error',
      message: 'No authenticated user',
      data: null,
      timestamp: new Date().toISOString(),
    }
  }

  const projectData = { ...project, ownerId: user.id }
  const response = await fetch(PROJECT_ROOT_ENDPOINT, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(projectData),
  })
  return handleResponse(response)
}

export async function updateProject(project: ProjectUpdateForm): Promise<ApiResponse<ProjectResponse>> {
  const response = await fetch(UPDATE_PROJECT_ENDPOINT, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(project),
  })
  return handleResponse(response)
}

export async function deleteProject(projectId: number): Promise<ApiResponse<null>> {
  const response = await fetch(DELETE_PROJECT_ENDPOINT, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(projectId),
  })
  return handleResponse(response)
}
