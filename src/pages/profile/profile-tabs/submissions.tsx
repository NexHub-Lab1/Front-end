import { useEffect, useState } from 'react'
import { Card, CardBody, CardDescription, CardTitle } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { readStoredUser } from '../../../lib/auth-storage'
import type { TaskSubmissionResponse } from '../../../types/app'
import { fetchSubmissionsByUser } from '../../../lib/submission-storage'

export function SubmissionsTab() {
  const currentUser = readStoredUser()
  const [submissions, setSubmissions] = useState<TaskSubmissionResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadUserSubmissions = async () => {
    try {
      setIsLoading(true)
      if (!currentUser) {
        setSubmissions([])
        return
      }

      const result = await fetchSubmissionsByUser(currentUser.id)
      if (result.status === 'success' && result.data) {
        // Sort by submitted date descending
        const sorted = result.data.sort((a, b) =>
          new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
        )
        setSubmissions(sorted)
      } else {
        setSubmissions([])
      }
    } catch (error) {
      console.error('Error loading submissions:', error)
      setSubmissions([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadUserSubmissions()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-50 text-green-700 border-green-200'
      case 'REJECTED':
        return 'bg-red-50 text-red-700 border-red-200'
      case 'PENDING':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200'
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardBody className="p-6 space-y-3">
          <CardTitle className="text-2xl">Loading...</CardTitle>
        </CardBody>
      </Card>
    )
  }

  if (submissions.length === 0) {
    return (
      <Card>
        <CardBody className="p-6 space-y-3">
          <CardTitle className="text-2xl">My Submissions</CardTitle>
          <CardDescription>You haven't submitted any tasks yet.</CardDescription>
        </CardBody>
      </Card>
    )
  }

  return (
    <Card>
      <CardBody className="p-6 space-y-6">
        <div>
          <CardTitle className="text-2xl mb-4">My Submissions</CardTitle>
          <div className="space-y-3">
            {submissions.map((submission) => (
              <div
                key={submission.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-base">{submission.taskTitle}</h3>
                    <p className="text-sm text-gray-600">{submission.projectName}</p>
                  </div>
                  <Badge variant="secondary" className={getStatusColor(submission.status)}>
                    {submission.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-3">
                  <div>
                    <p className="text-gray-600">
                      <span className="font-medium">Submitted:</span>{' '}
                      {new Date(submission.submittedAt).toLocaleDateString()}
                    </p>
                  </div>
                  {submission.reviewedAt && (
                    <div>
                      <p className="text-gray-600">
                        <span className="font-medium">Reviewed:</span>{' '}
                        {new Date(submission.reviewedAt).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-gray-600">
                      <span className="font-medium">Attempts used:</span> {submission.attemptsUsed}
                    </p>
                  </div>
                  {submission.reviewerUsername && (
                    <div>
                      <p className="text-gray-600">
                        <span className="font-medium">Reviewed by:</span> {submission.reviewerUsername}
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="font-medium">Pull Request:</span>{' '}
                    <a
                      href={submission.pullRequestUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline break-all"
                    >
                      {submission.pullRequestUrl}
                    </a>
                  </p>

                  {submission.reviewComments && (
                    <div className="bg-gray-50 rounded p-3 mt-3">
                      <p className="text-sm font-medium text-gray-700 mb-1">Reviewer Comments:</p>
                      <p className="text-sm text-gray-600">{submission.reviewComments}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardBody>
    </Card>
  )
}
