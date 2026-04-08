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
