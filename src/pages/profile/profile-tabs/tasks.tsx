import {
  Card,
  CardBody,
  CardDescription,
  CardTitle,
} from "../../../components/ui/card";
import { Ban, Check, Cross, PlusIcon, Pencil, Trash2 } from "lucide-react";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";

import type { TaskRequest, TaskResponse, ProjectResponse } from "../../../types/app";

import { createTask, fetchAllTasks, updateTask, deleteTask, cancelTask } from "../../../lib/task-storage";
import { fetchProjectsByCurrentUser } from "../../../lib/project-storage";
import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "../../../components/ui/modal";
import { Input } from "../../../components/ui/input";

const EMPTY_TASK_FORM: TaskRequest = {
  projectId: 0,
  title: "",
  description: "",
  deliverables: "",
  rewardAmount: 0,
  rewardCurrency: "USD",
  deadline: new Date(),
  status: "Open",
  maxAttempts: 3,
  recommendedSkills: []
}

export function TasksTab() {

  const navigate = useNavigate()
  const [tasks, setTasks] = useState<TaskResponse[]>([]);
  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<TaskResponse | null>(null);
  const [taskToCancel, setTaskToCancel] = useState<TaskResponse | null>(null);
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

  const [taskForm, setTaskForm] = useState<TaskRequest>(EMPTY_TASK_FORM);

  const loadProjects = async () => {
    const response = await fetchProjectsByCurrentUser();
    if (response.status === 'success' && response.data) {
      const activeProjects = response.data.filter(
        (project) => project.status.toString().toLowerCase() !== 'archived'
      )
      setProjects(activeProjects)
      return activeProjects
    }

    setProjects([])
    return []
  }

  const reloadTasks = async (ownedProjects = projects) => {
    const response = await fetchAllTasks();

    if (response.status === 'success' && response.data) {
      const ownedProjectIds = new Set(ownedProjects.map((project) => project.id))
      setTasks(
        response.data
          .filter((task) => ownedProjectIds.has(task.projectId))
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      )
    } else {
      setTasks([])
    }
  }

  useEffect(() => {
    async function loadProfileTasks() {
      const ownedProjects = await loadProjects()
      await reloadTasks(ownedProjects)
    }

    void loadProfileTasks();
  }, []);

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
      nextErrors.projectId = 'Project ID is required.'
    }

    setCreateErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
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
        setFeedback({message: res.message || "Error", type:"error"})
        setIsSubmitting(false)
        return
      }

      console.log(res.data)
      setFeedback({message: isEditMode ? "Task updated successfully" : "Task created successfully", type:"success"});
      setShowModal(false)
      setIsEditMode(false)
      setEditingTaskId(null)
      reloadTasks()
    } catch (error) {
      setFeedback({message: "Error processing task", type:"error"})
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDeleteTask(taskId: number) {

    try {
      const res = await deleteTask(taskId)
      if (res.status === 'error') {
        setFeedback({message: res.message || "Error deleting task", type:"error"})
        return
      }

      setFeedback({message: "Task deleted successfully", type:"success"});
      setTaskToDelete(null)
      reloadTasks()
    } catch (error) {
      setFeedback({message: "Error deleting task", type:"error"})
    }
  }

  async function handleCancelTask(taskId: number) {
    try {
      const res = await cancelTask(taskId)
      if (res.status === 'error') {
        setFeedback({message: res.message || "Error cancelling task", type:"error"})
        return
      }

      setFeedback({message: "Task cancelled successfully", type:"success"});
      setTaskToCancel(null)
      reloadTasks()
    } catch (error) {
      setFeedback({message: "Error cancelling task", type:"error"})
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
              onChange={(event) =>
                setTaskForm((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
            />
          </div>

          <div>
            <label htmlFor="project-select" className="block text-sm font-medium mb-2">
              Project
            </label>
            <select
              id="project-select"
              value={taskForm.projectId}
              onChange={(event) =>
                setTaskForm((current) => ({
                  ...current,
                  projectId: Number(event.target.value),
                }))
              }
              className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                createErrors.projectId
                  ? 'border-red-300 focus:ring-red-200'
                  : 'border-slate-300 focus:ring-blue-200'
              }`}
            >
              <option value={0}>Select a project...</option>
              {projects.map((project) => (
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
              onChange={(event) =>
                setTaskForm((current) => ({
                  ...current,
                  deliverables: event.target.value,
                }))
              }
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">Recommended Skills</label>
            <Input
              placeholder="Separate skills with commas."
              value={skillsInput}
              onChange={(event) => setSkillsInput(event.target.value)}
            />
            <p className="text-xs text-slate-500 mt-1">Separate skills with commas.</p>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              placeholder="Detailed description of the task"
              className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 resize-none ${
                createErrors.description
                  ? 'border-red-300 focus:ring-red-200'
                  : 'border-slate-300 focus:ring-blue-200'
              }`}
              rows={4}
              value={taskForm.description}
              onChange={(event) =>
                setTaskForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
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
        {taskToDelete ? (
          <Modal
            isOpen={Boolean(taskToDelete)}
            onClose={() => setTaskToDelete(null)}
            title="Delete task"
          >
            <div className="space-y-4">
              <CardDescription>
                Are you sure you want to delete <strong>{taskToDelete.title}</strong>? This action cannot be undone.
              </CardDescription>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => setTaskToDelete(null)}>
                  Cancel
                </Button>
                <Button type="button" variant="primary" onClick={() => handleDeleteTask(taskToDelete.id)}>
                  Delete task
                </Button>
              </div>
            </div>
          </Modal>
        ) : null}
        {taskToCancel ? (
          <Modal
            isOpen={Boolean(taskToCancel)}
            onClose={() => setTaskToCancel(null)}
            title="Cancel task"
          >
            <div className="space-y-4">
              <CardDescription>
                Cancel <strong>{taskToCancel.title}</strong>? This keeps assignment and submission history, but marks the
                task as cancelled.
              </CardDescription>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => setTaskToCancel(null)}>
                  Keep task
                </Button>
                <Button type="button" variant="outline" className="border-amber-200 text-amber-700 hover:bg-amber-50" onClick={() => handleCancelTask(taskToCancel.id)}>
                  Cancel task
                </Button>
              </div>
            </div>
          </Modal>
        ) : null}
        <section className="mt-10 h-full">
          {tasks.length === 0 ? (
            <Card>
              <CardBody className="p-6 text-center">
                <CardDescription>No tasks yet. Create one to get started!</CardDescription>
              </CardBody>
            </Card>
          ) : (
            <div className="grid lg:grid-cols-3 h-full grid-cols-1 gap-2 overflow-scroll">
              {tasks.map((task) => (
                <Card key={task.id} hoverShadow={true} className="h-fit cursor-pointer" onClick={() => navigate(`/task/${task.id}`)} clickMouse={true}>
                  <CardBody className="space-y-4 p-5">
                    <div className="space-y-2">
                      <CardTitle className="text-xl font-medium">
                        {task.title}
                      </CardTitle>
                      <CardDescription>{task.description}</CardDescription>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">{task.status}</Badge>
                      <Badge variant="outline">{task.projectName}</Badge>
                    </div>

                    <div className="space-y-2 text-sm">
                      <p><strong>Reward:</strong> {task.rewardAmount} {task.rewardCurrency}</p>
                      <p><strong>Deliverables:</strong> {task.deliverables}</p>
                      <p><strong>Max Attempts:</strong> {task.maxAttempts}</p>
                    </div>

                    {task.recommendedSkills.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {task.recommendedSkills.map((skill) => (
                          <Badge key={skill} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 pt-4">
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
                            setTaskToCancel(task)
                          }}
                          className="flex-1"
                        >
                          <Ban size={14} />
                          Cancel
                        </Button>
                      ) : null}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation()
                          setTaskToDelete(task)
                        }}
                        className="flex-1"
                      >
                        <Trash2 size={14} />
                        Delete
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </section>
      </CardBody>
    </Card>
  );
}
