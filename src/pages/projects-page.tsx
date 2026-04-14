import { Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { AppHeader } from '../components/app/app-header'
import { ProjectListCard } from '../components/app/project-list-card'
import { SectionTitle } from '../components/app/section-title'
import { PROJECTS_ROOT_ENDPOINT } from '../lib/project-api'
import type { ApiResponse, AuthUser, ProjectSummary } from '../types/app'
import { Card, CardBody, CardDescription } from '../components/ui/card'
import { Input } from '../components/ui/input'

export function ProjectsPage({
  user,
  onSignOut,
  onOpenMenu,
}: {
  user: AuthUser | null
  onSignOut: () => void
  onOpenMenu: () => void
}) {
  const [projects, setProjects] = useState<ProjectSummary[]>([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadProjects() {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(PROJECTS_ROOT_ENDPOINT)
        const result = (await response.json()) as ApiResponse<ProjectSummary[]>

        if (!response.ok || result.status === 'error' || !result.data) {
          throw new Error(result.message || 'Unable to load projects')
        }

        setProjects(result.data)
      } catch (fetchError) {
        setProjects([])
        setError(fetchError instanceof Error ? fetchError.message : 'Unable to load projects')
      } finally {
        setIsLoading(false)
      }
    }

    void loadProjects()
  }, [])

  const filteredProjects = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    if (!normalizedSearch) {
      return projects
    }

    return projects.filter((project) => {
      return (
        project.name.toLowerCase().includes(normalizedSearch) ||
        project.description.toLowerCase().includes(normalizedSearch) ||
        project.tags.some((tag) => tag.toLowerCase().includes(normalizedSearch))
      )
    })
  }, [projects, search])

  return (
    <main className="min-h-screen px-4 py-5 sm:px-6 lg:px-8">
      <AppHeader user={user} onSignOut={onSignOut} onOpenMenu={onOpenMenu} />

      <section className="mt-6 space-y-6">
        <Card>
          <CardBody className="space-y-5 p-6">
            <div>
              <SectionTitle title="Projects" />
              <CardDescription className="max-w-2xl text-base">
                Explore active products and open source initiatives across NexHub.
              </CardDescription>
            </div>

            <div className="relative max-w-3xl">
              <Search
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <Input
                className="pl-11"
                placeholder="Search projects"
                aria-label="Search projects"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="space-y-4 p-6">
            <SectionTitle title="Projects" />

            {isLoading ? (
              <CardDescription>Loading projects...</CardDescription>
            ) : error ? (
              <CardDescription className=" text-red-600">{error}</CardDescription>
            ) : filteredProjects.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredProjects.map((project) => (
                  <ProjectListCard
                    key={project.id}
                    id={project.id}
                    name={project.name}
                    description={project.description}
                    tags={project.tags}
                    status={project.status}
                    ownerUsername={project.ownerUsername}
                    stars={project.starsCount}
                    contributors={project.contributorCount}
                    githubRepo={project.githubRepo}
                    actionLabel="View project"
                  />
                ))}
              </div>
            ) : (
              <CardDescription>No projects match this search yet.</CardDescription>
            )}
          </CardBody>
        </Card>
      </section>
    </main>
  )
}
