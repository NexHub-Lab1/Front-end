import type { ApiResponse, GithubRepository } from '../types/app'
import { readStoredUserToken } from './auth-storage'

const GITHUB_REPOS_ENDPOINT = '/api/github/repos'

function getAuthHeaders(): HeadersInit {
  const token = readStoredUserToken()
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }
}

export async function fetchGithubRepositories(): Promise<ApiResponse<GithubRepository[]>> {
  const response = await fetch(GITHUB_REPOS_ENDPOINT, {
    method: 'GET',
    headers: getAuthHeaders(),
  })

  return response.json()
}
