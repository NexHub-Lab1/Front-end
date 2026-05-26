import { useEffect, useState, useCallback } from 'react'
import { Card, CardBody, CardDescription, CardTitle } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { PaginationControls } from '../../../components/ui/pagination-controls'
import type { PaginatedResponse, TaskSubmissionResponse, User } from '../../../types/app'
import { fetchSubmissionsByUser } from '../../../lib/submission-storage'
import { PROFILE_PAGE_SIZE, createEmptyPaginatedResponse } from '../../../lib/pagination'
import { readStoredProfileDashboard } from '../../../lib/dashboard-storage'

export function SubmissionsTab({ 
    user 
}: { 
    user: User 
}) {
  const [submissionsPage, setSubmissionsPage] = useState<PaginatedResponse<TaskSubmissionResponse>>(() => {
    const dashboard = readStoredProfileDashboard();
    return dashboard?.submissions || createEmptyPaginatedResponse<TaskSubmissionResponse>(0, PROFILE_PAGE_SIZE);
  })
  const [currentPage, setCurrentPage] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  const loadUserSubmissions = useCallback(async (pageOverride = currentPage) => {
    if (!user?.id) return;

    try {
      setIsLoading(true)

      const result = await fetchSubmissionsByUser(user.id, {
        page: pageOverride,
        size: PROFILE_PAGE_SIZE,
        sort: ['submittedAt,desc'],
      })
      if (result.status === 'success' && result.data) {
        setSubmissionsPage(result.data)
      } else {
        setSubmissionsPage(createEmptyPaginatedResponse<TaskSubmissionResponse>(pageOverride, PROFILE_PAGE_SIZE))
      }
    } catch (error) {
      console.error('Error loading submissions:', error)
      setSubmissionsPage(createEmptyPaginatedResponse<TaskSubmissionResponse>(pageOverride, PROFILE_PAGE_SIZE))
    } finally {
      setIsLoading(false)
    }
  }, [user.id, currentPage]);

  useEffect(() => {
    const syncFromDashboard = () => {
      const dashboard = readStoredProfileDashboard();
      if (dashboard?.submissions && currentPage === 0) {
        setSubmissionsPage(dashboard.submissions);
      }
    };

    if (currentPage > 0) {
      void loadUserSubmissions();
    } else {
      syncFromDashboard();
    }

    window.addEventListener('nexhub-dashboard-updated', syncFromDashboard);
    return () => window.removeEventListener('nexhub-dashboard-updated', syncFromDashboard);
  }, [loadUserSubmissions, currentPage]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'bg-green-50 text-green-700 border-green-200'
      case 'rejected':
        return 'bg-red-50 text-red-700 border-red-200'
      case 'submitted':
      case 'changes_requested':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200'
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  if (isLoading && submissionsPage.content.length === 0) {
    return (
      <Card className="border-none shadow-none">
        <CardBody className="p-10 text-center space-y-3">
          <CardTitle className="text-2xl">Loading...</CardTitle>
        </CardBody>
      </Card>
    )
  }

  return (
    <Card>
      <CardBody className="p-6 space-y-6">
        <div>
          <CardTitle className="text-2xl mb-4">My Submissions</CardTitle>
          
          {submissionsPage.content.length === 0 && !isLoading ? (
            <div className="py-12 text-center border-2 border-dashed rounded-xl">
              <CardDescription className="text-base">You haven't submitted any tasks yet.</CardDescription>
            </div>
          ) : (
            <div className="space-y-4">
              {submissionsPage.content.map((submission) => (
                <div
                  key={submission.id}
                  className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-all hover:border-blue-200"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg line-clamp-1">{submission.taskTitle}</h3>
                      <p className="text-sm text-slate-500 line-clamp-1">{submission.projectName}</p>
                    </div>
                    <Badge variant="secondary" className={`border-slate-100 ${getStatusColor(submission.status)}`}>
                      {submission.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4 border-t border-slate-50 pt-3">
                    <div className="space-y-1">
                      <p className="text-slate-600">
                        <span className="font-medium text-slate-800">Submitted:</span>{' '}
                        {new Date(submission.submittedAt).toLocaleDateString()}
                      </p>
                      {submission.reviewedAt && (
                        <p className="text-slate-600">
                          <span className="font-medium text-slate-800">Reviewed:</span>{' '}
                          {new Date(submission.reviewedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-slate-600">
                        <span className="font-medium text-slate-800">Attempts:</span> {submission.attemptsUsed}
                      </p>
                      {submission.reviewerUsername && (
                        <p className="text-slate-600">
                          <span className="font-medium text-slate-800">Reviewer:</span> {submission.reviewerUsername}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="bg-slate-50 rounded-md p-3">
                      <p className="font-medium text-slate-700 text-xs mb-1 uppercase tracking-tight">Pull Request</p>
                      <a
                        href={submission.pullRequestUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline break-all font-mono text-[11px]"
                      >
                        {submission.pullRequestUrl}
                      </a>
                    </div>

                    {submission.reviewComments && (
                      <div className="bg-amber-50/50 border border-amber-100 rounded-md p-3">
                        <p className="text-xs font-semibold text-amber-800 mb-1">Reviewer Feedback:</p>
                        <p className="text-sm text-slate-700 italic">{submission.reviewComments}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {submissionsPage.totalPages > 1 && (
          <PaginationControls
            page={submissionsPage.page}
            totalPages={submissionsPage.totalPages}
            totalElements={submissionsPage.totalElements}
            itemLabel="submission"
            isLoading={isLoading}
            onPageChange={setCurrentPage}
          />
        )}
      </CardBody>
    </Card>
  )
}
