import { ArrowLeft, CircleDollarSign, FolderKanban, PlusIcon, RotateCcw, Search, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { AppHeader } from '../components/app/app-header'
import { StatLine } from '../components/app/stat-line'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardBody, CardDescription, CardTitle } from '../components/ui/card'
import { PaginationControls } from '../components/ui/pagination-controls'
import { CreateTaskModal } from '../components/app/create-task-modal'
import { fetchAllTasks, fetchFeaturedTasks } from '../lib/task-storage'
import type { FeaturedTaskResponse, PaginatedResponse, TaskResponse } from '../types/app'
import { GRID_PAGE_SIZE, createEmptyPaginatedResponse } from '../lib/pagination'
import { readStoredUser } from '../lib/auth-storage'
import { fundingBadgeClassName, normalizeFundingStatus } from '../lib/payment-utils'

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
  const [searchParams, setSearchParams] = useSearchParams()
  const isFeaturedMode = searchParams.get('featured') === '1'
  const [tasksPage, setTasksPage] = useState<PaginatedResponse<TaskResponse>>(
    createEmptyPaginatedResponse<TaskResponse>(0, GRID_PAGE_SIZE),
  )
  const [featuredTasksPage, setFeaturedTasksPage] = useState<PaginatedResponse<FeaturedTaskResponse>>(
    createEmptyPaginatedResponse<FeaturedTaskResponse>(0, GRID_PAGE_SIZE),
  )
  const [currentPage, setCurrentPage] = useState(0)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const currentUser = readStoredUser()

  useEffect(() => {
    setCurrentPage(0)
  }, [isFeaturedMode])

  useEffect(() => {
    async function loadTasks() {
      setIsLoading(true)
      setLoadError(null)

      if (isFeaturedMode) {
        const featuredResponse = await fetchFeaturedTasks({
          page: currentPage,
          size: GRID_PAGE_SIZE,
          userId: currentUser?.id,
        })

        if (featuredResponse.status === 'error' || !featuredResponse.data) {
          setFeaturedTasksPage(createEmptyPaginatedResponse<FeaturedTaskResponse>(currentPage, GRID_PAGE_SIZE))
          setLoadError(featuredResponse.message || 'Unable to load recommended tasks.')
          setIsLoading(false)
          return
        }

        setFeaturedTasksPage(featuredResponse.data)
        setIsLoading(false)
        return
      }

      const tasksResponse = await fetchAllTasks({
        page: currentPage,
        size: GRID_PAGE_SIZE,
        search: searchKeyword,
        status: statusFilter,
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
      if (isFeaturedMode) {
        setFeaturedTasksPage(createEmptyPaginatedResponse<FeaturedTaskResponse>(currentPage, GRID_PAGE_SIZE))
        setLoadError('Unable to load recommended tasks.')
      } else {
        setTasksPage(createEmptyPaginatedResponse<TaskResponse>(currentPage, GRID_PAGE_SIZE))
        setLoadError('Unable to load tasks.')
      }
      setIsLoading(false)
    })
  }, [currentPage, currentUser?.id, isFeaturedMode, searchKeyword, statusFilter])

  const taskItems = isFeaturedMode
    ? featuredTasksPage.content.map((featuredTask) => ({
        task: featuredTask.task,
        score: featuredTask.recommendationScore,
        reasons: featuredTask.recommendationReasons,
        eligible: featuredTask.eligible,
      }))
    : tasksPage.content.map((task) => ({
        task,
        score: null,
        reasons: [] as string[],
        eligible: true,
      }))
  const activePage = isFeaturedMode ? featuredTasksPage : tasksPage

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
                  {isFeaturedMode
                    ? 'Ranked opportunities based on skills, funding, reputation, deadline, and task quality.'
                    : 'Explore tasks from other projects and open one to apply.'}
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

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant={isFeaturedMode ? 'outline' : 'primary'}
                onClick={() => {
                  setSearchParams({})
                  setCurrentPage(0)
                }}
              >
                All tasks
              </Button>
              <Button
                variant={isFeaturedMode ? 'primary' : 'outline'}
                onClick={() => {
                  setSearchParams({ featured: '1' })
                  setCurrentPage(0)
                }}
              >
                <Sparkles size={16} />
                Recommended
              </Button>
            </div>

            {isFeaturedMode ? (
              <Card className="border-blue-100 bg-blue-50/70 shadow-none">
                <CardBody className="p-4">
                  <CardDescription className="text-blue-800">
                    Recommendations are scored from skill match, reputation eligibility, funding status, deadline, freshness, and task quality.
                  </CardDescription>
                </CardBody>
              </Card>
            ) : (
              <div className="flex flex-col md:flex-row gap-4 mb-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search tasks by title or description..."
                    value={searchKeyword}
                    onChange={(e) => {
                      setSearchKeyword(e.target.value)
                      setCurrentPage(0)
                    }}
                    className="w-full pl-10 pr-4 py-2.5 text-sm border rounded-xl border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-100 placeholder-slate-400 bg-slate-50/50 focus:bg-white transition-all"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value)
                    setCurrentPage(0)
                  }}
                  className="border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white cursor-pointer min-w-[160px]"
                >
                  <option value="">All Statuses</option>
                  <option value="Open">Open</option>
                  <option value="In_Progress">In Progress</option>
                  <option value="Review">Review</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            )}

            {loadError ? (
              <Card className="border-red-100 bg-red-50/70 shadow-none">
                <CardBody className="p-5">
                  <CardDescription className="text-red-700">{loadError}</CardDescription>
                </CardBody>
              </Card>
            ) : isLoading ? (
              <Card className="shadow-none">
                <CardBody className="p-6 text-center">
                  <CardDescription>{isFeaturedMode ? 'Loading recommended tasks...' : 'Loading tasks...'}</CardDescription>
                </CardBody>
              </Card>
            ) : taskItems.length === 0 ? (
              <Card className="shadow-none">
                <CardBody className="p-6 text-center">
                  <CardDescription>
                    {isFeaturedMode ? 'No recommended tasks available yet.' : 'No tasks available to apply for yet.'}
                  </CardDescription>
                </CardBody>
              </Card>
            ) : (
              <>
                <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-3">
                  {taskItems.map(({ task, score, reasons, eligible }) => (
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
                            <Badge variant="outline" className={fundingBadgeClassName(task.fundingStatus)}>
                              {normalizeFundingStatus(task.fundingStatus)}
                            </Badge>
                            <Badge variant="outline">{task.projectName}</Badge>
                            {score !== null ? (
                              <Badge variant="outline" className="border-blue-100 bg-blue-50 text-blue-700">
                                Score {score}
                              </Badge>
                            ) : null}
                            {eligible === false ? (
                              <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                                Stretch
                              </Badge>
                            ) : null}
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
                          {reasons.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {reasons.map((reason) => (
                                <Badge key={reason} variant="secondary" className="bg-blue-50 text-blue-700">
                                  {reason}
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
                  page={activePage.page}
                  totalPages={activePage.totalPages}
                  totalElements={activePage.totalElements}
                  itemLabel={isFeaturedMode ? 'recommended task' : 'task'}
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
