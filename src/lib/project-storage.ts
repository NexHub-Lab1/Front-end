import type {
  ApiResponse,
  PaginatedResponse,
  PaginationParams,
  ProjectForm,
  ProjectResponse,
  ProjectUpdateForm,
} from '../types/app'
import { readStoredUserToken, readStoredUser, handleForbiddenResponse } from './auth-storage'
import { buildPaginationQuery, normalizePaginatedApiResponse } from './pagination'

export const PROJECT_ROOT_ENDPOINT = '/api/projects'
export const GET_PROJECTS_ENDPOINT = (user_id: number) => PROJECT_ROOT_ENDPOINT + '/owner/' + String(user_id)
export const UPDATE_PROJECT_ENDPOINT = PROJECT_ROOT_ENDPOINT + '/updateproject'
export const DELETE_PROJECT_ENDPOINT = PROJECT_ROOT_ENDPOINT + '/delete'
export const ARCHIVE_PROJECT_ENDPOINT = PROJECT_ROOT_ENDPOINT + '/archive'

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

export async function fetchAllProjects(
  params?: PaginationParams,
): Promise<ApiResponse<PaginatedResponse<ProjectResponse>>> {
  const page = params?.page ?? 0
  const size = params?.size ?? 9
  const response = await fetch(`${PROJECT_ROOT_ENDPOINT}${buildPaginationQuery(params)}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })
  return normalizePaginatedApiResponse(await handleResponse(response, false), page, size)
}

export async function fetchProjectsByCurrentUser(
  params?: PaginationParams,
): Promise<ApiResponse<PaginatedResponse<ProjectResponse>>> {
  const user = readStoredUser()
  const token = readStoredUserToken()
  if (!user) {
    return {
      status: 'error',
      message: 'No authenticated user',
      data: null,
      timestamp: new Date().toISOString(),
    }
  }
  if (!token) {
    return {
      status: 'error',
      message: 'No authentication token',
      data: null,
      timestamp: new Date().toISOString(),
    }
  }

  const page = params?.page ?? 0
  const size = params?.size ?? 9
  const endpoint = `${GET_PROJECTS_ENDPOINT(user.id)}${buildPaginationQuery(params)}`
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: getAuthHeaders(),
  })
  return normalizePaginatedApiResponse(await handleResponse(response), page, size)
}

export async function fetchProjectsByOwnerId(
  ownerId: number,
  params?: PaginationParams,
): Promise<ApiResponse<PaginatedResponse<ProjectResponse>>> {
  const page = params?.page ?? 0
  const size = params?.size ?? 9
  const endpoint = `${GET_PROJECTS_ENDPOINT(ownerId)}${buildPaginationQuery(params)}`
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })
  return normalizePaginatedApiResponse(await handleResponse(response, false), page, size)
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

export async function deleteProject(projectId: number): Promise<ApiResponse<ProjectResponse>> {
  const response = await fetch(DELETE_PROJECT_ENDPOINT, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(projectId),
  })
  return handleResponse(response)
}

export async function archiveProject(projectId: number): Promise<ApiResponse<ProjectResponse>> {
  const response = await fetch(ARCHIVE_PROJECT_ENDPOINT, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(projectId),
  })
  return handleResponse(response)
}
