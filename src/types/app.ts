export type AuthMode = 'login' | 'signup'

export type AuthUser = {
  user: User
  token: string
}
export type User = {
  id: number
  username: string
  email: string
}
export type ApiResponse<T> = {
  status: 'success' | 'error'
  message: string
  data: T | null
  timestamp: string
}

export type PaginatedResponse<T> = {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
  hasNext: boolean
  hasPrevious: boolean
}

export type PaginationParams = {
  page?: number
  size?: number
  sort?: string[]
}

export type AppRoute = '/' | '/auth/login' | '/auth/signup' | '/profile' | '/projects'

export type ProjectResponse = {
  id: number,
  ownerId: number,
  ownerUsername: String,
  name: String,
  description: String,
  githubRepo: String,
  status: String,
  createdAt: Date,
  updatedAt: Date,
  lastActiveAt: Date,
  completedTasksCount: number,
  starsCount: number,
  contributorCount: number,
  tags: String[]
}

export type ProjectForm = {
  ownerId: number,
  name: string,
  description: string,
  githubRepo: string,
  status: string,
  tags: string[]
}

export type ProjectUpdateForm = {
  id: number
  name: string
  description: string
  githubRepo: string
  status: string
  tags: string[]
}

export type ProjectCard = {
  name: string
  description: string
  tags: string[]
  stars: number
  followers: number
}

export type BountyCard = {
  title: string
  project: string
  reward: string
  meta: string
}

export type DeveloperCard = {
  name: string
  handle: string
  followers: number
  score: string
  rank: string
}

export type TaskRequest = {
  projectId: number,
  title: string,
  description: string,
  deliverables: string,
  rewardAmount: number,
  rewardCurrency: string,
  deadline: Date,
  status: string,
  maxAttempts: number,
  recommendedSkills: string[]
}

export type TaskResponse = {
  id: number,
  projectId: number,
  projectName: string,
  title: string,
  description: string,
  deliverables: string,
  rewardAmount: number,
  rewardCurrency: string,
  deadline: Date,
  status: string,
  maxAttempts: number,
  createdAt: Date,
  updatedAt: Date,
  recommendedSkills: string[]
}

export type TaskAssignmentRequest = {
  taskId: number
  userId: number
}

export type TaskAssignmentResponse = {
  id: number,
  taskId: number,
  taskTitle: string,
  projectId: number,
  projectName: string,
  userId: number,
  username: string,
  assignedAt: Date,
  status: string,
  attemptsUsed: number
}

export type TaskAssignmentUpdateRequest = {
  id: number
  status: string
  attemptsUsed: number
}

export type TaskSubmissionRequest = {
  assignmentId: number
  pullRequestUrl: string
}

export type TaskSubmissionResponse = {
  id: number
  taskId: number
  taskTitle: string
  assignmentId: number
  projectId: number
  projectName: string,
  userId: number,
  username: string,
  pullRequestUrl: string,
  submittedAt: Date,
  status: string,
  reviewComments: string,
  reviewedAt: Date,
  reviewerId: number,
  reviewerUsername: string,
  attemptsUsed: number
}

export type TaskSubmissionUpdateRequest = {
  id: number
  pullRequestUrl: string
  status: string
  reviewComments: string
  reviewerId: number
}
