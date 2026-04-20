import { ArrowLeft, Bookmark, Send } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { AppHeader } from '../components/app/app-header'
import { StatLine } from '../components/app/stat-line'
import { fetchTasksByProject } from '../lib/task-storage'
import type { TaskResponse } from '../types/app'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardBody, CardDescription, CardTitle } from '../components/ui/card'

export function TaskDetailPage({
  onSignOut,
  onOpenMenu,
}: {
  onSignOut: () => void
  onOpenMenu: () => void
}) {
  const navigate = useNavigate()
  const { id } = useParams()
  const [task, setTask] = useState<TaskResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadTask() {
      const parsedId = Number(id)

      if (!id || Number.isNaN(parsedId)) {
        setError('Task id is invalid')
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        // Since we don't have a fetchTaskById endpoint, we'll fetch all tasks for the project
        // In a real scenario, you'd have a dedicated fetchTaskById endpoint
        const response = await fetch(`/api/tasks/${parsedId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('nexhub-auth-user') ? JSON.parse(localStorage.getItem('nexhub-auth-user')!).token : ''}`,
          },
        })

        if (!response.ok) {
          throw new Error('Unable to load task')
        }

        const data = await response.json()
        if (data.status === 'error' || !data.data) {
          throw new Error(data.message || 'Unable to load task')
        }

        setTask(data.data)
      } catch (fetchError) {
        setTask(null)
        setError(fetchError instanceof Error ? fetchError.message : 'Unable to load task')
      } finally {
        setIsLoading(false)
      }
    }

    void loadTask()
  }, [id])

  return (
    <main className="min-h-screen px-4 py-5 sm:px-6 lg:px-8">
      <AppHeader onSignOut={onSignOut} onOpenMenu={onOpenMenu} />

      <section className="mx-auto mt-6 max-w-5xl space-y-2">
        <Button variant="ghost" onClick={() => navigate('/profile')} className="w-fit">
          <ArrowLeft size={16} className="mr-2" />
          Back
        </Button>
        {isLoading ? (
          <Card>
            <CardBody className="space-y-3 p-6">
              <CardTitle className="text-3xl">Loading task...</CardTitle>
              <CardDescription>Please wait while we load the task details.</CardDescription>
            </CardBody>
          </Card>
        ) : error ? (
          <Card>
            <CardBody className="space-y-3 p-6">
              <CardTitle className="text-3xl">Task not found</CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardBody>
          </Card>
        ) : task ? (
          <>
            <Card className="overflow-hidden">
              <CardBody className="space-y-6 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.14),transparent_35%),linear-gradient(180deg,rgba(255,255,255,1),rgba(248,250,252,1))] p-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">{task.status}</Badge>
                      <Badge variant="outline">{task.projectName}</Badge>
                    </div>

                    <div className="space-y-2">
                      <CardTitle className="text-4xl">{task.title}</CardTitle>
                      <CardDescription className="max-w-3xl text-base leading-7 text-slate-600">
                        {task.description}
                      </CardDescription>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {task.recommendedSkills.map((skill) => (
                        <Badge key={skill} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 lg:flex-col">
                    <Button
                      variant="primary"
                      size="lg"
                      disabled
                      className="opacity-50 cursor-not-allowed"
                      title="WIP: Submit functionality coming soon"
                    >
                      <Send size={16} className="mr-2" />
                      Submit (WIP)
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      disabled
                      className="opacity-50 cursor-not-allowed"
                      title="WIP: Save for later functionality coming soon"
                    >
                      <Bookmark size={16} className="mr-2" />
                      Save (WIP)
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody className="space-y-6 p-6">
                <div>
                  <CardTitle className="text-2xl mb-4">Task Details</CardTitle>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <p className="text-sm text-slate-500">Deliverables</p>
                      <p className="text-base text-slate-900">{task.deliverables}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-slate-500">Reward</p>
                      <div className="flex items-baseline gap-2">
                        <p className="text-2xl font-bold text-slate-900">{task.rewardAmount}</p>
                        <p className="text-sm text-slate-600">{task.rewardCurrency}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-slate-500">Max Attempts</p>
                      <p className="text-base text-slate-900">{task.maxAttempts}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-slate-500">Deadline</p>
                      <p className="text-base text-slate-900">
                        {new Date(task.deadline).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-slate-500">Created</p>
                      <p className="text-base text-slate-900">
                        {new Date(task.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-slate-500">Last Updated</p>
                      <p className="text-base text-slate-900">
                        {new Date(task.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>

          </>
        ) : null}
      </section>
    </main>
  )
}
