import {
  Card,
  CardBody,
  CardDescription,
  CardTitle,
} from "../../../components/ui/card";
import { ArrowRight, Badge, LoaderCircle, PlusIcon, Search, Star, Users } from "lucide-react";
import { Button } from "../../../components/ui/button";

import type { ProjectForm, ProjectResponse } from "../../../types/app";

import { getProjectsFromCurrentUser, PROJECT_ROOT_ENDPOINT } from "../../../lib/user-storage";
import { useEffect, useState, type FormEvent } from "react";
import { StatLine } from "../../../components/app/stat-line";
import Modal from "../../../components/ui/modal";
import { Input } from "../../../components/ui/input";
import { readStoredAuthUser } from "../../../lib/auth-storage";

export function ProjectsTab() {
  const data = readStoredAuthUser();
  if (!data) return null
  const [projects, setProjects] = useState<ProjectResponse[] | null>();
  const [showModal, setShowModal] = useState<boolean>(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [projectForm, setProjectForm] = useState<ProjectForm>({
    name: "",
    ownerId: data.user.id,
    description: "",
    githubRepo: "",
    status: "",
    tags: new Set(),
  });

  useEffect(() => {
    const data = (async () => {
      return await getProjectsFromCurrentUser();
    })();

    data.then((res) => setProjects(res)).catch((_) => setProjects([]));
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);
    if(!data) return null

    const response = await fetch(PROJECT_ROOT_ENDPOINT, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${data.token}`
      },
      body: JSON.stringify(projectForm)
    })

    const result = (await response.json())
    console.log(result)
  }

  const displayModal = () => {
    if (!showModal) return null;

    return (
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={"Create a new project"}
      >
        <form className="flex flex-col gap-2" onSubmit={handleSubmit}>
          <Input
            label="Project Name"
            placeholder="Test"
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
            value={projectForm.status}
            onChange={(event) =>
              setProjectForm((current) => ({
                ...current,
                status: event.target.value,
              }))
            }
          />
          <div className="flex w-full pt-5">
            <Button type="submit" variant="primary" size="lg" className="w-full">
              Create Project
              {isSubmitting ? (
                <LoaderCircle size={18} className="animate-spin" />
              ) : (
                <ArrowRight size={18} />
              )}
            </Button>
          </div>
        </form>
      </Modal>
    );
  };

  return (
    <Card>
      <CardBody className="p-4 flex flex-col gap-2">
        <div>
          <CardTitle className="text-3xl">My projects</CardTitle>
          <CardDescription className="mt-2 text-base">
            Here you can see all of your projects and create new ones.
          </CardDescription>
        </div>
        <section className="flex flex-row">
          <div className="hidden md:block">
            <div className="flex h-12 items-center gap-3 rounded-l-2xl border border-slate-200 bg-white px-4 shadow-sm">
              <Search size={18} className="text-slate-400" />
              <input
                type="text"
                placeholder="Search"
                aria-label="Search"
                className="w-full border-0 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
              />
            </div>
          </div>
          <Button
            className="rounded-l-none h-12"
            variant="primary"
            size="lg"
            onClick={() => setShowModal(true)}
          >
            <PlusIcon size={16} />
          </Button>
        </section>
        {displayModal()}
        <section>
          <div className="grid gap-4 lg:grid-cols-3">
            {projects &&
              projects.map((project) => (
                <Card key={project.id} className="shadow-none">
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
