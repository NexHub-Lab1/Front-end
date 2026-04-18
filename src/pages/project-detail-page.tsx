import { ArrowLeft, FolderGit2, Pencil, Sparkles, Star, Trash2, Users } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { AppHeader } from '../components/app/app-header'
import { StatLine } from '../components/app/stat-line'
import { getProjectById, getCurrentUserAuthData, updateProject, deleteProject } from '../lib/user-storage'
import type { ProjectResponse, ProjectUpdateForm } from '../types/app'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardBody, CardDescription, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import Modal from '../components/ui/modal'

function normalizeRepoUrl(githubRepo?: string) {
  if (!githubRepo) {
    return null
  }

  if (githubRepo.startsWith('http://') || githubRepo.startsWith('https://')) {
    return githubRepo
  }

  return `https://${githubRepo}`
}

export function ProjectDetailPage({
  onSignOut,
  onOpenMenu,
}: {
  onSignOut: () => void
  onOpenMenu: () => void
}) {
  const navigate = useNavigate()
  const { id } = useParams()
  const [project, setProject] = useState<ProjectResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editFeedback, setEditFeedback] = useState<string | null>(null)
  const [editErrors, setEditErrors] = useState<{
    name?: string
    description?: string
    githubRepo?: string
    status?: string
  }>({})
  const [editForm, setEditForm] = useState<ProjectUpdateForm>({
    id: 0,
    name: '',
    description: '',
    githubRepo: '',
    status: '',
    tags: [],
  })
  const [tagsInput, setTagsInput] = useState('')
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const currentUser = getCurrentUserAuthData()?.user

  useEffect(() => {
    async function loadProject() {
      const parsedId = Number(id)

      if (!id || Number.isNaN(parsedId)) {
        setError('Project id is invalid')
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const result = await getProjectById(parsedId)

        if (!result) {
          throw new Error('Unable to load project')
        }

        setProject(result)
      } catch (fetchError) {
        setProject(null)
        setError(fetchError instanceof Error ? fetchError.message : 'Unable to load project')
      } finally {
        setIsLoading(false)
      }
    }

    void loadProject()
  }, [id])

  useEffect(() => {
    if (!project) {
      return
    }

    setEditForm({
      id: project.id,
      name: project.name.toString(),
      description: project.description.toString(),
      githubRepo: project.githubRepo.toString(),
      status: project.status.toString(),
      tags: project.tags.map((tag) => tag.toString()),
    })
    setTagsInput(project.tags.map((tag) => tag.toString()).join(', '))
    setEditErrors({})
  }, [project])

  const repoUrl = useMemo(() => normalizeRepoUrl(project?.githubRepo?.toString()), [project?.githubRepo])
  const isOwner = useMemo(() => {
    if (!project || !currentUser) {
      return false
    }

    return project.ownerId === currentUser.id
  }, [project, currentUser])

  function validateEditForm() {
    const nextErrors: {
      name?: string
      description?: string
      githubRepo?: string
      status?: string
    } = {}

    if (!editForm.name.trim()) {
      nextErrors.name = 'Project name is required.'
    }

    if (!editForm.description.trim()) {
      nextErrors.description = 'Description is required.'
    }

    if (!editForm.githubRepo.trim()) {
      nextErrors.githubRepo = 'GitHub repository is required.'
    }

    if (!editForm.status.trim()) {
      nextErrors.status = 'Status is required.'
    }

    setEditErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleEditSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!project) {
      return
    }

    if (!validateEditForm()) {
      setEditFeedback(null)
      return
    }

    setIsSubmitting(true)
    setEditFeedback(null)

    try {
      const updatedProject = await updateProject({
        ...editForm,
        id: project.id,
        tags: tagsInput
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
      })

      if (!updatedProject) {
        throw new Error('Unable to update project')
      }

      setProject(updatedProject)
      setEditFeedback('Project updated successfully')
      setIsEditOpen(false)
    } catch (submitError) {
      setEditFeedback(submitError instanceof Error ? submitError.message : 'Unable to update project')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDeleteProject() {
    if (!project || !isOwner) {
      return
    }

    setEditFeedback(null)

    try {
      const deletedProject = await deleteProject(project.id)
      if (!deletedProject) {
        throw new Error('Unable to delete project')
      }

      navigate('/profile')
    } catch (deleteError) {
      setEditFeedback(deleteError instanceof Error ? deleteError.message : 'Unable to delete project')
    }
  }

  return (
    <main className="min-h-screen px-4 py-5 sm:px-6 lg:px-8">
      <AppHeader onSignOut={onSignOut} onOpenMenu={onOpenMenu} />

      <section className="mx-auto mt-6 max-w-5xl space-y-6">
        {isLoading ? (
          <Card>
            <CardBody className="space-y-3 p-6">
              <CardTitle className="text-3xl">Loading project...</CardTitle>
              <CardDescription>Please wait while we load the project details.</CardDescription>
            </CardBody>
          </Card>
        ) : error ? (
          <Card>
            <CardBody className="space-y-3 p-6">
              <CardTitle className="text-3xl">Project not found</CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardBody>
          </Card>
        ) : project ? (
          <>
            <Card className="overflow-hidden">
              <CardBody className="space-y-6 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.14),_transparent_35%),linear-gradient(180deg,rgba(255,255,255,1),rgba(248,250,252,1))] p-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">{project.status}</Badge>
                      {project.ownerUsername ? (
                        <Badge variant="outline">by {project.ownerUsername.toString()}</Badge>
                      ) : null}
                    </div>

                    <div className="space-y-2">
                      <CardTitle className="text-4xl">{project.name.toString()}</CardTitle>
                      <CardDescription className="max-w-3xl text-base leading-7 text-slate-600">
                        {project.description.toString()}
                      </CardDescription>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {project.tags.map((tag) => (
                        <Badge key={tag.toString()} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {repoUrl ? (
                      <Button variant="outline" asChild>
                        <a href={repoUrl} target="_blank" rel="noreferrer">
                          <FolderGit2 size={16} />
                          Open repository
                        </a>
                      </Button>
                    ) : null}
                    <Button variant="primary" onClick={() => setIsEditOpen(true)}>
                      <Pencil size={16} />
                      Edit project
                    </Button>
                    {isOwner ? (
                      <Button
                        variant="outline"
                        className="border-red-200 text-red-600 hover:bg-red-50"
                        onClick={() => setIsDeleteOpen(true)}
                      >
                        <Trash2 size={16} />
                        Delete project
                      </Button>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-wrap gap-5">
                  <StatLine
                    icon={<Star size={14} className="text-amber-400" />}
                    text={`${project.starsCount} stars`}
                  />
                  <StatLine
                    icon={<Users size={14} className="text-slate-400" />}
                    text={`${project.contributorCount} contributors`}
                  />
                </div>
              </CardBody>
            </Card>

            {editFeedback ? (
              <Card className="border-blue-100 bg-blue-50/70 shadow-none">
                <CardBody className="flex items-center gap-3 p-4">
                  <Sparkles size={16} className="text-blue-600" />
                  <CardDescription className="text-sm text-blue-700">{editFeedback}</CardDescription>
                </CardBody>
              </Card>
            ) : null}

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
              <Card className="shadow-none">
                <CardBody className="space-y-4 p-6">
                  <CardTitle className="text-xl">About this project</CardTitle>
                  <CardDescription className="text-base leading-7 text-slate-600">
                    {project.description.toString()}
                  </CardDescription>
                </CardBody>
              </Card>

              <Card className="shadow-none">
                <CardBody className="space-y-4 p-6">
                  <CardTitle className="text-xl">Project details</CardTitle>
                  <div className="grid gap-3 text-sm text-slate-600">
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-medium text-slate-700">Project id</span>
                      <span>{project.id}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-medium text-slate-700">Status</span>
                      <span>{project.status.toString()}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-medium text-slate-700">Created</span>
                      <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-medium text-slate-700">Last updated</span>
                      <span>{new Date(project.updatedAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <span className="font-medium text-slate-700">Tags</span>
                      <span className="text-right">{project.tags.join(', ') || 'No tags yet'}</span>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>

            <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit project">
              <form className="grid gap-4" onSubmit={handleEditSubmit}>
                <Input
                  label="Project name"
                  helperText={editErrors.name}
                  className={editErrors.name ? 'border-red-300 focus-visible:ring-red-200' : undefined}
                  value={editForm.name}
                  onChange={(event) =>
                    setEditForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                />
                <Input
                  label="Description"
                  helperText={editErrors.description}
                  className={editErrors.description ? 'border-red-300 focus-visible:ring-red-200' : undefined}
                  value={editForm.description}
                  onChange={(event) =>
                    setEditForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                />
                <Input
                  label="GitHub repository"
                  helperText={editErrors.githubRepo}
                  className={editErrors.githubRepo ? 'border-red-300 focus-visible:ring-red-200' : undefined}
                  value={editForm.githubRepo}
                  onChange={(event) =>
                    setEditForm((current) => ({
                      ...current,
                      githubRepo: event.target.value,
                    }))
                  }
                />
                <Input
                  label="Status"
                  helperText={editErrors.status}
                  className={editErrors.status ? 'border-red-300 focus-visible:ring-red-200' : undefined}
                  value={editForm.status}
                  onChange={(event) =>
                    setEditForm((current) => ({
                      ...current,
                      status: event.target.value,
                    }))
                  }
                />
                <Input
                  label="Tags"
                  helperText="Separate tags with commas."
                  value={tagsInput}
                  onChange={(event) => setTagsInput(event.target.value)}
                />
                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="ghost" onClick={() => setIsEditOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : 'Save changes'}
                  </Button>
                </div>
              </form>
            </Modal>

            <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Delete project">
              <div className="grid gap-4">
                <CardDescription className="text-base text-slate-600">
                  This will remove <span className="font-medium text-slate-900">{project.name.toString()}</span> from
                  your projects. This action cannot be undone.
                </CardDescription>
                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="ghost" onClick={() => setIsDeleteOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="border-red-200 text-red-600 hover:bg-red-50"
                    onClick={async () => {
                      setIsDeleteOpen(false)
                      await handleDeleteProject()
                    }}
                  >
                    <Trash2 size={16} />
                    Delete project
                  </Button>
                </div>
              </div>
            </Modal>
          </>
        ) : null}
      </section>
    </main>
  )
}
