import { useState, type FormEvent } from 'react'

import { createProject } from '../../lib/project-storage'
import { isFigmaFileUrl } from '../../lib/figma-url'
import { isGithubRepositoryUrl } from '../../lib/github-url'
import type { ProjectForm } from '../../types/app'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import Modal from '../ui/modal'

const EMPTY_PROJECT_FORM: ProjectForm = {
  name: '',
  ownerId: 0,
  description: '',
  githubRepo: '',
  figmaFileUrl: '',
  status: '',
  tags: [],
}

export function CreateProjectModal({
  isOpen,
  onClose,
  onCreated,
}: {
  isOpen: boolean
  onClose: () => void
  onCreated?: () => void | Promise<void>
}) {
  const [projectForm, setProjectForm] = useState<ProjectForm>(EMPTY_PROJECT_FORM)
  const [tagsInput, setTagsInput] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [createErrors, setCreateErrors] = useState<{
    name?: string
    description?: string
    githubRepo?: string
    status?: string
  }>({})

  function resetForm() {
    setProjectForm(EMPTY_PROJECT_FORM)
    setTagsInput('')
    setSubmitError(null)
    setCreateErrors({})
    setIsSubmitting(false)
  }

  function handleClose() {
    resetForm()
    onClose()
  }

  function validateProjectField(field: keyof typeof createErrors, value: string) {
    if (field === 'name') {
      return value.trim() ? undefined : 'Project name is required.'
    }
    if (field === 'description') {
      return value.trim() ? undefined : 'Description is required.'
    }
    if (field === 'githubRepo') {
      const hasFigma = projectForm.figmaFileUrl?.trim();
      if (!value.trim() && !hasFigma) {
        return 'Either a GitHub repository or Figma URL is required.'
      }
      if (value.trim() && !isGithubRepositoryUrl(value)) {
        return 'Enter a valid GitHub repository URL.'
      }
      return undefined;
    }
    return value.trim() ? undefined : 'Status is required.'
  }

  function updateCreateError(field: keyof typeof createErrors, value: string) {
    setCreateErrors((current) => {
      if (!current[field]) {
        return current
      }

      return {
        ...current,
        [field]: validateProjectField(field, value),
      }
    })
  }

  function validateProjectForm() {
    const nextErrors: typeof createErrors = {}

    if (!projectForm.name.trim()) {
      nextErrors.name = 'Project name is required.'
    }
    if (!projectForm.description.trim()) {
      nextErrors.description = 'Description is required.'
    }
    const hasGithub = projectForm.githubRepo?.trim() || "";
    const hasFigma = projectForm.figmaFileUrl?.trim() || "";

    if (!hasGithub && !hasFigma) {
      nextErrors.githubRepo = 'Either a GitHub repository or Figma URL is required.'
    } else {
      if (hasGithub && !isGithubRepositoryUrl(hasGithub)) {
        nextErrors.githubRepo = 'Enter a valid GitHub repository URL.'
      }
      if (hasFigma && !isFigmaFileUrl(hasFigma)) {
        nextErrors.githubRepo = 'Enter a valid Figma URL.'
      }
    }
    if (!projectForm.status.trim()) {
      nextErrors.status = 'Status is required.'
    }

    setCreateErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!validateProjectForm()) {
      setSubmitError(null)
      return
    }

    try {
      setIsSubmitting(true)
      setSubmitError(null)

      const result = await createProject({
        ...projectForm,
        tags: tagsInput
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
      })

      if (result.status === 'error' || !result.data) {
        setSubmitError(result.message || 'Unable to create project.')
        return
      }

      await onCreated?.()
      handleClose()
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Unable to create project.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) {
    return null
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create a new project">
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <Input
          label="Project Name"
          placeholder="Project name"
          helperText={createErrors.name}
          error={Boolean(createErrors.name)}
          value={projectForm.name}
          onChange={(event) => {
            setProjectForm((current) => ({ ...current, name: event.target.value }))
            updateCreateError('name', event.target.value)
          }}
        />
        <Input
          label="GitHub Repo"
          placeholder="Example: https://github.com/owner/repository"
          helperText={createErrors.githubRepo}
          error={Boolean(createErrors.githubRepo)}
          value={projectForm.githubRepo || ""}
          onChange={(event) => {
            setProjectForm((current) => ({ ...current, githubRepo: event.target.value }))
            updateCreateError('githubRepo', event.target.value)
          }}
        />
        <Input
          label="Figma URL (optional)"
          placeholder="Example: https://www.figma.com/design/..."
          value={projectForm.figmaFileUrl || ""}
          onChange={(event) => {
            setProjectForm((current) => ({ ...current, figmaFileUrl: event.target.value }))
          }}
        />
        <div>
          <label className="mb-2 block text-sm font-medium">Description</label>
          <textarea
            rows={4}
            value={projectForm.description}
            placeholder="Describe the project"
            className={`w-full resize-none rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
              createErrors.description ? 'border-red-300 focus:ring-red-200' : 'border-slate-300 focus:ring-blue-200'
            }`}
            onChange={(event) => {
              setProjectForm((current) => ({ ...current, description: event.target.value }))
              updateCreateError('description', event.target.value)
            }}
          />
          {createErrors.description ? <p className="mt-1 text-xs text-red-600">{createErrors.description}</p> : null}
        </div>
        <div>
          <label htmlFor="sidebar-create-project-status" className="mb-2 block text-sm font-medium">
            Status
          </label>
          <select
            id="sidebar-create-project-status"
            value={projectForm.status}
            onChange={(event) => {
              setProjectForm((current) => ({ ...current, status: event.target.value }))
              updateCreateError('status', event.target.value)
            }}
            className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
              createErrors.status ? 'border-red-300 focus:ring-red-200' : 'border-slate-300 focus:ring-blue-200'
            }`}
          >
            <option value="">Select a status...</option>
            <option value="OPEN">OPEN</option>
            <option value="HIRING">HIRING</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="COMPLETED">COMPLETED</option>
          </select>
          {createErrors.status ? <p className="mt-1 text-xs text-red-600">{createErrors.status}</p> : null}
        </div>
        <Input
          label="Tags"
          helperText="Separate tags with commas."
          value={tagsInput}
          onChange={(event) => setTagsInput(event.target.value)}
        />
        {submitError ? <p className="text-sm text-red-600">{submitError}</p> : null}
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create project'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
