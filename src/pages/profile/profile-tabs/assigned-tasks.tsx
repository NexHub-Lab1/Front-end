import { ArrowRight, RefreshCw } from 'lucide-react'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import { Card, CardBody, CardDescription, CardTitle } from '../../../components/ui/card'
import { PaginationControls } from '../../../components/ui/pagination-controls'
import { fetchAssignmentsByUser } from '../../../lib/assignment-storage'
import type { PaginatedResponse, TaskAssignmentResponse, User } from '../../../types/app'
import { PROFILE_PAGE_SIZE, createEmptyPaginatedResponse } from '../../../lib/pagination'
import { readStoredProfileDashboard } from '../../../lib/dashboard-storage'

function statusClassName(status: string) {
  switch (status.toLowerCase()) {
    case 'active':
    case 'in_progress':
      return 'border-blue-200 bg-blue-50 text-blue-700'
    case 'submitted':
      return 'border-amber-200 bg-amber-50 text-amber-700'
    default:
      return 'border-slate-200 bg-slate-50 text-slate-700'
  }
}

export function AssignedTasksTab({ 
    user 
}: { 
    user: User 
}) {
  const navigate = useNavigate()
  const [assignmentsPage, setAssignmentsPage] = useState<PaginatedResponse<TaskAssignmentResponse>>(() => {
    const dashboard = readStoredProfileDashboard();
    return dashboard?.assignments || createEmptyPaginatedResponse<TaskAssignmentResponse>(0, PROFILE_PAGE_SIZE);
  })
  const [currentPage, setCurrentPage] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  
  const hasMounted = useRef(false)

  const loadAssignedTasks = useCallback(async (pageOverride = currentPage) => {
    if (!user?.id) return;

    try {
      setIsLoading(true)
      setLoadError(null)

      const response = await fetchAssignmentsByUser(
        user.id,
        {
          page: pageOverride,
          size: PROFILE_PAGE_SIZE,
          sort: ['assignedAt,desc'],
        },
        true,
      )
      if (response.status === 'error' || !response.data) {
        setAssignmentsPage(createEmptyPaginatedResponse<TaskAssignmentResponse>(pageOverride, PROFILE_PAGE_SIZE))
        setLoadError(response.message || 'Unable to load assigned tasks.')
        return
      }

      setAssignmentsPage(response.data)
    } catch (error) {
      console.error('Failed to load assigned tasks', error)
      setAssignmentsPage(createEmptyPaginatedResponse<TaskAssignmentResponse>(pageOverride, PROFILE_PAGE_SIZE))
      setLoadError(error instanceof Error ? error.message : 'Unable to load assigned tasks.')
    } finally {
      setIsLoading(false)
    }
  }, [user.id, currentPage]);

  useEffect(() => {
    const syncFromDashboard = () => {
      const dashboard = readStoredProfileDashboard();
      if (dashboard?.assignments && currentPage === 0) {
        setAssignmentsPage(dashboard.assignments);
      }
    };

    if (!hasMounted.current) {
      hasMounted.current = true;
      if (assignmentsPage.content.length === 0 || currentPage > 0) {
        void loadAssignedTasks();
      }
    } else {
      void loadAssignedTasks();
    }

    window.addEventListener('nexhub-dashboard-updated', syncFromDashboard);
    return () => window.removeEventListener('nexhub-dashboard-updated', syncFromDashboard);
  }, [loadAssignedTasks, currentPage]);

  return (
    <Card>
      <CardBody className="flex h-full max-h-full flex-col gap-6 p-6">
        <section className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-3xl">Assigned Tasks</CardTitle>
            <CardDescription className="mt-2 text-base">
              Tasks you chose to work on and still need to finish.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => void loadAssignedTasks(currentPage)} disabled={isLoading}>
            <RefreshCw size={14} className={isLoading ? "animate-spin mr-2" : "mr-2"} />
            Refresh
          </Button>
        </section>

        {loadError ? (
          <Card className="border-red-100 bg-red-50/70 shadow-none">
            <CardBody className="p-4">
              <CardDescription className="text-red-700">{loadError}</CardDescription>
            </CardBody>
          </Card>
        ) : null}

        {assignmentsPage.content.length === 0 && !loadError && !isLoading ? (
          <Card className="shadow-none border-dashed border-2">
            <CardBody className="p-10 text-center space-y-4">
              <CardTitle className="text-xl">No assigned tasks yet</CardTitle>
              <CardDescription className="max-w-xs mx-auto">
                When you assign yourself to a task, it will appear here until it is completed.
              </CardDescription>
              <Button className="mt-5" variant="primary" onClick={() => navigate('/tasks')}>
                Explore tasks
                <ArrowRight size={16} />
              </Button>
            </CardBody>
          </Card>
        ) : (
          <>
            <div className="grid flex-1 grid-cols-1 gap-3 overflow-y-auto lg:grid-cols-2 pb-4">
              {assignmentsPage.content.map((assignment) => (
                <Card key={assignment.id} className="h-fit shadow-none border border-slate-200" hoverShadow={true}>
                  <CardBody className="space-y-4 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <CardTitle className="text-xl font-medium line-clamp-1">{assignment.taskTitle}</CardTitle>
                        <CardDescription className="line-clamp-1">{assignment.projectName}</CardDescription>
                      </div>
                      <Badge variant="outline" className={statusClassName(assignment.status)}>
                        {assignment.status}
                      </Badge>
                    </div>

                    <div className="grid gap-2 text-sm text-slate-600 border-t border-slate-50 pt-3">
                      <p>
                        <span className="font-medium text-slate-800">Assigned:</span>{' '}
                        {new Date(assignment.assignedAt).toLocaleDateString()}
                      </p>
                      <p>
                        <span className="font-medium text-slate-800">Attempts used:</span>{' '}
                        {assignment.attemptsUsed}
                      </p>
                    </div>

                    <Button
                      variant="primary"
                      className="w-full mt-2"
                      onClick={() => navigate(`/task/${assignment.taskId}`, { state: { backTo: '/profile?tab=assigned-tasks' } })}
                    >
                      View task
                      <ArrowRight size={16} />
                    </Button>
                  </CardBody>
                </Card>
              ))}
            </div>
            <PaginationControls
              page={assignmentsPage.page}
              totalPages={assignmentsPage.totalPages}
              totalElements={assignmentsPage.totalElements}
              itemLabel="assignment"
              isLoading={isLoading}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </CardBody>
    </Card>
  )
}
