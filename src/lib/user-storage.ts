import type { ApiResponse, ProjectForm, ProjectResponse } from "../types/app";
import { readStoredAuthUser } from "./auth-storage";

export const PROJECT_ROOT_ENDPOINT = '/api/projects'
export const GET_PROJECTS_ENDPOINT = (user_id: Number) => PROJECT_ROOT_ENDPOINT + '/owner/' + String(user_id)

export function getCurrentUserAuthData() {
  return readStoredAuthUser()
}

export async function getProjectsFromCurrentUser() {
    const data = getCurrentUserAuthData()
    if (!data) return []

    const endpoint = GET_PROJECTS_ENDPOINT(data.user.id)

    const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${data.token}`,
            'Content-Type': 'application/json'
        }
    })

    const result = await response.json() as ApiResponse<ProjectResponse[]>
    return result.data
}

export async function getProjectById(projectId: number): Promise<ProjectResponse | null> {
    const userData = getCurrentUserAuthData()
    if (!userData) return null

    const response = await fetch(`${PROJECT_ROOT_ENDPOINT}/${projectId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${userData.token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) return null

    const result = await response.json() as ApiResponse<ProjectResponse>
    return result.data
}

export async function createProject(p: ProjectForm): Promise<ProjectResponse | null> {
    const userData = getCurrentUserAuthData()
    if (!userData) return null

    p.ownerId = userData.user.id

    const response = await fetch(PROJECT_ROOT_ENDPOINT, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userData.token}`
      },
      body: JSON.stringify(p)
    })

    if (!response.ok) return null
    const result = (await response.json()) as ApiResponse<ProjectResponse>
    return result.data
}

export async function signOutCurrentUser() {
    return await fetch('/api/auth/signout', { method: 'POST' })
}
