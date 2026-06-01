import {
  Card,
  CardBody,
  CardDescription,
  CardTitle,
} from "../../../components/ui/card";
import { Check, Cross, PlusIcon, Pencil, Trash2 } from "lucide-react";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";

import type { TaskRequest, TaskResponse, ProjectLookupDTO, User } from "../../../types/app";

import { createTask, fetchTasksByOwner, updateTask, deleteTask, cancelTask } from "../../../lib/task-storage";
import { useEffect, useState, type FormEvent, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "../../../components/ui/modal";
import { Input } from "../../../components/ui/input";
import { PaginationControls } from "../../../components/ui/pagination-controls";
import { PROFILE_PAGE_SIZE, createEmptyPaginatedResponse } from "../../../lib/pagination";
import type { PaginatedResponse } from "../../../types/app";
import { readStoredProfileDashboard } from "../../../lib/dashboard-storage";

const EMPTY_TASK_FORM: TaskRequest = {
  projectId: 0,
  title: "",
  description: "",
  deliverables: "",
  rewardAmount: 0,
  rewardCurrency: "ARS",
  deadline: new Date(),
  status: "Open",
  maxAttempts: 3,
  recommendedSkills: []
}

export function TasksTab({
  user
}: {
  user: User
}) {
  const navigate = useNavigate()
  const [lookupProjects, setLookupProjects] = useState<ProjectLookupDTO[]>(() => {
    return readStoredProfileDashboard()?.projectLookups || [];
  });
  const [tasksPage, setTasksPage] = useState<PaginatedResponse<TaskResponse>>(() => {
    const dashboard = readStoredProfileDashboard();
    return dashboard?.tasks || createEmptyPaginatedResponse<TaskResponse>(0, PROFILE_PAGE_SIZE);
  });
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [taskToRemove, setTaskToRemove] = useState<TaskResponse | null>(null);
  const [createErrors, setCreateErrors] = useState<{
    title?: string
    description?: string
    deliverables?: string
    rewardAmount?: string
    projectId?: string
  }>({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [skillsInput, setSkillsInput] = useState('')

  const [taskForm, setTaskForm] = useState<TaskRequest>({
    ...EMPTY_TASK_FORM,
    projectId: 0
  });

  const reloadTasks = useCallback(async (pageOverride = currentPage) => {
    if (!user?.id) return;

    setIsLoadingTasks(true)
    try {
      const response = await fetchTasksByOwner(user.id, {
        page: pageOverride,
        size: PROFILE_PAGE_SIZE,
      });

      if (response.status === 'success' && response.data) {
        setTasksPage(response.data)
      } else {
        setTasksPage(createEmptyPaginatedResponse<TaskResponse>(pageOverride, PROFILE_PAGE_SIZE))
      }
    } catch (error) {
      console.error('Failed to reload tasks', error)
      setTasksPage(createEmptyPaginatedResponse<TaskResponse>(pageOverride, PROFILE_PAGE_SIZE))
    } finally {
      setIsLoadingTasks(false)
    }
  }, [user.id, currentPage]);

  useEffect(() => {
    const syncFromDashboard = () => {
      const dashboard = readStoredProfileDashboard();
      if (dashboard?.tasks && currentPage === 0) {
        setTasksPage(dashboard.tasks);
      }
      if (dashboard?.projectLookups) {
        setLookupProjects(dashboard.projectLookups);
      }
    };

    if (currentPage > 0) {
      void reloadTasks();
    } else {
      syncFromDashboard();
    }

    window.addEventListener('nexhub-dashboard-updated', syncFromDashboard);
    return () => window.removeEventListener('nexhub-dashboard-updated', syncFromDashboard);
  }, [reloadTasks, currentPage]);

  function validateTaskForm() {
    const nextErrors: {
      title?: string
      description?: string
      deliverables?: string
      rewardAmount?: string
      projectId?: string
    } = {}

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
      nextErrors.projectId = 'Project is required.'
    }

    setCreateErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
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

    return Number(value) > 0 ? undefined : 'Project is required.'
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validateTaskForm()) {
      setFeedback(null)
      return
    }

    setIsSubmitting(true);
    setFeedback(null);

    const taskData = {
      ...taskForm,
      recommendedSkills: skillsInput
        .split(',')
        .map((skill) => skill.trim())
        .filter(Boolean),
    }

    try {
      let res;
      if (isEditMode && editingTaskId) {
        res = await updateTask({
          ...taskData,
          id: editingTaskId
        })
      } else {
        res = await createTask(taskData)
      }

      if (res.status === 'error' || !res.data) {
        setFeedback({ message: res.message || "Error", type: "error" })
        setIsSubmitting(false)
        return
      }

      setFeedback({ message: isEditMode ? "Task updated successfully" : "Task created successfully", type: "success" });
      setShowModal(false)
      setIsEditMode(false)
      setEditingTaskId(null)
      setCurrentPage(0)
      void reloadTasks(0)
    } catch (error) {
      setFeedback({ message: "Error processing task", type: "error" })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleRemoveTask(taskId: number) {
    try {
      const res = await deleteTask(taskId)
      if (res.status === 'error') {
        if (res.message && res.message.includes('has assignments or submissions')) {
          const cancelRes = await cancelTask(taskId)
          if (cancelRes.status === 'error') {
            setFeedback({ message: cancelRes.message || "Error removing task", type: "error" })
            return
          }
          setFeedback({ message: "Task was cancelled to preserve assignment history", type: "success" })
        } else {
          setFeedback({ message: res.message || "Error removing task", type: "error" })
          return
        }
      } else {
        setFeedback({ message: "Task deleted successfully", type: "success" })
      }
      setTaskToRemove(null)
      setCurrentPage(0)
      void reloadTasks(0)
    } catch (error) {
      setFeedback({ message: "Error removing task", type: "error" })
    }
  }

  function handleEditTask(task: TaskResponse) {
    setTaskForm({
      projectId: task.projectId,
      title: task.title,
      description: task.description,
      deliverables: task.deliverables,
      rewardAmount: task.rewardAmount,
      rewardCurrency: task.rewardCurrency,
      deadline: task.deadline,
      status: task.status,
      maxAttempts: task.maxAttempts,
      recommendedSkills: task.recommendedSkills
    })
    setSkillsInput(task.recommendedSkills.join(', '))
    setEditingTaskId(task.id)
    setIsEditMode(true)
    setShowModal(true)
  }

  function resetForm() {
    setShowModal(false)
    setIsEditMode(false)
    setEditingTaskId(null)
    setCreateErrors({})
    setSkillsInput('')
    setTaskForm(EMPTY_TASK_FORM)
  }

  const displayModal = () => {
    if (!showModal) return null;

    return (
      <Modal
        isOpen={showModal}
        onClose={resetForm}
        title={isEditMode ? "Edit task" : "Create a new task"}
      >
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">Task Title</label>
            <Input
              placeholder="Implement feature X"
              helperText={createErrors.title}
              error={Boolean(createErrors.title)}
              value={taskForm.title}
              onChange={(event) => {
                setTaskForm((current) => ({
                  ...current,
                  title: event.target.value,
                }))
                updateTaskError('title', event.target.value)
              }}
            />
          </div>

          <div>
            <label htmlFor="project-select" className="block text-sm font-medium mb-2">
              Project
            </label>
            <select
              id="project-select"
              value={taskForm.projectId}
              onChange={(event) => {
                const projectId = Number(event.target.value)
                setTaskForm((current) => ({
                  ...current,
                  projectId,
                }))
                updateTaskError('projectId', projectId)
              }}
              className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${createErrors.projectId
                ? 'border-red-300 focus:ring-red-200'
                : 'border-slate-300 focus:ring-blue-200'
                }`}
            >
              <option value={0}>Select a project...</option>
              {lookupProjects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
            {createErrors.projectId && (
              <p className="text-xs text-red-600 mt-1">{createErrors.projectId}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Reward Amount</label>
            <Input
              placeholder="100"
              helperText={createErrors.rewardAmount}
              error={Boolean(createErrors.rewardAmount)}
              value={taskForm.rewardAmount || ''}
              onChange={(event) => {
                const value = event.target.value;
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
            <label htmlFor="status-select" className="block text-sm font-medium mb-2">
              Status
            </label>
            <select
              id="status-select"
              value={taskForm.status}
              onChange={(event) =>
                setTaskForm((current) => ({
                  ...current,
                  status: event.target.value,
                }))
              }
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
            <label className="block text-sm font-medium mb-2">Max Attempts</label>
            <Input
              placeholder="3"
              value={taskForm.maxAttempts || ''}
              onChange={(event) => {
                const value = event.target.value;
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
            <label className="block text-sm font-medium mb-2">Deliverables</label>
            <Input
              placeholder="What needs to be delivered"
              helperText={createErrors.deliverables}
              error={Boolean(createErrors.deliverables)}
              value={taskForm.deliverables}
              onChange={(event) => {
                setTaskForm((current) => ({
                  ...current,
                  deliverables: event.target.value,
                }))
                updateTaskError('deliverables', event.target.value)
              }}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">Recommended Skills</label>
            <Input
              placeholder="Separate skills with commas."
              value={skillsInput}
              onChange={(event) => setSkillsInput(event.target.value)}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              placeholder="Detailed description of the task"
              className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 resize-none ${createErrors.description
                ? 'border-red-300 focus:ring-red-200'
                : 'border-slate-300 focus:ring-blue-200'
                }`}
              rows={4}
              value={taskForm.description}
              onChange={(event) => {
                setTaskForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
                updateTaskError('description', event.target.value)
              }}
            />
            {createErrors.description && (
              <p className="text-xs text-red-600 mt-1">{createErrors.description}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2 md:col-span-2">
            <Button type="button" variant="ghost" onClick={resetForm}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update task' : 'Create task')}
            </Button>
          </div>
        </form>
      </Modal>
    );
  };

  return (
    <Card>
      <CardBody className="p-4 flex flex-col max-h-full h-full">
        <section className="flex flex-row items-center">
          <div className="w-full">
            <CardTitle className="text-3xl">My Tasks</CardTitle>
            <CardDescription className="mt-2 text-base">
              Manage your tasks, create new ones, and track their progress.
            </CardDescription>
          </div>
          <Button
            className="h-12 mr-10"
            variant="primary"
            size="lg"
            onClick={() => {
              setIsEditMode(false)
              setTaskForm(EMPTY_TASK_FORM)
              setSkillsInput('')
              setCreateErrors({})
              setShowModal(true)
            }}
          >
            <PlusIcon size={16} />
          </Button>
        </section>
        {feedback ? (
          <Card className={`border-${feedback.type === 'success' ? 'green' : 'red'}-100 bg-${feedback.type === 'success' ? 'green' : 'red'}-50/70 shadow-none`}>
            <CardBody className="flex items-center gap-3 p-4">
              {feedback.type === 'success' ? <Check size={16} className="text-green-600" /> : <Cross size={16} className="text-red-600" />}
              <CardDescription className={`text-sm text-${feedback.type === 'success' ? 'green' : 'red'}-700`}>{feedback.message}</CardDescription>
            </CardBody>
          </Card>
        ) : null}
        {displayModal()}
        {taskToRemove ? (
          <Modal
            isOpen={Boolean(taskToRemove)}
            onClose={() => setTaskToRemove(null)}
            title="Remove task"
          >
            <div className="space-y-4">
              <CardDescription>
                Are you sure you want to remove <strong>{taskToRemove.title}</strong>?
                <br />
                <span className="text-xs text-slate-500 mt-2 block">
                  Note: If this task has active contributors or submission history, it will be automatically cancelled instead of completely deleted to preserve history.
                </span>
              </CardDescription>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => setTaskToRemove(null)}>
                  Cancel
                </Button>
                <Button type="button" variant="primary" onClick={() => handleRemoveTask(taskToRemove.id)}>
                  Remove task
                </Button>
              </div>
            </div>
          </Modal>
        ) : null}
        <section className="mt-10 h-full overflow-hidden">
          {isLoadingTasks ? (
            <Card className="shadow-none border-none">
              <CardBody className="p-6 text-center">
                <CardDescription>Loading your tasks...</CardDescription>
              </CardBody>
            </Card>
          ) : tasksPage.content.length === 0 ? (
            <Card className="shadow-none border-none">
              <CardBody className="p-6 text-center">
                <CardDescription>No tasks yet. Create one to get started!</CardDescription>
              </CardBody>
            </Card>
          ) : (
            <>
              <div className="grid lg:grid-cols-3 h-full grid-cols-1 gap-2 overflow-y-auto pr-1 pb-4">
                {tasksPage.content.map((task) => (
                  <Card
                    key={task.id}
                    hoverShadow={true}
                    className="h-fit cursor-pointer"
                    onClick={() => navigate(`/task/${task.id}`, { state: { backTo: '/profile?tab=tasks' } })}
                    clickMouse={true}
                  >
                    <CardBody className="space-y-4 p-5">
                      <div className="space-y-2">
                        <CardTitle className="text-xl font-medium truncate" title={task.title}>
                          {task.title}
                        </CardTitle>
                        <CardDescription className="line-clamp-2">{task.description}</CardDescription>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">{task.status}</Badge>
                        <Badge variant="outline" className="truncate max-w-[150px]">{task.projectName}</Badge>
                      </div>

                      <div className="space-y-2 text-sm text-slate-600">
                        <p><span className="font-medium text-slate-800">Reward:</span> {task.rewardAmount} {task.rewardCurrency}</p>
                        <p><span className="font-medium text-slate-800">Max Attempts:</span> {task.maxAttempts}</p>
                      </div>

                      {task.recommendedSkills.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {task.recommendedSkills.slice(0, 3).map((skill) => (
                            <Badge key={skill} variant="outline" className="bg-blue-50 text-blue-700 border-blue-100 text-[10px]">
                              {skill}
                            </Badge>
                          ))}
                          {task.recommendedSkills.length > 3 && (
                            <Badge variant="outline" className="text-[10px]">+{task.recommendedSkills.length - 3}</Badge>
                          )}
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-100">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditTask(task)
                          }}
                          className="flex-1"
                        >
                          <Pencil size={14} />
                          Edit
                        </Button>
                        {task.status.toLowerCase() !== 'cancelled' ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation()
                              setTaskToRemove(task)
                            }}
                            className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 size={14} />
                            Delete
                          </Button>
                        ) : null}
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
              <PaginationControls
                page={tasksPage.page}
                totalPages={tasksPage.totalPages}
                totalElements={tasksPage.totalElements}
                itemLabel="task"
                isLoading={isLoadingTasks}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </section>
      </CardBody>
    </Card>
  );
}
