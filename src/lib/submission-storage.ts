import type { ApiResponse, TaskSubmissionResponse, TaskSubmissionRequest, TaskSubmissionUpdateRequest } from '../types/app'
import { readStoredUserToken, handleForbiddenResponse } from './auth-storage'

const SUBMISSION_ROOT_ENDPOINT = '/api/task-submissions'
export const GET_SUBMISSION_BY_ID = (id: number) => SUBMISSION_ROOT_ENDPOINT + `/${id}`
export const GET_SUBMISSIONS_BY_TASK = (taskId: number) => SUBMISSION_ROOT_ENDPOINT + `/task/${taskId}`
export const GET_SUBMISSIONS_BY_ASSIGNMENT = (assignmentId: number) => SUBMISSION_ROOT_ENDPOINT + `/assignment/${assignmentId}`
export const GET_SUBMISSIONS_BY_USER = (userId: number) => SUBMISSION_ROOT_ENDPOINT + `/user/${userId}`
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

export async function fetchSubmissionsByTask(taskId: number): Promise<ApiResponse<TaskSubmissionResponse[]>> {
  const response = await fetch(GET_SUBMISSIONS_BY_TASK(taskId), {
    method: 'GET',
    headers: getAuthHeaders(),
  })
  return handleResponse(response)
}

export async function fetchSubmissionsByAssignment(assignmentId: number): Promise<ApiResponse<TaskSubmissionResponse[]>> {
  const response = await fetch(GET_SUBMISSIONS_BY_ASSIGNMENT(assignmentId), {
    method: 'GET',
    headers: getAuthHeaders(),
  })
  return handleResponse(response)
}

export async function fetchSubmissionsByUser(userId: number): Promise<ApiResponse<TaskSubmissionResponse[]>> {
  const response = await fetch(GET_SUBMISSIONS_BY_USER(userId), {
    method: 'GET',
    headers: getAuthHeaders(),
  })
  return handleResponse(response)
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