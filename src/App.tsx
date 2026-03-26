import { useEffect, useMemo, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import {
  ArrowRight,
  BellRing,
  CheckCircle2,
  LoaderCircle,
  LogIn,
  Menu,
  Search,
  Sparkles,
  Star,
  Trophy,
  UserPlus,
  Users,
} from 'lucide-react'

import { Badge } from './components/ui/badge'
import { Button } from './components/ui/button'
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from './components/ui/card'
import { Input } from './components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs'
import './App.css'

type AuthMode = 'login' | 'signup'

type AuthUser = {
  id: number
  username: string
  email: string
}

type ApiResponse<T> = {
  status: 'success' | 'error'
  message: string
  data: T | null
  timestamp: string
}

type AppRoute = '/' | '/auth/login' | '/auth/signup'

type ProjectCard = {
  name: string
  description: string
  tags: string[]
  stars: number
  followers: number
}

type BountyCard = {
  title: string
  project: string
  reward: string
  meta: string
}

type DeveloperCard = {
  name: string
  handle: string
  followers: number
  score: string
  rank: string
}

const initialLogin = {
  email: '',
  password: '',
}

const initialSignup = {
  username: '',
  email: '',
  password: '',
}

const topProjects: ProjectCard[] = [
  {
    name: 'DevConnector',
    description: 'Social network for developers',
    tags: ['Node.js', 'MERN'],
    stars: 22,
    followers: 14,
  },
  {
    name: 'Web3 Dashboard',
    description: 'Crypto and DeFi management tool',
    tags: ['Solidity', 'Ethereum'],
    stars: 18,
    followers: 9,
  },
  {
    name: 'AI Code Assistant',
    description: 'AI-powered coding assistant',
    tags: ['Python', 'OpenAI'],
    stars: 17,
    followers: 10,
  },
]

const topBounties: BountyCard[] = [
  {
    title: 'Improve UI animations in DevConnector',
    project: 'DevConnector',
    reward: '$500',
    meta: '14 followers',
  },
  {
    title: 'Implement OAuth2 login in DevFlow',
    project: 'DevFlow',
    reward: '$200',
    meta: '2 followers',
  },
  {
    title: 'Add ENS support to Solidity Contracts Hub',
    project: 'Review',
    reward: '$400',
    meta: '1 day ago',
  },
]

const topDevelopers: DeveloperCard[] = [
  {
    name: 'Aaron Molina',
    handle: '@aaron-m',
    followers: 345,
    score: '4.99',
    rank: '#1',
  },
  {
    name: 'Camille Dubois',
    handle: '@camille-d',
    followers: 310,
    score: '4.98',
    rank: '#2',
  },
  {
    name: 'Manuel Garcia',
    handle: '@manuel-g',
    followers: 292,
    score: '4.97',
    rank: '#3',
  },
]

const activityItems = [
  'Bounty "API rate limiting solution" by @sarah_code',
  'New contributors joined DevFlow this week',
  'Open React task posted for ManuAI',
]

function normalizeRoute(pathname: string): AppRoute {
  if (pathname === '/auth/signup') {
    return '/auth/signup'
  }

  if (pathname === '/auth/login') {
    return '/auth/login'
  }

  return '/'
}

function navigateTo(path: AppRoute) {
  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

function BrandMark() {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-b from-blue-500 to-indigo-600 text-xl font-bold text-white shadow-lg shadow-blue-500/20">
        N
      </div>
      <span className="text-3xl font-semibold tracking-tight text-slate-900">NexHub</span>
    </div>
  )
}

function SectionTitle({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="text-3xl font-semibold tracking-tight text-slate-900">{title}</h2>
      {right}
    </div>
  )
}

function StatLine({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-slate-500">
      {icon}
      {text}
    </span>
  )
}

function DeveloperAvatar({ name }: { name: string }) {
  return (
    <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-b from-blue-100 to-blue-200 font-semibold text-blue-800">
      {name.charAt(0)}
    </div>
  )
}

function LandingPage() {
  return (
    <main className="min-h-screen px-4 py-5 sm:px-6 lg:px-8">
      <header className="rounded-3xl border border-slate-200/80 bg-white/80 px-4 py-3 shadow-sm backdrop-blur">
        <div className="grid items-center gap-4 md:grid-cols-[auto_minmax(240px,1fr)_auto]">
          <button type="button" onClick={() => navigateTo('/')} className="text-left">
            <BrandMark />
          </button>

          <div className="hidden md:block">
            <div className="flex h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 shadow-sm">
              <Search size={18} className="text-slate-400" />
              <input
                type="text"
                placeholder="Search"
                aria-label="Search"
                className="w-full border-0 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
              />
            </div>
          </div>

          <nav className="flex items-center justify-end gap-2 sm:gap-3">
            <Button variant="primary" onClick={() => navigateTo('/auth/login')}>
              Sign in
            </Button>
            <Button variant="ghost" className="hidden sm:inline-flex" onClick={() => navigateTo('/auth/signup')}>
              Sign up
            </Button>
            <Button variant="ghost" size="icon" aria-label="Menu">
              <Menu size={22} />
            </Button>
          </nav>
        </div>
      </header>

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
                <Button variant="primary" size="lg">
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

function AuthPage({ mode }: { mode: AuthMode }) {
  const [loginForm, setLoginForm] = useState(initialLogin)
  const [signupForm, setSignupForm] = useState(initialSignup)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)

  const activeHeading = useMemo(() => {
    return mode === 'login'
      ? {
          eyebrow: 'Welcome back',
          title: 'Sign in to keep building on NexHub',
          description: 'Use your email and password to access your builder account and project workflow.',
          endpoint: '/api/auth/login',
        }
      : {
          eyebrow: 'Create account',
          title: 'Join NexHub and start shipping with teams',
          description: 'Create a simple account to explore projects, claim bounties, and grow your reputation.',
          endpoint: '/api/auth/signup',
        }
  }, [mode])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setFeedback(null)

    const payload = mode === 'login' ? loginForm : signupForm

    try {
      const response = await fetch(activeHeading.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const result = (await response.json()) as ApiResponse<AuthUser>

      if (!response.ok || result.status === 'error') {
        throw new Error(result.message || 'Request failed')
      }

      setCurrentUser(result.data)
      setFeedback({ type: 'success', message: result.message })

      if (mode === 'signup') {
        setSignupForm(initialSignup)
      } else {
        setLoginForm(initialLogin)
      }

      window.setTimeout(() => {
        navigateTo('/')
      }, 700)
    } catch (error) {
      setCurrentUser(null)
      setFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'Unexpected error',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="grid min-h-[calc(100vh-3rem)] gap-8 lg:grid-cols-[minmax(320px,1.15fr)_minmax(340px,440px)] lg:items-center">
        <section className="space-y-7">
          <button type="button" onClick={() => navigateTo('/')} className="text-left">
            <BrandMark />
          </button>

          <div className="max-w-3xl">
            <Badge variant="secondary" className="mb-4 px-3 py-1.5 text-sm">
              {activeHeading.eyebrow}
            </Badge>
            <h1 className="text-balance text-4xl font-semibold tracking-tight text-slate-900 md:text-6xl">
              {activeHeading.title}
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-slate-500">{activeHeading.description}</p>
          </div>

          <Card className="max-w-2xl">
            <CardHeader className="flex-row items-center gap-2 pb-0">
              <Sparkles size={18} className="text-indigo-600" />
              <p className="font-semibold text-slate-900">Why builders use NexHub</p>
            </CardHeader>
            <CardBody className="pt-4">
              <ul className="list-disc space-y-3 pl-5 text-slate-500">
                <li>Find projects, claim bounties, and keep your work in one place.</li>
                <li>Build a profile that shows your contributions and growth over time.</li>
                <li>Move between project discovery and execution without friction.</li>
              </ul>
            </CardBody>
          </Card>
        </section>

        <Card className="border-slate-200/90 bg-white/95 shadow-[0_22px_60px_rgba(33,70,144,0.12)]">
          <CardBody className="p-6 sm:p-7">
            <Tabs value={mode} onValueChange={(value) => navigateTo(value === 'signup' ? '/auth/signup' : '/auth/login')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">
                  <LogIn size={16} />
                  <span>Sign in</span>
                </TabsTrigger>
                <TabsTrigger value="signup">
                  <UserPlus size={16} />
                  <span>Sign up</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login" />
              <TabsContent value="signup" />
            </Tabs>

            <p className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
              {mode === 'login'
                ? 'Access your projects, bounties, and builder profile.'
                : 'Create your account with a username, email, and password.'}
            </p>

            <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
              {mode === 'signup' ? (
                <Input
                  label="Username"
                  placeholder="buildername"
                  value={signupForm.username}
                  onChange={(event) => setSignupForm((current) => ({ ...current, username: event.target.value }))}
                />
              ) : null}

              <Input
                type="email"
                label="Email"
                placeholder="you@nexhub.dev"
                value={mode === 'login' ? loginForm.email : signupForm.email}
                onChange={(event) =>
                  mode === 'login'
                    ? setLoginForm((current) => ({ ...current, email: event.target.value }))
                    : setSignupForm((current) => ({ ...current, email: event.target.value }))
                }
              />

              <Input
                type="password"
                label="Password"
                placeholder="At least 8 characters"
                value={mode === 'login' ? loginForm.password : signupForm.password}
                onChange={(event) =>
                  mode === 'login'
                    ? setLoginForm((current) => ({ ...current, password: event.target.value }))
                    : setSignupForm((current) => ({ ...current, password: event.target.value }))
                }
              />

              <Button type="submit" variant="primary" size="lg" className="w-full">
                {mode === 'login' ? 'Sign in to NexHub' : 'Create account'}
                {isSubmitting ? <LoaderCircle size={18} className="animate-spin" /> : <ArrowRight size={18} />}
              </Button>
            </form>

            {feedback ? (
              <Card
                className={`mt-5 shadow-none ${
                  feedback.type === 'success'
                    ? 'border-emerald-200 bg-emerald-50'
                    : 'border-red-200 bg-red-50'
                }`}
              >
                <CardBody className="flex flex-row items-center gap-3 p-4">
                  {feedback.type === 'success' ? (
                    <CheckCircle2 size={18} className="text-emerald-600" />
                  ) : (
                    <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                  )}
                  <p className={feedback.type === 'success' ? 'text-emerald-700' : 'text-red-700'}>
                    {feedback.message}
                  </p>
                </CardBody>
              </Card>
            ) : null}

            <div className="my-5 h-px bg-slate-200" />

            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-slate-900">
                  {currentUser ? 'Welcome to NexHub' : 'Your workspace starts here'}
                </p>
                <Badge variant="secondary">{currentUser ? 'Ready' : 'Private & secure'}</Badge>
              </div>

              {currentUser ? (
                <Card className="bg-slate-50/80 shadow-none">
                  <CardBody className="grid gap-4 p-4 text-left">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Username</p>
                      <p className="mt-1 text-base font-semibold text-slate-900">{currentUser.username}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Email</p>
                      <p className="mt-1 text-base font-semibold text-slate-900">{currentUser.email}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">User ID</p>
                      <p className="mt-1 text-base font-semibold text-slate-900">#{currentUser.id}</p>
                    </div>
                  </CardBody>
                </Card>
              ) : (
                <p className="text-sm leading-6 text-slate-500">
                  Sign in to continue with your builder profile, or create an account to start exploring projects and bounties.
                </p>
              )}
            </div>
          </CardBody>
        </Card>
      </div>
    </main>
  )
}

function App() {
  const [route, setRoute] = useState<AppRoute>(() => normalizeRoute(window.location.pathname))

  useEffect(() => {
    function handleRouteChange() {
      setRoute(normalizeRoute(window.location.pathname))
    }

    window.addEventListener('popstate', handleRouteChange)
    return () => window.removeEventListener('popstate', handleRouteChange)
  }, [])

  if (route === '/auth/login') {
    return <AuthPage mode="login" />
  }

  if (route === '/auth/signup') {
    return <AuthPage mode="signup" />
  }

  return <LandingPage />
}

export default App
