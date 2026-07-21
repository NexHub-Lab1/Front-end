import { ArrowLeft, CreditCard, ExternalLink, RefreshCw, Send, UserPlus, Check, X, Loader2, Pencil, GitPullRequest, MessageSquare } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

import { AppHeader } from '../components/app/app-header'
import { TaskTypeBadge } from '../components/app/task-type-badge'
import type { PaymentResponse, TaskResponse, User, TaskAssignmentResponse, TaskSubmissionRequest, TaskSubmissionResponse, TaskRequest, TaskType, TaskInvitationResponse, GithubPullRequestCommentResponse } from '../types/app'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardBody, CardDescription, CardTitle } from '../components/ui/card'
import Modal from '../components/ui/modal'
import { Input } from '../components/ui/input'
import { fetchProjectById } from '../lib/project-storage'
import { fetchTaskById, retryGithubIssueSync, updateTask } from '../lib/task-storage'
import { createSubmission, fetchSubmissionsByTask, fetchSubmissionsByAssignment, updateSubmission } from '../lib/submission-storage'
import { fetchAssignmentsByUser, createAssignment } from '../lib/assignment-storage'
import { createInvitation, fetchInvitationsByTask } from '../lib/task-invitation-storage'
import { fetchAllUserDetails } from '../lib/user-storage'
import { LOOKUP_PAGE_SIZE } from '../lib/pagination'
import { fetchTaskPayments, fundTask, syncTaskPayments } from '../lib/payment-storage'
import { formatMoney, fundingBadgeClassName, isTaskFunded, normalizeFundingStatus } from '../lib/payment-utils'
import { fetchTaskAssignments } from '../lib/chat-storage'
import { TaskChatPanel } from '../components/app/task-chat-panel'
import { readStoredProfileDashboard } from '../lib/dashboard-storage'
import { fetchGithubTaskActivity } from '../lib/github-activity-storage'
import { isFigmaFileUrl } from '../lib/figma-url'

export function TaskDetailPage({
  currentUser,
  onSignOut,
  onOpenMenu,
}: {
  currentUser: User | null
  onSignOut: () => void
  onOpenMenu: () => void
}) {
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams()
  const [task, setTask] = useState<TaskResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOwner, setIsOwner] = useState(false)
  const [userAssignment, setUserAssignment] = useState<TaskAssignmentResponse | null>(null)
  const [anyAssignment, setAnyAssignment] = useState<TaskAssignmentResponse | null>(null)
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [prUrl, setPrUrl] = useState('')
  const [description, setDescription] = useState('')
  const [demoUrl, setDemoUrl] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isAssigning, setIsAssigning] = useState(false)
  const [assignError, setAssignError] = useState<string | null>(null)
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [taskPayments, setTaskPayments] = useState<PaymentResponse[]>([])
  const [isPaymentActionLoading, setIsPaymentActionLoading] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [paymentNotice, setPaymentNotice] = useState<{ type: 'info' | 'success'; message: string } | null>(null)
  const autoSyncedPaymentRef = useRef<string | null>(null)
  const [projectOwnerUsername, setProjectOwnerUsername] = useState<string | null>(null)
  const [projectOwnerId, setProjectOwnerId] = useState<number | null>(null)
  const [assignments, setAssignments] = useState<TaskAssignmentResponse[]>([])
  const [selectedAssignment, setSelectedAssignment] = useState<TaskAssignmentResponse | null>(null)
  const [submissions, setSubmissions] = useState<TaskSubmissionResponse[]>([])
  const [githubActivity, setGithubActivity] = useState<GithubPullRequestCommentResponse[]>([])
  const [isGithubActivityLoading, setIsGithubActivityLoading] = useState(false)
  const [githubActivityError, setGithubActivityError] = useState<string | null>(null)

  // State for fast proposal review
  const [selectedSubmission, setSelectedSubmission] = useState<TaskSubmissionResponse | null>(null)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [reviewComments, setReviewComments] = useState('')
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)
  const [reviewError, setReviewError] = useState<string | null>(null)
  const [isRejecting, setIsRejecting] = useState(false)
  const [selectedDeveloperFilter, setSelectedDeveloperFilter] = useState<string | null>(null)

  // State for task collaboration & invitation
  const [invitations, setInvitations] = useState<TaskInvitationResponse[]>([])
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteReceiverId, setInviteReceiverId] = useState<number | null>(null)
  const [isInviting, setIsInviting] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [inviteSearchQuery, setInviteSearchQuery] = useState('')

  // State for task editing
  const [showEditModal, setShowEditModal] = useState(false)
  const [editTaskForm, setEditTaskForm] = useState<TaskRequest>({
    projectId: 0,
    title: '',
    description: '',
    deliverables: '',
    rewardAmount: 0,
    rewardCurrency: 'ARS',
    deadline: new Date(),
    status: 'OPEN',
    maxAttempts: 3,
    minReputation: 0,
    collaborative: false,
    recommendedSkills: [],
    taskType: 'DEVELOPMENT',
  })
  const [editSkillsInput, setEditSkillsInput] = useState('')
  const [editErrors, setEditErrors] = useState<{
    title?: string
    description?: string
    deliverables?: string
    rewardAmount?: string
  }>({})
  const [editFeedback, setEditFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [isUpdatingTask, setIsUpdatingTask] = useState(false)
  const [isGithubIssueSyncing, setIsGithubIssueSyncing] = useState(false)
  const [allowAnyReputation, setAllowAnyReputation] = useState(true)
  const [rejectionReason, setRejectionReason] = useState<'BUGS_OR_INCOMPLETE' | 'SPAM_OR_LOW_EFFORT'>('BUGS_OR_INCOMPLETE')


  const getDeadlineString = (dateVal: Date | string | undefined): string => {
    if (!dateVal) return ''
    const d = new Date(dateVal)
    if (isNaN(d.getTime())) return ''
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const validateEditTaskForm = () => {
    const nextErrors: typeof editErrors = {}

    if (!editTaskForm.title.trim()) {
      nextErrors.title = 'Task title is required.'
    }

    if (!editTaskForm.description.trim()) {
      nextErrors.description = 'Description is required.'
    }

    if (!editTaskForm.deliverables.trim()) {
      nextErrors.deliverables = 'Deliverables are required.'
    }

    if (editTaskForm.rewardAmount <= 0) {
      nextErrors.rewardAmount = 'Reward amount must be greater than 0.'
    }

    setEditErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const updateEditTaskError = (field: keyof typeof editErrors, value: string | number) => {
    setEditErrors((current) => {
      if (!current[field]) {
        return current
      }

      let errorVal: string | undefined = undefined
      if (field === 'title' && !String(value).trim()) {
        errorVal = 'Task title is required.'
      } else if (field === 'description' && !String(value).trim()) {
        errorVal = 'Description is required.'
      } else if (field === 'deliverables' && !String(value).trim()) {
        errorVal = 'Deliverables are required.'
      } else if (field === 'rewardAmount' && Number(value) <= 0) {
        errorVal = 'Reward amount must be greater than 0.'
      }

      return {
        ...current,
        [field]: errorVal,
      }
    })
  }

  const handleOpenEditModal = () => {
    if (!task) return
    setEditTaskForm({
      projectId: task.projectId,
      title: task.title,
      description: task.description,
      deliverables: task.deliverables,
      rewardAmount: task.rewardAmount,
      rewardCurrency: task.rewardCurrency || 'ARS',
      deadline: task.deadline,
      status: task.status,
      maxAttempts: task.maxAttempts,
      minReputation: task.minReputation,
      collaborative: task.collaborative,
      recommendedSkills: task.recommendedSkills || [],
      taskType: task.taskType || 'DEVELOPMENT',
    })
    setEditSkillsInput((task.recommendedSkills || []).join(', '))
    setAllowAnyReputation(!task.minReputation || task.minReputation <= -500)
    setEditErrors({})
    setEditFeedback(null)
    setShowEditModal(true)
  }

  const handleRetryGithubIssueSync = async () => {
    if (!task || !isOwner) return
    setIsGithubIssueSyncing(true)
    setActionFeedback(null)
    try {
      const response = await retryGithubIssueSync(task.id)
      if (response.status === 'success' && response.data) {
        setTask(response.data)
        setActionFeedback({
          type: response.data.githubIssueSyncStatus === 'failed' ? 'error' : 'success',
          message: response.data.githubIssueSyncStatus === 'failed'
            ? response.data.githubIssueLastError || 'GitHub issue synchronization failed.'
            : 'GitHub issue synchronized successfully.',
        })
      } else {
        setActionFeedback({ type: 'error', message: response.message || 'GitHub issue synchronization failed.' })
      }
    } catch (syncError) {
      setActionFeedback({
        type: 'error',
        message: syncError instanceof Error ? syncError.message : 'GitHub issue synchronization failed.',
      })
    } finally {
      setIsGithubIssueSyncing(false)
    }
  }

  const handleEditTaskSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!validateEditTaskForm() || !task) {
      setEditFeedback(null)
      return
    }

    setIsUpdatingTask(true)
    setEditFeedback(null)

    const updatedData = {
      ...editTaskForm,
      minReputation: allowAnyReputation ? -500 : (editTaskForm.minReputation || 0),
      recommendedSkills: editSkillsInput
        .split(',')
        .map((skill) => skill.trim())
        .filter(Boolean),
    }

    try {
      const res = await updateTask({
        ...updatedData,
        id: task.id,
      })

      if (res.status === 'error' || !res.data) {
        setEditFeedback({ message: res.message || 'Error updating task', type: 'error' })
        return
      }

      setEditFeedback({ message: 'Task updated successfully', type: 'success' })
      setTask(res.data)
      setShowEditModal(false)
    } catch {
      setEditFeedback({ message: 'Error updating task', type: 'error' })
    } finally {
      setIsUpdatingTask(false)
    }
  }

  const handleOpenReviewModal = (submission: TaskSubmissionResponse) => {
    setSelectedSubmission(submission)
    setReviewComments(submission.reviewComments || '')
    setReviewError(null)
    setRejectionReason('BUGS_OR_INCOMPLETE')
    setIsRejecting(false)
    setShowReviewModal(true)
  }

  const submitReview = async (approved: boolean) => {
    if (!selectedSubmission || !currentUser || !task) return

    if (!approved && !reviewComments.trim()) {
      setReviewError('Comments are required when rejecting a submission')
      return
    }

    try {
      setIsSubmittingReview(true)
      setReviewError(null)
      setActionFeedback(null)

      const result = await updateSubmission({
        id: selectedSubmission.id,
        pullRequestUrl: selectedSubmission.pullRequestUrl,
        status: approved ? 'APPROVED' : 'REJECTED',
        reviewComments: reviewComments.trim() || (approved ? 'Approved' : 'Rejected'),
        reviewerId: currentUser.id,
        rejectionReason: approved ? undefined : rejectionReason,
      })

      if (result.status === 'success') {
        setShowReviewModal(false)
        setSelectedSubmission(null)
        setReviewComments('')
        setIsRejecting(false)
        
        // Reload submissions list
        const subsRes = await fetchSubmissionsByTask(task.id, { page: 0, size: 100 })
        if (subsRes.status === 'success' && subsRes.data) {
          setSubmissions(subsRes.data.content)
        }

        setActionFeedback({
          type: 'success',
          message: `Submission ${approved ? 'approved' : 'rejected'} successfully.`,
        })
      } else {
        setReviewError(result.message || 'Failed to submit review')
      }
    } catch (error) {
      setReviewError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsSubmittingReview(false)
    }
  }



  useEffect(() => {
    if (showInviteModal) {
      async function loadUsers() {
        try {
          const res = await fetchAllUserDetails()
          if (res.status === 'success' && res.data) {
            const mappedUsers: User[] = res.data.map(u => ({
              id: u.id,
              username: u.username,
              email: u.email
            }))
            setAllUsers(mappedUsers)
          }
        } catch (e) {
          console.error("Failed to load users for invitation", e)
        }
      }
      void loadUsers()
    }
  }, [showInviteModal])

  const handleSendInvitation = async () => {
    if (!currentUser || !task || !inviteReceiverId) return

    try {
      setIsInviting(true)
      setInviteError(null)
      const res = await createInvitation({
        taskId: task.id,
        receiverId: inviteReceiverId,
      })

      if (res.status === 'success' && res.data) {
        setInvitations((prev) => [...prev, res.data!])
        setShowInviteModal(false)
        setInviteReceiverId(null)
        setActionFeedback({
          type: 'success',
          message: `Invitation sent successfully to ${res.data.receiverUsername}.`,
        })
      } else {
        setInviteError(res.message || 'Failed to send invitation')
      }
    } catch (e) {
      setInviteError(e instanceof Error ? e.message : 'An error occurred')
    } finally {
      setIsInviting(false)
    }
  }

  useEffect(() => {
    async function loadTask() {
      const parsedId = Number(id)

      if (!id || Number.isNaN(parsedId)) {
        setError('Task id is invalid')
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(null)
      setIsOwner(false)
      setUserAssignment(null)
      setAnyAssignment(null)
      setProjectOwnerUsername(null)
      setProjectOwnerId(null)
      setAssignments([])
      setSelectedAssignment(null)
      setSubmissions([])
      setGithubActivity([])
      setGithubActivityError(null)
      setIsGithubActivityLoading(false)
      setInvitations([])
      setTaskPayments([])
      setPaymentError(null)
      setPaymentNotice(null)

      try {
        const response = await fetchTaskById(parsedId)
        if (response.status === 'error' || !response.data) {
          throw new Error(response.message || 'Unable to load task')
        }

        const loadedTask = response.data
        setTask(loadedTask)

        let userIsOwner = false
        const projectRes = await fetchProjectById(loadedTask.projectId)
        if (projectRes.status === 'success' && projectRes.data) {
          setProjectOwnerUsername(projectRes.data.ownerUsername)
          setProjectOwnerId(projectRes.data.ownerId)
          if (currentUser) {
            const ownerStatus = projectRes.data.ownerId === currentUser.id
            setIsOwner(ownerStatus)
            userIsOwner = ownerStatus

            if (ownerStatus) {
              const paymentsResponse = await fetchTaskPayments(loadedTask.id)
              if (paymentsResponse.status === 'success' && paymentsResponse.data) {
                setTaskPayments(paymentsResponse.data)
              } else {
                setPaymentError(paymentsResponse.message || 'Unable to load payment history.')
              }
            }
          }
        }

        if (currentUser) {

          let hasActiveAssignment = false
          let foundAnyAssignment: TaskAssignmentResponse | null = null
          const assignmentsRes = await fetchAssignmentsByUser(currentUser.id, {
            page: 0,
            size: LOOKUP_PAGE_SIZE,
            sort: ['assignedAt,desc'],
          })
          if (assignmentsRes.data) {
            const foundActive = assignmentsRes.data.content.find(
              a => a.taskId === parsedId && a.status.toLowerCase() !== 'completed'
            )
            setUserAssignment(foundActive || null)
            hasActiveAssignment = !!foundActive

            const foundAny = assignmentsRes.data.content.find(
              a => a.taskId === parsedId
            )
            foundAnyAssignment = foundAny || null
            setAnyAssignment(foundAny || null)
          }

          const allAssignmentsRes = await fetchTaskAssignments(parsedId)
          if (allAssignmentsRes.status === 'success' && allAssignmentsRes.data) {
            const content = allAssignmentsRes.data.content || []
            setAssignments(content)
            if (userIsOwner && content.length > 0) {
              setSelectedAssignment(content[0])
            }
          }

          if (userIsOwner || hasActiveAssignment) {
            // Fetch task invitations
            const invitesRes = await fetchInvitationsByTask(parsedId)
            if (invitesRes.status === 'success' && invitesRes.data) {
              setInvitations(invitesRes.data)
            }
          }

          if (userIsOwner) {
            const subsRes = await fetchSubmissionsByTask(parsedId, { page: 0, size: 100 })
            if (subsRes.status === 'success' && subsRes.data) {
              setSubmissions(subsRes.data.content)
            }
          } else if (foundAnyAssignment) {
            const subsRes = await fetchSubmissionsByAssignment(foundAnyAssignment.id, { page: 0, size: 100 })
            if (subsRes.status === 'success' && subsRes.data) {
              setSubmissions(subsRes.data.content)
            }
          }

          if (userIsOwner || foundAnyAssignment) {
            setIsGithubActivityLoading(true)
            try {
              const activityRes = await fetchGithubTaskActivity(parsedId)
              if (activityRes.status === 'success' && activityRes.data) {
                setGithubActivity(activityRes.data)
              } else {
                setGithubActivityError(activityRes.message || 'Unable to load GitHub activity.')
              }
            } catch {
              setGithubActivityError('Unable to load GitHub activity.')
            } finally {
              setIsGithubActivityLoading(false)
            }
          }

        }
      } catch (fetchError) {
        setTask(null)
        setError(fetchError instanceof Error ? fetchError.message : 'Unable to load task')
      } finally {
        setIsLoading(false)
      }
    }

    void loadTask()
  }, [id, currentUser])

  const handleAssignTask = async () => {
    if (!currentUser || !task) {
      return
    }

    if (isOwner) {
      setAssignError('Task owners cannot be assigned to their own tasks')
      return
    }

    try {
      setIsAssigning(true)
      setAssignError(null)
      setActionFeedback(null)

      const result = await createAssignment({
        taskId: task.id,
        userId: currentUser.id,
      })

      if (result.status === 'success' && result.data) {
        setUserAssignment(result.data)
        setAnyAssignment(result.data)
        setActionFeedback({
          type: 'success',
          message: 'Task assigned successfully. You can now submit your pull request.',
        })
      } else {
        setAssignError(result.message || 'Failed to assign task')
        setActionFeedback({ type: 'error', message: result.message || 'Failed to assign task' })
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred'
      setAssignError(message)
      setActionFeedback({ type: 'error', message })
    } finally {
      setIsAssigning(false)
    }
  }

  const handleSubmit = async () => {
    const isDevelopment = task?.taskType === 'DEVELOPMENT' || !task?.taskType;
    let urlError = undefined;

    if (isDevelopment) {
      urlError = validatePullRequestUrl(prUrl);
    } else {
      urlError = validateDesignUrl(prUrl);
    }

    if (urlError) {
      setSubmitError(urlError)
      return
    }

    if (!userAssignment) {
      setSubmitError('You must be assigned to this task before submitting')
      return
    }

    try {
      setIsSubmitting(true)
      setSubmitError(null)
      setActionFeedback(null)

      const submissionPayload: TaskSubmissionRequest = {
        assignmentId: userAssignment.id,
        description: description.trim() || undefined,
        demoUrl: demoUrl.trim() || undefined,
      };

      if (isDevelopment) {
        submissionPayload.pullRequestUrl = prUrl;
      } else {
        submissionPayload.designUrl = prUrl;
      }

      const result = await createSubmission(submissionPayload)

      if (result.status === 'success') {
        setShowSubmitModal(false)
        setPrUrl('')
        setDescription('')
        setDemoUrl('')
        setActionFeedback({
          type: 'success',
          message: 'Submission created successfully. The project owner can now review it.',
        })
        
        // Reload assignments to update status
        if (currentUser) {
          const assignmentsRes = await fetchAssignmentsByUser(currentUser.id, {
            page: 0,
            size: LOOKUP_PAGE_SIZE,
            sort: ['assignedAt,desc'],
          })
          if (assignmentsRes.data) {
            const updatedAssignment = assignmentsRes.data.content.find(
              a => a.taskId === task?.id && a.status.toLowerCase() !== 'completed'
            )
            setUserAssignment(updatedAssignment || null)

            const targetAssignmentId = updatedAssignment?.id || userAssignment.id
            const subsRes = await fetchSubmissionsByAssignment(targetAssignmentId, { page: 0, size: 100 })
            if (subsRes.status === 'success' && subsRes.data) {
              setSubmissions(subsRes.data.content)
            }
          }
        }
      } else {
        setSubmitError(result.message || 'Failed to create submission')
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFundTask = async () => {
    if (!task) {
      return
    }

    setIsPaymentActionLoading(true)
    setPaymentError(null)
    setActionFeedback(null)

    try {
      const result = await fundTask(task.id)
      if (result.status === 'error' || !result.data) {
        throw new Error(result.message || 'Unable to start funding.')
      }
      if (!result.data.checkoutUrl) {
        throw new Error('Mercado Pago did not return a checkout URL.')
      }

      setTask((currentTask) => currentTask ? { ...currentTask, fundingStatus: 'pending' } : currentTask)
      setTaskPayments((payments) => [result.data!, ...payments])
      window.location.assign(result.data.checkoutUrl)
    } catch (fundingError) {
      setPaymentError(fundingError instanceof Error ? fundingError.message : 'Unable to start funding.')
    } finally {
      setIsPaymentActionLoading(false)
    }
  }

  const handleRefreshPaymentStatus = async () => {
    if (!task || !isOwner) {
      return
    }

    setIsPaymentActionLoading(true)
    setPaymentError(null)

    try {
      const syncResponse = await syncTaskPayments(task.id)
      if (syncResponse.status === 'error' || !syncResponse.data) {
        throw new Error(syncResponse.message || 'Unable to sync payment status.')
      }

      const [taskResponse, paymentsResponse] = await Promise.all([
        fetchTaskById(task.id),
        fetchTaskPayments(task.id),
      ])
      if (taskResponse.status === 'error' || !taskResponse.data) {
        throw new Error(taskResponse.message || 'Unable to refresh task.')
      }
      if (paymentsResponse.status === 'error' || !paymentsResponse.data) {
        throw new Error(paymentsResponse.message || 'Unable to refresh payment history.')
      }

      setTask(taskResponse.data)
      setTaskPayments(paymentsResponse.data)
      const refreshedFundingStatus = normalizeFundingStatus(taskResponse.data.fundingStatus)
      if (refreshedFundingStatus === 'funded') {
        setPaymentNotice({
          type: 'success',
          message: 'Payment confirmed. This task reward is now funded.',
        })
      } else if (refreshedFundingStatus === 'pending') {
        setPaymentNotice({
          type: 'info',
          message: 'Payment status was checked. Mercado Pago has not confirmed funding yet.',
        })
      }
    } catch (refreshError) {
      setPaymentError(refreshError instanceof Error ? refreshError.message : 'Unable to refresh payment.')
    } finally {
      setIsPaymentActionLoading(false)
    }
  }

  const latestPayment = taskPayments[0] ?? null
  const checkoutReturnStatus = new URLSearchParams(location.search).get('payment')
  const returnedFromCheckout = checkoutReturnStatus !== null

  useEffect(() => {
    if (!task || !isOwner || !latestPayment || latestPayment.status.toLowerCase() !== 'pending') {
      return
    }

    const checkoutStatus = new URLSearchParams(location.search).get('payment')
    if (!checkoutStatus) {
      return
    }

    const syncKey = `${task.id}-${latestPayment.id}-${checkoutStatus}`
    if (autoSyncedPaymentRef.current === syncKey) {
      return
    }

    autoSyncedPaymentRef.current = syncKey
    setPaymentNotice({
      type: 'info',
      message: 'Checking Mercado Pago confirmation for this reward...',
    })
    void handleRefreshPaymentStatus()
  }, [isOwner, latestPayment, location.search, task])

  function validatePullRequestUrl(value: string) {
    if (!value.trim()) {
      return 'Please enter a Pull Request URL'
    }

    if (!value.startsWith('http://') && !value.startsWith('https://')) {
      return 'Please enter a valid URL (must start with http:// or https://)'
    }

    return undefined
  }

  function validateDesignUrl(value: string) {
    if (!value.trim()) {
      return 'Please enter a Figma Design URL'
    }

    if (!value.startsWith('http://') && !value.startsWith('https://')) {
      return 'Please enter a valid URL (must start with http:// or https://)'
    }

    if (!isFigmaFileUrl(value)) {
      return 'Please enter a valid Figma URL'
    }

    return undefined
  }

  const dashboard = readStoredProfileDashboard()
  const userReputation = dashboard?.stats?.reputationScore ?? 0
  const isReputationTooLow = currentUser && task && task.minReputation > -500 && userReputation < task.minReputation
  const isDeadlinePassed = task && task.deadline && new Date(task.deadline).getTime() < Date.now()

  const eligibleUsers = allUsers.filter((u) => {
    const assigneesUserIds = new Set(assignments.map((a) => a.userId))
    const invitedUserIds = new Set(invitations.map((i) => i.receiverId))
    return (
      u.id !== currentUser?.id &&
      u.id !== projectOwnerId &&
      !assigneesUserIds.has(u.id) &&
      !invitedUserIds.has(u.id)
    )
  })

  const filteredEligibleUsers = eligibleUsers.filter((u) =>
    u.username.toLowerCase().includes(inviteSearchQuery.toLowerCase())
  )

  const getAssignmentButtonContent = () => {
    if (isDeadlinePassed) {
      return {
        text: 'Deadline Passed',
        disabled: true,
        tooltip: 'This task can no longer be claimed because the deadline has passed',
      }
    }

    if (!currentUser) {
      return {
        text: 'Login to assign',
        disabled: true,
        tooltip: 'Please login to assign this task to yourself',
      }
    }

    if (isOwner) {
      return {
        text: 'Assign Task',
        disabled: true,
        tooltip: 'Task owners cannot be assigned to their own tasks',
      }
    }

    if (isReputationTooLow) {
      return {
        text: 'Reputation Too Low',
        disabled: true,
        tooltip: `Your reputation score is too low (${userReputation} Rep). You need at least ${task?.minReputation} Rep to claim this task.`,
      }
    }

    if (userAssignment) {
      return {
        text: 'Already Assigned',
        disabled: true,
        tooltip: `You were assigned on ${new Date(userAssignment.assignedAt).toLocaleDateString()}`,
      }
    }

    if (!isTaskFunded(task?.fundingStatus)) {
      return {
        text: 'Waiting for Funding',
        disabled: true,
        tooltip: 'The project owner must fund this reward before it can be assigned',
      }
    }

    if (task && !task.collaborative) {
      const hasAnyActive = assignments.some(
        (a) => a.status.toLowerCase() === 'active'
      )
      if (hasAnyActive) {
        return {
          text: 'Already Claimed',
          disabled: true,
          tooltip: 'This task has already been claimed by another developer.',
        }
      }
    }

    return {
      text: 'Assign to Me',
      disabled: false,
      tooltip: 'Assign this task to yourself',
    }
  }

  const getSubmitButtonContent = () => {
    if (isDeadlinePassed) {
      return {
        disabled: true,
        tooltip: 'This task can no longer accept submissions because the deadline has passed',
      }
    }

    if (!currentUser) {
      return {
        disabled: true,
        tooltip: 'Login to submit',
      }
    }

    if (isOwner) {
      return {
        disabled: true,
        tooltip: 'Task owners cannot submit',
      }
    }

    if (!isTaskFunded(task?.fundingStatus)) {
      return {
        disabled: true,
        tooltip: 'This reward must be funded before you can submit work',
      }
    }

    if (!userAssignment) {
      return {
        disabled: true,
        tooltip: 'You must be assigned to this task before submitting',
      }
    }

    return {
      disabled: false,
      tooltip: 'Submit your solution',
    }
  }

  const showChat = !!(currentUser && (userAssignment || isOwner))
  const assignmentButton = getAssignmentButtonContent()
  const submitButton = getSubmitButtonContent()
  const fundingStatus = normalizeFundingStatus(task?.fundingStatus)
  const githubReviewedSubmissions = submissions
    .filter((submission) => submission.githubReviewState)
    .sort((first, second) => {
      const firstDate = first.githubReviewUpdatedAt ? new Date(first.githubReviewUpdatedAt).getTime() : 0
      const secondDate = second.githubReviewUpdatedAt ? new Date(second.githubReviewUpdatedAt).getTime() : 0
      return secondDate - firstDate
    })

  const githubReviewBadgeClass = (state: string) => {
    switch (state.toLowerCase()) {
      case 'approved':
        return 'border-emerald-200 bg-emerald-50 text-emerald-700'
      case 'changes_requested':
        return 'border-amber-200 bg-amber-50 text-amber-800'
      case 'dismissed':
        return 'border-slate-200 bg-slate-100 text-slate-600'
      default:
        return 'border-blue-200 bg-blue-50 text-blue-700'
    }
  }

  const githubReviewLabel = (state: string) => {
    return state.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
  }

  const teamLeadId = userAssignment
    ? (userAssignment.parentAssignmentId || userAssignment.id)
    : (isOwner && selectedAssignment)
      ? (selectedAssignment.parentAssignmentId || selectedAssignment.id)
      : null

  const leadAssignment = teamLeadId
    ? assignments.find((ass) => ass.id === teamLeadId)
    : null

  const leadUserId = leadAssignment ? leadAssignment.userId : null

  const teamAssignments = teamLeadId
    ? assignments.filter((ass) => ass.id === teamLeadId || ass.parentAssignmentId === teamLeadId)
    : []

  const teamInvitations = leadUserId
    ? invitations.filter((invite) => invite.senderId === leadUserId)
    : []

  const backTo = typeof location.state === 'object' && location.state !== null && 'backTo' in location.state
    ? String(location.state.backTo)
    : null

  function handleBack() {
    if (backTo) {
      navigate(backTo)
      return
    }

    navigate(-1)
  }

  return (
    <main className="min-h-screen px-4 py-5 sm:px-6 lg:px-8">
      <AppHeader onSignOut={onSignOut} onOpenMenu={onOpenMenu} />

      <section className={`mx-auto mt-6 space-y-2 transition-all duration-300 ${showChat ? 'max-w-7xl' : 'max-w-5xl'}`}>
        <Button variant="ghost" onClick={handleBack} className="w-fit">
          <ArrowLeft size={16} className="mr-2" />
          Back
        </Button>
        {isLoading ? (
          <Card>
            <CardBody className="space-y-3 p-6">
              <CardTitle className="text-3xl">Loading task...</CardTitle>
              <CardDescription>Please wait while we load the task details.</CardDescription>
            </CardBody>
          </Card>
        ) : error ? (
          <Card>
            <CardBody className="space-y-3 p-6">
              <CardTitle className="text-3xl">Task not found</CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardBody>
          </Card>
        ) : task ? (
          <div className={showChat ? "grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6" : "space-y-6"}>
            {/* Left Column (Task details) */}
            <div className="space-y-6">
              <Card className="overflow-hidden">
                <CardBody className="space-y-6 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.14),transparent_35%),linear-gradient(180deg,rgba(255,255,255,1),rgba(248,250,252,1))] p-6">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">{task.status}</Badge>
                        <Badge variant="outline" className={fundingBadgeClassName(task.fundingStatus)}>
                          {fundingStatus}
                        </Badge>
                        <Badge variant="outline">{task.projectName}</Badge>
                        <TaskTypeBadge taskType={task.taskType} />
                        {projectOwnerUsername && projectOwnerId && (
                          <Badge
                            variant="outline"
                            className="cursor-pointer hover:bg-slate-100 transition-colors"
                            onClick={() => navigate(`/user/${projectOwnerId}`)}
                          >
                            by {projectOwnerUsername}
                          </Badge>
                        )}
                        {userAssignment && (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Assigned
                          </Badge>
                        )}
                        {isDeadlinePassed && (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            Overdue
                          </Badge>
                        )}
                      </div>

                      <div className="space-y-2">
                        <CardTitle className="text-4xl">{task.title}</CardTitle>
                        <CardDescription className="max-w-3xl text-base leading-7 text-slate-600">
                          {task.description}
                        </CardDescription>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {task.recommendedSkills.map((skill) => (
                          <Badge key={skill} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2 lg:flex-col">
                      {isOwner ? (
                        <Button
                          variant="primary"
                          size="lg"
                          onClick={handleOpenEditModal}
                        >
                          <Pencil size={16} className="mr-2" />
                          Edit Task
                        </Button>
                      ) : (
                        <>
                          {!userAssignment && (
                            <Button
                              variant="secondary"
                              size="lg"
                              disabled={assignmentButton.disabled || isAssigning}
                              onClick={handleAssignTask}
                              title={assignmentButton.tooltip}
                            >
                              <UserPlus size={16} className="mr-2" />
                              {isAssigning ? 'Assigning...' : assignmentButton.text}
                            </Button>
                          )}
                          <Button
                            variant="primary"
                            size="lg"
                            disabled={submitButton.disabled}
                            onClick={() => setShowSubmitModal(true)}
                            title={submitButton.tooltip}
                          >
                            <Send size={16} className="mr-2" />
                            Submit
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {assignError && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-3">
                      <p className="text-sm text-red-700">{assignError}</p>
                    </div>
                  )}

                  {actionFeedback && (
                    <div
                      className={`rounded-md border p-3 ${
                        actionFeedback.type === 'success'
                          ? 'border-green-200 bg-green-50'
                          : 'border-red-200 bg-red-50'
                      }`}
                    >
                      <p
                        className={`text-sm ${
                          actionFeedback.type === 'success' ? 'text-green-700' : 'text-red-700'
                        }`}
                      >
                        {actionFeedback.message}
                      </p>
                    </div>
                  )}

                  {isOwner && (
                    <div className="space-y-4 rounded-xl border border-blue-100 bg-white/75 p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <CardTitle className="text-xl">Reward funding</CardTitle>
                          <CardDescription className="mt-1">
                            Secure {formatMoney(task.rewardAmount, task.rewardCurrency)} before work begins.
                          </CardDescription>
                        </div>
                        <Badge variant="outline" className={fundingBadgeClassName(task.fundingStatus)}>
                          {fundingStatus}
                        </Badge>
                      </div>

                      {paymentError ? (
                        <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                          {paymentError}
                        </p>
                      ) : null}

                      {paymentNotice ? (
                        <p
                          className={`rounded-md border p-3 text-sm ${
                            paymentNotice.type === 'success'
                              ? 'border-green-200 bg-green-50 text-green-700'
                              : 'border-blue-200 bg-blue-50 text-blue-700'
                          }`}
                        >
                          {paymentNotice.message}
                        </p>
                      ) : null}

                      {latestPayment?.status.toLowerCase() === 'pending' ? (
                        <div className="space-y-3">
                          <CardDescription>
                            {returnedFromCheckout
                              ? 'You returned from Mercado Pago. Funding is enabled when the payment webhook is confirmed.'
                              : 'Your Mercado Pago checkout is waiting for payment confirmation.'}
                          </CardDescription>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              variant="outline"
                              onClick={() => void handleRefreshPaymentStatus()}
                              disabled={isPaymentActionLoading}
                            >
                              <RefreshCw size={16} className="mr-2" />
                              Refresh status
                            </Button>
                            {latestPayment.checkoutUrl ? (
                              <Button variant="primary" asChild>
                                <a href={latestPayment.checkoutUrl}>
                                  <ExternalLink size={16} className="mr-2" />
                                  Continue to Mercado Pago
                                </a>
                              </Button>
                            ) : null}
                          </div>
                        </div>
                      ) : fundingStatus !== 'funded' && fundingStatus !== 'released' ? (
                        <Button
                          variant="primary"
                          onClick={() => void handleFundTask()}
                          disabled={isPaymentActionLoading}
                        >
                          <CreditCard size={16} className="mr-2" />
                          {isPaymentActionLoading ? 'Starting...' : 'Fund task reward'}
                        </Button>
                      ) : (
                        <CardDescription>
                          {fundingStatus === 'released'
                            ? 'The approved reward has been released to the contributor.'
                            : 'This reward is funded and held until a submission is approved.'}
                        </CardDescription>
                      )}
                    </div>
                  )}

                  {userAssignment && (
                    <div className="bg-green-50 border border-green-200 rounded-md p-4">
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-green-900">You are assigned to this task</p>
                        <div className="text-sm text-green-700 space-y-1">
                          <p>Assigned on: {new Date(userAssignment.assignedAt).toLocaleDateString()}</p>
                          <p>Status: {userAssignment.status}</p>
                          <p>Attempts used: {userAssignment.attemptsUsed} / {task.maxAttempts}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardBody>
              </Card>

              {(task.githubIssueUrl || (isOwner && assignments.length > 0 && !task.githubIssueUrl)) && (
                <Card>
                  <CardBody className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <CardTitle className="text-lg">GitHub Issue</CardTitle>
                        {task.githubIssueNumber ? (
                          <Badge variant="outline">#{task.githubIssueNumber}</Badge>
                        ) : null}
                        {task.githubIssueState ? (
                          <Badge
                            variant="outline"
                            className={task.githubIssueState.toLowerCase() === 'closed'
                              ? 'border-violet-200 bg-violet-50 text-violet-700'
                              : 'border-green-200 bg-green-50 text-green-700'}
                          >
                            {task.githubIssueState.toLowerCase() === 'closed' ? 'Closed' : 'Open'}
                          </Badge>
                        ) : null}
                      </div>
                      {isOwner && task.githubIssueSyncStatus === 'failed' ? (
                        <CardDescription className="text-red-700">
                          {task.githubIssueLastError || 'The GitHub Issue could not be synchronized.'}
                        </CardDescription>
                      ) : isOwner && !task.githubIssueUrl ? (
                        <CardDescription className="text-amber-700">
                          No GitHub Issue has been created for this task yet.
                        </CardDescription>
                      ) : (
                        <CardDescription>
                          Shared by every collaborator assigned to this task.
                        </CardDescription>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {isOwner && !task.githubIssueUrl ? (
                        <Button
                          variant="outline"
                          onClick={() => void handleRetryGithubIssueSync()}
                          disabled={isGithubIssueSyncing}
                        >
                          <RefreshCw size={16} className={`mr-2 ${isGithubIssueSyncing ? 'animate-spin' : ''}`} />
                          {isGithubIssueSyncing
                            ? 'Creating...'
                            : task.githubIssueSyncStatus === 'failed'
                              ? 'Retry sync'
                              : 'Create GitHub issue'}
                        </Button>
                      ) : null}
                      {task.githubIssueUrl ? (
                        <Button variant="primary" asChild>
                          <a href={task.githubIssueUrl} target="_blank" rel="noreferrer">
                            <ExternalLink size={16} className="mr-2" />
                            View GitHub issue
                          </a>
                        </Button>
                      ) : null}
                    </div>
                  </CardBody>
                </Card>
              )}

              <Card>
                <CardBody className="space-y-6 p-6">
                  <div>
                    <CardTitle className="text-2xl mb-4">Task Details</CardTitle>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <p className="text-sm text-slate-500">Deliverables</p>
                        <p className="text-base text-slate-900">{task.deliverables}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-slate-500">Reward</p>
                        <div className="flex items-baseline gap-2">
                          <p className="text-2xl font-bold text-slate-900">
                            {formatMoney(task.rewardAmount, task.rewardCurrency)}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-slate-500">Max Attempts</p>
                        <p className="text-base text-slate-900">{task.maxAttempts}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-slate-500">Min Reputation Required</p>
                        <p className="text-base text-slate-900">
                          {task.minReputation <= -500 ? 'None' : task.minReputation}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-slate-500">Deadline</p>
                        <div className="flex items-baseline gap-2">
                          <p className="text-base text-slate-900">
                            {new Date(task.deadline).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-slate-500">Created</p>
                        <p className="text-base text-slate-900">
                          {new Date(task.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-slate-500">Last Updated</p>
                        <p className="text-base text-slate-900">
                          {new Date(task.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* Team & Collaboration Card */}
              {task.collaborative && (isOwner || userAssignment) && (
                <Card>
                  <CardBody className="space-y-6 p-6 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.06),transparent_35%)]">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <CardTitle className="text-2xl">Team & Collaboration</CardTitle>
                        {userAssignment && !userAssignment.parentAssignmentId && userAssignment.status.toLowerCase() === 'active' && !isDeadlinePassed && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowInviteModal(true)}
                            className="h-8 border-blue-200 text-blue-600 hover:bg-blue-50 font-semibold"
                          >
                            <UserPlus size={14} className="mr-1.5" />
                            Invite Collaborator
                          </Button>
                        )}
                      </div>

                      <div className="space-y-4">
                        {/* Assignees List */}
                        <div>
                          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Assigned Developers</h4>
                          {teamAssignments.length === 0 ? (
                            <p className="text-sm text-slate-500 italic">No developers assigned yet.</p>
                          ) : (
                            <div className="flex flex-wrap gap-3">
                              {teamAssignments.map((ass) => {
                                const isLead = !ass.parentAssignmentId
                                return (
                                  <div
                                    key={ass.id}
                                    className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5"
                                  >
                                    <span
                                      onClick={() => navigate(`/user/${ass.userId}`)}
                                      className="text-sm font-semibold text-slate-800 hover:underline cursor-pointer"
                                    >
                                      {ass.username}
                                    </span>
                                    <Badge
                                      variant="outline"
                                      className={isLead ? "bg-blue-50 text-blue-700 border-blue-200 text-[10px]" : "bg-slate-100 text-slate-600 border-slate-200 text-[10px]"}
                                    >
                                      {isLead ? 'Lead' : 'Collaborator'}
                                    </Badge>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>

                        {/* Sent Invitations List (only for Lead or Project Owner) */}
                        {(isOwner || (userAssignment && !userAssignment.parentAssignmentId)) && (
                          <div className="pt-2 border-t border-slate-100">
                            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Sent Invitations</h4>
                            {teamInvitations.length === 0 ? (
                              <p className="text-sm text-slate-500 italic">No invitations sent yet.</p>
                            ) : (
                              <div className="space-y-2">
                                {teamInvitations.map((invite) => {
                                  const statusLower = invite.status.toLowerCase()
                                  let statusClass = "bg-amber-50 text-amber-700 border-amber-200"
                                  if (statusLower === 'accepted') statusClass = "bg-green-50 text-green-700 border-green-200"
                                  if (statusLower === 'rejected') statusClass = "bg-red-50 text-red-700 border-red-200"

                                  return (
                                    <div
                                      key={invite.id}
                                      className="flex items-center justify-between bg-slate-50/50 border border-slate-200/60 rounded-xl px-4 py-2"
                                    >
                                      <div className="flex items-center gap-2">
                                        <span
                                          onClick={() => navigate(`/user/${invite.receiverId}`)}
                                          className="text-sm font-medium text-slate-700 hover:underline cursor-pointer"
                                        >
                                          {invite.receiverUsername}
                                        </span>
                                        <span className="text-xs text-slate-400">invited by {invite.senderUsername}</span>
                                      </div>
                                      <Badge variant="outline" className={`${statusClass} text-[10px]`}>
                                        {invite.status}
                                      </Badge>
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardBody>
                </Card>
              )}

              {/* Submitted Proposals Card */}
              {(isOwner || anyAssignment) && (
                <Card>
                  <CardBody className="space-y-6 p-6">
                    <div>
                      <CardTitle className="text-2xl mb-1">Submitted Proposals</CardTitle>
                      <CardDescription className="text-sm text-slate-500 mb-4">
                        {isOwner 
                          ? "Review and track all solution proposals submitted by developers for this task."
                          : "Track the status of your submitted solution proposals for this task."
                        }
                      </CardDescription>

                      {submissions.length === 0 ? (
                        <div className="text-center py-8 bg-slate-50/50 border border-dashed border-slate-200 rounded-xl">
                          <p className="text-sm font-semibold text-slate-600">No proposals submitted yet</p>
                          <p className="text-xs text-slate-400 mt-1">
                            {isOwner 
                              ? "Assigned developers will submit their work here."
                              : "Click 'Submit' above to submit your pull request link once you're ready."
                            }
                          </p>
                        </div>
                      ) : isOwner ? (
                        selectedDeveloperFilter === null ? (
                          /* Grouped Developer View */
                          <div className="overflow-x-auto border border-slate-200/80 rounded-2xl bg-white">
                            <table className="w-full text-left border-collapse text-sm">
                              <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-200/80 font-semibold text-slate-500 text-[11px] uppercase tracking-wider">
                                  <th className="px-5 py-3">Developer</th>
                                  <th className="px-5 py-3">Submissions</th>
                                  <th className="px-5 py-3">Latest Status</th>
                                  <th className="px-5 py-3 text-right">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                                {Object.values(
                                  submissions.reduce((acc, sub) => {
                                    const key = sub.username
                                    if (!acc[key]) {
                                      acc[key] = {
                                        username: sub.username,
                                        userId: sub.userId,
                                        submissionsCount: 0,
                                        latestSubmissionDate: sub.submittedAt,
                                        latestStatus: sub.status,
                                      }
                                    }
                                    acc[key].submissionsCount += 1
                                    if (new Date(sub.submittedAt) > new Date(acc[key].latestSubmissionDate)) {
                                      acc[key].latestSubmissionDate = sub.submittedAt
                                      acc[key].latestStatus = sub.status
                                    }
                                    return acc
                                  }, {} as Record<string, { username: string, userId: number, submissionsCount: number, latestSubmissionDate: Date, latestStatus: string }>)
                                ).map((dev) => {
                                  const statusLower = dev.latestStatus.toLowerCase()
                                  const isCompleted = statusLower === 'completed' || statusLower === 'accepted' || statusLower === 'approved'
                                  const isRejected = statusLower === 'rejected'
                                  const isPending = statusLower === 'submitted' || statusLower === 'pending'
                                  
                                  let badgeClass = "bg-blue-50 text-blue-700 border-blue-200"
                                  if (isCompleted) badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  if (isRejected) badgeClass = "bg-red-50 text-red-700 border-red-200"
                                  if (isPending) badgeClass = "bg-amber-50 text-amber-700 border-amber-200"

                                  return (
                                    <tr
                                      key={dev.username}
                                      onClick={() => setSelectedDeveloperFilter(dev.username)}
                                      className="cursor-pointer hover:bg-slate-100/50 transition-colors"
                                    >
                                      <td className="px-5 py-3 font-semibold text-slate-800">
                                        <span
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            navigate(`/user/${dev.userId}`)
                                          }}
                                          className="hover:underline hover:text-blue-600 cursor-pointer"
                                        >
                                          {dev.username}
                                        </span>
                                      </td>
                                      <td className="px-5 py-3">
                                        <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200">
                                          {dev.submissionsCount} {dev.submissionsCount === 1 ? 'submission' : 'submissions'}
                                        </Badge>
                                      </td>
                                      <td className="px-5 py-3">
                                        <Badge className={`border ${badgeClass}`}>
                                          {dev.latestStatus}
                                        </Badge>
                                      </td>
                                      <td className="px-5 py-3 text-right">
                                        <Button
                                          variant="primary"
                                          size="sm"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            setSelectedDeveloperFilter(dev.username)
                                          }}
                                          className="h-7 px-3 text-xs font-semibold"
                                        >
                                          View Attempts
                                        </Button>
                                      </td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          /* Attempts View for Selected Developer */
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedDeveloperFilter(null)}
                                className="text-xs font-semibold border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center gap-1.5"
                              >
                                <ArrowLeft size={14} />
                                Back to Developers
                              </Button>
                              <p className="text-xs font-semibold text-slate-500">
                                Showing attempts for{' '}
                                <span
                                  onClick={() => {
                                    const sub = submissions.find(s => s.username === selectedDeveloperFilter)
                                    if (sub) {
                                      navigate(`/user/${sub.userId}`)
                                    }
                                  }}
                                  className="text-blue-600 font-bold hover:underline cursor-pointer"
                                >
                                  {selectedDeveloperFilter}
                                </span>
                              </p>
                            </div>

                            <div className="overflow-x-auto border border-slate-200/80 rounded-2xl bg-white">
                              <table className="w-full text-left border-collapse text-sm">
                                <thead>
                                  <tr className="bg-slate-50/50 border-b border-slate-200/80 font-semibold text-slate-500 text-[11px] uppercase tracking-wider">
                                    <th className="px-5 py-3">Attempt</th>
                                    <th className="px-5 py-3">PR Link</th>
                                    <th className="px-5 py-3">Submitted</th>
                                    <th className="px-5 py-3">Status</th>
                                    <th className="px-5 py-3">Review Details</th>
                                    <th className="px-5 py-3 text-right">Actions</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                                  {submissions
                                    .filter((s) => s.username === selectedDeveloperFilter)
                                    .map((sub) => {
                                      const statusLower = sub.status.toLowerCase()
                                      const isCompleted = statusLower === 'completed' || statusLower === 'accepted' || statusLower === 'approved'
                                      const isRejected = statusLower === 'rejected'
                                      const isPending = statusLower === 'submitted' || statusLower === 'pending'
                                      
                                      let badgeClass = "bg-blue-50 text-blue-700 border-blue-200"
                                      if (isCompleted) badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-200"
                                      if (isRejected) badgeClass = "bg-red-50 text-red-700 border-red-200"
                                      if (isPending) badgeClass = "bg-amber-50 text-amber-700 border-amber-200"

                                      return (
                                        <tr
                                          key={sub.id}
                                          onClick={() => handleOpenReviewModal(sub)}
                                          className="cursor-pointer hover:bg-slate-100/50 transition-colors"
                                        >
                                          <td className="px-5 py-3">
                                            <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200">
                                              Attempt {sub.attemptsUsed}
                                            </Badge>
                                          </td>
                                          <td className="px-5 py-3">
                                            <a
                                              href={sub.pullRequestUrl || sub.designUrl}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              onClick={(e) => e.stopPropagation()}
                                              className="text-blue-600 hover:text-blue-700 font-medium hover:underline inline-flex items-center gap-1"
                                            >
                                              {sub.pullRequestUrl ? 'View PR' : 'View Design'}
                                            </a>
                                          </td>
                                          <td className="px-5 py-3 text-slate-500 text-xs font-normal">
                                            {new Date(sub.submittedAt).toLocaleDateString()}
                                          </td>
                                          <td className="px-5 py-3">
                                            <Badge className={`border ${badgeClass}`}>
                                              {sub.status}
                                            </Badge>
                                          </td>
                                          <td className="px-5 py-3 text-xs max-w-[200px] truncate" title={sub.reviewComments || 'No review comments yet.'}>
                                            {sub.reviewComments ? (
                                              <span className="text-slate-600 italic">"{sub.reviewComments}"</span>
                                            ) : (
                                              <span className="text-slate-400">-</span>
                                            )}
                                          </td>
                                          <td className="px-5 py-3 text-right">
                                            <Button
                                              variant={isPending ? "primary" : "outline"}
                                              size="sm"
                                              onClick={(e) => {
                                                e.stopPropagation()
                                                handleOpenReviewModal(sub)
                                              }}
                                              className="h-7 px-3 text-xs font-semibold"
                                            >
                                              {isPending ? "Review" : "View Details"}
                                            </Button>
                                          </td>
                                        </tr>
                                      )
                                    })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )
                      ) : (
                        /* Direct Developer's Attempts Table */
                        <div className="overflow-x-auto border border-slate-200/80 rounded-2xl bg-white">
                          <table className="w-full text-left border-collapse text-sm">
                            <thead>
                              <tr className="bg-slate-50/50 border-b border-slate-200/80 font-semibold text-slate-500 text-[11px] uppercase tracking-wider">
                                <th className="px-5 py-3">Attempt</th>
                                <th className="px-5 py-3">PR Link</th>
                                <th className="px-5 py-3">Submitted</th>
                                <th className="px-5 py-3">Status</th>
                                <th className="px-5 py-3">Review Details</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                              {submissions.map((sub) => {
                                const statusLower = sub.status.toLowerCase()
                                const isCompleted = statusLower === 'completed' || statusLower === 'accepted' || statusLower === 'approved'
                                const isRejected = statusLower === 'rejected'
                                const isPending = statusLower === 'submitted' || statusLower === 'pending'
                                
                                let badgeClass = "bg-blue-50 text-blue-700 border-blue-200"
                                if (isCompleted) badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-200"
                                if (isRejected) badgeClass = "bg-red-50 text-red-700 border-red-200"
                                if (isPending) badgeClass = "bg-amber-50 text-amber-700 border-amber-200"

                                return (
                                  <tr key={sub.id} className="hover:bg-slate-50/30 transition-colors">
                                    <td className="px-5 py-3">
                                      <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200">
                                        Attempt {sub.attemptsUsed}
                                      </Badge>
                                    </td>
                                    <td className="px-5 py-3">
                                      <a
                                        href={sub.pullRequestUrl || sub.designUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-700 font-medium hover:underline inline-flex items-center gap-1"
                                      >
                                        {sub.pullRequestUrl ? 'View PR' : 'View Design'}
                                      </a>
                                    </td>
                                    <td className="px-5 py-3 text-slate-500 text-xs font-normal">
                                      {new Date(sub.submittedAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-5 py-3">
                                      <Badge className={`border ${badgeClass}`}>
                                        {sub.status}
                                      </Badge>
                                    </td>
                                    <td className="px-5 py-3 text-xs max-w-[200px] truncate" title={sub.reviewComments || 'No review comments yet.'}>
                                      {sub.reviewComments ? (
                                        <span className="text-slate-600 italic">"{sub.reviewComments}"</span>
                                      ) : (
                                        <span className="text-slate-400">-</span>
                                      )}
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </CardBody>
                </Card>
              )}

              {(isOwner || anyAssignment) && submissions.length > 0 && (
                <Card>
                  <CardBody className="space-y-5 p-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="mb-1 flex items-center gap-2">
                          <GitPullRequest size={20} className="text-slate-700" />
                          <CardTitle className="text-xl">GitHub activity</CardTitle>
                        </div>
                        <CardDescription>
                          Comments and technical reviews from the linked pull request.
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="w-fit bg-slate-50 text-slate-600">
                        Read only
                      </Badge>
                    </div>

                    {githubReviewedSubmissions.length > 0 && (
                      <div className="space-y-2 border-t border-slate-100 pt-4">
                        <p className="text-xs font-semibold uppercase text-slate-500">Technical review status</p>
                        {githubReviewedSubmissions.map((submission) => (
                          <div
                            key={submission.id}
                            className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50/70 p-3 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge className={`border ${githubReviewBadgeClass(submission.githubReviewState!)}`}>
                                  {githubReviewLabel(submission.githubReviewState!)}
                                </Badge>
                                {isOwner && (
                                  <span className="text-sm font-medium text-slate-700">{submission.username}</span>
                                )}
                              </div>
                              <p className="mt-1 text-xs text-slate-500">
                                {submission.githubReviewAuthor ? `Reviewed by @${submission.githubReviewAuthor}` : 'GitHub review updated'}
                                {submission.githubReviewUpdatedAt
                                  ? ` · ${new Date(submission.githubReviewUpdatedAt).toLocaleString()}`
                                  : ''}
                              </p>
                            </div>
                            {submission.githubReviewUrl && (
                              <Button asChild variant="outline" size="sm" className="shrink-0">
                                <a href={submission.githubReviewUrl} target="_blank" rel="noopener noreferrer">
                                  View review
                                  <ExternalLink size={14} />
                                </a>
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="space-y-3 border-t border-slate-100 pt-4">
                      <div className="flex items-center gap-2">
                        <MessageSquare size={17} className="text-slate-500" />
                        <p className="text-sm font-semibold text-slate-800">Pull request comments</p>
                      </div>

                      {isGithubActivityLoading ? (
                        <div className="flex items-center gap-2 py-4 text-sm text-slate-500">
                          <Loader2 size={16} className="animate-spin" />
                          Loading GitHub activity...
                        </div>
                      ) : githubActivityError ? (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                          {githubActivityError}
                        </div>
                      ) : githubActivity.length === 0 ? (
                        <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50/50 px-4 py-5 text-center text-sm text-slate-500">
                          No GitHub comments or reviews yet.
                        </p>
                      ) : (
                        <div className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                          {githubActivity.map((activity) => (
                            <div key={activity.id} className="p-4">
                              <div className="flex items-start gap-3">
                                {activity.authorAvatarUrl ? (
                                  <img
                                    src={activity.authorAvatarUrl}
                                    alt=""
                                    className="h-8 w-8 shrink-0 rounded-full border border-slate-200"
                                  />
                                ) : (
                                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                                    {(activity.authorUsername || '?').slice(0, 1).toUpperCase()}
                                  </div>
                                )}
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                    <span className="text-sm font-semibold text-slate-800">
                                      {activity.authorUsername ? `@${activity.authorUsername}` : 'GitHub user'}
                                    </span>
                                    <Badge variant="outline" className="bg-white text-[10px] text-slate-500">
                                      {activity.eventType === 'pull_request_review_comment'
                                        ? 'Inline review'
                                        : activity.eventType === 'pull_request_review'
                                          ? 'Review summary'
                                          : 'Conversation'}
                                    </Badge>
                                    {activity.createdAt && (
                                      <span className="text-xs text-slate-400">
                                        {new Date(activity.createdAt).toLocaleString()}
                                      </span>
                                    )}
                                  </div>
                                  <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
                                    {activity.body}
                                  </p>
                                  {activity.githubUrl && (
                                    <a
                                      href={activity.githubUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                                    >
                                      View on GitHub
                                      <ExternalLink size={12} />
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardBody>
                </Card>
              )}
            </div>

            {/* Right Column (Chat Panel) */}
            {showChat && (
              <div className="flex flex-col h-full space-y-4">
                {isOwner ? (
                  assignments.length > 0 ? (
                    <div className="flex flex-col flex-1 space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                      {/* Developer selection dropdown for owner */}
                      <div className="bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                        <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                          Select Developer Conversation
                        </label>
                        <select
                          value={selectedAssignment?.id || ''}
                          onChange={(e) => {
                            const assId = Number(e.target.value)
                            const found = assignments.find((a) => a.id === assId)
                            if (found) {
                              setSelectedAssignment(found)
                            }
                          }}
                          className="w-full bg-slate-50/50 border border-slate-200/80 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-700"
                        >
                          {assignments.map((ass) => (
                            <option key={ass.id} value={ass.id}>
                              {ass.username}
                            </option>
                          ))}
                        </select>
                      </div>

                      {selectedAssignment && (
                        <TaskChatPanel
                          assignmentId={selectedAssignment.id}
                          currentUser={currentUser!}
                          otherUserUsername={selectedAssignment.username}
                          className="flex-1 min-h-[500px]"
                        />
                      )}
                    </div>
                  ) : (
                    <Card className="shadow-sm border border-slate-200/80 bg-white/90 backdrop-blur-md p-6 text-center animate-in fade-in duration-300">
                      <CardBody className="space-y-2">
                        <CardTitle className="text-base font-semibold text-slate-700">No Developers Assigned</CardTitle>
                        <CardDescription className="text-xs text-slate-400">
                          Once a developer assigns themselves to this task, you can chat with them here in real-time.
                        </CardDescription>
                      </CardBody>
                    </Card>
                  )
                ) : (
                  userAssignment && (
                    <div className="flex flex-col flex-1 animate-in fade-in slide-in-from-right-4 duration-300">
                      <TaskChatPanel
                        assignmentId={userAssignment.id}
                        currentUser={currentUser!}
                        otherUserUsername={projectOwnerUsername || 'Project Owner'}
                        className="flex-1 min-h-[500px]"
                      />
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        ) : null}
      </section>

      {showSubmitModal && (
        <Modal
          isOpen={showSubmitModal}
          onClose={() => {
            setShowSubmitModal(false)
            setPrUrl('')
            setDescription('')
            setDemoUrl('')
            setSubmitError(null)
          }}
          title="Submit Solution"
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium">
                {task?.taskType === 'DEVELOPMENT' || !task?.taskType ? 'Pull Request URL' : 'Figma Design URL'}
              </label>
              <Input
                type="text"
                value={prUrl}
                onChange={(e) => {
                  setPrUrl(e.target.value)
                  if (submitError) {
                    const isDevelopment = task?.taskType === 'DEVELOPMENT' || !task?.taskType;
                    const err = isDevelopment ? validatePullRequestUrl(e.target.value) : validateDesignUrl(e.target.value);
                    setSubmitError(err ?? null)
                  }
                }}
                placeholder={task?.taskType === 'DEVELOPMENT' || !task?.taskType ? "https://github.com/..." : "https://figma.com/..."}
                disabled={isSubmitting}
                helperText={submitError || undefined}
                error={Boolean(submitError)}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Briefly describe your solution..."
                disabled={isSubmitting}
                className="w-full rounded-md border border-slate-300 p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium">Demo/Visuals URL (Optional)</label>
              <Input
                type="text"
                value={demoUrl}
                onChange={(e) => setDemoUrl(e.target.value)}
                placeholder="https://..."
                disabled={isSubmitting}
              />
            </div>
            {userAssignment && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-sm text-blue-700">
                  This submission will be linked to your assignment (Attempt {userAssignment.attemptsUsed + 1} of {task?.maxAttempts})
                </p>
              </div>
            )}
            <div className="flex gap-3">
              <Button
                variant="primary"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowSubmitModal(false)
                  setPrUrl('')
                  setDescription('')
                  setDemoUrl('')
                  setSubmitError(null)
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {showReviewModal && selectedSubmission && (
        <Modal
          isOpen={showReviewModal}
          onClose={() => {
            setShowReviewModal(false)
            setSelectedSubmission(null)
            setReviewComments('')
            setReviewError(null)
            setIsRejecting(false)
          }}
          title="Review Solution Proposal"
        >
          <div className="space-y-4">
            <div className="rounded-lg bg-slate-50 p-4 border border-slate-100 space-y-2">
              <div className="flex justify-between items-center text-sm">
                <div>
                  <span className="font-semibold text-slate-700">Developer:</span>{" "}
                  <span
                    onClick={() => {
                      setShowReviewModal(false)
                      setSelectedSubmission(null)
                      navigate(`/user/${selectedSubmission.userId}`)
                    }}
                    className="text-blue-600 font-semibold hover:underline cursor-pointer"
                  >
                    {selectedSubmission.username}
                  </span>
                </div>
                <div>
                  <Badge variant="outline" className="bg-slate-100 text-slate-600">
                    Attempt {selectedSubmission.attemptsUsed}
                  </Badge>
                </div>
              </div>
              <div className="text-sm">
                <span className="font-semibold text-slate-700">Submitted:</span>{" "}
                <span className="text-slate-600">
                  {new Date(selectedSubmission.submittedAt).toLocaleString()}
                </span>
              </div>
              <div className="text-sm flex items-center gap-2">
                <span className="font-semibold text-slate-700">{selectedSubmission.pullRequestUrl ? 'PR Link:' : 'Design Link:'}</span>{" "}
                <a
                  href={selectedSubmission.pullRequestUrl || selectedSubmission.designUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-blue-600 hover:text-blue-700 font-mono text-xs hover:underline truncate max-w-[400px]"
                >
                  {selectedSubmission.pullRequestUrl || selectedSubmission.designUrl}
                </a>
              </div>
              {selectedSubmission.demoUrl && (
                <div className="text-sm flex items-center gap-2">
                  <span className="font-semibold text-slate-700">Demo URL:</span>{" "}
                  <a
                    href={selectedSubmission.demoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-blue-600 hover:text-blue-700 font-mono text-xs hover:underline truncate max-w-[400px]"
                  >
                    {selectedSubmission.demoUrl}
                  </a>
                </div>
              )}
              {selectedSubmission.description && (
                <div className="text-sm space-y-1">
                  <span className="font-semibold text-slate-700">Description:</span>
                  <div className="bg-slate-100 p-2 rounded text-slate-600 text-xs whitespace-pre-wrap">
                    {selectedSubmission.description}
                  </div>
                </div>
              )}
              <div className="text-sm flex items-center gap-2">
                <span className="font-semibold text-slate-700">Current Status:</span>{" "}
                <Badge
                  className={`border ${
                    selectedSubmission.status.toLowerCase() === 'completed' ||
                    selectedSubmission.status.toLowerCase() === 'accepted' ||
                    selectedSubmission.status.toLowerCase() === 'approved'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : selectedSubmission.status.toLowerCase() === 'rejected'
                      ? 'bg-red-50 text-red-700 border-red-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}
                >
                  {selectedSubmission.status}
                </Badge>
              </div>
            </div>

            {/* Check if it is pending review */}
            {(selectedSubmission.status.toLowerCase() === 'submitted' ||
              selectedSubmission.status.toLowerCase() === 'pending') ? (
              <div className="space-y-4">
                {isRejecting && (
                  <>
                    <div className="space-y-2 bg-slate-50 border border-slate-100 rounded-lg p-3 text-slate-900">
                      <label className="block text-sm font-semibold text-slate-700">
                        Rejection Reason & Severity
                      </label>
                      <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 pt-1">
                        <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                          <input
                            type="radio"
                            name="rejectionReason"
                            value="BUGS_OR_INCOMPLETE"
                            checked={rejectionReason === 'BUGS_OR_INCOMPLETE'}
                            onChange={() => setRejectionReason('BUGS_OR_INCOMPLETE')}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300"
                          />
                          <span>Bugs / Incomplete <span className="text-slate-400 font-normal">(-10 Rep)</span></span>
                        </label>
                        <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                          <input
                            type="radio"
                            name="rejectionReason"
                            value="SPAM_OR_LOW_EFFORT"
                            checked={rejectionReason === 'SPAM_OR_LOW_EFFORT'}
                            onChange={() => setRejectionReason('SPAM_OR_LOW_EFFORT')}
                            className="h-4 w-4 text-red-600 focus:ring-red-500 border-slate-300"
                          />
                          <span>Spam / Low Effort <span className="text-red-500 font-medium">(-25 Rep, reset streak)</span></span>
                        </label>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-slate-700">
                        Review Feedback Comments <span className="text-red-500 font-normal">*</span>
                      </label>
                      <textarea
                        value={reviewComments}
                        onChange={(e) => {
                          setReviewComments(e.target.value)
                          if (reviewError) setReviewError(null)
                        }}
                        placeholder="Enter your feedback, suggestions, or comments here..."
                        rows={4}
                        className="w-full rounded-lg border border-slate-200 p-3 text-sm focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400"
                        disabled={isSubmittingReview}
                      />
                    </div>
                  </>
                )}

                {reviewError && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <p className="text-sm text-red-700">{reviewError}</p>
                  </div>
                )}

                <div className="flex flex-wrap gap-3 pt-2">
                  {!isRejecting && (
                    <Button
                      variant="primary"
                      onClick={() => submitReview(true)}
                      disabled={isSubmittingReview}
                      className="bg-emerald-600 hover:bg-emerald-700 border-emerald-600 text-white flex items-center gap-1.5"
                    >
                      {isSubmittingReview ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Check size={16} />
                      )}
                      Approve Proposal
                    </Button>
                  )}
                  {isRejecting ? (
                    <Button
                      variant="primary"
                      onClick={() => submitReview(false)}
                      disabled={isSubmittingReview || !reviewComments.trim()}
                      title={!reviewComments.trim() ? "Comments are required for rejection" : "Confirm Rejection"}
                      className="bg-red-600 hover:bg-red-700 border-red-600 text-white flex items-center gap-1.5"
                    >
                      {isSubmittingReview ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <X size={16} />
                      )}
                      Confirm Rejection
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => setIsRejecting(true)}
                      disabled={isSubmittingReview}
                      className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 flex items-center gap-1.5"
                    >
                      <X size={16} />
                      Reject Proposal
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    onClick={() => {
                      if (isRejecting) {
                        setIsRejecting(false)
                        setReviewError(null)
                      } else {
                        setShowReviewModal(false)
                        setSelectedSubmission(null)
                        setReviewComments('')
                        setReviewError(null)
                        setIsRejecting(false)
                      }
                    }}
                    disabled={isSubmittingReview}
                    className="ml-auto"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              // Already reviewed proposal
              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-slate-700">Review Comments</h4>
                  <div className="bg-slate-50/70 border border-slate-200/60 rounded-lg p-3.5 italic text-slate-700 text-sm">
                    {selectedSubmission.reviewComments ? `"${selectedSubmission.reviewComments}"` : "No review comments provided."}
                  </div>
                </div>
                {selectedSubmission.reviewedAt && (
                  <div className="text-xs text-slate-400">
                    Reviewed on: {new Date(selectedSubmission.reviewedAt).toLocaleString()}
                    {selectedSubmission.reviewerUsername && ` by ${selectedSubmission.reviewerUsername}`}
                  </div>
                )}
                <div className="flex justify-end pt-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowReviewModal(false)
                      setSelectedSubmission(null)
                      setReviewComments('')
                      setReviewError(null)
                    }}
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {showEditModal && (
        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title="Edit Task"
        >
          <form className="grid gap-4 md:grid-cols-2 text-slate-900" onSubmit={handleEditTaskSubmit}>
            {editFeedback && (
              <div className="md:col-span-2">
                <div className={`p-3 rounded-lg flex items-center gap-3 text-sm border ${
                  editFeedback.type === 'success'
                    ? 'border-green-100 bg-green-50 text-green-700'
                    : 'border-red-100 bg-red-50 text-red-700'
                }`}>
                  {editFeedback.type === 'success' ? (
                    <Check size={16} className="text-green-600" />
                  ) : (
                    <X size={16} className="text-red-600" />
                  )}
                  <span>{editFeedback.message}</span>
                </div>
              </div>
            )}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1 text-slate-700">Task Title</label>
              <Input
                placeholder="Implement feature X"
                helperText={editErrors.title}
                error={Boolean(editErrors.title)}
                value={editTaskForm.title}
                onChange={(event) => {
                  setEditTaskForm((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                  updateEditTaskError('title', event.target.value)
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700">Reward Amount</label>
              <Input
                placeholder="100"
                helperText={editErrors.rewardAmount}
                error={Boolean(editErrors.rewardAmount)}
                value={editTaskForm.rewardAmount || ''}
                onChange={(event) => {
                  const value = event.target.value;
                  if (value === '' || /^\d+(\.\d{0,2})?$/.test(value)) {
                    setEditTaskForm((current) => ({
                      ...current,
                      rewardAmount: value === '' ? 0 : Number(value),
                    }))
                    updateEditTaskError('rewardAmount', value === '' ? 0 : Number(value))
                  }
                }}
              />
            </div>

            <div>
              <label htmlFor="edit-task-status" className="block text-sm font-medium mb-1 text-slate-700">
                Status
              </label>
              <select
                id="edit-task-status"
                value={editTaskForm.status}
                onChange={(event) =>
                  setEditTaskForm((current) => ({
                    ...current,
                    status: event.target.value,
                  }))
                }
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="OPEN">OPEN</option>
                <option value="HIRING">HIRING</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="COMPLETED">COMPLETED</option>
              </select>
            </div>

            <div>
              <label htmlFor="edit-task-type" className="block text-sm font-medium mb-1 text-slate-700">
                Task Type
              </label>
              <select
                id="edit-task-type"
                value={editTaskForm.taskType}
                onChange={(event) =>
                  setEditTaskForm((current) => ({
                    ...current,
                    taskType: event.target.value as TaskType,
                  }))
                }
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="DEVELOPMENT">Development</option>
                <option value="DESIGN">Design</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700">Max Attempts</label>
              <Input
                placeholder="3"
                value={editTaskForm.maxAttempts || ''}
                onChange={(event) => {
                  const value = event.target.value;
                  if (value === '' || /^\d+$/.test(value)) {
                    setEditTaskForm((current) => ({
                      ...current,
                      maxAttempts: value === '' ? 0 : Number(value),
                    }))
                  }
                }}
              />
            </div>


            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700">Deadline</label>
              <Input
                type="date"
                value={getDeadlineString(editTaskForm.deadline)}
                onChange={(event) => {
                  const val = event.target.value
                  setEditTaskForm((current) => ({
                    ...current,
                    deadline: val ? new Date(val) : new Date(),
                  }))
                }}
              />
            </div>

            <div className="flex flex-col justify-center gap-2">
              <div className="flex items-center gap-2 mt-6">
                <input
                  id="edit-task-any-rep"
                  type="checkbox"
                  checked={allowAnyReputation}
                  onChange={(event) => {
                    const checked = event.target.checked
                    setAllowAnyReputation(checked)
                    if (checked) {
                      setEditTaskForm((current) => ({
                        ...current,
                        minReputation: -500,
                      }))
                    } else {
                      setEditTaskForm((current) => ({
                        ...current,
                        minReputation: 0,
                      }))
                    }
                  }}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="edit-task-any-rep" className="text-sm font-medium text-slate-700 cursor-pointer">
                  Any reputation score
                </label>
              </div>
            </div>

            {!allowAnyReputation && (
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-700">Minimum Reputation Required</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={editTaskForm.minReputation === undefined ? "" : editTaskForm.minReputation}
                  onChange={(event) => {
                    const value = event.target.value;
                    setEditTaskForm((current) => ({
                      ...current,
                      minReputation: value === "" ? 0 : Number(value),
                    }));
                  }}
                />
              </div>
            )}

            <div className="flex items-center gap-2 mt-6">
              <input
                id="edit-task-collaborative"
                type="checkbox"
                checked={editTaskForm.collaborative}
                onChange={(event) => {
                  setEditTaskForm((current) => ({
                    ...current,
                    collaborative: event.target.checked,
                  }))
                }}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="edit-task-collaborative" className="text-sm font-medium text-slate-700 cursor-pointer">
                Collaborative Task
              </label>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1 text-slate-700">Deliverables</label>
              <Input
                placeholder="What needs to be delivered"
                helperText={editErrors.deliverables}
                error={Boolean(editErrors.deliverables)}
                value={editTaskForm.deliverables}
                onChange={(event) => {
                  setEditTaskForm((current) => ({
                    ...current,
                    deliverables: event.target.value,
                  }))
                  updateEditTaskError('deliverables', event.target.value)
                }}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1 text-slate-700">Recommended Skills</label>
              <Input
                placeholder="Separate skills with commas."
                value={editSkillsInput}
                onChange={(event) => setEditSkillsInput(event.target.value)}
              />
              <p className="mt-1 text-xs text-slate-500">Separate skills with commas.</p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1 text-slate-700">Description</label>
              <textarea
                placeholder="Detailed description of the task"
                className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 resize-none bg-white ${editErrors.description
                  ? 'border-red-300 focus:ring-red-200'
                  : 'border-slate-300 focus:ring-blue-200'
                  }`}
                rows={4}
                value={editTaskForm.description}
                onChange={(event) => {
                  setEditTaskForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                  updateEditTaskError('description', event.target.value)
                }}
              />
              {editErrors.description && (
                <p className="text-xs text-red-600 mt-1">{editErrors.description}</p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2 md:col-span-2">
              <Button type="button" variant="ghost" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={isUpdatingTask}>
                {isUpdatingTask ? 'Updating...' : 'Update task'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {showInviteModal && (
        <Modal
          isOpen={showInviteModal}
          onClose={() => {
            setShowInviteModal(false)
            setInviteReceiverId(null)
            setInviteError(null)
            setInviteSearchQuery('')
          }}
          title="Invite Collaborator"
        >
          <div className="space-y-4 text-slate-900">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Search Developer to Invite</label>
              <Input
                type="text"
                placeholder="Type username to search..."
                value={inviteSearchQuery}
                onChange={(e) => setInviteSearchQuery(e.target.value)}
                disabled={isInviting}
              />
            </div>

            {/* Results List */}
            <div className="border border-slate-200 rounded-lg max-h-[220px] overflow-y-auto divide-y divide-slate-100 bg-white shadow-inner">
              {filteredEligibleUsers.length === 0 ? (
                <p className="text-sm text-slate-500 p-4 text-center italic">
                  {inviteSearchQuery ? `No developers found matching "${inviteSearchQuery}"` : "No developers available to invite"}
                </p>
              ) : (
                filteredEligibleUsers.map((u) => {
                  const isSelected = inviteReceiverId === u.id
                  return (
                    <div
                      key={u.id}
                      onClick={() => setInviteReceiverId(u.id)}
                      className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors ${
                        isSelected ? 'bg-blue-50/70 text-blue-900 font-semibold' : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-600 text-sm uppercase">
                          {u.username.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{u.username}</p>
                          {u.email && <p className="text-xs text-slate-400 font-normal">{u.email}</p>}
                        </div>
                      </div>
                      {isSelected && (
                        <span className="text-blue-600">
                          <Check size={16} />
                        </span>
                      )}
                    </div>
                  )
                })
              )}
            </div>

            {/* Selected developer indicator */}
            {inviteReceiverId && (
              <div className="flex items-center justify-between rounded-xl bg-blue-50/50 border border-blue-200/60 p-3 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center gap-2.5">
                  <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></div>
                  <p className="text-sm font-medium text-blue-900">
                    Selected: <span className="font-bold">{allUsers.find(u => u.id === inviteReceiverId)?.username}</span>
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setInviteReceiverId(null)}
                  className="h-7 w-7 p-0 rounded-full hover:bg-blue-100/50 text-blue-600"
                >
                  <X size={14} />
                </Button>
              </div>
            )}

            {inviteError && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-700">{inviteError}</p>
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <Button
                variant="primary"
                onClick={handleSendInvitation}
                disabled={isInviting || !inviteReceiverId}
              >
                {isInviting ? 'Sending Invitation...' : 'Send Invitation'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowInviteModal(false)
                  setInviteReceiverId(null)
                  setInviteError(null)
                  setInviteSearchQuery('')
                }}
                disabled={isInviting}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </main>
  )
}
