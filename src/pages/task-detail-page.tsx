import { ArrowLeft, Bookmark, CheckCircle, CreditCard, Send, UserPlus, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

import { AppHeader } from '../components/app/app-header'
import type { PaymentResponse, TaskResponse, User, TaskAssignmentResponse } from '../types/app'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardBody, CardDescription, CardTitle } from '../components/ui/card'
import Modal from '../components/ui/modal'
import { Input } from '../components/ui/input'
import { fetchProjectById } from '../lib/project-storage'
import { fetchTaskById } from '../lib/task-storage'
import { createSubmission } from '../lib/submission-storage'
import { fetchAssignmentsByUser, createAssignment } from '../lib/assignment-storage'
import { LOOKUP_PAGE_SIZE } from '../lib/pagination'
import { createTaskPayment, fetchPaymentsByTask, simulatePaymentResult } from '../lib/payment-storage'
import { formatMoney, fundingBadgeClassName, isRewardFunded, normalizeFundingStatus } from '../lib/payment-utils'

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
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [prUrl, setPrUrl] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isAssigning, setIsAssigning] = useState(false)
  const [assignError, setAssignError] = useState<string | null>(null)
  const [taskPayments, setTaskPayments] = useState<PaymentResponse[]>([])
  const [isPaymentActionLoading, setIsPaymentActionLoading] = useState(false)
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const latestPayment = taskPayments[0] ?? null
  const fundingStatus = normalizeFundingStatus(task?.fundingStatus)

  async function loadTaskDetails() {
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
        const projectRes = await fetchProjectById(loadedTask.projectId)
        if (projectRes.status === 'success' && projectRes.data) {
          setIsOwner(projectRes.data.ownerId === currentUser.id)
        }

        const assignmentsRes = await fetchAssignmentsByUser(currentUser.id, {
          page: 0,
          size: LOOKUP_PAGE_SIZE,
          sort: ['assignedAt,desc'],
        })
        if (assignmentsRes.data) {
          const activeAssignment = assignmentsRes.data.content.find(
            a => a.taskId === parsedId && a.status.toLowerCase() !== 'completed'
          )
          setUserAssignment(activeAssignment || null)
        }

        const paymentsRes = await fetchPaymentsByTask(parsedId)
        if (paymentsRes.status === 'success' && paymentsRes.data) {
          setTaskPayments(paymentsRes.data)
        }
      }
    } catch (fetchError) {
      setTask(null)
      setTaskPayments([])
      setError(fetchError instanceof Error ? fetchError.message : 'Unable to load task')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadTaskDetails()
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

  const handleCreatePayment = async () => {
    if (!currentUser || !task) {
      return
    }

    try {
      setIsPaymentActionLoading(true)
      setActionFeedback(null)

      const result = await createTaskPayment({
        taskId: task.id,
        payerId: currentUser.id,
      })

      if (result.status === 'success' && result.data) {
        setTaskPayments([result.data, ...taskPayments])
        setTask({ ...task, fundingStatus: 'pending' })
        setActionFeedback({
          type: 'success',
          message: 'Payment checkout created. Use the mock gateway buttons below to simulate Mercado Pago locally.',
        })
        return
      }

      setActionFeedback({ type: 'error', message: result.message || 'Unable to create payment.' })
    } catch (error) {
      setActionFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'Unable to create payment.',
      })
    } finally {
      setIsPaymentActionLoading(false)
    }
  }

  const handleSimulatePayment = async (status: 'approved' | 'failed') => {
    if (!latestPayment || !task) {
      return
    }

    try {
      setIsPaymentActionLoading(true)
      setActionFeedback(null)

      const result = await simulatePaymentResult({
        paymentId: latestPayment.id,
        status,
        failureReason: status === 'failed' ? 'Mock Mercado Pago payment failed' : undefined,
      })

      if (result.status === 'success' && result.data) {
        setTaskPayments([result.data, ...taskPayments.filter((payment) => payment.id !== result.data?.id)])
        setTask({ ...task, fundingStatus: status === 'approved' ? 'funded' : 'unfunded' })
        setActionFeedback({
          type: status === 'approved' ? 'success' : 'error',
          message: status === 'approved'
            ? 'Payment approved. The reward is now locked in escrow.'
            : 'Payment failed. The task is still unfunded.',
        })
        return
      }

      setActionFeedback({ type: 'error', message: result.message || 'Unable to process payment result.' })
    } catch (error) {
      setActionFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'Unable to process payment result.',
      })
    } finally {
      setIsPaymentActionLoading(false)
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

    if (task && !isRewardFunded(task.fundingStatus)) {
      return {
        text: 'Waiting for funding',
        disabled: true,
        tooltip: 'This task must be funded before developers can assign themselves',
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

    if (task && !isRewardFunded(task.fundingStatus)) {
      return {
        disabled: true,
        tooltip: 'This task must be funded before submissions are accepted',
      }
    }

    return {
      disabled: false,
      tooltip: 'Submit your solution',
    }
  }

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

      <section className="mx-auto mt-6 max-w-5xl space-y-2">
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
          <>
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

                {isOwner ? (
                  <Card className="border-slate-200 bg-white/80 shadow-none">
                    <CardBody className="space-y-4 p-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-slate-900">Task funding</p>
                          <CardDescription>
                            Fund this reward before developers start working. Approved payments are held in escrow until you approve a submission.
                          </CardDescription>
                        </div>
                        <Badge variant="outline" className={fundingBadgeClassName(task.fundingStatus)}>
                          {fundingStatus}
                        </Badge>
                      </div>

                      <div className="grid gap-3 text-sm text-slate-600 md:grid-cols-3">
                        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                          <p className="text-xs uppercase tracking-wide text-slate-400">Reward</p>
                          <p className="mt-1 font-semibold text-slate-900">
                            {formatMoney(task.rewardAmount, task.rewardCurrency)}
                          </p>
                        </div>
                        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                          <p className="text-xs uppercase tracking-wide text-slate-400">Latest payment</p>
                          <p className="mt-1 font-semibold text-slate-900">
                            {latestPayment ? latestPayment.status : 'none'}
                          </p>
                        </div>
                        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                          <p className="text-xs uppercase tracking-wide text-slate-400">Provider</p>
                          <p className="mt-1 font-semibold text-slate-900">
                            {latestPayment ? latestPayment.provider : 'mercadopago'}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {!['pending', 'funded', 'released'].includes(fundingStatus) ? (
                          <Button
                            variant="primary"
                            onClick={handleCreatePayment}
                            disabled={isPaymentActionLoading}
                          >
                            <CreditCard size={16} />
                            {isPaymentActionLoading ? 'Creating...' : 'Fund task'}
                          </Button>
                        ) : null}

                        {latestPayment?.checkoutUrl ? (
                          <Button asChild variant="outline">
                            <a href={latestPayment.checkoutUrl} target="_blank" rel="noopener noreferrer">
                              Open checkout
                            </a>
                          </Button>
                        ) : null}

                        {latestPayment?.status?.toLowerCase() === 'pending' ? (
                          <>
                            <Button
                              variant="secondary"
                              onClick={() => void handleSimulatePayment('approved')}
                              disabled={isPaymentActionLoading}
                            >
                              <CheckCircle size={16} />
                              Simulate approved
                            </Button>
                            <Button
                              variant="outline"
                              className="border-red-200 text-red-600 hover:bg-red-50"
                              onClick={() => void handleSimulatePayment('failed')}
                              disabled={isPaymentActionLoading}
                            >
                              <XCircle size={16} />
                              Simulate failed
                            </Button>
                          </>
                        ) : null}
                      </div>
                    </CardBody>
                  </Card>
                ) : null}

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
                      <p className="text-base text-slate-900">
                        {new Date(task.deadline).toLocaleDateString()}
                      </p>
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

          </>
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
    </main>
  )
}
