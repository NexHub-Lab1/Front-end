import {
  Archive,
  FolderGit2,
  Pencil,
  Sparkles,
  Star,
  Trash2,
  Users,
  ArrowLeft,
  ArrowDown,
  ArrowRight,
  Plus,
  Check,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import { AppHeader } from "../components/app/app-header";
import { StatLine } from "../components/app/stat-line";
import { readStoredUser } from "../lib/auth-storage";
import {
  fetchProjectById,
  updateProject,
  deleteProject,
  archiveProject,
} from "../lib/project-storage";
import { fetchTasksByProject, createTask } from "../lib/task-storage";
import { isGithubRepositoryUrl } from "../lib/github-url";
import type {
  ProjectResponse,
  ProjectUpdateForm,
  TaskResponse,
  TaskRequest,
} from "../types/app";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Card,
  CardBody,
  CardDescription,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import Modal from "../components/ui/modal";
import { PaginationControls } from "../components/ui/pagination-controls";
import {
  DETAIL_PAGE_SIZE,
  createEmptyPaginatedResponse,
} from "../lib/pagination";
import type { PaginatedResponse } from "../types/app";

function normalizeRepoUrl(githubRepo?: string) {
  if (!githubRepo) {
    return null;
  }

  if (githubRepo.startsWith("http://") || githubRepo.startsWith("https://")) {
    return githubRepo;
  }

  return `https://${githubRepo}`;
}

export function ProjectDetailPage({
  onSignOut,
  onOpenMenu,
}: {
  onSignOut: () => void;
  onOpenMenu: () => void;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const [project, setProject] = useState<ProjectResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editFeedback, setEditFeedback] = useState<string | null>(null);
  const [editErrors, setEditErrors] = useState<{
    name?: string;
    description?: string;
    githubRepo?: string;
    status?: string;
  }>({});
  const [editForm, setEditForm] = useState<ProjectUpdateForm>({
    id: 0,
    name: "",
    description: "",
    githubRepo: "",
    status: "",
    tags: [],
  });
  const [tagsInput, setTagsInput] = useState("");
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [projectTasksPage, setProjectTasksPage] = useState<
    PaginatedResponse<TaskResponse>
  >(createEmptyPaginatedResponse<TaskResponse>(0, DETAIL_PAGE_SIZE));
  const [tasksPageIndex, setTasksPageIndex] = useState(0);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const currentUser = readStoredUser();

  // State for creating a new task
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTaskForm, setNewTaskForm] = useState<TaskRequest>({
    projectId: 0,
    title: "",
    description: "",
    deliverables: "",
    rewardAmount: 0,
    rewardCurrency: "USD",
    deadline: new Date(),
    status: "OPEN",
    maxAttempts: 3,
    recommendedSkills: [],
  });
  const [createSkillsInput, setCreateSkillsInput] = useState("");
  const [createErrors, setCreateErrors] = useState<{
    title?: string;
    description?: string;
    deliverables?: string;
    rewardAmount?: string;
  }>({});
  const [createFeedback, setCreateFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);
  const [reloadTrigger, setReloadTrigger] = useState(0);

  const getDeadlineString = (dateVal: Date | string | undefined): string => {
    if (!dateVal) return "";
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "";
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const validateCreateTaskForm = () => {
    const nextErrors: typeof createErrors = {};

    if (!newTaskForm.title.trim()) {
      nextErrors.title = "Task title is required.";
    }

    if (!newTaskForm.description.trim()) {
      nextErrors.description = "Description is required.";
    }

    if (!newTaskForm.deliverables.trim()) {
      nextErrors.deliverables = "Deliverables are required.";
    }

    if (newTaskForm.rewardAmount <= 0) {
      nextErrors.rewardAmount = "Reward amount must be greater than 0.";
    }

    setCreateErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const updateCreateTaskError = (
    field: keyof typeof createErrors,
    value: string | number,
  ) => {
    setCreateErrors((current) => {
      if (!current[field]) {
        return current;
      }

      let errorVal: string | undefined = undefined;
      if (field === "title" && !String(value).trim()) {
        errorVal = "Task title is required.";
      } else if (field === "description" && !String(value).trim()) {
        errorVal = "Description is required.";
      } else if (field === "deliverables" && !String(value).trim()) {
        errorVal = "Deliverables are required.";
      } else if (field === "rewardAmount" && Number(value) <= 0) {
        errorVal = "Reward amount must be greater than 0.";
      }

      return {
        ...current,
        [field]: errorVal,
      };
    });
  };

  const handleOpenCreateModal = () => {
    if (!project) return;
    setNewTaskForm({
      projectId: project.id,
      title: "",
      description: "",
      deliverables: "",
      rewardAmount: 0,
      rewardCurrency: "USD",
      deadline: new Date(),
      status: "OPEN",
      maxAttempts: 3,
      recommendedSkills: [],
    });
    setCreateSkillsInput("");
    setCreateErrors({});
    setCreateFeedback(null);
    setShowCreateModal(true);
  };

  const handleCreateTaskSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateCreateTaskForm() || !project) {
      setCreateFeedback(null);
      return;
    }

    setIsSubmittingTask(true);
    setCreateFeedback(null);

    const taskData = {
      ...newTaskForm,
      recommendedSkills: createSkillsInput
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean),
    };

    try {
      const res = await createTask(taskData);

      if (res.status === "error" || !res.data) {
        setCreateFeedback({
          message: res.message || "Error creating task",
          type: "error",
        });
        return;
      }

      setCreateFeedback({
        message: "Task created successfully",
        type: "success",
      });
      setReloadTrigger((prev) => prev + 1);
      setShowCreateModal(false);
    } catch (error) {
      setCreateFeedback({ message: "Error creating task", type: "error" });
    } finally {
      setIsSubmittingTask(false);
    }
  };

  useEffect(() => {
    async function loadProject() {
      const parsedId = Number(id);

      if (!id || Number.isNaN(parsedId)) {
        setError("Project id is invalid");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetchProjectById(parsedId);

        if (response.status === "error" || !response.data) {
          throw new Error(response.message || "Unable to load project");
        }

        setProject(response.data);
      } catch (fetchError) {
        setProject(null);
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Unable to load project",
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadProject();
  }, [id]);

  useEffect(() => {
    if (!project) {
      return;
    }

    setTasksPageIndex(0);
  }, [project?.id]);

  useEffect(() => {
    if (!project) {
      return;
    }

    async function loadTasks() {
      setIsLoadingTasks(true);
      try {
        const response = await fetchTasksByProject(project!.id, {
          page: tasksPageIndex,
          size: DETAIL_PAGE_SIZE,
        });
        if (response.status === "success" && response.data) {
          setProjectTasksPage(response.data);
        } else {
          setProjectTasksPage(
            createEmptyPaginatedResponse<TaskResponse>(
              tasksPageIndex,
              DETAIL_PAGE_SIZE,
            ),
          );
        }
      } catch (error) {
        setProjectTasksPage(
          createEmptyPaginatedResponse<TaskResponse>(
            tasksPageIndex,
            DETAIL_PAGE_SIZE,
          ),
        );
      } finally {
        setIsLoadingTasks(false);
      }
    }

    void loadTasks();
  }, [project?.id, tasksPageIndex, reloadTrigger]);

  useEffect(() => {
    if (!project) {
      return;
    }

    setEditForm({
      id: project.id,
      name: project.name.toString(),
      description: project.description.toString(),
      githubRepo: project.githubRepo.toString(),
      status: project.status.toString(),
      tags: project.tags.map((tag) => tag.toString()),
    });
    setTagsInput(project.tags.map((tag) => tag.toString()).join(", "));
    setEditErrors({});
  }, [project]);

  const repoUrl = useMemo(
    () => normalizeRepoUrl(project?.githubRepo?.toString()),
    [project?.githubRepo],
  );
  const isOwner = useMemo(() => {
    if (!project || !currentUser) {
      return false;
    }

    return project.ownerId === currentUser.id;
  }, [project, currentUser]);
  const isArchivedProject =
    project?.status.toString().toLowerCase() === "archived";
  const canManageProject = isOwner && !isArchivedProject;
  const canDeleteProject =
    canManageProject && !isLoadingTasks && projectTasksPage.totalElements === 0;
  const canArchiveProject =
    canManageProject && !isLoadingTasks && projectTasksPage.totalElements > 0;
  const backTo =
    typeof location.state === "object" &&
    location.state !== null &&
    "backTo" in location.state
      ? String(location.state.backTo)
      : null;

  function handleBack() {
    if (backTo) {
      navigate(backTo);
      return;
    }

    navigate(-1);
  }

  function validateEditForm() {
    const nextErrors: {
      name?: string;
      description?: string;
      githubRepo?: string;
      status?: string;
    } = {};

    if (!editForm.name.trim()) {
      nextErrors.name = "Project name is required.";
    }

    if (!editForm.description.trim()) {
      nextErrors.description = "Description is required.";
    }

    if (!editForm.githubRepo.trim()) {
      nextErrors.githubRepo = "GitHub repository is required.";
    } else if (!isGithubRepositoryUrl(editForm.githubRepo)) {
      nextErrors.githubRepo = "Enter a valid GitHub repository URL.";
    }

    if (!editForm.status.trim()) {
      nextErrors.status = "Status is required.";
    }

    setEditErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function validateEditField(field: keyof typeof editErrors, value: string) {
    if (field === "name") {
      return value.trim() ? undefined : "Project name is required.";
    }

    if (field === "description") {
      return value.trim() ? undefined : "Description is required.";
    }

    if (field === "githubRepo") {
      if (!value.trim()) {
        return "GitHub repository is required.";
      }
      return isGithubRepositoryUrl(value)
        ? undefined
        : "Enter a valid GitHub repository URL.";
    }

    return value.trim() ? undefined : "Status is required.";
  }

  function updateEditError(field: keyof typeof editErrors, value: string) {
    setEditErrors((current) => {
      if (!current[field]) {
        return current;
      }

      return {
        ...current,
        [field]: validateEditField(field, value),
      };
    });
  }

  async function handleEditSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!project || isArchivedProject) {
      return;
    }

    if (!validateEditForm()) {
      setEditFeedback(null);
      return;
    }

    setIsSubmitting(true);
    setEditFeedback(null);

    try {
      const response = await updateProject({
        ...editForm,
        id: project.id,
        tags: tagsInput
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      });

      if (response.status === "error" || !response.data) {
        throw new Error(response.message || "Unable to update project");
      }

      setProject(response.data);
      setEditFeedback("Project updated successfully");
      setIsEditOpen(false);
    } catch (submitError) {
      setEditFeedback(
        submitError instanceof Error
          ? submitError.message
          : "Unable to update project",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteProject() {
    if (!project || !canManageProject) {
      return;
    }

    setEditFeedback(null);

    try {
      const response = await deleteProject(project.id);
      if (response.status === "error") {
        throw new Error(response.message || "Unable to delete project");
      }

      navigate("/profile");
    } catch (deleteError) {
      setEditFeedback(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete project",
      );
    }
  }

  async function handleArchiveProject() {
    if (!project || !canManageProject) {
      return;
    }

    setEditFeedback(null);

    try {
      const response = await archiveProject(project.id);
      if (response.status === "error" || !response.data) {
        throw new Error(response.message || "Unable to archive project");
      }

      setProject(response.data);
      setEditFeedback("Project archived successfully");
    } catch (archiveError) {
      setEditFeedback(
        archiveError instanceof Error
          ? archiveError.message
          : "Unable to archive project",
      );
    }
  }

  return (
    <main className="min-h-screen px-4 py-5 sm:px-6 lg:px-8">
      <AppHeader onSignOut={onSignOut} onOpenMenu={onOpenMenu} />

      <section className="mx-auto mt-6 max-w-5xl space-y-2">
        <Button variant="ghost" onClick={handleBack} className="w-fit">
          <ArrowLeft size={16} className="mr-2" />
          Back
        </Button>
        {isLoading ? (
          <Card>
            <CardBody className="space-y-3 p-6">
              <CardTitle className="text-3xl">Loading project...</CardTitle>
              <CardDescription>
                Please wait while we load the project details.
              </CardDescription>
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
              <CardBody className="space-y-6 transition-all bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.14),transparent_35%),linear-gradient(180deg,rgba(255,255,255,1),rgba(248,250,252,1))] p-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">{project.status}</Badge>
                      {project.ownerUsername ? (
                        <Badge variant="outline">
                          by {project.ownerUsername.toString()}
                        </Badge>
                      ) : null}
                    </div>

                    <div className="space-y-2">
                      <CardTitle className="text-4xl">
                        {project.name.toString()}
                      </CardTitle>
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
                    {canManageProject ? (
                      <Button
                        variant="primary"
                        onClick={() => setIsEditOpen(true)}
                      >
                        <Pencil size={16} />
                        Edit project
                      </Button>
                    ) : null}
                    {canArchiveProject ? (
                      <Button
                        variant="outline"
                        className="border-amber-200 text-amber-700 hover:bg-amber-50"
                        onClick={() => setIsArchiveOpen(true)}
                      >
                        <Archive size={16} />
                        Archive project
                      </Button>
                    ) : null}
                    {canDeleteProject ? (
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
                <span
                  className="flex-row flex justify-start text-sm items-center gap-x-2 cursor-pointer"
                  onClick={() => setShowDetails(!showDetails)}
                >
                  {!showDetails ? (
                    <ArrowDown size={12} />
                  ) : (
                    <ArrowRight size={12} />
                  )}
                  Details
                </span>
                {showDetails ? (
                  <div className="grid gap-1 text-sm text-slate-600">
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-medium text-slate-700">
                        Project id
                      </span>
                      <span>{project.id}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-medium text-slate-700">Status</span>
                      <span>{project.status.toString()}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-medium text-slate-700">
                        Created
                      </span>
                      <span>
                        {new Date(project.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-medium text-slate-700">
                        Last updated
                      </span>
                      <span>
                        {new Date(project.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <span className="font-medium text-slate-700">Tags</span>
                      <span className="text-right">
                        {project.tags.join(", ") || "No tags yet"}
                      </span>
                    </div>
                  </div>
                ) : null}
              </CardBody>
            </Card>

            {editFeedback ? (
              <Card className="border-blue-100 bg-blue-50/70 shadow-none">
                <CardBody className="flex items-center gap-3 p-4">
                  <Sparkles size={16} className="text-blue-600" />
                  <CardDescription className="text-sm text-blue-700">
                    {editFeedback}
                  </CardDescription>
                </CardBody>
              </Card>
            ) : null}

            <div className="w-full">
              <Card className="shadow-none">
                <CardBody className="space-y-4 p-6">
                  <CardTitle className="text-xl">About this project</CardTitle>
                  <CardDescription className="text-base leading-7 text-slate-600">
                    {project.description.toString()}
                  </CardDescription>
                </CardBody>
              </Card>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl">Tasks in this project</CardTitle>
                {isOwner && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleOpenCreateModal}
                    className="flex items-center gap-1.5"
                  >
                    <Plus size={16} />
                    Create Task
                  </Button>
                )}
              </div>
              {isLoadingTasks ? (
                <Card className="shadow-none">
                  <CardBody className="p-6 text-center">
                    <CardDescription>Loading tasks...</CardDescription>
                  </CardBody>
                </Card>
              ) : projectTasksPage.content.length === 0 ? (
                <Card className="shadow-none">
                  <CardBody className="p-6 text-center">
                    <CardDescription>
                      No tasks yet for this project.
                    </CardDescription>
                  </CardBody>
                </Card>
              ) : (
                <>
                  <div className="grid lg:grid-cols-3 grid-cols-1 gap-2">
                    {projectTasksPage.content.map((task) => (
                      <Card
                        key={task.id}
                        hoverShadow={true}
                        className="h-fit cursor-pointer"
                        onClick={() => navigate(`/task/${task.id}`)}
                        clickMouse={true}
                      >
                        <CardBody className="space-y-4 p-5">
                          <div className="space-y-2">
                            <CardTitle className="text-xl font-medium">
                              {task.title}
                            </CardTitle>
                            <CardDescription>
                              {task.description}
                            </CardDescription>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary">{task.status}</Badge>
                          </div>

                          <div className="space-y-2 text-sm">
                            <p>
                              <strong>Reward:</strong> {task.rewardAmount}{" "}
                              {task.rewardCurrency}
                            </p>
                            <p>
                              <strong>Deliverables:</strong> {task.deliverables}
                            </p>
                            <p>
                              <strong>Max Attempts:</strong> {task.maxAttempts}
                            </p>
                          </div>

                          {task.recommendedSkills.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {task.recommendedSkills.map((skill) => (
                                <Badge
                                  key={skill}
                                  variant="outline"
                                  className="bg-blue-50 text-blue-700 border-blue-200"
                                >
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </CardBody>
                      </Card>
                    ))}
                  </div>
                  <PaginationControls
                    page={projectTasksPage.page}
                    totalPages={projectTasksPage.totalPages}
                    totalElements={projectTasksPage.totalElements}
                    itemLabel="task"
                    isLoading={isLoadingTasks}
                    onPageChange={setTasksPageIndex}
                  />
                </>
              )}
            </div>

            <Modal
              isOpen={isEditOpen}
              onClose={() => setIsEditOpen(false)}
              title="Edit project"
            >
              <form className="grid gap-4" onSubmit={handleEditSubmit}>
                <Input
                  label="Project name"
                  helperText={editErrors.name}
                  error={Boolean(editErrors.name)}
                  value={editForm.name}
                  onChange={(event) => {
                    setEditForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }));
                    updateEditError("name", event.target.value);
                  }}
                />
                <Input
                  label="Description"
                  helperText={editErrors.description}
                  error={Boolean(editErrors.description)}
                  value={editForm.description}
                  onChange={(event) => {
                    setEditForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }));
                    updateEditError("description", event.target.value);
                  }}
                />
                <Input
                  label="GitHub repository"
                  placeholder="Example: https://github.com/owner/repository"
                  helperText={editErrors.githubRepo}
                  error={Boolean(editErrors.githubRepo)}
                  value={editForm.githubRepo}
                  onChange={(event) => {
                    setEditForm((current) => ({
                      ...current,
                      githubRepo: event.target.value,
                    }));
                    updateEditError("githubRepo", event.target.value);
                  }}
                />
                <Input
                  label="Status"
                  helperText={editErrors.status}
                  error={Boolean(editErrors.status)}
                  value={editForm.status}
                  onChange={(event) => {
                    setEditForm((current) => ({
                      ...current,
                      status: event.target.value,
                    }));
                    updateEditError("status", event.target.value);
                  }}
                />
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
                    onClick={() => setIsEditOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Saving..." : "Save changes"}
                  </Button>
                </div>
              </form>
            </Modal>

            <Modal
              isOpen={isDeleteOpen}
              onClose={() => setIsDeleteOpen(false)}
              title="Delete project"
            >
              <div className="grid gap-4">
                <CardDescription className="text-base text-slate-600">
                  This will remove{" "}
                  <span className="font-medium text-slate-900">
                    {project.name.toString()}
                  </span>{" "}
                  from your projects. This action cannot be undone.
                </CardDescription>
                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsDeleteOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="border-red-200 text-red-600 hover:bg-red-50"
                    onClick={async () => {
                      setIsDeleteOpen(false);
                      await handleDeleteProject();
                    }}
                  >
                    <Trash2 size={16} />
                    Delete project
                  </Button>
                </div>
              </div>
            </Modal>

            <Modal
              isOpen={isArchiveOpen}
              onClose={() => setIsArchiveOpen(false)}
              title="Archive project"
            >
              <div className="grid gap-4">
                <CardDescription className="text-base text-slate-600">
                  This project has tasks, so it cannot be safely deleted.
                  Archiving keeps its task history while marking
                  <span className="font-medium text-slate-900">
                    {" "}
                    {project.name.toString()}
                  </span>{" "}
                  as archived.
                </CardDescription>
                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsArchiveOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="border-amber-200 text-amber-700 hover:bg-amber-50"
                    onClick={async () => {
                      setIsArchiveOpen(false);
                      await handleArchiveProject();
                    }}
                  >
                    <Archive size={16} />
                    Archive project
                  </Button>
                </div>
              </div>
            </Modal>

            {showCreateModal && (
              <Modal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                title="Create a new task"
              >
                <form className="grid gap-4 md:grid-cols-2 text-slate-900" onSubmit={handleCreateTaskSubmit}>
                  {createFeedback && (
                    <div className="md:col-span-2">
                      <div className={`p-3 rounded-lg flex items-center gap-3 text-sm border ${
                        createFeedback.type === 'success'
                          ? 'border-green-100 bg-green-50 text-green-700'
                          : 'border-red-100 bg-red-50 text-red-700'
                      }`}>
                        {createFeedback.type === 'success' ? (
                          <Check size={16} className="text-green-600" />
                        ) : (
                          <X size={16} className="text-red-600" />
                        )}
                        <span>{createFeedback.message}</span>
                      </div>
                    </div>
                  )}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1 text-slate-700">Task Title</label>
                    <Input
                      placeholder="Implement feature X"
                      helperText={createErrors.title}
                      error={Boolean(createErrors.title)}
                      value={newTaskForm.title}
                      onChange={(event) => {
                        setNewTaskForm((current) => ({
                          ...current,
                          title: event.target.value,
                        }));
                        updateCreateTaskError("title", event.target.value);
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 text-slate-700">Reward Amount</label>
                    <Input
                      placeholder="100"
                      helperText={createErrors.rewardAmount}
                      error={Boolean(createErrors.rewardAmount)}
                      value={newTaskForm.rewardAmount || ""}
                      onChange={(event) => {
                        const value = event.target.value;
                        if (value === "" || /^\d+(\.\d{0,2})?$/.test(value)) {
                          setNewTaskForm((current) => ({
                            ...current,
                            rewardAmount: value === "" ? 0 : Number(value),
                          }));
                          updateCreateTaskError("rewardAmount", value === "" ? 0 : Number(value));
                        }
                      }}
                    />
                  </div>

                  <div>
                    <label htmlFor="create-task-status" className="block text-sm font-medium mb-1 text-slate-700">
                      Status
                    </label>
                    <select
                      id="create-task-status"
                      value={newTaskForm.status}
                      onChange={(event) =>
                        setNewTaskForm((current) => ({
                          ...current,
                          status: event.target.value,
                        }))
                      }
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="OPEN">OPEN</option>
                      <option value="HIRING">HIRING</option>
                      <option value="IN_PROGRESS">IN_PROGRESS</option>
                      <option value="COMPLETED">COMPLETED</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 text-slate-700">Max Attempts</label>
                    <Input
                      placeholder="3"
                      value={newTaskForm.maxAttempts || ""}
                      onChange={(event) => {
                        const value = event.target.value;
                        if (value === "" || /^\d+$/.test(value)) {
                          setNewTaskForm((current) => ({
                            ...current,
                            maxAttempts: value === "" ? 0 : Number(value),
                          }));
                        }
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 text-slate-700">Deadline</label>
                    <Input
                      type="date"
                      value={getDeadlineString(newTaskForm.deadline)}
                      onChange={(event) => {
                        const val = event.target.value;
                        setNewTaskForm((current) => ({
                          ...current,
                          deadline: val ? new Date(val) : new Date(),
                        }));
                      }}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1 text-slate-700">Deliverables</label>
                    <Input
                      placeholder="What needs to be delivered"
                      helperText={createErrors.deliverables}
                      error={Boolean(createErrors.deliverables)}
                      value={newTaskForm.deliverables}
                      onChange={(event) => {
                        setNewTaskForm((current) => ({
                          ...current,
                          deliverables: event.target.value,
                        }));
                        updateCreateTaskError("deliverables", event.target.value);
                      }}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1 text-slate-700">Recommended Skills</label>
                    <Input
                      placeholder="Separate skills with commas."
                      value={createSkillsInput}
                      onChange={(event) => setCreateSkillsInput(event.target.value)}
                    />
                    <p className="mt-1 text-xs text-slate-500">Separate skills with commas.</p>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1 text-slate-700">Description</label>
                    <textarea
                      placeholder="Detailed description of the task"
                      className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 resize-none bg-white ${
                        createErrors.description
                          ? "border-red-300 focus:ring-red-200"
                          : "border-slate-300 focus:ring-blue-200"
                      }`}
                      rows={4}
                      value={newTaskForm.description}
                      onChange={(event) => {
                        setNewTaskForm((current) => ({
                          ...current,
                          description: event.target.value,
                        }));
                        updateCreateTaskError("description", event.target.value);
                      }}
                    />
                    {createErrors.description && (
                      <p className="text-xs text-red-600 mt-1">{createErrors.description}</p>
                    )}
                  </div>

                  <div className="flex justify-end gap-3 pt-2 md:col-span-2">
                    <Button type="button" variant="ghost" onClick={() => setShowCreateModal(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" variant="primary" disabled={isSubmittingTask}>
                      {isSubmittingTask ? "Creating..." : "Create task"}
                    </Button>
                  </div>
                </form>
              </Modal>
            )}
          </>
        ) : null}
      </section>
    </main>
  );
}
