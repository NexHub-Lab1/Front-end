import type { ApiResponse, ProjectResponse } from "../types/app";
import { getCurrentUserAuthData } from "./user-storage";

export async function getAllProjects() : Promise<ProjectResponse[] | null> {
    const user = getCurrentUserAuthData()
    if (!user) return null
    
    return fetch('/api/projects', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json'
        }
    }).then(res => res.json() as Promise<ApiResponse<ProjectResponse[]>>)
    .then(res => res.data)
    .catch(_ => null)
}