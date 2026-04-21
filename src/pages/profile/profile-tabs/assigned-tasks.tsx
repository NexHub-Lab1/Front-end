import { ArrowRight, RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import { Card, CardBody, CardDescription, CardTitle } from '../../../components/ui/card'
import { readStoredUser } from '../../../lib/auth-storage'
import { fetchAssignmentsByUser } from '../../../lib/assignment-storage'
import type { TaskAssignmentResponse } from '../../../types/app'

function isOpenAssignment(assignment: TaskAssignmentResponse) {
  const status = assignment.status.toLowerCase()
  return status !== 'completed' && status !== 'cancelled'
}

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

export function AssignedTasksTab() {
  const navigate = useNavigate()
  const currentUser = readStoredUser()
  const [assignments, setAssignments] = useState<TaskAssignmentResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  async function loadAssignedTasks() {
    if (!currentUser) {
      setAssignments([])
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setLoadError(null)

      const response = await fetchAssignmentsByUser(currentUser.id)
      if (response.status === 'error' || !response.data) {
        setAssignments([])
        setLoadError(response.message || 'Unable to load assigned tasks.')
        return
      }

      setAssignments(
        response.data
          .filter(isOpenAssignment)
          .sort((a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime()),
      )
    } catch (error) {
      setAssignments([])
      setLoadError(error instanceof Error ? error.message : 'Unable to load assigned tasks.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadAssignedTasks()
  }, [])

  if (isLoading) {
    return (
      <Card>
        <CardBody className="space-y-3 p-6">
          <CardTitle className="text-2xl">Assigned Tasks</CardTitle>
          <CardDescription>Loading the tasks assigned to you...</CardDescription>
        </CardBody>
      </Card>
    )
  }

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
          <Button variant="outline" size="sm" onClick={loadAssignedTasks}>
            <RefreshCw size={14} />
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

        {assignments.length === 0 && !loadError ? (
          <Card className="shadow-none">
            <CardBody className="p-6 text-center">
              <CardTitle className="text-xl">No assigned tasks yet</CardTitle>
              <CardDescription className="mt-2">
                When you assign yourself to a task, it will appear here until it is completed.
              </CardDescription>
              <Button className="mt-5" variant="primary" onClick={() => navigate('/tasks')}>
                Explore tasks
                <ArrowRight size={16} />
              </Button>
            </CardBody>
          </Card>
        ) : (
          <div className="grid flex-1 grid-cols-1 gap-3 overflow-y-auto lg:grid-cols-2">
            {assignments.map((assignment) => (
              <Card key={assignment.id} className="h-fit shadow-none" hoverShadow={true}>
                <CardBody className="space-y-4 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <CardTitle className="text-xl font-medium">{assignment.taskTitle}</CardTitle>
                      <CardDescription>{assignment.projectName}</CardDescription>
                    </div>
                    <Badge variant="outline" className={statusClassName(assignment.status)}>
                      {assignment.status}
                    </Badge>
                  </div>

                  <div className="grid gap-2 text-sm text-slate-600">
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
                    className="w-full"
                    onClick={() => navigate(`/task/${assignment.taskId}`)}
                  >
                    View task
                    <ArrowRight size={16} />
                  </Button>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  )
}
