import { useEffect, useState } from 'react'
import { Card, CardBody, CardDescription, CardTitle } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import { Check, X, AlertCircle, RefreshCw } from 'lucide-react'
import Modal from '../../../components/ui/modal'
import type { TaskSubmissionResponse } from '../../../types/app'
import { fetchSubmissionsByTask } from '../../../lib/submission-storage'
import { fetchAllTasks } from '../../../lib/task-storage'
import { fetchProjectsByCurrentUser } from '../../../lib/project-storage'
import { readStoredUser } from '../../../lib/auth-storage'
import { updateSubmission } from '../../../lib/submission-storage'

export function ToReviewTab() {
  const currentUser = readStoredUser()
  const [submissions, setSubmissions] = useState<TaskSubmissionResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [selectedSubmission, setSelectedSubmission] = useState<TaskSubmissionResponse | null>(null)
  const [reviewComments, setReviewComments] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve')
  const [reviewFeedback, setReviewFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [debugInfo, setDebugInfo] = useState<{
    projectsCount: number
    tasksCount: number
    ownedTasksCount: number
    totalSubmissions: number
    pendingSubmissions: number
  } | null>(null)

  const loadSubmissionsToReview = async () => {
    try {
      setIsLoading(true)
      setLoadError(null)
      
      console.log('🔍 Starting to load submissions to review...')
      
      if (!currentUser) {
        setLoadError('No user logged in')
        setSubmissions([])
        return
      }

      const projectsRes = await fetchProjectsByCurrentUser()
      
      if (projectsRes.status === 'error' || !projectsRes.data) {
        setLoadError('Failed to load projects: ' + projectsRes.message)
        setSubmissions([])
        return
      }

      const ownedProjects = projectsRes.data
      const ownedProjectIds = ownedProjects.map(p => p.id)
      
      if (ownedProjectIds.length === 0) {
        setSubmissions([])
        setDebugInfo({
          projectsCount: 0,
          tasksCount: 0,
          ownedTasksCount: 0,
          totalSubmissions: 0,
          pendingSubmissions: 0
        })
        return
      }

      const tasksRes = await fetchAllTasks()
      
      if (tasksRes.status === 'error' || !tasksRes.data) {
        setLoadError('Failed to load tasks: ' + tasksRes.message)
        setSubmissions([])
        return
      }

      const allTasks = tasksRes.data

      const ownedTasks = allTasks.filter(task => 
        ownedProjectIds.includes(task.projectId)
      )

      if (ownedTasks.length === 0) {
        setSubmissions([])
        setDebugInfo({
          projectsCount: ownedProjects.length,
          tasksCount: allTasks.length,
          ownedTasksCount: 0,
          totalSubmissions: 0,
          pendingSubmissions: 0
        })
        return
      }

      const allSubmissions: TaskSubmissionResponse[] = []
      let totalSubmissionsCount = 0
      
      for (const task of ownedTasks) {
        
        try {
          const submissionsRes = await fetchSubmissionsByTask(task.id)
          
          if (submissionsRes.status === 'success' && submissionsRes.data) {
            totalSubmissionsCount += submissionsRes.data.length
            const pendingSubmissions = submissionsRes.data.filter(sub => {
              return sub.status === 'submitted'
            })
            
            allSubmissions.push(...pendingSubmissions)
          } else {
            console.log(`  - No submissions or error for task ${task.id}`)
          }
        } catch (taskError) {
          console.error(`Error fetching submissions for task ${task.id}:`, taskError)
        }
      }

      setSubmissions(allSubmissions)
      setDebugInfo({
        projectsCount: ownedProjects.length,
        tasksCount: allTasks.length,
        ownedTasksCount: ownedTasks.length,
        totalSubmissions: totalSubmissionsCount,
        pendingSubmissions: allSubmissions.length
      })
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Unknown error occurred')
      setSubmissions([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadSubmissionsToReview()
  }, [])

  const handleReview = (submission: TaskSubmissionResponse, approved: boolean) => {
    setSelectedSubmission(submission)
    setReviewComments('')
    setReviewAction(approved ? 'approve' : 'reject')
    setShowReviewModal(true)
  }

  const submitReview = async () => {
    if (!selectedSubmission || !currentUser) return

    const approved = reviewAction === 'approve'

    try {
      setIsSubmitting(true)
      setReviewFeedback(null)
      
      const result = await updateSubmission({
        id: selectedSubmission.id,
        pullRequestUrl: selectedSubmission.pullRequestUrl,
        status: approved ? 'APPROVED' : 'REJECTED',
        reviewComments: reviewComments.trim() || (approved ? 'Approved' : 'Rejected'),
        reviewerId: currentUser.id,
      })

      if (result.status === 'success') {
        setShowReviewModal(false)
        setReviewComments('')
        setSelectedSubmission(null)
        await loadSubmissionsToReview()
        setReviewFeedback({
          type: 'success',
          message: `Submission ${approved ? 'approved' : 'rejected'} successfully.`,
        })
      } else {
        setReviewFeedback({
          type: 'error',
          message: 'Failed to submit review: ' + result.message,
        })
      }
    } catch (error) {
      setReviewFeedback({
        type: 'error',
        message: 'Error submitting review: ' + (error instanceof Error ? error.message : 'Unknown error'),
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardBody className="p-6 space-y-3">
          <CardTitle className="text-2xl">Loading...</CardTitle>
          <CardDescription>Fetching submissions to review...</CardDescription>
        </CardBody>
      </Card>
    )
  }

  if (loadError) {
    return (
      <Card>
        <CardBody className="p-6 space-y-4">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle size={20} />
            <CardTitle className="text-2xl">Error Loading Submissions</CardTitle>
          </div>
          <CardDescription className="text-red-700">{loadError}</CardDescription>
          <Button 
            variant="outline" 
            onClick={loadSubmissionsToReview}
            className="w-fit"
          >
            <RefreshCw size={16} className="mr-2" />
            Retry
          </Button>
        </CardBody>
      </Card>
    )
  }

  return (
    <Card>
      <CardBody className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl">Tasks to Review</CardTitle>
            {debugInfo && (
              <CardDescription className="mt-2 text-sm space-y-1">
                <div>Your projects: {debugInfo.projectsCount}</div>
                <div>Your tasks: {debugInfo.ownedTasksCount}</div>
                <div>Total submissions: {debugInfo.totalSubmissions}</div>
                <div>Pending submissions: {debugInfo.pendingSubmissions}</div>
              </CardDescription>
            )}
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={loadSubmissionsToReview}
          >
            <RefreshCw size={14} className="mr-2" />
            Refresh
          </Button>
        </div>

        {reviewFeedback ? (
          <Card
            className={`shadow-none ${
              reviewFeedback.type === 'success'
                ? 'border-green-200 bg-green-50'
                : 'border-red-200 bg-red-50'
            }`}
          >
            <CardBody className="p-4">
              <CardDescription
                className={reviewFeedback.type === 'success' ? 'text-green-700' : 'text-red-700'}
              >
                {reviewFeedback.message}
              </CardDescription>
            </CardBody>
          </Card>
        ) : null}

        {submissions.length === 0 ? (
          <div className="text-center py-8 space-y-2">
            <CardDescription className="text-base">
              No submissions to review at the moment.
            </CardDescription>
            {debugInfo && debugInfo.ownedTasksCount > 0 && (
              <CardDescription className="text-sm text-gray-500">
                You have {debugInfo.ownedTasksCount} task{debugInfo.ownedTasksCount !== 1 ? 's' : ''} but no pending submissions yet.
              </CardDescription>
            )}
            {debugInfo && debugInfo.ownedTasksCount === 0 && debugInfo.projectsCount > 0 && (
              <CardDescription className="text-sm text-gray-500">
                Create tasks in your projects to receive submissions.
              </CardDescription>
            )}
            {debugInfo && debugInfo.projectsCount === 0 && (
              <CardDescription className="text-sm text-gray-500">
                Create a project and add tasks to start receiving submissions.
              </CardDescription>
            )}
          </div>
        ) : (
          <div className="grid gap-3 grid-cols-1 lg:grid-cols-2">
            {submissions.map((submission) => (
              <div
                key={submission.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-base">{submission.taskTitle}</h3>
                      <p className="text-sm text-gray-600">{submission.projectName}</p>
                    </div>
                    <Badge variant="secondary" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                      {submission.status}
                    </Badge>
                  </div>

                  <div className="space-y-1 text-sm">
                    <p className="text-gray-600">
                      <span className="font-medium">Submitted by:</span> {submission.username}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">PR:</span>{' '}
                      <a
                        href={submission.pullRequestUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline break-all"
                      >
                        {submission.pullRequestUrl.length > 50 
                          ? submission.pullRequestUrl.substring(0, 50) + '...' 
                          : submission.pullRequestUrl}
                      </a>
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">Submitted:</span>{' '}
                      {new Date(submission.submittedAt).toLocaleDateString()} at{' '}
                      {new Date(submission.submittedAt).toLocaleTimeString()}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">Attempt:</span> {submission.attemptsUsed}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleReview(submission, true)}
                      className="flex-1"
                    >
                      <Check size={14} className="mr-1" />
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReview(submission, false)}
                      className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                    >
                      <X size={14} className="mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardBody>

      {showReviewModal && selectedSubmission && (
        <Modal
          isOpen={showReviewModal}
          onClose={() => {
            setShowReviewModal(false)
            setSelectedSubmission(null)
            setReviewComments('')
          }}
          title={`Review Submission`}
        >
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <p className="text-sm">
                <span className="font-medium">Task:</span> {selectedSubmission.taskTitle}
              </p>
              <p className="text-sm">
                <span className="font-medium">Project:</span> {selectedSubmission.projectName}
              </p>
              <p className="text-sm">
                <span className="font-medium">Submitted by:</span> {selectedSubmission.username}
              </p>
              <p className="text-sm">
                <span className="font-medium">PR URL:</span>{' '}
                <a
                  href={selectedSubmission.pullRequestUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  View Pull Request
                </a>
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">
                Review Comments {reviewAction === 'reject' && <span className="text-red-600">*</span>}
              </label>
              <textarea
                value={reviewComments}
                onChange={(e) => setReviewComments(e.target.value)}
                placeholder={reviewAction === 'approve' 
                  ? "Add your feedback (optional)" 
                  : "Please explain why you're rejecting this submission"}
                rows={4}
                className={`w-full rounded-md border p-2 text-sm focus:ring-2 focus:border-transparent ${
                  reviewAction === 'reject' && !reviewComments.trim()
                    ? 'border-red-300 focus:ring-red-200'
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
              />
              {reviewAction === 'reject' && !reviewComments.trim() && (
                <p className="text-xs text-red-600">Comments are required when rejecting a submission</p>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <p className="text-sm text-blue-700">
                You are about to <strong>{reviewAction === 'approve' ? 'approve' : 'reject'}</strong> this submission.
                {reviewAction === 'reject' && ' The contributor will be notified and can submit again if attempts remain.'}
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="primary"
                onClick={submitReview}
                disabled={isSubmitting || (reviewAction === 'reject' && !reviewComments.trim())}
                className={reviewAction === 'reject' ? 'bg-red-600 hover:bg-red-700' : ''}
              >
                {isSubmitting ? 'Submitting...' : (reviewAction === 'approve' ? 'Approve' : 'Reject')}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowReviewModal(false)
                  setSelectedSubmission(null)
                  setReviewComments('')
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </Card>
  )
}
