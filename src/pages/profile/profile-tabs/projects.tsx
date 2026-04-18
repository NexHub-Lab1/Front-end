import {
  Card,
  CardBody,
  CardDescription,
  CardTitle,
} from "../../../components/ui/card";
import { Badge, Check, Cross, PlusIcon, Star, Users } from "lucide-react";
import { Button } from "../../../components/ui/button";

import type { ProjectForm, ProjectResponse } from "../../../types/app";

import { createProject, getProjectsFromCurrentUser } from "../../../lib/user-storage";
import { useEffect, useState, type FormEvent } from "react";
import { StatLine } from "../../../components/app/stat-line";
import Modal from "../../../components/ui/modal";
import { Input } from "../../../components/ui/input";
import { useNavigate } from "react-router-dom";

export function ProjectsTab() {

  const navigate = useNavigate()
  const [projects, setProjects] = useState<ProjectResponse[] | null>();
  const [showModal, setShowModal] = useState<boolean>(false);
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
    ownerId: 0,
    description: "",
    githubRepo: "",
    status: "",
    tags: []
  });

  const reloadProjects = async () => {
    const data = (async () => {
      return await getProjectsFromCurrentUser();
    })();

    data.then((res) => setProjects(res)).catch(() => setProjects([]));
  }

  useEffect(() => {
    reloadProjects();
  }, []);

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

    if (!projectForm.githubRepo.trim()) {
      nextErrors.githubRepo = 'GitHub repository is required.'
    }

    if (!projectForm.status.trim()) {
      nextErrors.status = 'Status is required.'
    }

    setCreateErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validateProjectForm()) {
      setFeedback(null)
      return
    }

    setIsSubmitting(true);
    setFeedback(null);

    await createProject({
      ...projectForm,
      tags: tagsInput
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    })
      .then((res) => {
        setIsSubmitting(false)
        if (res == null) {
          setFeedback({message:"Error", type:"error"})
          return
        }
        
        console.log(res)
        setIsSubmitting(false)
        setFeedback({message: "Project created successfully", type:"success"});
        setShowModal(false)
        reloadProjects()
      })
      .catch((res) => console.log(res))
  }



  const displayModal = () => {
    if (!showModal) return null;

    return (
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          setCreateErrors({})
          setTagsInput('')
          setProjectForm({
            name: "",
            ownerId: 0,
            description: "",
            githubRepo: "",
            status: "",
            tags: []
          })
        }}
        title={"Create a new project"}
      >
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <Input
            label="Project Name"
            placeholder="Test"
            helperText={createErrors.name}
            className={createErrors.name ? 'border-red-300 focus-visible:ring-red-200' : undefined}
            value={projectForm.name}
            onChange={(event) =>
              setProjectForm((current) => ({
                ...current,
                name: event.target.value,
              }))
            }
          />
          <Input
            label="GitHub Repo"
            placeholder="http://github.com/DHipo/repoTest"
            helperText={createErrors.githubRepo}
            className={createErrors.githubRepo ? 'border-red-300 focus-visible:ring-red-200' : undefined}
            value={projectForm.githubRepo}
            onChange={(event) =>
              setProjectForm((current) => ({
                ...current,
                githubRepo: event.target.value,
              }))
            }
          />
          <Input
            label="Description"
            placeholder="Web app"
            helperText={createErrors.description}
            className={createErrors.description ? 'border-red-300 focus-visible:ring-red-200' : undefined}
            value={projectForm.description}
            onChange={(event) =>
              setProjectForm((current) => ({
                ...current,
                description: event.target.value,
              }))
            }
          />
          <Input
            label="Status"
            placeholder="In Progress"
            helperText={createErrors.status}
            className={createErrors.status ? 'border-red-300 focus-visible:ring-red-200' : undefined}
            value={projectForm.status}
            onChange={(event) =>
              setProjectForm((current) => ({
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
            <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>
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
      <CardBody className="p-4 flex flex-col max-h-full">
        <section className="flex flex-row items-center">
          <div className="w-full">
            <CardTitle className="text-3xl">My projects</CardTitle>
            <CardDescription className="mt-2 text-base">
              Here you can see all of your projects and create new ones.
            </CardDescription>
          </div>
          <Button
            className="h-12 mr-10"
            variant="primary"
            size="lg"
            onClick={() => setShowModal(true)}
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
        <section className="mt-10 max-h-full">
          <div className="grid lg:grid-cols-3 grid-cols-1 gap-2 overflow-scroll">
            {projects &&
              projects.map((project) => (
                <Card className="" onClick={() => navigate(`/project/${project.id}`)} key={project.id} hoverShadow={true} clickMouse={true}>
                  <CardBody className="space-y-4 p-5">
                    <div className="space-y-2">
                      <CardTitle className="text-2xl font-medium">
                        {project.name}
                      </CardTitle>
                      <CardDescription>{project.description}</CardDescription>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {project.tags.map((tag) => (
                        <Badge key={tag[0]}>{tag}</Badge>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-4">
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
        </section>
      </CardBody>
    </Card>
  );
}
