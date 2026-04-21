import { ArrowLeft, CircleDollarSign, FolderKanban, RotateCcw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { AppHeader } from '../components/app/app-header'
import { StatLine } from '../components/app/stat-line'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardBody, CardDescription, CardTitle } from '../components/ui/card'
import { fetchAllTasks } from '../lib/task-storage'
import type { TaskResponse } from '../types/app'

export function TasksPage({
  onSignOut,
  onOpenMenu,
}: {
  onSignOut: () => void
  onOpenMenu: () => void
}) {
  const navigate = useNavigate()
  const [tasks, setTasks] = useState<TaskResponse[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    async function loadTasks() {
      setLoadError(null)

      const tasksResponse = await fetchAllTasks()

      if (tasksResponse.status === 'error' || !tasksResponse.data) {
        setTasks([])
        setLoadError(tasksResponse.message || 'Unable to load tasks.')
        return
      }

      setTasks(
        tasksResponse.data
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
      )
    }

    void loadTasks()
  }, [])

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
            <div>
              <h2 className="mb-2 text-3xl font-semibold tracking-tight text-slate-900">
                Tasks
              </h2>
              <CardDescription className="max-w-2xl text-base">
                Explore tasks from other projects and open one to apply.
              </CardDescription>
            </div>

            {loadError ? (
              <Card className="border-red-100 bg-red-50/70 shadow-none">
                <CardBody className="p-5">
                  <CardDescription className="text-red-700">{loadError}</CardDescription>
                </CardBody>
              </Card>
            ) : tasks === null ? (
              <Card className="shadow-none">
                <CardBody className="p-6 text-center">
                  <CardDescription>Loading tasks...</CardDescription>
                </CardBody>
              </Card>
            ) : tasks.length === 0 ? (
              <Card className="shadow-none">
                <CardBody className="p-6 text-center">
                  <CardDescription>No tasks available to apply for yet.</CardDescription>
                </CardBody>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-2 lg:grid-cols-3">
                {tasks.map((task) => (
                  <Card key={task.id} className="shadow-none" hoverShadow={true}>
                    <CardBody className="flex h-full flex-col gap-4 p-5 sm:items-start sm:justify-between">
                      <div className="min-w-0 space-y-3">
                        <div className="space-y-1">
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
                            text={`${task.rewardAmount} ${task.rewardCurrency}`}
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
            )}
          </CardBody>
        </Card>
      </section>
    </main>
  )
}
