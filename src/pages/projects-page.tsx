import { ArrowLeft, Search, Star, Users } from 'lucide-react'

import { AppHeader } from '../components/app/app-header'
import { SectionTitle } from '../components/app/section-title'
import { StatLine } from '../components/app/stat-line'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardBody, CardDescription, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { useNavigate } from 'react-router-dom'
import { getAllProjects } from '../lib/project-storage'
import { useEffect, useState } from 'react'
import type { ProjectResponse } from '../types/app'

export function ProjectsPage({
  onSignOut,
  onOpenMenu,
}: {
  onSignOut: () => void
  onOpenMenu: () => void
}) {
  const navigator = useNavigate()
  const [projects, setProjects] = useState<ProjectResponse[]>([])
  const [editFeedback, setEditFeedback] = useState<string | null>(null)
  const [editErrors, setEditErrors] = useState<{

  useEffect(() => {
    const response = getAllProjects()
    response
    .then(res => res ? setProjects(res) : setProjects([]))
    .catch(error => console.error(error))
  }, [setProjects])

  return (
    <main className="min-h-screen px-4 py-5 sm:px-6 lg:px-8">
      <AppHeader onSignOut={onSignOut} onOpenMenu={onOpenMenu} />

      <section className="mt-6 space-y-6">
        <Card>
          <CardBody className="space-y-5 p-6">
            <div>
              <SectionTitle title="Projects" goBack={true}/>
              <CardDescription className="max-w-2xl text-base">
                Explore active products and open source initiatives across NexHub.
              </CardDescription>
            </div>

            <div className="relative max-w-3xl">
              <Search
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <Input className="pl-11" placeholder="Search projects" aria-label="Search projects" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {projects && projects.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()).map((project) => (
                <Card key={project.id} className="shadow-none" hoverShadow={true}>
                  <CardBody className="flex flex-col gap-4 p-5 sm:items-start sm:justify-between">
                    <div className="min-w-0 space-y-3">
                      <div className="space-y-1">
                        <CardTitle className="text-2xl font-medium">
                          {project.name + ' '}
                          <span className='font-bold text-lg'>| {project.ownerUsername}</span>
                        </CardTitle>
                        <CardDescription className="max-w-3xl">{project.description}</CardDescription>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {project.tags.map((tag) => (
                          <Badge key={tag.at(0)} variant="secondary">
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

                    <div className="flex w-full items-center">
                      <Button variant='primary' className='w-full' onClick={() => navigator(`/project/${project.id}`)}>View</Button>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          </CardBody>
        </Card>
      </section>
    </main>
  )
}
