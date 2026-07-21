import {
  Card,
  CardBody,
  CardDescription,
  CardTitle,
} from "../../../components/ui/card";
import { Check, Cross, Github, PlusIcon, Star, Users } from "lucide-react";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";

import type { ProjectForm, ProjectResponse, User } from "../../../types/app";

import { createProject, fetchProjectsByCurrentUser } from "../../../lib/project-storage";
import { useEffect, useState, type FormEvent, useCallback } from "react";
import { StatLine } from "../../../components/app/stat-line";
import Modal from "../../../components/ui/modal";
import { Input } from "../../../components/ui/input";
import { PaginationControls } from "../../../components/ui/pagination-controls";
import { useNavigate } from "react-router-dom";
import { isGithubRepositoryUrl } from "../../../lib/github-url";
import { isFigmaFileUrl } from "../../../lib/figma-url";
import { PROFILE_PAGE_SIZE, createEmptyPaginatedResponse } from "../../../lib/pagination";
import type { PaginatedResponse } from "../../../types/app";
import { readStoredProfileDashboard } from "../../../lib/dashboard-storage";
import { ImportGithubReposModal } from "../../../components/app/import-github-repos-modal";

export function ProjectsTab({ 
    user 
}: { 
    user: User 
}) {
  const navigate = useNavigate()
  const [projectsPage, setProjectsPage] = useState<PaginatedResponse<ProjectResponse>>(() => {
    const dashboard = readStoredProfileDashboard();
    return dashboard?.projects || createEmptyPaginatedResponse<ProjectResponse>(0, PROFILE_PAGE_SIZE);
  });
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [createErrors, setCreateErrors] = useState<{
    name?: string
    description?: string
    githubRepo?: string
    status?: string
  }>({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [tagsInput, setTagsInput] = useState('')

  const [projectForm, setProjectForm] = useState<ProjectForm>({
    name: "",
    ownerId: user?.id || 0,
    description: "",
    githubRepo: "",
    figmaFileUrl: "",
    status: "",
    tags: []
  });

  function resetProjectForm() {
    setCreateErrors({})
    setTagsInput('')
    setFeedback(null)
    setIsSubmitting(false)
    setProjectForm({
      name: "",
      ownerId: user?.id || 0,
      description: "",
      githubRepo: "",
      figmaFileUrl: "",
      status: "",
      tags: []
    })
  }

  const reloadProjects = useCallback(async (pageOverride = currentPage) => {
    if (!user?.id) return;
    
    setIsLoadingProjects(true)
    try {
      const response = await fetchProjectsByCurrentUser({
        page: pageOverride,
        size: PROFILE_PAGE_SIZE,
      });

      if (response.status === 'success' && response.data) {
        setProjectsPage(response.data)
      } else {
        setProjectsPage(createEmptyPaginatedResponse<ProjectResponse>(pageOverride, PROFILE_PAGE_SIZE))
      }
    } catch (error) {
      console.error('Failed to reload projects', error)
      setProjectsPage(createEmptyPaginatedResponse<ProjectResponse>(pageOverride, PROFILE_PAGE_SIZE))
    } finally {
      setIsLoadingProjects(false)
    }
  }, [user.id, currentPage]);

  useEffect(() => {
    const syncFromDashboard = () => {
      const dashboard = readStoredProfileDashboard();
      if (dashboard?.projects && currentPage === 0) {
        setProjectsPage(dashboard.projects);
      }
    };

    if (currentPage > 0) {
      void reloadProjects();
    } else {
      syncFromDashboard();
    }

    window.addEventListener('nexhub-dashboard-updated', syncFromDashboard);
    return () => window.removeEventListener('nexhub-dashboard-updated', syncFromDashboard);
  }, [reloadProjects, currentPage]);

  function validateProjectForm() {
    const nextErrors: {
      name?: string
      description?: string
      githubRepo?: string
      status?: string
    } = {}

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validateProjectForm()) {
      setFeedback(null)
      return
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const res = await createProject({
        ...projectForm,
        tags: tagsInput
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
      })
      
      setIsSubmitting(false)
      if (res.status === 'error' || !res.data) {
        setFeedback({message: res.message || "Error", type:"error"})
        return
      }
      
      setFeedback({message: "Project created successfully", type:"success"});
      setShowModal(false)
      resetProjectForm()
      setCurrentPage(0)
      void reloadProjects(0)
    } catch {
      setFeedback({message: "Error creating project", type:"error"})
      setIsSubmitting(false)
    }
  }

  const displayModal = () => {
    if (!showModal) return null;

    return (
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          resetProjectForm()
        }}
        title={"Create a new project"}
      >
        <form className="grid gap-4" onSubmit={handleSubmit}>
          {feedback && (
            <div className={`p-3 rounded-lg flex items-center gap-3 text-sm border ${
              feedback.type === 'success'
                ? 'border-green-100 bg-green-50 text-green-700'
                : 'border-red-100 bg-red-50 text-red-700'
            }`}>
              {feedback.type === 'success' ? <Check size={16} className="text-green-600" /> : <Cross size={16} className="text-red-600" />}
              <span>{feedback.message}</span>
            </div>
          )}
          <Input
            label="Project Name"
            placeholder="Test"
            helperText={createErrors.name}
            error={Boolean(createErrors.name)}
            value={projectForm.name}
            onChange={(event) =>
              {
              setProjectForm((current) => ({
                ...current,
                name: event.target.value,
              }))
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
              setProjectForm((current) => ({
                ...current,
                githubRepo: event.target.value,
              }))
              updateCreateError('githubRepo', event.target.value)
            }}
          />
          <Input
            label="Figma URL (optional)"
            placeholder="Example: https://www.figma.com/design/..."
            value={projectForm.figmaFileUrl || ""}
            onChange={(event) => {
              setProjectForm((current) => ({
                ...current,
                figmaFileUrl: event.target.value,
              }))
            }}
          />
          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              placeholder="Web app"
              className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 resize-none ${
                createErrors.description
                  ? 'border-red-300 focus:ring-red-200'
                  : 'border-slate-300 focus:ring-blue-200'
              }`}
              rows={4}
              value={projectForm.description}
              onChange={(event) => {
                setProjectForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
                updateCreateError('description', event.target.value)
              }}
            />
            {createErrors.description && (
              <p className="text-xs text-red-600 mt-1">{createErrors.description}</p>
            )}
          </div>
          <div>
            <label htmlFor="project-status-select" className="block text-sm font-medium mb-2">
              Status
            </label>
            <select
              id="project-status-select"
              value={projectForm.status}
              onChange={(event) => {
                setProjectForm((current) => ({
                  ...current,
                  status: event.target.value,
                }))
                updateCreateError('status', event.target.value)
              }}
              className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                createErrors.status
                  ? 'border-red-300 focus:ring-red-200'
                  : 'border-slate-300 focus:ring-blue-200'
              }`}
            >
              <option value="">Select a status...</option>
              <option value="OPEN">OPEN</option>
              <option value="HIRING">HIRING</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="COMPLETED">COMPLETED</option>
            </select>
            {createErrors.status && (
              <p className="text-xs text-red-600 mt-1">{createErrors.status}</p>
            )}
          </div>
          <Input
            label="Tags"
            helperText="Separate tags with commas."
            value={tagsInput}
            onChange={(event) => setTagsInput(event.target.value)}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setShowModal(false)
                resetProjectForm()
              }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create project'}
            </Button>
          </div>
        </form>
      </Modal>
    );
  };

  return (
    <Card>
      <CardBody className="p-4 flex flex-col max-h-full h-full">
        <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <CardTitle className="text-3xl">My projects</CardTitle>
            <CardDescription className="mt-2 text-base">
              Here you can see all of your projects and create or import new ones.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-3 sm:flex-nowrap">
            {user.githubUsername ? (
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
              aria-label="Create project"
              onClick={() => {
                resetProjectForm()
                setShowModal(true)
              }}
            >
              <PlusIcon size={16} />
            </Button>
          </div>
        </section>
        {!showModal && feedback ? (
          <Card className={`border-${feedback.type === 'success' ? 'green' : 'red'}-100 bg-${feedback.type === 'success' ? 'green' : 'red'}-50/70 shadow-none`}>
            <CardBody className="flex items-center gap-3 p-4">
              {feedback.type === 'success' ? <Check size={16} className="text-green-600" /> : <Cross size={16} className="text-red-600" />}
              <CardDescription className={`text-sm text-${feedback.type === 'success' ? 'green' : 'red'}-700`}>{feedback.message}</CardDescription>
            </CardBody>
          </Card>
        ) : null}
        {displayModal()}
        <ImportGithubReposModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          onImported={async () => {
            setFeedback({ message: 'GitHub repository imported successfully.', type: 'success' })
            setCurrentPage(0)
            await reloadProjects(0)
          }}
        />
        <section className="mt-10 h-full overflow-hidden">
          {isLoadingProjects ? (
            <Card className="shadow-none border-none">
              <CardBody className="p-6 text-center">
                <CardDescription>Loading your projects...</CardDescription>
              </CardBody>
            </Card>
          ) : projectsPage.content.length === 0 ? (
            <Card className="shadow-none border-none">
              <CardBody className="p-6 text-center">
                <CardDescription>No projects yet. Create one to get started.</CardDescription>
              </CardBody>
            </Card>
          ) : (
            <>
              <div className="grid h-full auto-rows-fr grid-cols-1 gap-4 overflow-y-auto pr-1 lg:grid-cols-3 pb-4">
                {projectsPage.content.map((project) => (
                  <Card
                    className="h-fit"
                    onClick={() => navigate(`/project/${project.id}`, { state: { backTo: '/profile?tab=projects' } })}
                    key={project.id}
                    hoverShadow={true}
                    clickMouse={true}
                  >
                    <CardBody className="flex h-full flex-col gap-4 p-5">
                      <div className="min-h-[5rem] min-w-0 space-y-2">
                        <CardTitle className="break-words text-2xl font-medium leading-tight">
                          {project.name}
                        </CardTitle>
                        <CardDescription className="line-clamp-2">{project.description}</CardDescription>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {project.tags.slice(0, 3).map((tag) => (
                          <Badge variant='outline' key={String(tag)} className="text-[10px]">{tag}</Badge>
                        ))}
                      </div>
                      <div className="mt-auto flex flex-wrap gap-4 pt-4 border-t border-slate-100">
                        <StatLine
                          icon={<Star size={14} className="text-amber-400" />}
                          text={`${project.starsCount} stars`}
                        />
                        <StatLine
                          icon={<Users size={14} className="text-slate-400" />}
                          text={` WIP followers`}
                        />
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
                isLoading={isLoadingProjects}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </section>
      </CardBody>
    </Card>
  );
}
