import type { ApiResponse, User, UserDetailsResponse } from '../types/app'
import { readStoredUserToken, handleForbiddenResponse } from './auth-storage'

export const USER_ROOT_ENDPOINT = '/api/users'
export const GET_USER_DETAILS = (id:number) => `${USER_ROOT_ENDPOINT}/details/${id}`
export const GET_TOP_DEVS = `${USER_ROOT_ENDPOINT}/all_users_details`

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

export async function getUserDetails(userId: number): Promise<ApiResponse<UserDetailsResponse>> {
  const response = await fetch(GET_USER_DETAILS(userId), {
    method: 'GET',
    headers: getAuthHeaders(),
  })
  return handleResponse(response)
}

export async function fetchUserById(userId: number): Promise<ApiResponse<User>> {
  const response = await fetch(`${USER_ROOT_ENDPOINT}/${userId}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  })
  return handleResponse(response)
}

export async function fetchAllUsers(): Promise<ApiResponse<User[]>> {
  const response = await fetch(USER_ROOT_ENDPOINT, {
    method: 'GET',
    headers: getAuthHeaders(),
  })
  return handleResponse(response)
}

export async function updateUser(user: User): Promise<ApiResponse<User>> {
  const response = await fetch(`${USER_ROOT_ENDPOINT}/${user.id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(user),
  })
  return handleResponse(response)
}

export async function fetchAllUserDetails(): Promise<ApiResponse<UserDetailsResponse[]>> {
  const response = await fetch(GET_TOP_DEVS, {
    method: 'GET',
    headers: getAuthHeaders(),
  })
  console.log('fetchAllUserDetails response:', response)
  return handleResponse(response)
}