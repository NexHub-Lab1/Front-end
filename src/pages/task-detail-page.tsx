import { ArrowLeft, Bookmark, Send, UserPlus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { AppHeader } from '../components/app/app-header'
import type { TaskResponse, User, TaskAssignmentResponse } from '../types/app'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardBody, CardDescription, CardTitle } from '../components/ui/card'
import Modal from '../components/ui/modal'
import { Input } from '../components/ui/input'
import { fetchProjectsByCurrentUser } from '../lib/project-storage'
import { createSubmission } from '../lib/submission-storage'
import { fetchAssignmentsByUser, createAssignment } from '../lib/assignment-storage'

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
        const response = await fetch(`/api/tasks/${parsedId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('nexhub-auth-user') ? JSON.parse(localStorage.getItem('nexhub-auth-user')!).token : ''}`,
          },
        })

        if (!response.ok) {
          throw new Error('Unable to load task')
        }

        const data = await response.json()
        if (data.status === 'error' || !data.data) {
          throw new Error(data.message || 'Unable to load task')
        }

        setTask(data.data)

        if (currentUser) {
          const projectsRes = await fetchProjectsByCurrentUser()
          if (projectsRes.data) {
            const isOwner = projectsRes.data.some(p => p.id === data.data.projectId)
            setIsOwner(isOwner)
          }

          const assignmentsRes = await fetchAssignmentsByUser(currentUser.id)
          if (assignmentsRes.data) {
            const activeAssignment = assignmentsRes.data.find(
              a => a.taskId === parsedId && a.status !== 'COMPLETED'
            )
            setUserAssignment(activeAssignment || null)
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

      const result = await createAssignment({
        taskId: task.id,
        userId: currentUser.id,
      })

      if (result.status === 'success' && result.data) {
        setUserAssignment(result.data)
        alert('Task assigned successfully! You can now work on this task.')
      } else {
        setAssignError(result.message || 'Failed to assign task')
      }
    } catch (error) {
      setAssignError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsAssigning(false)
    }
  }

  const handleSubmit = async () => {
    if (!prUrl.trim()) {
      setSubmitError('Please enter a Pull Request URL')
      return
    }

    if (!prUrl.startsWith('http://') && !prUrl.startsWith('https://')) {
      setSubmitError('Please enter a valid URL (must start with http:// or https://)')
      return
    }

    if (!userAssignment) {
      setSubmitError('You must be assigned to this task before submitting')
      return
    }

    try {
      setIsSubmitting(true)
      setSubmitError(null)

      const result = await createSubmission({
        assignmentId: userAssignment.id,
        pullRequestUrl: prUrl,
      })

      if (result.status === 'success') {
        setShowSubmitModal(false)
        setPrUrl('')
        alert('Submission created successfully!')
        
        // Reload assignments to update status
        if (currentUser) {
          const assignmentsRes = await fetchAssignmentsByUser(currentUser.id)
          if (assignmentsRes.data) {
            const updatedAssignment = assignmentsRes.data.find(
              a => a.taskId === task?.id && a.status !== 'COMPLETED'
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

  const assignmentButton = getAssignmentButtonContent()
  const submitButton = getSubmitButtonContent()

  return (
    <main className="min-h-screen px-4 py-5 sm:px-6 lg:px-8">
      <AppHeader onSignOut={onSignOut} onOpenMenu={onOpenMenu} />

      <section className="mx-auto mt-6 max-w-5xl space-y-2">
        <Button variant="ghost" onClick={() => navigate(-1)} className="w-fit">
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
                onChange={(e) => setPrUrl(e.target.value)}
                placeholder="https://github.com/..."
                disabled={isSubmitting}
              />
              {submitError && (
                <p className="text-sm text-red-600">{submitError}</p>
              )}
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
