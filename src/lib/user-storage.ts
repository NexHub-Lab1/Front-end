import type { ApiResponse, ProjectResponse } from "../types/app";
import { readStoredAuthUser } from "./auth-storage";

export const PROJECT_ROOT_ENDPOINT = '/api/projects'
export const GET_PROJECTS_ENDPOINT = (user_id: Number) => PROJECT_ROOT_ENDPOINT + '/owner/' + String(user_id)

export function getCurrentUserData() {
  return readStoredAuthUser()
}

export async function getProjectsFromCurrentUser() {
    const data = getCurrentUserData()
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