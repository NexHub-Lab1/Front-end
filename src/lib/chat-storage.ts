import type { ApiResponse, PaginatedResponse, TaskAssignmentResponse } from '../types/app'
import { readStoredUserToken } from './auth-storage'

export type ChatMessageResponse = {
  id: number
  assignmentId: number
  senderId: number
  senderUsername: string
  content: string
  createdAt: string
}

function getHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${readStoredUserToken()}`
  }
}

export async function fetchChatHistory(assignmentId: number): Promise<ApiResponse<ChatMessageResponse[]>> {
  const res = await fetch(`/api/chat/${assignmentId}`, {
    headers: getHeaders()
  })
  return res.json()
}

export async function sendChatMessage(assignmentId: number, content: string): Promise<ApiResponse<ChatMessageResponse>> {
  const res = await fetch(`/api/chat`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ assignmentId, content })
  })
  return res.json()
}

export async function fetchTaskAssignments(taskId: number): Promise<ApiResponse<PaginatedResponse<TaskAssignmentResponse>>> {
  const res = await fetch(`/api/task-assignments/task/${taskId}?size=100`, {
    headers: getHeaders()
  })
  return res.json()
}
