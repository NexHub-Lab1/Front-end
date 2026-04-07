import { ArrowRight, BellRing, Star, Trophy, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { activityItems, topBounties, topDevelopers, topProjects } from '../data/mock-content'
import { AppHeader } from '../components/app/app-header'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardBody, CardDescription, CardTitle } from '../components/ui/card'
import { DeveloperAvatar } from '../components/app/developer-avatar'
import { SectionTitle } from '../components/app/section-title'
import { StatLine } from '../components/app/stat-line'

export function LandingPage({
  onSignOut,
  onOpenMenu,
}: {
  onSignOut: () => void
  onOpenMenu: () => void
}) {
  const navigate = useNavigate()

  return (
    <main className="min-h-screen px-4 py-5 sm:px-6 lg:px-8">
      <AppHeader onSignOut={onSignOut} onOpenMenu={onOpenMenu} />

      <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <Card>
            <CardBody className="space-y-5 p-6">
              <SectionTitle title="Top projects" />
              <div className="grid gap-4 lg:grid-cols-3">
                {topProjects.map((project) => (
                  <Card key={project.name} className="shadow-none">
                    <CardBody className="space-y-4 p-5">
                      <div className="space-y-2">
                        <CardTitle className="text-2xl font-medium">{project.name}</CardTitle>
                        <CardDescription>{project.description}</CardDescription>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {project.tags.map((tag) => (
                          <Badge key={tag} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-4">
                        <StatLine icon={<Star size={14} className="text-amber-400" />} text={`${project.stars} stars`} />
                        <StatLine icon={<Users size={14} className="text-slate-400" />} text={`${project.followers} followers`} />
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
              <div className="flex justify-center">
                <Button variant="primary" size="lg" onClick={() => navigate('/projects')}>
                  See all
                  <ArrowRight size={16} />
                </Button>
              </div>
            </CardBody>
          </Card>

          <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
            <Card>
              <CardBody className="p-6">
                <SectionTitle title="Top bounties" />
                <div className="space-y-3">
                  {topBounties.map((bounty) => (
                    <Card key={bounty.title} className="shadow-none">
                      <CardBody className="flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-xl font-medium">{bounty.title}</CardTitle>
                          <CardDescription>{bounty.project}</CardDescription>
                        </div>
                        <div className="text-left sm:text-right">
                          <p className="text-lg font-semibold text-slate-900">{bounty.reward} USD</p>
                          <p className="text-sm text-slate-500">{bounty.meta}</p>
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>
                <div className="mt-5 flex justify-center">
                  <Button variant="primary" size="lg">
                    See more
                    <ArrowRight size={16} />
                  </Button>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody className="p-6">
                <SectionTitle
                  title="Top developers"
                  right={
                    <Button variant="ghost" size="sm">
                      See all
                    </Button>
                  }
                />
                <Card className="shadow-none">
                  <CardBody className="space-y-4 p-5">
                    <div className="space-y-2">
                      <CardTitle className="text-2xl font-medium">
                        Build a notification system for DevConnector
                      </CardTitle>
                      <CardDescription>
                        Clear scope, fast review cycle, and room for visible contribution.
                      </CardDescription>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">Node.js</Badge>
                      <Badge variant="secondary">MERN</Badge>
                      <Badge variant="outline">5 days left</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold text-slate-900">$800 USD</span>
                      <Button variant="secondary" size="sm">
                        See more
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              </CardBody>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
            <Card>
              <CardBody className="p-6">
                <SectionTitle title="Projects" right={<span className="text-sm text-slate-500">looking for contributors</span>} />
                <Card className="shadow-none">
                  <CardBody className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2">
                      <CardTitle className="text-2xl font-medium">ManuAI</CardTitle>
                      <CardDescription>Implement a new task feed experience</CardDescription>
                    </div>
                    <div className="flex flex-wrap gap-2 sm:justify-end">
                      <Badge variant="secondary">JavaScript</Badge>
                      <Badge variant="secondary">Node.js</Badge>
                    </div>
                  </CardBody>
                </Card>
              </CardBody>
            </Card>

            <Card>
              <CardBody className="p-6">
                <SectionTitle title="Recent activity" />
                <div className="space-y-3">
                  {activityItems.map((item) => (
                    <Card key={item} className="bg-slate-50/80 shadow-none">
                      <CardBody className="flex flex-row items-center gap-3 p-4 text-slate-700">
                        <BellRing size={16} className="text-indigo-600" />
                        <span className="text-sm">{item}</span>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              </CardBody>
            </Card>
          </div>
        </div>

        <Card className="h-fit xl:sticky xl:top-5">
          <CardBody className="p-6">
            <SectionTitle title="Top developers" />
            <div className="space-y-4">
              {topDevelopers.map((developer) => (
                <Card key={developer.rank} className="shadow-none">
                  <CardBody className="flex flex-row gap-4 p-4">
                    <DeveloperAvatar name={developer.name} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <CardTitle className="truncate text-lg font-medium">{developer.name}</CardTitle>
                        <span className="text-base font-semibold text-slate-700">{developer.rank}</span>
                      </div>
                      <CardDescription className="mt-1">{developer.handle}</CardDescription>
                      <div className="mt-3 flex flex-wrap gap-4">
                        <StatLine icon={<Users size={14} className="text-slate-400" />} text={`${developer.followers} followers`} />
                        <StatLine icon={<Trophy size={14} className="text-indigo-500" />} text={developer.score} />
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
            <Button variant="primary" size="lg" className="mt-5 w-full">
              View ranking
            </Button>
          </CardBody>
        </Card>
      </section>
    </main>
  )
}
