import { ArrowLeft, Github, PlusIcon, Star, Users, Search } from 'lucide-react'

import { AppHeader } from '../components/app/app-header'
import { ImportGithubReposModal } from '../components/app/import-github-repos-modal'
import { StatLine } from '../components/app/stat-line'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardBody, CardDescription, CardTitle } from '../components/ui/card'
import { PaginationControls } from '../components/ui/pagination-controls'
import { CreateProjectModal } from '../components/app/create-project-modal'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { fetchAllProjects } from '../lib/project-storage'
import { useEffect, useState } from 'react'
import type { PaginatedResponse, ProjectResponse } from '../types/app'
import { GRID_PAGE_SIZE, createEmptyPaginatedResponse } from '../lib/pagination'
import { readStoredUser } from '../lib/auth-storage'

export function ProjectsPage({
  onSignOut,
  onOpenMenu,
}: {
  onSignOut: () => void
  onOpenMenu: () => void
}) {
  const navigator = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [projectsPage, setProjectsPage] = useState<PaginatedResponse<ProjectResponse>>(
    createEmptyPaginatedResponse<ProjectResponse>(0, GRID_PAGE_SIZE),
  )
  const [currentPage, setCurrentPage] = useState(0)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const currentUser = readStoredUser()

  async function loadProjects(page: number, search = searchKeyword, status = statusFilter) {
    setIsLoading(true)
    setLoadError(null)

    try {
      const response = await fetchAllProjects({
        page,
        size: GRID_PAGE_SIZE,
        search,
        status,
      })

      if (response.status === 'success' && response.data) {
        setProjectsPage(response.data)
      } else {
        setProjectsPage(createEmptyPaginatedResponse<ProjectResponse>(page, GRID_PAGE_SIZE))
        setLoadError(response.message || 'Unable to load projects.')
      }
    } catch (error) {
      console.error(error)
      setProjectsPage(createEmptyPaginatedResponse<ProjectResponse>(page, GRID_PAGE_SIZE))
      setLoadError('Unable to load projects.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadProjects(currentPage, searchKeyword, statusFilter).catch((error) => {
      console.error(error)
    })
  }, [currentPage, searchKeyword, statusFilter])

  useEffect(() => {
    if (searchParams.get('importGithub') === '1' && currentUser?.githubUsername) {
      setShowImportModal(true)
      setSearchParams({}, { replace: true })
    }
  }, [currentUser?.githubUsername, searchParams, setSearchParams])

  return (
    <main className="min-h-screen px-4 py-5 sm:px-6 lg:px-8">
      <AppHeader onSignOut={onSignOut} onOpenMenu={onOpenMenu} />

      <section className="mt-6 space-y-6">
        <Button variant="ghost" onClick={() => navigator(-1)} className="w-fit mb-4">
          <ArrowLeft size={16} className="mr-2" />
          Back
        </Button>
        <Card>
          <CardBody className="space-y-5 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-3xl font-semibold tracking-tight text-slate-900 mb-2">Projects</h2>
                <CardDescription className="max-w-2xl text-base">
                  Explore active products and open source initiatives across NexHub.
                </CardDescription>
              </div>
              {currentUser ? (
                <div className="flex items-center gap-3">
                  {currentUser.githubUsername ? (
                    <Button
                      className="h-12"
                      variant="outline"
                      size="lg"
                      onClick={() => setShowImportModal(true)}
                    >
                      <Github size={16} />
                      Import repos
                    </Button>
                  ) : null}
                  <Button
                    className="h-12"
                    variant="primary"
                    size="lg"
                    onClick={() => setShowCreateModal(true)}
                  >
                    <PlusIcon size={16} />
                  </Button>
                </div>
              ) : null}
            </div>
            {feedback ? (
              <Card className="border-green-100 bg-green-50/70 shadow-none">
                <CardBody className="p-4">
                  <CardDescription className="text-green-700">{feedback}</CardDescription>
                </CardBody>
              </Card>
            ) : null}
            <CreateProjectModal
              isOpen={showCreateModal}
              onClose={() => setShowCreateModal(false)}
              onCreated={async () => {
                setFeedback('Project created successfully.')
                setCurrentPage(0)
                await loadProjects(0)
              }}
            />
            <ImportGithubReposModal
              isOpen={showImportModal}
              onClose={() => setShowImportModal(false)}
              onImported={async () => {
                setFeedback('GitHub repository imported successfully.')
                setCurrentPage(0)
                await loadProjects(0)
              }}
            />

            {/* Search & Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Search projects by name or description..."
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
                <option value="OPEN">OPEN</option>
                <option value="HIRING">HIRING</option>
                <option value="IN_PROGRESS">IN PROGRESS</option>
                <option value="COMPLETED">COMPLETED</option>
              </select>
            </div>

            {loadError ? (
              <Card className="border-red-100 bg-red-50/70 shadow-none">
                <CardBody className="p-5">
                  <CardDescription className="text-red-700">{loadError}</CardDescription>
                </CardBody>
              </Card>
            ) : isLoading ? (
              <Card className="shadow-none">
                <CardBody className="p-6 text-center">
                  <CardDescription>Loading projects...</CardDescription>
                </CardBody>
              </Card>
            ) : projectsPage.content.length === 0 ? (
              <Card className="shadow-none">
                <CardBody className="p-6 text-center">
                  <CardDescription>No projects found.</CardDescription>
                </CardBody>
              </Card>
            ) : (
              <>
                <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-3">
                  {projectsPage.content.map((project) => (
                    <Card key={project.id} className="h-full shadow-none" hoverShadow={true}>
                      <CardBody className="flex h-full flex-col gap-4 p-5">
                        <div className="min-w-0 flex-1 space-y-3">
                          <div className="min-h-20 space-y-1">
                            <CardTitle className="text-2xl font-medium">
                              {project.name + ' '}
                              <span className='font-bold text-lg'>| {project.ownerUsername}</span>
                            </CardTitle>
                            <CardDescription className="max-w-3xl">{project.description}</CardDescription>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {project.tags.map((tag) => (
                              <Badge key={String(tag)} variant="secondary">
                                {tag}
                              </Badge>
                            ))}
                          </div>

                          <div className="flex flex-wrap gap-4">
                            <StatLine
                              icon={<Star size={14} className="text-amber-400" />}
                              text={`${project.starsCount} stars`}
                            />
                            <StatLine
                              icon={<Users size={14} className="text-slate-400" />}
                              text={`WIP followers`}
                            />
                          </div>
                        </div>

                        <div className="mt-auto flex w-full items-center">
                          <Button variant='primary' className='w-full' onClick={() => navigator(`/project/${project.id}`)}>View</Button>
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>

                <PaginationControls
                  page={projectsPage.page}
                  totalPages={projectsPage.totalPages}
                  totalElements={projectsPage.totalElements}
                  itemLabel="project"
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
