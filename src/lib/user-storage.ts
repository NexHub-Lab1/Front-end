import type { ApiResponse, User, UserDetailsResponse } from '../types/app'
import { readStoredUserToken, handleForbiddenResponse } from './auth-storage'

export const USER_ROOT_ENDPOINT = '/api/users'
export const GET_USER_DETAILS = (id:number) => `${USER_ROOT_ENDPOINT}/details/${id}`
export const GET_TOP_DEVS = `${USER_ROOT_ENDPOINT}/all_users_details`
export const FOLLOW_USER = `${USER_ROOT_ENDPOINT}/follow`
export const UNFOLLOW_USER =  `${USER_ROOT_ENDPOINT}/unfollow`
export const GET_FOLLOWED = (id:number) => `${USER_ROOT_ENDPOINT}/followed/${id}`
export const GET_FOLLOWERS = (id:number) => `${USER_ROOT_ENDPOINT}/followers/${id}`

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
  return handleResponse(response)
}

export async function followUser(from: number, to: number): Promise<ApiResponse<UserDetailsResponse>> {
  const response = await fetch(FOLLOW_USER, {
    method: 'POST',
    body: JSON.stringify({ 
      from, to
    }),
    headers: getAuthHeaders(),
  })
  return handleResponse(response)
}

export async function unfollowUser(from: number, to: number): Promise<ApiResponse<UserDetailsResponse>> {
  const response = await fetch(UNFOLLOW_USER, {
    method: 'POST',
    body: JSON.stringify({ 
      from, to
    }),
    headers: getAuthHeaders(),
  })
  return handleResponse(response)
}

export async function getFollowedUsers(userId: number): Promise<ApiResponse<UserDetailsResponse[]>> {
  const response = await fetch(GET_FOLLOWED(userId), {
    method: 'GET',
    headers: getAuthHeaders(),
  })
  return handleResponse(response)
}

export async function getFollowers(userId: number): Promise<ApiResponse<UserDetailsResponse[]>> {
  const response = await fetch(GET_FOLLOWERS(userId), {
    method: 'GET',
    headers: getAuthHeaders(),
  })
  return handleResponse(response)
}
