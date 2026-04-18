import type { ApiResponse, ProjectResponse } from "../types/app";
import { getCurrentUserAuthData } from "./user-storage";
import { handleForbiddenResponse } from "./auth-storage";

export async function getAllProjects() : Promise<ProjectResponse[] | null> {
    const user = getCurrentUserAuthData()
    if (!user) return null
    
    return fetch('/api/projects', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json'
        }
    })
    .then(res => {
        if (res.status === 403) {
            handleForbiddenResponse()
            return null
        }
        return res.json() as Promise<ApiResponse<ProjectResponse[]>>
    })
    .then(res => res ? (res.data ? 
        res.data.map(p => ({ ...p, updatedAt: new Date(p.updatedAt), createdAt: new Date(p.createdAt) }))
        : null) : null
    )
    .catch(() => null)
}