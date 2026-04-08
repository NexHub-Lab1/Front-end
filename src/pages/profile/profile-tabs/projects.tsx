import {
  Card,
  CardBody,
  CardDescription,
  CardTitle,
} from "../../../components/ui/card";
import { Badge, PlusIcon, Search, Star, Users } from "lucide-react";
import { Button } from "../../../components/ui/button";

import type {
  ProjectResponse,
} from "../../../types/app";

import { getProjectsFromCurrentUser } from "../../../lib/user-storage";
import { useEffect, useState } from "react";
import { StatLine } from "../../../components/app/stat-line";

export function ProjectsTab() {
  const [projects, setProjects] = useState<ProjectResponse[] | null>();

  useEffect(() => {
    const data = (async () => {
      return await getProjectsFromCurrentUser();
    })();

    data.then((res) => setProjects(res)).catch((_) => setProjects([]));
  }, []);

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
            onClick={() => console.log("get")}
          >
            <PlusIcon size={16} />
          </Button>
        </section>
        <section>
            <div className="grid gap-4 lg:grid-cols-3">
            {projects && projects.map((project) => (
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
                      <Badge key={tag[0]}>
                        {tag}
                      </Badge>
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
