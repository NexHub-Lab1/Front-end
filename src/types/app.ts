export type AuthMode = 'login' | 'signup'

export type UserDetailsResponse = {
  id: number
  username: string
  email: string
  bio: string
  skills: string[]
  streakDay: number
  image_url: string
  last_active_at: Date
  created_at: Date
  reputationScore: number
  totalPoints: number
  githubUsername?: string | null
  figmaUsername?: string | null
}

export type AuthUser = {
  user: User
  token: string
}
export type User = {
  id: number
  username: string
  email: string
  githubId?: number | null
  githubUsername?: string | null
  figmaId?: string | null
  figmaUsername?: string | null
  profileImageUrl?: string | null
  skills?: string[]
  emailNotificationsEnabled?: boolean
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
  search?: string
  status?: string
  taskType?: TaskType
  userId?: number
}

export type AppRoute = '/' | '/auth/login' | '/auth/signup' | '/profile' | '/projects'

export type GithubRepository = {
  id: number
  name: string
  fullName: string
  description: string | null
  htmlUrl: string
  isPrivate: boolean
}

export type ProjectResponse = {
  id: number,
  ownerId: number,
  ownerUsername: string,
  name: string,
  description: string,
  githubRepo?: string | null,
  status: string,
  createdAt: Date,
  updatedAt: Date,
  lastActiveAt: Date,
  completedTasksCount: number,
  starsCount: number,
  contributorCount: number,
  tags: string[],
  githubWebhookStatus?: string | null,
  githubWebhookLastError?: string | null,
  githubWebhookConnectedAt?: Date | string | null,
  githubWebhookLastDeliveryAt?: Date | string | null,
  figmaFileUrl?: string | null,
  figmaFileKey?: string | null,
  figmaThumbnailUrl?: string | null
}

export type ProjectForm = {
  ownerId: number,
  name: string,
  description: string,
  githubRepo?: string | null,
  figmaFileUrl?: string | null,
  status: string,
  tags: string[]
}

export type ProjectUpdateForm = {
  id: number
  name: string
  description: string
  githubRepo?: string | null
  figmaFileUrl?: string | null
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

export type TaskType = 'DEVELOPMENT' | 'DESIGN'

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
  minReputation?: number,
  collaborative: boolean,
  recommendedSkills: string[],
  taskType: TaskType
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
  fundingStatus?: string | null,
  maxAttempts: number,
  minReputation: number,
  collaborative: boolean,
  createdAt: Date,
  updatedAt: Date,
  recommendedSkills: string[],
  taskType: TaskType
  githubIssueId?: number | null,
  githubIssueNumber?: number | null,
  githubIssueUrl?: string | null,
  githubIssueState?: string | null,
  githubIssueSyncStatus?: string | null,
  githubIssueLastError?: string | null,
  githubIssueLastSyncedAt?: Date | string | null
}

export type FeaturedTaskResponse = {
  task: TaskResponse
  recommendationScore: number
  recommendationReasons: string[]
  matchedSkills: string[]
  eligible: boolean
}

export type PaymentResponse = {
  id: number
  taskId: number
  taskTitle: string
  payerId: number
  payerUsername: string
  amount: number
  currency: string
  provider: string
  providerPreferenceId: string | null
  providerPaymentId: string | null
  checkoutUrl: string | null
  status: string
  failureReason: string | null
  createdAt: Date
  updatedAt: Date
  approvedAt: Date | null
  failedAt: Date | null
  releasedAt: Date | null
  refundedAt: Date | null
}

export type BalanceResponse = {
  userId: number
  username: string
  availableBalance: number
  escrowBalance: number
}

export type WalletTransactionResponse = {
  id: number
  userId: number
  username: string
  paymentId: number
  taskId: number
  taskTitle: string
  type: string
  amount: number
  currency: string
  availableBalanceAfter: number
  escrowBalanceAfter: number
  description: string | null
  createdAt: Date
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
  attemptsUsed: number,
  parentAssignmentId?: number | null
}

export type TaskAssignmentUpdateRequest = {
  id: number
  status: string
  attemptsUsed: number
}

export type TaskInvitationRequest = {
  taskId: number
  receiverId: number
}

export type TaskInvitationResponse = {
  id: number
  taskId: number
  taskTitle: string
  projectId: number
  projectName: string
  senderId: number
  senderUsername: string
  receiverId: number
  receiverUsername: string
  status: string
  createdAt: string
}

export type TaskSubmissionRequest = {
  assignmentId: number
  pullRequestUrl?: string
  designUrl?: string
  description?: string
  demoUrl?: string
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
  pullRequestUrl?: string,
  designUrl?: string,
  description?: string,
  demoUrl?: string,
  submittedAt: Date,
  status: string,
  reviewComments: string,
  reviewedAt: Date,
  reviewerId: number,
  reviewerUsername: string,
  attemptsUsed: number
  githubReviewState?: string | null
  githubReviewAuthor?: string | null
  githubReviewUrl?: string | null
  githubReviewUpdatedAt?: Date | string | null
}

export type GithubPullRequestCommentResponse = {
  id: number
  submissionId: number
  taskId: number
  pullRequestUrl: string
  eventType: 'issue_comment' | 'pull_request_review' | 'pull_request_review_comment'
  authorUsername: string | null
  authorAvatarUrl: string | null
  body: string
  githubUrl: string
  createdAt: Date | string | null
  updatedAt: Date | string | null
}

export type TaskSubmissionUpdateRequest = {
  id: number
  pullRequestUrl?: string
  designUrl?: string
  status: string
  reviewComments: string
  reviewerId: number
  rejectionReason?: 'SPAM_OR_LOW_EFFORT' | 'BUGS_OR_INCOMPLETE'
}

export type ProjectLookupDTO = {
  id: number
  name: string
}

export type UserStatsDTO = {
  totalPoints: number
  reputationScore: number
  streakDay: number
}

export type ProfileDashboardDTO = {
  userDetails: UserDetailsResponse
  projectLookups: ProjectLookupDTO[]
  stats: UserStatsDTO
  projects: PaginatedResponse<ProjectResponse>
  tasks: PaginatedResponse<TaskResponse>
  assignments: PaginatedResponse<TaskAssignmentResponse>
  submissions: PaginatedResponse<TaskSubmissionResponse>
  toReview: PaginatedResponse<TaskSubmissionResponse>
}

export type Notification = {
  id: number
  message: string
  type: 'INFO' | 'SUCCESS' | 'WARNING'
  read: boolean
  createdAt: string
  targetPath: string | null
}
