import { useEffect, useState, useCallback } from 'react'
import { AlertCircle, Check, RefreshCw, X } from 'lucide-react'

import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import { Card, CardBody, CardDescription, CardTitle } from '../../../components/ui/card'
import Modal from '../../../components/ui/modal'
import { PaginationControls } from '../../../components/ui/pagination-controls'
import { PROFILE_PAGE_SIZE, createEmptyPaginatedResponse } from '../../../lib/pagination'
import { fetchSubmissionsToReview, updateSubmission } from '../../../lib/submission-storage'
import type { PaginatedResponse, TaskSubmissionResponse, User } from '../../../types/app'
import { readStoredProfileDashboard } from '../../../lib/dashboard-storage'

export function ToReviewTab({ 
    user 
}: { 
    user: User 
}) {
  const [submissionsPage, setSubmissionsPage] = useState<PaginatedResponse<TaskSubmissionResponse>>(() => {
    const dashboard = readStoredProfileDashboard();
    return dashboard?.toReview || createEmptyPaginatedResponse<TaskSubmissionResponse>(0, PROFILE_PAGE_SIZE);
  })
  const [currentPage, setCurrentPage] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [selectedSubmission, setSelectedSubmission] = useState<TaskSubmissionResponse | null>(null)
  const [reviewComments, setReviewComments] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve')
  const [reviewFeedback, setReviewFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const loadSubmissionsToReview = useCallback(async (pageOverride = currentPage) => {
    if (!user?.id) return;

    try {
      setIsLoading(true)
      setLoadError(null)

      const response = await fetchSubmissionsToReview(user.id, {
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
      console.error('Failed to load submissions to review', error)
      setSubmissionsPage(createEmptyPaginatedResponse<TaskSubmissionResponse>(pageOverride, PROFILE_PAGE_SIZE))
      setLoadError(error instanceof Error ? error.message : 'Unknown error occurred')
    } finally {
      setIsLoading(false)
    }
  }, [user.id, currentPage]);

  useEffect(() => {
    const syncFromDashboard = () => {
      const dashboard = readStoredProfileDashboard();
      if (dashboard?.toReview && currentPage === 0) {
        setSubmissionsPage(dashboard.toReview);
      }
    };

    if (currentPage > 0) {
      void loadSubmissionsToReview();
    } else {
      syncFromDashboard();
    }

    window.addEventListener('nexhub-dashboard-updated', syncFromDashboard);
    return () => window.removeEventListener('nexhub-dashboard-updated', syncFromDashboard);
  }, [loadSubmissionsToReview, currentPage]);

  const handleReview = (submission: TaskSubmissionResponse, approved: boolean) => {
    setSelectedSubmission(submission)
    setReviewComments('')
    setReviewAction(approved ? 'approve' : 'reject')
    setShowReviewModal(true)
  }

  const submitReview = async () => {
    if (!selectedSubmission || !user?.id) return

    const approved = reviewAction === 'approve'

    try {
      setIsSubmitting(true)
      setReviewFeedback(null)

      const result = await updateSubmission({
        id: selectedSubmission.id,
        pullRequestUrl: selectedSubmission.pullRequestUrl,
        status: approved ? 'APPROVED' : 'REJECTED',
        reviewComments: reviewComments.trim() || (approved ? 'Approved' : 'Rejected'),
        reviewerId: user.id,
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

  if (isLoading && submissionsPage.content.length === 0) {
    return (
      <Card className="border-none shadow-none">
        <CardBody className="p-10 text-center space-y-3">
          <CardTitle className="text-2xl">Loading...</CardTitle>
          <CardDescription>Fetching submissions to review...</CardDescription>
        </CardBody>
      </Card>
    )
  }

  if (loadError) {
    return (
      <Card className="border-red-100 bg-red-50/70 shadow-none">
        <CardBody className="p-8 text-center space-y-4">
          <div className="flex flex-col items-center gap-2 text-red-600">
            <AlertCircle size={32} />
            <CardTitle className="text-2xl">Error Loading Submissions</CardTitle>
          </div>
          <CardDescription className="text-red-700 max-w-sm mx-auto">{loadError}</CardDescription>
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
            disabled={isLoading}
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin mr-2" : "mr-2"} />
            Refresh
          </Button>
        </div>

        {!showReviewModal && reviewFeedback ? (
          <Card
            className={`shadow-none border-2 ${
              reviewFeedback.type === 'success'
                ? 'border-green-100 bg-green-50'
                : 'border-red-100 bg-red-50'
            }`}
          >
            <CardBody className="p-4 flex items-center gap-3">
              {reviewFeedback.type === 'success' ? (
                <Check size={18} className="text-green-600" />
              ) : (
                <X size={18} className="text-red-600" />
              )}
              <CardDescription
                className={reviewFeedback.type === 'success' ? 'text-green-800 font-medium' : 'text-red-800 font-medium'}
              >
                {reviewFeedback.message}
              </CardDescription>
            </CardBody>
          </Card>
        ) : null}

        {submissionsPage.content.length === 0 && !isLoading ? (
          <div className="py-12 text-center border-2 border-dashed rounded-xl">
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
                  className="rounded-lg border border-slate-200 p-4 transition-all hover:shadow-md hover:border-blue-200"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg line-clamp-1">{submission.taskTitle}</h3>
                        <p className="text-sm text-slate-500 line-clamp-1">{submission.projectName}</p>
                      </div>
                      <Badge variant="secondary" className="border-amber-100 bg-amber-50 text-amber-700">
                        {submission.status}
                      </Badge>
                    </div>

                    <div className="space-y-2 text-sm border-t border-slate-50 pt-3">
                      <p className="text-slate-600 flex items-center gap-2">
                        <span className="font-medium text-slate-800">By:</span> {submission.username}
                      </p>
                      <p className="text-slate-600">
                        <span className="font-medium text-slate-800">Submitted:</span>{' '}
                        {new Date(submission.submittedAt).toLocaleDateString()}
                      </p>
                      <p className="text-slate-600">
                        <span className="font-medium text-slate-800">Attempt:</span> {submission.attemptsUsed}
                      </p>
                      <div className="bg-slate-50 rounded-md p-2 mt-1">
                        <p className="font-medium text-slate-700 text-xs mb-1 uppercase tracking-tight">Pull Request</p>
                        <a
                          href={submission.pullRequestUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="break-all text-blue-600 hover:underline font-mono text-[11px]"
                        >
                          {submission.pullRequestUrl}
                        </a>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
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
                        className="flex-1 border-red-100 text-red-600 hover:bg-red-50 hover:border-red-200"
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
            {reviewFeedback && (
              <div className={`p-3 rounded-lg flex items-center gap-3 text-sm border ${
                reviewFeedback.type === 'success'
                  ? 'border-green-100 bg-green-50 text-green-700'
                  : 'border-red-100 bg-red-50 text-red-700'
              }`}>
                {reviewFeedback.type === 'success' ? <Check size={16} className="text-green-600" /> : <X size={16} className="text-red-600" />}
                <span>{reviewFeedback.message}</span>
              </div>
            )}
            <div className="space-y-2 rounded-lg bg-slate-50 p-4 border border-slate-100">
              <p className="text-sm"><span className="font-semibold text-slate-700">Task:</span> {selectedSubmission.taskTitle}</p>
              <p className="text-sm"><span className="font-semibold text-slate-700">PR:</span> <a href={selectedSubmission.pullRequestUrl} target="_blank" className="text-blue-600 hover:underline">{selectedSubmission.pullRequestUrl}</a></p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-800">
                Review Comments {reviewAction === 'reject' && <span className="text-red-600">*</span>}
              </label>
              <textarea
                value={reviewComments}
                onChange={(e) => setReviewComments(e.target.value)}
                placeholder={reviewAction === 'approve'
                  ? "Add your feedback (optional)"
                  : "Please explain why you're rejecting this submission"}
                rows={4}
                className={`w-full rounded-lg border p-3 text-sm focus:outline-none focus:ring-4 ${
                  reviewAction === 'reject' && !reviewComments.trim()
                    ? 'border-red-200 focus:ring-red-100'
                    : 'border-slate-200 focus:ring-blue-100 focus:border-blue-400'
                }`}
              />
              {reviewAction === 'reject' && !reviewComments.trim() && (
                <p className="text-xs text-red-600 font-medium">Comments are required when rejecting a submission</p>
              )}
            </div>

            <div className={`rounded-lg border p-4 ${reviewAction === 'approve' ? 'border-green-100 bg-green-50/50' : 'border-amber-100 bg-amber-50/50'}`}>
              <p className={`text-sm ${reviewAction === 'approve' ? 'text-green-800' : 'text-amber-800'}`}>
                You are about to <strong>{reviewAction === 'approve' ? 'approve' : 'reject'}</strong> this submission.
                {reviewAction === 'reject' && ' The contributor will be notified and can submit again if attempts remain.'}
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="primary"
                onClick={submitReview}
                disabled={isSubmitting || (reviewAction === 'reject' && !reviewComments.trim())}
                className={reviewAction === 'reject' ? 'bg-red-600 hover:bg-red-700' : ''}
              >
                {isSubmitting ? 'Submitting...' : (reviewAction === 'approve' ? 'Approve' : 'Reject')}
              </Button>
              <Button
                variant="ghost"
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
