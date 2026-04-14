export type AuthMode = 'login' | 'signup'

export type AuthUser = {
  id: number
  username: string
  email: string
}

export type ProfileDetails = {
  displayName: string
  username: string
  bio: string
  primaryRole: string
  experienceLevel: string
  skills: string[]
  location: string
  website: string
  githubUsername: string
}

export type ProjectSummary = {
  id: number
  ownerId: number | null
  ownerUsername: string | null
  name: string
  description: string
  githubRepo: string
  status: string
  createdAt: string
  updatedAt: string
  lastActiveAt: string
  completedTasksCount: number
  starsCount: number
  contributorCount: number
  tags: string[]
}

export type ApiResponse<T> = {
  status: 'success' | 'error'
  message: string
  data: T | null
  timestamp: string
}

export type AppRoute = '/' | '/auth/login' | '/auth/signup' | '/profile' | '/projects'

export type ProjectCard = {
  id: number
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
