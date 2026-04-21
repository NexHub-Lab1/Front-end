import { ArrowRight, BellRing, Star, Trophy, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { activityItems, topDevelopers } from '../data/mock-content'
import { AppHeader } from '../components/app/app-header'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardBody, CardDescription, CardTitle } from '../components/ui/card'
import { DeveloperAvatar } from '../components/app/developer-avatar'
import { SectionTitle } from '../components/app/section-title'
import { StatLine } from '../components/app/stat-line'
import { readStoredUserToken } from '../lib/auth-storage'
import { fetchAllProjects } from '../lib/project-storage'
import { fetchAllTasks } from '../lib/task-storage'
import type { ProjectResponse, TaskResponse } from '../types/app'

export function LandingPage({
  onSignOut,
  onOpenMenu,
}: {
  onSignOut: () => void
  onOpenMenu: () => void
}) {
  const navigate = useNavigate()
  const [topProjects, setTopProjects] = useState<ProjectResponse[] | null>(null)
  const [topProjectsError, setTopProjectsError] = useState<string | null>(null)
  const [topTasks, setTopTasks] = useState<TaskResponse[] | null>(null)
  const [topTasksError, setTopTasksError] = useState<string | null>(null)

  useEffect(() => {
    async function loadLandingData() {
      const token = readStoredUserToken()
      if (!token) {
        setTopProjects([])
        setTopTasks([])
        return
      }

      try {
        const [projectsResponse, tasksResponse] = await Promise.all([
          fetchAllProjects(),
          fetchAllTasks(),
        ])

        if (projectsResponse.status === 'success' && projectsResponse.data) {
          setTopProjects(
            [...projectsResponse.data]
              .sort((a, b) => {
                const starDifference = b.starsCount - a.starsCount
                if (starDifference !== 0) return starDifference

                return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
              })
              .slice(0, 3),
          )
        } else {
          setTopProjects([])
          setTopProjectsError(projectsResponse.message || 'Unable to load projects.')
        }

        if (tasksResponse.status === 'success' && tasksResponse.data) {
          setTopTasks(
            [...tasksResponse.data]
              .sort((a, b) => {
                const rewardDifference = b.rewardAmount - a.rewardAmount
                if (rewardDifference !== 0) return rewardDifference

                return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
              })
              .slice(0, 3),
          )
        } else {
          setTopTasks([])
          setTopTasksError(tasksResponse.message || 'Unable to load tasks.')
        }
      } catch {
        setTopProjects([])
        setTopTasks([])
        setTopProjectsError('Unable to load projects.')
        setTopTasksError('Unable to load tasks.')
      }
    }

    void loadLandingData()
  }, [])

  return (
    <main className="min-h-screen px-4 py-5 sm:px-6 lg:px-8">
      <AppHeader onSignOut={onSignOut} onOpenMenu={onOpenMenu} />

      <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <Card>
            <CardBody className="space-y-5 p-6">
              <SectionTitle title="Top projects" />
              <div className="grid gap-4 lg:grid-cols-3">
                {topProjectsError ? (
                  <Card className="border-red-100 bg-red-50/70 shadow-none lg:col-span-3">
                    <CardBody className="p-5">
                      <CardDescription className="text-red-700">{topProjectsError}</CardDescription>
                    </CardBody>
                  </Card>
                ) : topProjects === null ? (
                  <Card className="shadow-none lg:col-span-3">
                    <CardBody className="p-5">
                      <CardDescription>Loading projects...</CardDescription>
                    </CardBody>
                  </Card>
                ) : topProjects.length === 0 ? (
                  <Card className="shadow-none lg:col-span-3">
                    <CardBody className="p-5">
                      <CardTitle className="text-xl font-medium">No projects to show yet</CardTitle>
                      <CardDescription>
                        Sign in to explore the latest NexHub projects.
                      </CardDescription>
                    </CardBody>
                  </Card>
                ) : (
                  topProjects.map((project) => (
                    <Card key={project.id} className="shadow-none" hoverShadow={true} clickMouse={true}>
                      <CardBody className="space-y-4 p-5">
                        <div className="space-y-2">
                          <CardTitle className="text-2xl font-medium">{project.name}</CardTitle>
                          <CardDescription>{project.description}</CardDescription>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {project.tags.slice(0, 3).map((tag) => (
                            <Badge key={String(tag)} variant="secondary">
                              {String(tag)}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex flex-wrap gap-4">
                          <StatLine icon={<Star size={14} className="text-amber-400" />} text={`${project.starsCount} stars`} />
                          <StatLine icon={<Users size={14} className="text-slate-400" />} text={`${project.contributorCount} contributors`} />
                        </div>
                      </CardBody>
                    </Card>
                  ))
                )}
              </div>
              <div className="flex justify-center">
                <Button variant="primary" size="lg" onClick={() => navigate('/projects')}>
                  See all
                  <ArrowRight size={16} />
                </Button>
              </div>
            </CardBody>
          </Card>

          <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
            <Card>
              <CardBody className="p-6">
                <SectionTitle title="Top tasks" />
                <div className="space-y-3">
                  {topTasksError ? (
                    <Card className="border-red-100 bg-red-50/70 shadow-none">
                      <CardBody className="p-5">
                        <CardDescription className="text-red-700">{topTasksError}</CardDescription>
                      </CardBody>
                    </Card>
                  ) : topTasks === null ? (
                    <Card className="shadow-none">
                      <CardBody className="p-5">
                        <CardDescription>Loading tasks...</CardDescription>
                      </CardBody>
                    </Card>
                  ) : topTasks.length === 0 ? (
                    <Card className="shadow-none">
                      <CardBody className="p-5">
                        <CardTitle className="text-xl font-medium">No tasks to show yet</CardTitle>
                        <CardDescription>
                          Sign in to explore the latest tasks from NexHub projects.
                        </CardDescription>
                      </CardBody>
                    </Card>
                  ) : (
                    topTasks.map((task) => (
                      <Card key={task.id} className="shadow-none">
                        <CardBody className="flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between">
                          <div className="space-y-2">
                            <div className="space-y-1">
                              <CardTitle className="text-xl font-medium">{task.title}</CardTitle>
                              <CardDescription>{task.projectName}</CardDescription>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Badge variant="secondary">{task.status}</Badge>
                              {task.recommendedSkills.slice(0, 2).map((skill) => (
                                <Badge key={skill} variant="outline">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div className="text-left sm:text-right">
                            <p className="text-lg font-semibold text-slate-900">
                              {task.rewardAmount} {task.rewardCurrency}
                            </p>
                            <p className="text-sm text-slate-500">
                              {task.maxAttempts} attempts
                            </p>
                          </div>
                        </CardBody>
                      </Card>
                    ))
                  )}
                </div>
                <div className="mt-5 flex justify-center">
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={() => navigate(readStoredUserToken() ? '/tasks' : '/auth/login')}
                  >
                    See more
                    <ArrowRight size={16} />
                  </Button>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody className="p-6">
                <SectionTitle
                  title="Top developers"
                  right={
                    <Button variant="ghost" size="sm">
                      See all
                    </Button>
                  }
                />
                <Card className="shadow-none">
                  <CardBody className="space-y-4 p-5">
                    <div className="space-y-2">
                      <CardTitle className="text-2xl font-medium">
                        Build a notification system for DevConnector
                      </CardTitle>
                      <CardDescription>
                        Clear scope, fast review cycle, and room for visible contribution.
                      </CardDescription>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">Node.js</Badge>
                      <Badge variant="secondary">MERN</Badge>
                      <Badge variant="outline">5 days left</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold text-slate-900">$800 USD</span>
                      <Button variant="secondary" size="sm">
                        See more
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              </CardBody>
            </Card>
          </div>

          <div className="grid gap-6">
            <Card>
              <CardBody className="p-6">
                <SectionTitle title="Recent activity" />
                <div className="space-y-3">
                  {activityItems.map((item) => (
                    <Card key={item} className="bg-slate-50/80 shadow-none">
                      <CardBody className="flex flex-row items-center gap-3 p-4 text-slate-700">
                        <BellRing size={16} className="text-indigo-600" />
                        <span className="text-sm">{item}</span>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              </CardBody>
            </Card>
          </div>
        </div>

        <Card className="h-fit xl:sticky xl:top-5">
          <CardBody className="p-6">
            <SectionTitle title="Top developers" />
            <div className="space-y-4">
              {topDevelopers.map((developer) => (
                <Card key={developer.rank} className="shadow-none">
                  <CardBody className="flex flex-row gap-4 p-4">
                    <DeveloperAvatar name={developer.name} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <CardTitle className="truncate text-lg font-medium">{developer.name}</CardTitle>
                        <span className="text-base font-semibold text-slate-700">{developer.rank}</span>
                      </div>
                      <CardDescription className="mt-1">{developer.handle}</CardDescription>
                      <div className="mt-3 flex flex-wrap gap-4">
                        <StatLine icon={<Users size={14} className="text-slate-400" />} text={`${developer.followers} followers`} />
                        <StatLine icon={<Trophy size={14} className="text-indigo-500" />} text={developer.score} />
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
            <Button variant="primary" size="lg" className="mt-5 w-full">
              View ranking
            </Button>
          </CardBody>
        </Card>
      </section>
    </main>
  )
}
