import { useEffect, useState, type FormEvent } from 'react'

import { fetchProjectsByCurrentUser } from '../../lib/project-storage'
import { createTask } from '../../lib/task-storage'
import { LOOKUP_PAGE_SIZE } from '../../lib/pagination'
import type { ProjectResponse, TaskRequest } from '../../types/app'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import Modal from '../ui/modal'

const EMPTY_TASK_FORM: TaskRequest = {
  projectId: 0,
  title: '',
  description: '',
  deliverables: '',
  rewardAmount: 0,
  rewardCurrency: 'ARS',
  deadline: new Date(),
  status: 'Open',
  maxAttempts: 3,
  collaborative: false,
  recommendedSkills: [],
  taskType: 'DEVELOPMENT',
}

export function CreateTaskModal({
  isOpen,
  onClose,
  onCreated,
}: {
  isOpen: boolean
  onClose: () => void
  onCreated?: () => void | Promise<void>
}) {
  const [taskForm, setTaskForm] = useState<TaskRequest>(EMPTY_TASK_FORM)
  const [allowAnyReputation, setAllowAnyReputation] = useState(true)
  const [projects, setProjects] = useState<ProjectResponse[]>([])
  const [skillsInput, setSkillsInput] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [createErrors, setCreateErrors] = useState<{
    title?: string
    description?: string
    deliverables?: string
    rewardAmount?: string
    projectId?: string
  }>({})

  useEffect(() => {
    if (!isOpen) {
      return
    }

    async function loadProjects() {
      const response = await fetchProjectsByCurrentUser({
        page: 0,
        size: LOOKUP_PAGE_SIZE,
      })

      if (response.status === 'success' && response.data) {
        setProjects(
          response.data.content.filter(
            (project) => project.status.toString().toLowerCase() !== 'archived',
          ),
        )
        return
      }

      setProjects([])
    }

    void loadProjects()
  }, [isOpen])

  function resetForm() {
    setTaskForm(EMPTY_TASK_FORM)
    setAllowAnyReputation(true)
    setProjects([])
    setSkillsInput('')
    setSubmitError(null)
    setCreateErrors({})
    setIsSubmitting(false)
  }

  function handleClose() {
    resetForm()
    onClose()
  }

  function validateTaskField(field: keyof typeof createErrors, value: string | number) {
    if (field === 'title') {
      return String(value).trim() ? undefined : 'Task title is required.'
    }
    if (field === 'description') {
      return String(value).trim() ? undefined : 'Description is required.'
    }
    if (field === 'deliverables') {
      return String(value).trim() ? undefined : 'Deliverables are required.'
    }
    if (field === 'rewardAmount') {
      return Number(value) > 0 ? undefined : 'Reward amount must be greater than 0.'
    }
    return Number(value) > 0 ? undefined : 'Project ID is required.'
  }

  function updateTaskError(field: keyof typeof createErrors, value: string | number) {
    setCreateErrors((current) => {
      if (!current[field]) {
        return current
      }

      return {
        ...current,
        [field]: validateTaskField(field, value),
      }
    })
  }

  function validateTaskForm() {
    const nextErrors: typeof createErrors = {}

    if (!taskForm.title.trim()) {
      nextErrors.title = 'Task title is required.'
    }
    if (!taskForm.description.trim()) {
      nextErrors.description = 'Description is required.'
    }
    if (!taskForm.deliverables.trim()) {
      nextErrors.deliverables = 'Deliverables are required.'
    }
    if (taskForm.rewardAmount <= 0) {
      nextErrors.rewardAmount = 'Reward amount must be greater than 0.'
    }
    if (taskForm.projectId <= 0) {
      nextErrors.projectId = 'Project ID is required.'
    }

    setCreateErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!validateTaskForm()) {
      setSubmitError(null)
      return
    }

    try {
      setIsSubmitting(true)
      setSubmitError(null)

      const result = await createTask({
        ...taskForm,
        minReputation: allowAnyReputation ? -500 : (taskForm.minReputation || 0),
        recommendedSkills: skillsInput
          .split(',')
          .map((skill) => skill.trim())
          .filter(Boolean),
      })

      if (result.status === 'error' || !result.data) {
        setSubmitError(result.message || 'Unable to create task.')
        return
      }

      await onCreated?.()
      handleClose()
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Unable to create task.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) {
    return null
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create a new task">
      <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium">Task Title</label>
          <Input
            placeholder="Implement feature X"
            helperText={createErrors.title}
            error={Boolean(createErrors.title)}
            value={taskForm.title}
            onChange={(event) => {
              setTaskForm((current) => ({ ...current, title: event.target.value }))
              updateTaskError('title', event.target.value)
            }}
          />
        </div>
        <div>
          <label htmlFor="sidebar-create-task-project" className="mb-2 block text-sm font-medium">
            Project
          </label>
          <select
            id="sidebar-create-task-project"
            value={taskForm.projectId}
            onChange={(event) => {
              const projectId = Number(event.target.value)
              setTaskForm((current) => ({ ...current, projectId }))
              updateTaskError('projectId', projectId)
            }}
            className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
              createErrors.projectId ? 'border-red-300 focus:ring-red-200' : 'border-slate-300 focus:ring-blue-200'
            }`}
          >
            <option value={0}>Select a project...</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
          {createErrors.projectId ? <p className="mt-1 text-xs text-red-600">{createErrors.projectId}</p> : null}
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium">Reward Amount</label>
          <Input
            placeholder="100"
            helperText={createErrors.rewardAmount}
            error={Boolean(createErrors.rewardAmount)}
            value={taskForm.rewardAmount || ''}
            onChange={(event) => {
              const value = event.target.value
              if (value === '' || /^\d+(\.\d{0,2})?$/.test(value)) {
                setTaskForm((current) => ({
                  ...current,
                  rewardAmount: value === '' ? 0 : Number(value),
                }))
                updateTaskError('rewardAmount', value === '' ? 0 : Number(value))
              }
            }}
          />
        </div>
        <div>
          <label htmlFor="sidebar-create-task-status" className="mb-2 block text-sm font-medium">
            Status
          </label>
          <select
            id="sidebar-create-task-status"
            value={taskForm.status}
            onChange={(event) => {
              setTaskForm((current) => ({ ...current, status: event.target.value }))
            }}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2"
          >
            <option value="">Select a status...</option>
            <option value="OPEN">OPEN</option>
            <option value="HIRING">HIRING</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="COMPLETED">COMPLETED</option>
          </select>
        </div>
        <div>
          <label htmlFor="sidebar-create-task-type" className="mb-2 block text-sm font-medium">
            Task Type
          </label>
          <select
            id="sidebar-create-task-type"
            value={taskForm.taskType}
            onChange={(event) => {
              setTaskForm((current) => ({ ...current, taskType: event.target.value }))
            }}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2"
          >
            <option value="DEVELOPMENT">Development</option>
            <option value="DESIGN">Design</option>
          </select>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium">Max Attempts</label>
          <Input
            placeholder="3"
            value={taskForm.maxAttempts || ''}
            onChange={(event) => {
              const value = event.target.value
              if (value === '' || /^\d+$/.test(value)) {
                setTaskForm((current) => ({
                  ...current,
                  maxAttempts: value === '' ? 0 : Number(value),
                }))
              }
            }}
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium">Deliverables</label>
          <Input
            placeholder="What needs to be delivered"
            helperText={createErrors.deliverables}
            error={Boolean(createErrors.deliverables)}
            value={taskForm.deliverables}
            onChange={(event) => {
              setTaskForm((current) => ({ ...current, deliverables: event.target.value }))
              updateTaskError('deliverables', event.target.value)
            }}
          />
        </div>
        <div className="flex items-center gap-2 mt-6">
          <input
            id="sidebar-create-task-collaborative"
            type="checkbox"
            checked={taskForm.collaborative}
            onChange={(event) => {
              setTaskForm((current) => ({
                ...current,
                collaborative: event.target.checked,
              }))
            }}
            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="sidebar-create-task-collaborative" className="text-sm font-medium text-slate-700 cursor-pointer">
            Collaborative Task
          </label>
        </div>
        <div className="flex flex-col justify-center gap-2">
          <div className="flex items-center gap-2">
            <input
              id="sidebar-create-task-any-rep"
              type="checkbox"
              checked={allowAnyReputation}
              onChange={(event) => {
                const checked = event.target.checked
                setAllowAnyReputation(checked)
                if (checked) {
                  setTaskForm((current) => ({ ...current, minReputation: -500 }))
                } else {
                  setTaskForm((current) => ({ ...current, minReputation: 0 }))
                }
              }}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="sidebar-create-task-any-rep" className="text-sm font-medium text-slate-700 cursor-pointer">
              Any reputation score
            </label>
          </div>
        </div>
        {!allowAnyReputation && (
          <div>
            <label className="mb-2 block text-sm font-medium">Minimum Reputation Required</label>
            <Input
              type="number"
              placeholder="0"
              value={taskForm.minReputation === undefined ? '' : taskForm.minReputation}
              onChange={(event) => {
                const value = event.target.value
                setTaskForm((current) => ({
                  ...current,
                  minReputation: value === '' ? 0 : Number(value),
                }))
              }}
            />
          </div>
        )}
        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium">Recommended Skills</label>
          <Input
            placeholder="Separate skills with commas."
            value={skillsInput}
            onChange={(event) => setSkillsInput(event.target.value)}
          />
          <p className="mt-1 text-xs text-slate-500">Separate skills with commas.</p>
        </div>
        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium">Description</label>
          <textarea
            rows={4}
            value={taskForm.description}
            placeholder="Detailed description of the task"
            className={`w-full resize-none rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
              createErrors.description ? 'border-red-300 focus:ring-red-200' : 'border-slate-300 focus:ring-blue-200'
            }`}
            onChange={(event) => {
              setTaskForm((current) => ({ ...current, description: event.target.value }))
              updateTaskError('description', event.target.value)
            }}
          />
          {createErrors.description ? <p className="mt-1 text-xs text-red-600">{createErrors.description}</p> : null}
        </div>
        {submitError ? <p className="text-sm text-red-600 md:col-span-2">{submitError}</p> : null}
        <div className="flex justify-end gap-3 pt-2 md:col-span-2">
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create task'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
