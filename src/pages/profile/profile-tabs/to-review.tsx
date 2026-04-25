import { useEffect, useState } from 'react'
import { AlertCircle, Check, RefreshCw, X } from 'lucide-react'

import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import { Card, CardBody, CardDescription, CardTitle } from '../../../components/ui/card'
import Modal from '../../../components/ui/modal'
import { PaginationControls } from '../../../components/ui/pagination-controls'
import { readStoredUser } from '../../../lib/auth-storage'
import { PROFILE_PAGE_SIZE, createEmptyPaginatedResponse } from '../../../lib/pagination'
import { fetchSubmissionsToReview, updateSubmission } from '../../../lib/submission-storage'
import type { PaginatedResponse, TaskSubmissionResponse } from '../../../types/app'

export function ToReviewTab() {
  const currentUser = readStoredUser()
  const [submissionsPage, setSubmissionsPage] = useState<PaginatedResponse<TaskSubmissionResponse>>(
    createEmptyPaginatedResponse<TaskSubmissionResponse>(0, PROFILE_PAGE_SIZE),
  )
  const [currentPage, setCurrentPage] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [selectedSubmission, setSelectedSubmission] = useState<TaskSubmissionResponse | null>(null)
  const [reviewComments, setReviewComments] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve')
  const [reviewFeedback, setReviewFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const loadSubmissionsToReview = async (pageOverride = currentPage) => {
    try {
      setIsLoading(true)
      setLoadError(null)

      if (!currentUser) {
        setSubmissionsPage(createEmptyPaginatedResponse<TaskSubmissionResponse>(pageOverride, PROFILE_PAGE_SIZE))
        return
      }

      const response = await fetchSubmissionsToReview(currentUser.id, {
        page: pageOverride,
        size: PROFILE_PAGE_SIZE,
        sort: ['submittedAt,desc'],
      })

      if (response.status === 'error' || !response.data) {
        setSubmissionsPage(createEmptyPaginatedResponse<TaskSubmissionResponse>(pageOverride, PROFILE_PAGE_SIZE))
        setLoadError(response.message || 'Failed to load submissions to review.')
        return
      }

      setSubmissionsPage(response.data)
    } catch (error) {
      setSubmissionsPage(createEmptyPaginatedResponse<TaskSubmissionResponse>(pageOverride, PROFILE_PAGE_SIZE))
      setLoadError(error instanceof Error ? error.message : 'Unknown error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadSubmissionsToReview()
  }, [currentPage])

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
        await loadSubmissionsToReview(currentPage)
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
            onClick={() => void loadSubmissionsToReview(currentPage)}
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
            <CardDescription className="mt-2">
              Pending submissions for tasks owned by your projects.
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void loadSubmissionsToReview(currentPage)}
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

        {submissionsPage.content.length === 0 ? (
          <div className="py-8 text-center">
            <CardDescription className="text-base">
              No submissions to review at the moment.
            </CardDescription>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {submissionsPage.content.map((submission) => (
                <div
                  key={submission.id}
                  className="rounded-lg border border-gray-200 p-4 transition-shadow hover:shadow-md"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-base">{submission.taskTitle}</h3>
                        <p className="text-sm text-gray-600">{submission.projectName}</p>
                      </div>
                      <Badge variant="secondary" className="border-yellow-200 bg-yellow-50 text-yellow-700">
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
                          className="break-all text-blue-600 hover:underline"
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

            <PaginationControls
              page={submissionsPage.page}
              totalPages={submissionsPage.totalPages}
              totalElements={submissionsPage.totalElements}
              itemLabel="submission"
              isLoading={isLoading}
              onPageChange={setCurrentPage}
            />
          </>
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
            <div className="space-y-2 rounded-lg bg-gray-50 p-4">
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
                className={`w-full rounded-md border p-2 text-sm focus:border-transparent focus:ring-2 ${
                  reviewAction === 'reject' && !reviewComments.trim()
                    ? 'border-red-300 focus:ring-red-200'
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
              />
              {reviewAction === 'reject' && !reviewComments.trim() && (
                <p className="text-xs text-red-600">Comments are required when rejecting a submission</p>
              )}
            </div>

            <div className="rounded-md border border-blue-200 bg-blue-50 p-3">
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
