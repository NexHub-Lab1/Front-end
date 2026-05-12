import {
  ArrowRight,
  CheckCircle2,
  CircleDollarSign,
  Code2,
  FolderKanban,
  GitPullRequestArrow,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  Zap,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { AppHeader } from '../components/app/app-header'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardBody, CardDescription, CardTitle } from '../components/ui/card'
import { StatLine } from '../components/app/stat-line'
import { fetchAllProjects } from '../lib/project-storage'
import { fetchAllTasks } from '../lib/task-storage'
import { fetchAllUserDetails } from '../lib/user-storage'
import { readStoredUser } from '../lib/auth-storage'
import type { ProjectResponse, TaskResponse, UserDetailsResponse } from '../types/app'

function formatMoney(amount: number, currency: string) {
  return `${Number(amount).toLocaleString(undefined, {
    maximumFractionDigits: 2,
  })} ${currency}`
}

function sortDevelopersByActivity(users: UserDetailsResponse[]) {
  return [...users]
    .sort((a, b) => (b.streakDay || 0) - (a.streakDay || 0))
    .slice(0, 4)
}

function normalizeFundingStatus(status?: string | null) {
  return status?.trim().toLowerCase() || 'unfunded'
}

function fundingBadgeClassName(status?: string | null) {
  switch (normalizeFundingStatus(status)) {
    case 'funded':
      return 'border-green-200 bg-green-50 text-green-700'
    case 'pending':
      return 'border-amber-200 bg-amber-50 text-amber-700'
    case 'released':
      return 'border-blue-200 bg-blue-50 text-blue-700'
    case 'refunded':
      return 'border-slate-200 bg-slate-50 text-slate-700'
    default:
      return 'border-slate-200 bg-slate-50 text-slate-700'
  }
}

function LoadingCard({ label }: { label: string }) {
  return (
    <Card className="shadow-none">
      <CardBody className="p-5">
        <CardDescription>{label}</CardDescription>
      </CardBody>
    </Card>
  )
}

function ErrorCard({ message }: { message: string }) {
  return (
    <Card className="border-red-100 bg-red-50/70 shadow-none">
      <CardBody className="p-5">
        <CardDescription className="text-red-700">{message}</CardDescription>
      </CardBody>
    </Card>
  )
}

function EmptyCard({ title, description }: { title: string; description: string }) {
  return (
    <Card className="shadow-none">
      <CardBody className="space-y-2 p-5">
        <CardTitle className="text-xl font-medium">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardBody>
    </Card>
  )
}

export function LandingPage({
  onSignOut,
  onOpenMenu,
}: {
  onSignOut: () => void
  onOpenMenu: () => void
}) {
  const navigate = useNavigate()
  const currentUser = readStoredUser()
  const [topProjects, setTopProjects] = useState<ProjectResponse[] | null>(null)
  const [topProjectsError, setTopProjectsError] = useState<string | null>(null)
  const [topTasks, setTopTasks] = useState<TaskResponse[] | null>(null)
  const [topTasksError, setTopTasksError] = useState<string | null>(null)
  const [topUsers, setTopUsers] = useState<UserDetailsResponse[] | null>(null)
  const [topUsersError, setTopUsersError] = useState<string | null>(null)

  useEffect(() => {
    async function loadLandingData() {
      try {
        const [projectsResponse, tasksResponse, usersResponse] = await Promise.all([
          fetchAllProjects({ page: 0, size: 3 }),
          fetchAllTasks({ page: 0, size: 4, sort: ['rewardAmount,desc'] }),
          fetchAllUserDetails(),
        ])

        if (projectsResponse.status === 'success' && projectsResponse.data) {
          setTopProjects(projectsResponse.data.content)
        } else {
          setTopProjects([])
          setTopProjectsError(projectsResponse.message || 'Unable to load projects.')
        }

        if (tasksResponse.status === 'success' && tasksResponse.data) {
          setTopTasks(tasksResponse.data.content)
        } else {
          setTopTasks([])
          setTopTasksError(tasksResponse.message || 'Unable to load tasks.')
        }

        if (usersResponse.status === 'success' && usersResponse.data) {
          setTopUsers(sortDevelopersByActivity(usersResponse.data))
        } else {
          setTopUsers([])
          setTopUsersError(usersResponse.message || 'Unable to load developers.')
        }
      } catch {
        setTopProjects([])
        setTopTasks([])
        setTopUsers([])
        setTopProjectsError('Unable to load projects.')
        setTopTasksError('Unable to load tasks.')
        setTopUsersError('Unable to load developers.')
      }
    }

    void loadLandingData()
  }, [])

  const projectCount = topProjects?.length ?? 0
  const taskCount = topTasks?.length ?? 0
  const developerCount = topUsers?.length ?? 0
  const highlightedTask = topTasks?.[0] ?? null

  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_32%),linear-gradient(135deg,#eef4ff_0%,#ffffff_42%,#f8fbff_100%)] px-4 py-5 sm:px-6 lg:px-8">
      <AppHeader onSignOut={onSignOut} onOpenMenu={onOpenMenu} />

      <section className="mx-auto mt-8 grid max-w-7xl gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)] lg:items-stretch">
        <Card className="overflow-hidden border-blue-100/80 bg-white/85 shadow-[0_24px_80px_rgba(37,99,235,0.12)] backdrop-blur">
          <CardBody className="relative min-h-[470px] space-y-8 p-7 sm:p-9 lg:p-10">
            <div className="absolute right-8 top-8 hidden h-24 w-24 rounded-full bg-blue-100 blur-2xl sm:block" />
            <div className="relative inline-flex w-fit items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
              <Sparkles size={14} />
              Open-source work, funded before it starts
            </div>

            <div className="relative max-w-4xl space-y-5">
              <h1 className="text-5xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-6xl lg:text-7xl">
                Build real projects. Get rewarded for real pull requests.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-600">
                NexHub connects project owners with developers through scoped tasks, GitHub submissions,
                and reward funding that stays visible from start to finish.
              </p>
            </div>

            <div className="relative flex flex-wrap gap-3">
              <Button variant="primary" size="lg" onClick={() => navigate('/tasks')}>
                Explore tasks
                <ArrowRight size={16} />
              </Button>
              <Button variant="outline" size="lg" onClick={() => navigate('/projects')}>
                Browse projects
                <FolderKanban size={16} />
              </Button>
              {!currentUser ? (
                <Button variant="ghost" size="lg" onClick={() => navigate('/auth/signup')}>
                  Create account
                </Button>
              ) : (
                <Button variant="ghost" size="lg" onClick={() => navigate('/profile')}>
                  Open profile
                </Button>
              )}
            </div>

            <div className="relative grid gap-3 sm:grid-cols-3">
              <Card className="bg-slate-50/80 shadow-none">
                <CardBody className="space-y-1 p-4">
                  <p className="text-3xl font-semibold text-slate-950">{projectCount}+</p>
                  <CardDescription>featured projects</CardDescription>
                </CardBody>
              </Card>
              <Card className="bg-slate-50/80 shadow-none">
                <CardBody className="space-y-1 p-4">
                  <p className="text-3xl font-semibold text-slate-950">{taskCount}+</p>
                  <CardDescription>open tasks previewed</CardDescription>
                </CardBody>
              </Card>
              <Card className="bg-slate-50/80 shadow-none">
                <CardBody className="space-y-1 p-4">
                  <p className="text-3xl font-semibold text-slate-950">{developerCount}+</p>
                  <CardDescription>active developers</CardDescription>
                </CardBody>
              </Card>
            </div>
          </CardBody>
        </Card>

        <Card className="overflow-hidden border-blue-100/80 bg-white/90 shadow-[0_24px_80px_rgba(37,99,235,0.12)] backdrop-blur">
          <CardBody className="relative flex h-full min-h-[470px] flex-col justify-between gap-6 p-7">
            <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-blue-100/80 blur-3xl" />
            <div className="absolute bottom-0 right-0 h-28 w-28 rounded-tl-[4rem] bg-gradient-to-br from-blue-50 to-indigo-100" />

            <div className="relative space-y-4">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
                <Zap size={14} />
                Featured task
              </div>
              {topTasksError ? (
                <p className="text-sm text-red-700">{topTasksError}</p>
              ) : topTasks === null ? (
                <p className="text-sm text-slate-500">Loading featured task...</p>
              ) : highlightedTask ? (
                <>
                  <h2 className="text-4xl font-semibold tracking-[-0.03em] text-slate-950">{highlightedTask.title}</h2>
                  <p className="text-base leading-7 text-slate-600">{highlightedTask.description}</p>
                </>
              ) : (
                <>
                  <h2 className="text-4xl font-semibold tracking-[-0.03em] text-slate-950">No tasks yet</h2>
                  <p className="text-base leading-7 text-slate-600">
                    Once tasks are created, the highest reward task will show here.
                  </p>
                </>
              )}
            </div>

            {highlightedTask ? (
              <div className="relative space-y-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
                    <p className="text-sm text-slate-500">Reward</p>
                    <p className="mt-1 text-2xl font-semibold text-slate-950">
                      {formatMoney(highlightedTask.rewardAmount, highlightedTask.rewardCurrency)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-sm text-slate-500">Funding</p>
                    <p className="mt-1 text-2xl font-semibold capitalize text-slate-950">
                      {normalizeFundingStatus(highlightedTask.fundingStatus)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{highlightedTask.status}</Badge>
                  <Badge variant="outline" className="border-blue-100 bg-white text-blue-700">
                    {highlightedTask.projectName}
                  </Badge>
                  {highlightedTask.recommendedSkills.slice(0, 3).map((skill) => (
                    <Badge key={skill} variant="outline" className="bg-white">
                      {skill}
                    </Badge>
                  ))}
                </div>
                <Button variant="primary" size="lg" onClick={() => navigate(`/task/${highlightedTask.id}`)}>
                  View task
                  <ArrowRight size={16} />
                </Button>
              </div>
            ) : null}
          </CardBody>
        </Card>
      </section>

      <section className="mx-auto mt-8 grid max-w-7xl gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <Card className="bg-white/90 backdrop-blur">
            <CardBody className="space-y-5 p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <CardTitle className="text-3xl">Featured projects</CardTitle>
                  <CardDescription className="mt-2 text-base">
                    Explore active repositories and products already inside NexHub.
                  </CardDescription>
                </div>
                <Button variant="outline" onClick={() => navigate('/projects')}>
                  View all projects
                  <ArrowRight size={16} />
                </Button>
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                {topProjectsError ? (
                  <div className="lg:col-span-3">
                    <ErrorCard message={topProjectsError} />
                  </div>
                ) : topProjects === null ? (
                  <div className="lg:col-span-3">
                    <LoadingCard label="Loading projects..." />
                  </div>
                ) : topProjects.length === 0 ? (
                  <div className="lg:col-span-3">
                    <EmptyCard title="No projects yet" description="Projects will appear here once they are created." />
                  </div>
                ) : (
                  topProjects.map((project) => (
                    <Card
                      key={project.id}
                      className="h-full shadow-none"
                      hoverShadow={true}
                      clickMouse={true}
                      onClick={() => navigate(`/project/${project.id}`)}
                    >
                      <CardBody className="flex h-full flex-col gap-4 p-5">
                        <div className="min-w-0 flex-1 space-y-2">
                          <CardTitle className="break-words text-2xl font-medium">{project.name}</CardTitle>
                          <CardDescription className="line-clamp-3 break-words">{project.description}</CardDescription>
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
            </CardBody>
          </Card>

          <Card className="bg-white/90 backdrop-blur">
            <CardBody className="space-y-5 p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <CardTitle className="text-3xl">Funded work, clear scope</CardTitle>
                  <CardDescription className="mt-2 text-base">
                    Discover tasks by reward, project, status, and required skills.
                  </CardDescription>
                </div>
                <Button variant="outline" onClick={() => navigate('/tasks')}>
                  View all tasks
                  <ArrowRight size={16} />
                </Button>
              </div>

              <div className="grid gap-3">
                {topTasksError ? (
                  <ErrorCard message={topTasksError} />
                ) : topTasks === null ? (
                  <LoadingCard label="Loading tasks..." />
                ) : topTasks.length === 0 ? (
                  <EmptyCard title="No tasks yet" description="Tasks will appear here once project owners create them." />
                ) : (
                  topTasks.map((task) => (
                    <Card
                      key={task.id}
                      className="shadow-none"
                      hoverShadow={true}
                      clickMouse={true}
                      onClick={() => navigate(`/task/${task.id}`)}
                    >
                      <CardBody className="grid gap-4 p-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                        <div className="min-w-0 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="secondary">{task.status}</Badge>
                            <Badge variant="outline" className={fundingBadgeClassName(task.fundingStatus)}>
                              {normalizeFundingStatus(task.fundingStatus)}
                            </Badge>
                          </div>
                          <div>
                            <CardTitle className="break-words text-xl font-medium">{task.title}</CardTitle>
                            <CardDescription className="mt-1">{task.projectName}</CardDescription>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {task.recommendedSkills.slice(0, 3).map((skill) => (
                              <Badge key={skill} variant="outline">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-4 md:block md:text-right">
                          <p className="text-2xl font-semibold text-slate-950">
                            {formatMoney(task.rewardAmount, task.rewardCurrency)}
                          </p>
                          <CardDescription>{task.maxAttempts} attempts</CardDescription>
                        </div>
                      </CardBody>
                    </Card>
                  ))
                )}
              </div>
            </CardBody>
          </Card>

          <section className="grid gap-4 md:grid-cols-3">
            <Card className="bg-white/90 shadow-none backdrop-blur">
              <CardBody className="space-y-3 p-5">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-50 text-blue-700">
                  <FolderKanban size={20} />
                </div>
                <CardTitle className="text-xl">Create scoped tasks</CardTitle>
                <CardDescription>Owners define deliverables, rewards, attempts, and project context.</CardDescription>
              </CardBody>
            </Card>
            <Card className="bg-white/90 shadow-none backdrop-blur">
              <CardBody className="space-y-3 p-5">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-green-50 text-green-700">
                  <GitPullRequestArrow size={20} />
                </div>
                <CardTitle className="text-xl">Submit through GitHub</CardTitle>
                <CardDescription>Developers work through PR URLs, keeping review tied to actual code.</CardDescription>
              </CardBody>
            </Card>
            <Card className="bg-white/90 shadow-none backdrop-blur">
              <CardBody className="space-y-3 p-5">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-indigo-50 text-indigo-700">
                  <ShieldCheck size={20} />
                </div>
                <CardTitle className="text-xl">Release after approval</CardTitle>
                <CardDescription>Rewards stay tracked in escrow and move after the owner approves.</CardDescription>
              </CardBody>
            </Card>
          </section>
        </div>

        <aside className="space-y-6">
          <Card className="bg-white/90 backdrop-blur lg:sticky lg:top-5">
            <CardBody className="space-y-5 p-6">
              <div>
                <CardTitle className="text-2xl">Active developers</CardTitle>
                <CardDescription className="mt-2">A quick look at the people building in NexHub.</CardDescription>
              </div>

              <div className="space-y-3">
                {topUsersError ? (
                  <ErrorCard message={topUsersError} />
                ) : topUsers === null ? (
                  <LoadingCard label="Loading developers..." />
                ) : topUsers.length === 0 ? (
                  <EmptyCard title="No developers yet" description="Developers will appear here as the community grows." />
                ) : (
                  topUsers.map((user, index) => (
                    <Card
                      key={user.id}
                      className="shadow-none"
                      hoverShadow={true}
                      clickMouse={true}
                      onClick={() => navigate(`/user/${user.id}`)}
                    >
                      <CardBody className="flex items-center gap-4 p-4">
                        {user.image_url ? (
                          <img
                            src={user.image_url}
                            alt={user.username}
                            className="h-12 w-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-b from-blue-100 to-blue-200 font-semibold text-blue-800">
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <CardTitle className="truncate text-lg font-medium">{user.username}</CardTitle>
                            <span className="text-sm font-semibold text-slate-500">#{index + 1}</span>
                          </div>
                          <CardDescription className="truncate">{user.email}</CardDescription>
                          <StatLine
                            icon={<Code2 size={14} className="text-blue-500" />}
                            text={`${user.streakDay || 0} day streak`}
                          />
                        </div>
                      </CardBody>
                    </Card>
                  ))
                )}
              </div>
            </CardBody>
          </Card>

          <Card className="border-blue-100 bg-blue-950 text-white shadow-[0_24px_70px_rgba(30,64,175,0.22)]">
            <CardBody className="space-y-5 p-6">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10 text-blue-100">
                <CircleDollarSign size={22} />
              </div>
              <div>
                <CardTitle className="text-2xl text-white">Why rewards matter</CardTitle>
                <p className="mt-2 text-sm leading-6 text-blue-100">
                  Developers can see whether a task reward is funded before committing time. Owners keep control
                  because rewards are released only after review.
                </p>
              </div>
              <div className="space-y-3 text-sm text-blue-50">
                <div className="flex gap-2">
                  <CheckCircle2 size={16} className="mt-0.5 text-green-300" />
                  <span>Transparent task funding status</span>
                </div>
                <div className="flex gap-2">
                  <CheckCircle2 size={16} className="mt-0.5 text-green-300" />
                  <span>GitHub PR submission workflow</span>
                </div>
                <div className="flex gap-2">
                  <CheckCircle2 size={16} className="mt-0.5 text-green-300" />
                  <span>Reward status stays visible</span>
                </div>
              </div>
              <Button variant="secondary" className="w-full" onClick={() => navigate(currentUser ? '/profile' : '/auth/signup')}>
                {currentUser ? 'Open profile' : 'Join NexHub'}
                <ArrowRight size={16} />
              </Button>
            </CardBody>
          </Card>
        </aside>
      </section>

    </main>
  )
}
