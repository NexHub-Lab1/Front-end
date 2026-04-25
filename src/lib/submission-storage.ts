import type {
  ApiResponse,
  PaginatedResponse,
  PaginationParams,
  TaskSubmissionResponse,
  TaskSubmissionRequest,
  TaskSubmissionUpdateRequest,
} from '../types/app'
import { readStoredUserToken, handleForbiddenResponse } from './auth-storage'
import { buildPaginationQuery, normalizePaginatedApiResponse } from './pagination'

const SUBMISSION_ROOT_ENDPOINT = '/api/task-submissions'
export const GET_SUBMISSION_BY_ID = (id: number) => SUBMISSION_ROOT_ENDPOINT + `/${id}`
export const GET_SUBMISSIONS_BY_TASK = (taskId: number) => SUBMISSION_ROOT_ENDPOINT + `/task/${taskId}`
export const GET_SUBMISSIONS_BY_ASSIGNMENT = (assignmentId: number) => SUBMISSION_ROOT_ENDPOINT + `/assignment/${assignmentId}`
export const GET_SUBMISSIONS_BY_USER = (userId: number) => SUBMISSION_ROOT_ENDPOINT + `/user/${userId}`
export const GET_SUBMISSIONS_TO_REVIEW = (reviewerId: number) => SUBMISSION_ROOT_ENDPOINT + `/reviewer/${reviewerId}`
export const DELETE_SUBMISSION_ENDPOINT = SUBMISSION_ROOT_ENDPOINT + '/delete'
export const UPDATE_SUBMISSION_ENDPOINT = SUBMISSION_ROOT_ENDPOINT + '/updatesubmission'

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

export async function fetchSubmissionById(id: number): Promise<ApiResponse<TaskSubmissionResponse>> {
  const response = await fetch(GET_SUBMISSION_BY_ID(id), {
    method: 'GET',
    headers: getAuthHeaders(),
  })
  return handleResponse(response)
}

export async function fetchSubmissionsByTask(
  taskId: number,
  params?: PaginationParams,
): Promise<ApiResponse<PaginatedResponse<TaskSubmissionResponse>>> {
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
  const size = params?.size ?? 9
  const response = await fetch(`${GET_SUBMISSIONS_BY_TASK(taskId)}${buildPaginationQuery(params)}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  })
  return normalizePaginatedApiResponse(await handleResponse(response), page, size)
}

export async function fetchSubmissionsByAssignment(
  assignmentId: number,
  params?: PaginationParams,
): Promise<ApiResponse<PaginatedResponse<TaskSubmissionResponse>>> {
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
  const size = params?.size ?? 9
  const response = await fetch(`${GET_SUBMISSIONS_BY_ASSIGNMENT(assignmentId)}${buildPaginationQuery(params)}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  })
  return normalizePaginatedApiResponse(await handleResponse(response), page, size)
}

export async function fetchSubmissionsByUser(
  userId: number,
  params?: PaginationParams,
): Promise<ApiResponse<PaginatedResponse<TaskSubmissionResponse>>> {
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
  const size = params?.size ?? 9
  const response = await fetch(`${GET_SUBMISSIONS_BY_USER(userId)}${buildPaginationQuery(params)}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  })
  return normalizePaginatedApiResponse(await handleResponse(response), page, size)
}

export async function fetchSubmissionsToReview(
  reviewerId: number,
  params?: PaginationParams,
  status = 'submitted',
): Promise<ApiResponse<PaginatedResponse<TaskSubmissionResponse>>> {
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
  const size = params?.size ?? 9
  const query = buildPaginationQuery(params)
  const endpoint = `${GET_SUBMISSIONS_TO_REVIEW(reviewerId)}${query ? `${query}&status=${encodeURIComponent(status)}` : `?status=${encodeURIComponent(status)}`}`
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: getAuthHeaders(),
  })
  return normalizePaginatedApiResponse(await handleResponse(response), page, size)
}

export async function createSubmission(submission: TaskSubmissionRequest): Promise<ApiResponse<TaskSubmissionResponse>> {
  const response = await fetch(SUBMISSION_ROOT_ENDPOINT, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(submission),
  })
  return handleResponse(response)
}

export async function updateSubmission(submission: TaskSubmissionUpdateRequest): Promise<ApiResponse<TaskSubmissionResponse>> {
  const response = await fetch(UPDATE_SUBMISSION_ENDPOINT, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(submission),
  })
  return handleResponse(response)
}

export async function deleteSubmission(submissionId: number): Promise<ApiResponse<null>> {
  const response = await fetch(DELETE_SUBMISSION_ENDPOINT, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    body: JSON.stringify({ id: submissionId }),
  })
  return handleResponse(response)
}
