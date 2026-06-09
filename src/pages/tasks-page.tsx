import { ArrowLeft, CircleDollarSign, FolderKanban, PlusIcon, RotateCcw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { AppHeader } from '../components/app/app-header'
import { StatLine } from '../components/app/stat-line'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardBody, CardDescription, CardTitle } from '../components/ui/card'
import { PaginationControls } from '../components/ui/pagination-controls'
import { CreateTaskModal } from '../components/app/create-task-modal'
import { fetchAllTasks } from '../lib/task-storage'
import type { PaginatedResponse, TaskResponse } from '../types/app'
import { GRID_PAGE_SIZE, createEmptyPaginatedResponse } from '../lib/pagination'
import { readStoredUser } from '../lib/auth-storage'

const formatMoney = (amount: number, currency: string) => {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount)
  } catch (e) {
    return `${amount.toFixed(2)} ${currency}`
  }
}

export function TasksPage({
  onSignOut,
  onOpenMenu,
}: {
  onSignOut: () => void
  onOpenMenu: () => void
}) {
  const navigate = useNavigate()
  const [tasksPage, setTasksPage] = useState<PaginatedResponse<TaskResponse>>(
    createEmptyPaginatedResponse<TaskResponse>(0, GRID_PAGE_SIZE),
  )
  const [currentPage, setCurrentPage] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const currentUser = readStoredUser()

  useEffect(() => {
    async function loadTasks() {
      setIsLoading(true)
      setLoadError(null)

      const tasksResponse = await fetchAllTasks({
        page: currentPage,
        size: GRID_PAGE_SIZE,
      })

      if (tasksResponse.status === 'error' || !tasksResponse.data) {
        setTasksPage(createEmptyPaginatedResponse<TaskResponse>(currentPage, GRID_PAGE_SIZE))
        setLoadError(tasksResponse.message || 'Unable to load tasks.')
        setIsLoading(false)
        return
      }

      setTasksPage(tasksResponse.data)
      setIsLoading(false)
    }

    void loadTasks().catch((error) => {
      console.error(error)
      setTasksPage(createEmptyPaginatedResponse<TaskResponse>(currentPage, GRID_PAGE_SIZE))
      setLoadError('Unable to load tasks.')
      setIsLoading(false)
    })
  }, [currentPage])

  return (
    <main className="min-h-screen px-4 py-5 sm:px-6 lg:px-8">
      <AppHeader onSignOut={onSignOut} onOpenMenu={onOpenMenu} />

      <section className="mt-6 space-y-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 w-fit">
          <ArrowLeft size={16} className="mr-2" />
          Back
        </Button>

        <Card>
          <CardBody className="space-y-5 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="mb-2 text-3xl font-semibold tracking-tight text-slate-900">
                  Tasks
                </h2>
                <CardDescription className="max-w-2xl text-base">
                  Explore tasks from other projects and open one to apply.
                </CardDescription>
              </div>
              {currentUser ? (
                <Button
                  className="h-12"
                  variant="primary"
                  size="lg"
                  onClick={() => setShowCreateModal(true)}
                >
                  <PlusIcon size={16} />
                </Button>
              ) : null}
            </div>
            {feedback ? (
              <Card className="border-green-100 bg-green-50/70 shadow-none">
                <CardBody className="p-4">
                  <CardDescription className="text-green-700">{feedback}</CardDescription>
                </CardBody>
              </Card>
            ) : null}
            <CreateTaskModal
              isOpen={showCreateModal}
              onClose={() => setShowCreateModal(false)}
              onCreated={async () => {
                setFeedback('Task created successfully.')
                setCurrentPage(0)
                setIsLoading(true)
                setLoadError(null)
                const response = await fetchAllTasks({ page: 0, size: GRID_PAGE_SIZE })
                if (response.status === 'success' && response.data) {
                  setTasksPage(response.data)
                } else {
                  setTasksPage(createEmptyPaginatedResponse<TaskResponse>(0, GRID_PAGE_SIZE))
                  setLoadError(response.message || 'Unable to load tasks.')
                }
                setIsLoading(false)
              }}
            />

            {loadError ? (
              <Card className="border-red-100 bg-red-50/70 shadow-none">
                <CardBody className="p-5">
                  <CardDescription className="text-red-700">{loadError}</CardDescription>
                </CardBody>
              </Card>
            ) : isLoading ? (
              <Card className="shadow-none">
                <CardBody className="p-6 text-center">
                  <CardDescription>Loading tasks...</CardDescription>
                </CardBody>
              </Card>
            ) : tasksPage.content.length === 0 ? (
              <Card className="shadow-none">
                <CardBody className="p-6 text-center">
                  <CardDescription>No tasks available to apply for yet.</CardDescription>
                </CardBody>
              </Card>
            ) : (
              <>
                <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-3">
                  {tasksPage.content.map((task) => (
                    <Card key={task.id} className="h-full shadow-none" hoverShadow={true}>
                      <CardBody className="flex h-full flex-col gap-4 p-5">
                        <div className="min-w-0 flex-1 space-y-3">
                          <div className="min-h-[5rem] space-y-1">
                            <CardTitle className="text-2xl font-medium">{task.title}</CardTitle>
                            <CardDescription className="max-w-3xl">
                              {task.description}
                            </CardDescription>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary">{task.status}</Badge>
                            <Badge variant="outline">{task.projectName}</Badge>
                          </div>

                          <div className="flex flex-wrap gap-4">
                            <StatLine
                              icon={<FolderKanban size={14} className="text-slate-400" />}
                              text={task.projectName}
                            />
                            <StatLine
                              icon={<CircleDollarSign size={14} className="text-emerald-500" />}
                              text={formatMoney(task.rewardAmount, task.rewardCurrency)}
                            />
                            <StatLine
                              icon={<RotateCcw size={14} className="text-slate-400" />}
                              text={`${task.maxAttempts} attempts`}
                            />
                          </div>

                          {task.recommendedSkills.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {task.recommendedSkills.map((skill) => (
                                <Badge key={skill} variant="outline">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          ) : null}
                        </div>

                        <div className="flex w-full items-center">
                          <Button
                            variant="primary"
                            className="w-full"
                            onClick={() => navigate(`/task/${task.id}`)}
                          >
                            View task
                          </Button>
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>

                <PaginationControls
                  page={tasksPage.page}
                  totalPages={tasksPage.totalPages}
                  totalElements={tasksPage.totalElements}
                  itemLabel="task"
                  isLoading={isLoading}
                  onPageChange={setCurrentPage}
                />
              </>
            )}
          </CardBody>
        </Card>
      </section>
    </main>
  )
}
