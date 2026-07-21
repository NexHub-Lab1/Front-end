import type { ApiResponse, GithubPullRequestCommentResponse } from '../types/app'
import { readStoredUserToken } from './auth-storage'

export async function fetchGithubTaskActivity(
  taskId: number,
): Promise<ApiResponse<GithubPullRequestCommentResponse[]>> {
  const token = readStoredUserToken()
  if (!token) {
    return {
      status: 'error',
      message: 'No authentication token',
      data: null,
      timestamp: new Date().toISOString(),
    }
  }

  const response = await fetch(`/api/github/activity/task/${taskId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  })
  return response.json()
}
