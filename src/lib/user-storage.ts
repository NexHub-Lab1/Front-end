import type { ApiResponse, ProjectCard, ProjectResponse } from "../types/app";
import { readStoredUser } from "./auth-storage";

export const PROJECT_ROOT_ENDPOINT = '/api/projects'
export const GET_PROJECTS_ENDPOINT = (user_id: Number) => PROJECT_ROOT_ENDPOINT + '/owner/' + String(user_id)

export function getCurrentUser() {
  return readStoredUser()
}

export async function getProjectsFromCurrentUser() {
    const user = getCurrentUser()
    if (!user) return []

    const endpoint = GET_PROJECTS_ENDPOINT(user.id)

    const response = await fetch(endpoint, {
        method: 'GET'
    })
    const data = await response.json() as ApiResponse<ProjectResponse[]>
    return data.data
}