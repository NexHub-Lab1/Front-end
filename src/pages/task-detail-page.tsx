import { ArrowLeft, Bookmark, Send, UserPlus, Check, X, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

import { AppHeader } from '../components/app/app-header'
import type { TaskResponse, User, TaskAssignmentResponse, TaskSubmissionResponse } from '../types/app'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardBody, CardDescription, CardTitle } from '../components/ui/card'
import Modal from '../components/ui/modal'
import { Input } from '../components/ui/input'
import { fetchProjectById } from '../lib/project-storage'
import { fetchTaskById } from '../lib/task-storage'
import { createSubmission, fetchSubmissionsByTask, fetchSubmissionsByAssignment, updateSubmission } from '../lib/submission-storage'

import { fetchAssignmentsByUser, createAssignment } from '../lib/assignment-storage'
import { LOOKUP_PAGE_SIZE } from '../lib/pagination'
import { fetchTaskAssignments } from '../lib/chat-storage'
import { TaskChatPanel } from '../components/app/task-chat-panel'


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
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isAssigning, setIsAssigning] = useState(false)
  const [assignError, setAssignError] = useState<string | null>(null)
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [projectOwnerUsername, setProjectOwnerUsername] = useState<string | null>(null)
  const [assignments, setAssignments] = useState<TaskAssignmentResponse[]>([])
  const [selectedAssignment, setSelectedAssignment] = useState<TaskAssignmentResponse | null>(null)
  const [submissions, setSubmissions] = useState<TaskSubmissionResponse[]>([])

  // State for fast proposal review
  const [selectedSubmission, setSelectedSubmission] = useState<TaskSubmissionResponse | null>(null)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [reviewComments, setReviewComments] = useState('')
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)
  const [reviewError, setReviewError] = useState<string | null>(null)

  const handleOpenReviewModal = (submission: TaskSubmissionResponse) => {
    setSelectedSubmission(submission)
    setReviewComments(submission.reviewComments || '')
    setReviewError(null)
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
      })

      if (result.status === 'success') {
        setShowReviewModal(false)
        setSelectedSubmission(null)
        setReviewComments('')
        
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
    async function loadTask() {
      const parsedId = Number(id)

      if (!id || Number.isNaN(parsedId)) {
        setError('Task id is invalid')
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const response = await fetchTaskById(parsedId)
        if (response.status === 'error' || !response.data) {
          throw new Error(response.message || 'Unable to load task')
        }

        const loadedTask = response.data
        setTask(loadedTask)

        if (currentUser) {
          let userIsOwner = false
          const projectRes = await fetchProjectById(loadedTask.projectId)
          if (projectRes.status === 'success' && projectRes.data) {
            const ownerStatus = projectRes.data.ownerId === currentUser.id
            setIsOwner(ownerStatus)
            userIsOwner = ownerStatus
            setProjectOwnerUsername(projectRes.data.ownerUsername)
          }

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

            const foundAny = assignmentsRes.data.content.find(
              a => a.taskId === parsedId
            )
            foundAnyAssignment = foundAny || null
            setAnyAssignment(foundAny || null)
          }

          if (userIsOwner) {
            const allAssignmentsRes = await fetchTaskAssignments(parsedId)
            if (allAssignmentsRes.status === 'success' && allAssignmentsRes.data) {
              const content = allAssignmentsRes.data.content || []
              setAssignments(content)
              if (content.length > 0) {
                setSelectedAssignment(content[0])
              }
            }

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
    const urlError = validatePullRequestUrl(prUrl)
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

      const result = await createSubmission({
        assignmentId: userAssignment.id,
        pullRequestUrl: prUrl,
      })

      if (result.status === 'success') {
        setShowSubmitModal(false)
        setPrUrl('')
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

  function validatePullRequestUrl(value: string) {
    if (!value.trim()) {
      return 'Please enter a Pull Request URL'
    }

    if (!value.startsWith('http://') && !value.startsWith('https://')) {
      return 'Please enter a valid URL (must start with http:// or https://)'
    }

    return undefined
  }

  const getAssignmentButtonContent = () => {
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

    if (userAssignment) {
      return {
        text: 'Already Assigned',
        disabled: true,
        tooltip: `You were assigned on ${new Date(userAssignment.assignedAt).toLocaleDateString()}`,
      }
    }

    return {
      text: 'Assign to Me',
      disabled: false,
      tooltip: 'Assign this task to yourself',
    }
  }

  const getSubmitButtonContent = () => {
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
                        <Badge variant="outline">{task.projectName}</Badge>
                        {userAssignment && (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Assigned
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
                      <Button
                        variant="outline"
                        size="lg"
                        disabled
                        className="opacity-50 cursor-not-allowed"
                        title="WIP: Save for later functionality coming soon"
                      >
                        <Bookmark size={16} className="mr-2" />
                        Save (WIP)
                      </Button>
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
                          <p className="text-2xl font-bold text-slate-900">{task.rewardAmount}</p>
                          <p className="text-sm text-slate-600">{task.rewardCurrency}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-slate-500">Max Attempts</p>
                        <p className="text-base text-slate-900">{task.maxAttempts}</p>
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
                      ) : (
                        <div className="overflow-x-auto border border-slate-200/80 rounded-2xl bg-white">
                          <table className="w-full text-left border-collapse text-sm">
                            <thead>
                              <tr className="bg-slate-50/50 border-b border-slate-200/80 font-semibold text-slate-500 text-[11px] uppercase tracking-wider">
                                {isOwner && <th className="px-5 py-3">Developer</th>}
                                <th className="px-5 py-3">Attempt</th>
                                <th className="px-5 py-3">PR Link</th>
                                <th className="px-5 py-3">Submitted</th>
                                <th className="px-5 py-3">Status</th>
                                <th className="px-5 py-3">Review Details</th>
                                {isOwner && <th className="px-5 py-3 text-right">Actions</th>}
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
                                  <tr
                                    key={sub.id}
                                    onClick={() => {
                                      if (isOwner) {
                                        handleOpenReviewModal(sub)
                                      }
                                    }}
                                    className={`transition-colors ${
                                      isOwner
                                        ? 'cursor-pointer hover:bg-slate-100/50'
                                        : 'hover:bg-slate-50/30'
                                    }`}
                                  >
                                    {isOwner && (
                                      <td className="px-5 py-3 font-semibold text-slate-800">
                                        {sub.username}
                                      </td>
                                    )}
                                    <td className="px-5 py-3">
                                      <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200">
                                        Attempt {sub.attemptsUsed}
                                      </Badge>
                                    </td>
                                    <td className="px-5 py-3">
                                      <a
                                        href={sub.pullRequestUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="text-blue-600 hover:text-blue-700 font-medium hover:underline inline-flex items-center gap-1"
                                      >
                                        View PR
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
                                    {isOwner && (
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
                                    )}
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
            </div>

            {/* Right Column (Chat Panel) */}
            {showChat && (
              <div className="space-y-4">
                {isOwner ? (
                  assignments.length > 0 ? (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
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
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                      <TaskChatPanel
                        assignmentId={userAssignment.id}
                        currentUser={currentUser!}
                        otherUserUsername={projectOwnerUsername || 'Project Owner'}
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
            setSubmitError(null)
          }}
          title="Submit Solution"
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium">Pull Request URL</label>
              <Input
                type="text"
                value={prUrl}
                onChange={(e) => {
                  setPrUrl(e.target.value)
                  if (submitError) {
                    setSubmitError(validatePullRequestUrl(e.target.value) ?? null)
                  }
                }}
                placeholder="https://github.com/..."
                disabled={isSubmitting}
                helperText={submitError || undefined}
                error={Boolean(submitError)}
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
          }}
          title="Review Solution Proposal"
        >
          <div className="space-y-4">
            <div className="rounded-lg bg-slate-50 p-4 border border-slate-100 space-y-2">
              <div className="flex justify-between items-center text-sm">
                <div>
                  <span className="font-semibold text-slate-700">Developer:</span>{" "}
                  <span className="text-slate-900 font-semibold">{selectedSubmission.username}</span>
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
                <span className="font-semibold text-slate-700">PR Link:</span>{" "}
                <a
                  href={selectedSubmission.pullRequestUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-blue-600 hover:text-blue-700 font-mono text-xs hover:underline truncate max-w-[400px]"
                >
                  {selectedSubmission.pullRequestUrl}
                </a>
              </div>
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
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    Review Feedback Comments <span className="text-red-500 font-normal">(Required only for Rejections)</span>
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

                {reviewError && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <p className="text-sm text-red-700">{reviewError}</p>
                  </div>
                )}

                <div className="flex flex-wrap gap-3 pt-2">
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
                  <Button
                    variant="outline"
                    onClick={() => submitReview(false)}
                    disabled={isSubmittingReview || !reviewComments.trim()}
                    title={!reviewComments.trim() ? "Comments are required for rejection" : "Reject proposal"}
                    className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 flex items-center gap-1.5"
                  >
                    {isSubmittingReview ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <X size={16} />
                    )}
                    Reject Proposal
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setShowReviewModal(false)
                      setSelectedSubmission(null)
                      setReviewComments('')
                      setReviewError(null)
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
    </main>
  )
}
