import {
  ArrowRight,
  CheckCircle2,
  FolderKanban,
  Globe,
  Github,
  LoaderCircle,
  MapPin,
  Plus,
  Settings2,
  Sparkles,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

import { AppHeader } from '../components/app/app-header'
import { DeveloperAvatar } from '../components/app/developer-avatar'
import { ProjectListCard } from '../components/app/project-list-card'
import { SectionTitle } from '../components/app/section-title'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardBody, CardDescription, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Textarea } from '../components/ui/textarea'
import { AUTH_DELETE_ENDPOINT, AUTH_UPDATE_ENDPOINT } from '../lib/auth-storage'
import { PROJECTS_ROOT_ENDPOINT } from '../lib/project-api'
import {
  createDefaultProfileDetails,
  persistProfileDetails,
  readStoredProfileDetails,
} from '../lib/profile-storage'
import type { ApiResponse, AuthUser, ProfileDetails, ProjectSummary } from '../types/app'

const AVAILABLE_SKILLS = [
  'Java',
  'Spring',
  'Node.js',
  'React',
  'PostgreSQL',
  'Docker',
  'Python',
  'Solidity',
]

const ROLE_OPTIONS = ['Backend Developer', 'Full Stack Developer', 'Frontend Developer', 'Open Source Builder']
const EXPERIENCE_OPTIONS = ['Junior', 'Mid-level', 'Senior']

type FeedbackState = {
  type: 'success' | 'error'
  message: string
} | null

function sortProjects(projects: ProjectSummary[]) {
  return [...projects].sort((left, right) => {
    const rightDate = new Date(right.updatedAt || right.createdAt).getTime()
    const leftDate = new Date(left.updatedAt || left.createdAt).getTime()
    return rightDate - leftDate
  })
}

function formatUpdatedLabel(dateValue: string) {
  const date = new Date(dateValue)

  if (Number.isNaN(date.getTime())) {
    return 'Recently updated'
  }

  return `Updated ${date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })}`
}

function FeedbackCard({ feedback }: { feedback: FeedbackState }) {
  if (!feedback) {
    return null
  }

  return (
    <Card
      className={`shadow-none ${
        feedback.type === 'success' ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'
      }`}
    >
      <CardBody className="flex flex-row items-center gap-3 p-4">
        {feedback.type === 'success' ? (
          <CheckCircle2 size={18} className="text-emerald-600" />
        ) : (
          <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
        )}
        <p className={feedback.type === 'success' ? 'text-emerald-700' : 'text-red-700'}>{feedback.message}</p>
      </CardBody>
    </Card>
  )
}

function PublicInfoRow({
  icon,
  value,
}: {
  icon: ReactNode
  value: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
      <span className="text-slate-400">{icon}</span>
      <span className="truncate">{value}</span>
    </div>
  )
}

function ProjectsEmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}) {
  return (
    <Card className="shadow-none">
      <CardBody className="flex flex-col items-start gap-4 p-6">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-blue-700">
          <FolderKanban size={22} />
        </div>
        <div className="space-y-1">
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        {actionLabel && onAction ? (
          <Button variant="primary" onClick={onAction}>
            {actionLabel}
            <ArrowRight size={16} />
          </Button>
        ) : null}
      </CardBody>
    </Card>
  )
}

export function ProfilePage({
  user,
  onUserUpdate,
  onSignOut,
  onOpenMenu,
}: {
  user: AuthUser | null
  onUserUpdate: (user: AuthUser) => void
  onSignOut: () => void
  onOpenMenu: () => void
}) {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')
  const [accountForm, setAccountForm] = useState({
    currentEmail: user?.email ?? '',
    currentPassword: '',
    newUsername: user?.username ?? '',
    newEmail: user?.email ?? '',
    newPassword: '',
  })
  const [projectForm, setProjectForm] = useState({
    name: '',
    description: '',
    githubRepo: '',
    tags: '',
  })
  const [projects, setProjects] = useState<ProjectSummary[]>([])
  const [accountFeedback, setAccountFeedback] = useState<FeedbackState>(null)
  const [projectFeedback, setProjectFeedback] = useState<FeedbackState>(null)
  const [projectsLoadError, setProjectsLoadError] = useState<string | null>(null)
  const [profileDetails, setProfileDetails] = useState<ProfileDetails | null>(() =>
    user ? readStoredProfileDetails(user) : null
  )
  const [profileDraft, setProfileDraft] = useState<ProfileDetails | null>(() =>
    user ? readStoredProfileDetails(user) : null
  )
  const [profileFeedback, setProfileFeedback] = useState<FeedbackState>(null)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isLoadingProjects, setIsLoadingProjects] = useState(false)
  const [isCreatingProject, setIsCreatingProject] = useState(false)

  useEffect(() => {
    if (!user) {
      return
    }

    setAccountForm({
      currentEmail: user.email,
      currentPassword: '',
      newUsername: user.username,
      newEmail: user.email,
      newPassword: '',
    })

    const storedProfile = readStoredProfileDetails(user)
    setProfileDetails(storedProfile)
    setProfileDraft(storedProfile)
  }, [user])

  useEffect(() => {
    async function loadProjects() {
      if (!user) {
        return
      }

      setIsLoadingProjects(true)
      setProjectsLoadError(null)

      try {
        const response = await fetch(PROJECTS_ROOT_ENDPOINT)
        const result = (await response.json()) as ApiResponse<ProjectSummary[]>

        if (!response.ok || result.status === 'error' || !result.data) {
          throw new Error(result.message || 'Unable to load projects')
        }

        setProjects(sortProjects(result.data.filter((project) => project.ownerId === user.id)))
      } catch (error) {
        setProjects([])
        setProjectsLoadError(error instanceof Error ? error.message : 'Unable to load projects')
      } finally {
        setIsLoadingProjects(false)
      }
    }

    void loadProjects()
  }, [user])

  if (!user) {
    return null
  }

  const currentUser = user
  const currentProfile = profileDetails ?? createDefaultProfileDetails(currentUser)
  const editingProfile = profileDraft ?? currentProfile
  const uniqueTags = Array.from(new Set(projects.flatMap((project) => project.tags))).slice(0, 6)
  const activeProjectsCount = projects.filter((project) => project.status.toLowerCase() === 'active').length
  const overviewProjects = projects.slice(0, 3)

  async function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSaving(true)
    setAccountFeedback(null)

    try {
      const response = await fetch(AUTH_UPDATE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(accountForm),
      })

      const result = (await response.json()) as ApiResponse<AuthUser>
      const updatedUser = result.data

      if (!response.ok || result.status === 'error' || !updatedUser) {
        throw new Error(result.message || 'Unable to update account')
      }

      onUserUpdate(updatedUser)
      const syncedProfile: ProfileDetails = {
        ...(profileDetails ?? createDefaultProfileDetails(updatedUser)),
        displayName:
          (profileDetails?.displayName || '').trim() === currentUser.username
            ? updatedUser.username
            : profileDetails?.displayName || updatedUser.username,
        username: updatedUser.username,
      }

      persistProfileDetails(updatedUser.id, syncedProfile)
      setProfileDetails(syncedProfile)
      setProfileDraft(syncedProfile)
      setAccountForm((current) => ({
        ...current,
        currentEmail: updatedUser.email,
        currentPassword: '',
        newUsername: updatedUser.username,
        newEmail: updatedUser.email,
        newPassword: '',
      }))
      setAccountFeedback({ type: 'success', message: result.message })
    } catch (error) {
      setAccountFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'Unexpected error',
      })
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDeleteAccount() {
    if (!accountForm.currentPassword) {
      setAccountFeedback({
        type: 'error',
        message: 'Enter your current password before deleting the account.',
      })
      setActiveTab('settings')
      return
    }

    setIsDeleting(true)
    setAccountFeedback(null)

    try {
      const response = await fetch(AUTH_DELETE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: accountForm.currentEmail,
          password: accountForm.currentPassword,
        }),
      })

      const result = (await response.json()) as ApiResponse<null>
      if (!response.ok || result.status === 'error') {
        throw new Error(result.message || 'Unable to delete account')
      }

      onSignOut()
      navigate('/')
    } catch (error) {
      setAccountFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'Unexpected error',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  async function handleCreateProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsCreatingProject(true)
    setProjectFeedback(null)

    try {
      const response = await fetch(PROJECTS_ROOT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerId: currentUser.id,
          name: projectForm.name,
          description: projectForm.description,
          githubRepo: projectForm.githubRepo,
          status: 'active',
          tags: projectForm.tags
            .split(',')
            .map((tag) => tag.trim())
            .filter(Boolean),
        }),
      })

      const result = (await response.json()) as ApiResponse<ProjectSummary>
      const createdProject = result.data

      if (!response.ok || result.status === 'error' || !createdProject) {
        throw new Error(result.message || 'Unable to create project')
      }

      setProjects((current) => sortProjects([createdProject, ...current]))
      setProjectForm({
        name: '',
        description: '',
        githubRepo: '',
        tags: '',
      })
      setProjectFeedback({ type: 'success', message: result.message })
      setProjectsLoadError(null)
      setActiveTab('projects')
    } catch (error) {
      setProjectFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'Unexpected error',
      })
    } finally {
      setIsCreatingProject(false)
    }
  }

  function handleSaveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSavingProfile(true)
    setProfileFeedback(null)

    const normalizedProfile: ProfileDetails = {
      ...editingProfile,
      displayName: editingProfile.displayName.trim() || currentUser.username,
      username: editingProfile.username.trim() || currentUser.username,
      bio: editingProfile.bio.trim(),
      primaryRole: editingProfile.primaryRole.trim(),
      experienceLevel: editingProfile.experienceLevel.trim(),
      skills: editingProfile.skills.filter(Boolean),
      location: editingProfile.location.trim(),
      website: editingProfile.website.trim(),
      githubUsername: editingProfile.githubUsername.trim(),
    }

    persistProfileDetails(currentUser.id, normalizedProfile)
    setProfileDetails(normalizedProfile)
    setProfileDraft(normalizedProfile)
    setProfileFeedback({ type: 'success', message: 'Profile details saved locally.' })
    setIsSavingProfile(false)
  }

  function handleCancelProfileEdit() {
    setProfileDraft(profileDetails ?? createDefaultProfileDetails(currentUser))
    setProfileFeedback(null)
  }

  function toggleSkill(skill: string) {
    setProfileDraft((current) => {
      if (!current) {
        return current
      }

      const hasSkill = current.skills.includes(skill)
      return {
        ...current,
        skills: hasSkill ? current.skills.filter((value) => value !== skill) : [...current.skills, skill],
      }
    })
  }

  return (
    <main className="min-h-screen px-4 py-5 sm:px-6 lg:px-8">
      <AppHeader user={currentUser} onSignOut={onSignOut} onOpenMenu={onOpenMenu} />

      <section className="mx-auto mt-6 max-w-6xl space-y-6">
        <Card>
          <CardBody className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="rounded-3xl border border-blue-100 bg-blue-50 p-2">
                  <DeveloperAvatar name={currentProfile.displayName} />
                </div>
                <div className="min-w-0 space-y-2">
                  <div>
                    <CardTitle className="truncate text-3xl">{currentProfile.displayName}</CardTitle>
                    <CardDescription className="mt-1 text-base">
                      @{currentProfile.username} · {currentProfile.primaryRole}
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{currentProfile.experienceLevel}</Badge>
                    {currentProfile.skills.slice(0, 3).map((skill) => (
                      <Badge key={skill} variant="outline">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <CardDescription className="max-w-3xl text-base text-slate-600">
                {currentProfile.bio}
              </CardDescription>

              <div className="grid gap-4 sm:grid-cols-3">
                <Card className="shadow-none">
                  <CardBody className="space-y-1 p-5">
                    <CardDescription>Projects created</CardDescription>
                    <CardTitle className="text-3xl">{projects.length}</CardTitle>
                  </CardBody>
                </Card>
                <Card className="shadow-none">
                  <CardBody className="space-y-1 p-5">
                    <CardDescription>Active projects</CardDescription>
                    <CardTitle className="text-3xl">{activeProjectsCount}</CardTitle>
                  </CardBody>
                </Card>
                <Card className="shadow-none">
                  <CardBody className="space-y-1 p-5">
                    <CardDescription>Project tags</CardDescription>
                    <CardTitle className="text-3xl">{uniqueTags.length}</CardTitle>
                  </CardBody>
                </Card>
              </div>
            </div>

            <Card className="h-fit shadow-none">
              <CardBody className="space-y-4 p-5">
                <div className="space-y-1">
                  <CardTitle className="text-xl">Public info</CardTitle>
                  <CardDescription>
                    Keep the essentials visible so your profile makes sense once you start applying to bounties.
                  </CardDescription>
                </div>
                <div className="space-y-3">
                  <PublicInfoRow icon={<MapPin size={16} />} value={currentProfile.location || 'Add your location'} />
                  <PublicInfoRow
                    icon={<Globe size={16} />}
                    value={currentProfile.website || 'Add your website or portfolio'}
                  />
                  <PublicInfoRow
                    icon={<Github size={16} />}
                    value={
                      currentProfile.githubUsername
                        ? `github.com/${currentProfile.githubUsername}`
                        : 'Add your GitHub username'
                    }
                  />
                </div>
                <div className="flex flex-col gap-3 pt-2">
                  <Button variant="primary" size="lg" onClick={() => setActiveTab('projects')}>
                    <Plus size={16} />
                    Create new project
                  </Button>
                  <Button variant="ghost" size="lg" onClick={() => setActiveTab('settings')}>
                    <Settings2 size={16} />
                    Edit profile
                  </Button>
                </div>
              </CardBody>
            </Card>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full justify-start">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="projects">Projects</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
                  <Card className="shadow-none">
                    <CardBody className="p-6">
                      <SectionTitle
                        title="Recent projects"
                        right={
                          <Button variant="ghost" size="sm" onClick={() => setActiveTab('projects')}>
                            Manage projects
                          </Button>
                        }
                      />
                      {isLoadingProjects ? (
                        <div className="flex items-center gap-3 text-slate-500">
                          <LoaderCircle size={18} className="animate-spin" />
                          Loading your projects
                        </div>
                      ) : overviewProjects.length > 0 ? (
                        <div className="space-y-3">
                          {overviewProjects.map((project) => (
                            <ProjectListCard
                              key={project.id}
                              name={project.name}
                              description={project.description}
                              tags={project.tags}
                              status={project.status}
                              ownerUsername={project.ownerUsername}
                              stars={project.starsCount}
                              contributors={project.contributorCount}
                              updatedLabel={formatUpdatedLabel(project.updatedAt)}
                              githubRepo={project.githubRepo}
                            />
                          ))}
                        </div>
                      ) : (
                        <ProjectsEmptyState
                          title="No projects yet"
                          description="Start your workspace by creating the first project tied to your account."
                          actionLabel="Create a project"
                          onAction={() => setActiveTab('projects')}
                        />
                      )}
                    </CardBody>
                  </Card>

                  <div className="space-y-6">
                    <Card className="shadow-none">
                      <CardBody className="space-y-4 p-6">
                        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-blue-700">
                          <Sparkles size={20} />
                        </div>
                        <div className="space-y-1">
                          <CardTitle className="text-xl">Profile snapshot</CardTitle>
                          <CardDescription>
                            This is the information collaborators will care about most when your profile starts connecting with bounties and projects.
                          </CardDescription>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {currentProfile.skills.length > 0 ? (
                            currentProfile.skills.map((tag) => (
                              <Badge key={tag} variant="secondary">
                                {tag}
                              </Badge>
                            ))
                          ) : (
                            <Badge variant="outline">No profile skills yet</Badge>
                          )}
                        </div>
                        <CardDescription>{currentProfile.primaryRole} · {currentProfile.experienceLevel}</CardDescription>
                      </CardBody>
                    </Card>

                    {projectsLoadError ? (
                      <Card className="border-red-200 bg-red-50 shadow-none">
                        <CardBody className="space-y-2 p-5">
                          <CardTitle className="text-lg text-red-700">Could not load your projects</CardTitle>
                          <CardDescription className="text-red-700/80">{projectsLoadError}</CardDescription>
                        </CardBody>
                      </Card>
                    ) : null}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="projects" className="space-y-6">
                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
                  <Card className="shadow-none">
                    <CardBody className="p-6">
                      <SectionTitle title="My projects" />
                      {isLoadingProjects ? (
                        <div className="flex items-center gap-3 text-slate-500">
                          <LoaderCircle size={18} className="animate-spin" />
                          Loading your projects
                        </div>
                      ) : projects.length > 0 ? (
                        <div className="space-y-3">
                          {projects.map((project) => (
                            <ProjectListCard
                              key={project.id}
                              name={project.name}
                              description={project.description}
                              tags={project.tags}
                              status={project.status}
                              ownerUsername={project.ownerUsername}
                              stars={project.starsCount}
                              contributors={project.contributorCount}
                              updatedLabel={formatUpdatedLabel(project.updatedAt)}
                              githubRepo={project.githubRepo}
                            />
                          ))}
                        </div>
                      ) : (
                        <ProjectsEmptyState
                          title="Your project list is empty"
                          description="Create your first project here and it will appear in this workspace."
                        />
                      )}
                    </CardBody>
                  </Card>

                  <div className="space-y-6">
                    <Card className="xl:sticky xl:top-5">
                      <CardBody className="space-y-5 p-6">
                        <div className="space-y-1">
                          <Badge variant="secondary" className="px-3 py-1.5 text-sm">
                            Create project
                          </Badge>
                          <CardTitle className="text-2xl">Create a new project</CardTitle>
                          <CardDescription>
                            Add the core information now. You can expand the project later as bounties and tasks arrive.
                          </CardDescription>
                        </div>

                        <form className="space-y-4" onSubmit={handleCreateProject}>
                          <Input
                            label="Project name"
                            placeholder="DevFlow"
                            value={projectForm.name}
                            onChange={(event) =>
                              setProjectForm((current) => ({ ...current, name: event.target.value }))
                            }
                          />

                          <Textarea
                            label="Description"
                            placeholder="What is this project about?"
                            value={projectForm.description}
                            onChange={(event) =>
                              setProjectForm((current) => ({
                                ...current,
                                description: event.target.value,
                              }))
                            }
                          />

                          <Input
                            label="GitHub repository"
                            placeholder="github.com/your-org/project"
                            value={projectForm.githubRepo}
                            onChange={(event) =>
                              setProjectForm((current) => ({
                                ...current,
                                githubRepo: event.target.value,
                              }))
                            }
                          />

                          <Input
                            label="Tags"
                            helperText="Separate tags with commas"
                            placeholder="Java, Spring Boot, PostgreSQL"
                            value={projectForm.tags}
                            onChange={(event) =>
                              setProjectForm((current) => ({ ...current, tags: event.target.value }))
                            }
                          />

                          <Button type="submit" variant="primary" size="lg" className="w-full">
                            {isCreatingProject ? <LoaderCircle size={18} className="animate-spin" /> : <Plus size={18} />}
                            Create project
                          </Button>
                        </form>
                      </CardBody>
                    </Card>

                    <FeedbackCard feedback={projectFeedback} />
                    {projectsLoadError ? <FeedbackCard feedback={{ type: 'error', message: projectsLoadError }} /> : null}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="settings" className="space-y-6">
                <div className="mx-auto max-w-4xl space-y-6">
                  <Card className="shadow-none">
                    <CardBody className="space-y-6 p-6">
                      <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-5">
                        <div className="space-y-1">
                          <CardTitle className="text-2xl">Edit Profile</CardTitle>
                          <CardDescription>
                            Shape how your profile appears when you start joining projects and taking bounties.
                          </CardDescription>
                          <CardDescription className="text-xs">
                            Profile details are stored locally for now while backend profile fields are still pending.
                          </CardDescription>
                        </div>
                        <Button variant="ghost" size="icon" onClick={handleCancelProfileEdit} aria-label="Close edit profile">
                          <X size={18} />
                        </Button>
                      </div>

                      <form className="space-y-6" onSubmit={handleSaveProfile}>
                        <div className="grid gap-5 md:grid-cols-[160px_minmax(0,1fr)]">
                          <div className="space-y-3">
                            <div className="rounded-3xl border border-orange-100 bg-orange-50 p-3">
                              <DeveloperAvatar name={editingProfile.displayName} />
                            </div>
                            <Button type="button" variant="outline" className="w-full" onClick={handleCancelProfileEdit}>
                              Change
                            </Button>
                          </div>

                          <div className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                              <Input
                                label="Name"
                                value={editingProfile.displayName}
                                onChange={(event) =>
                                  setProfileDraft((current) =>
                                    current ? { ...current, displayName: event.target.value } : current
                                  )
                                }
                              />
                              <Input
                                label="Username"
                                value={editingProfile.username}
                                onChange={(event) =>
                                  setProfileDraft((current) =>
                                    current ? { ...current, username: event.target.value } : current
                                  )
                                }
                              />
                            </div>

                            <Textarea
                              label="Bio"
                              value={editingProfile.bio}
                              onChange={(event) =>
                                setProfileDraft((current) =>
                                  current ? { ...current, bio: event.target.value } : current
                                )
                              }
                            />

                            <div className="grid gap-4 md:grid-cols-2">
                              <label className="grid gap-2">
                                <span className="text-sm font-medium text-slate-700">Primary role</span>
                                <select
                                  className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm shadow-slate-100 outline-none focus-visible:ring-2 focus-visible:ring-blue-200"
                                  value={editingProfile.primaryRole}
                                  onChange={(event) =>
                                    setProfileDraft((current) =>
                                      current ? { ...current, primaryRole: event.target.value } : current
                                    )
                                  }
                                >
                                  {ROLE_OPTIONS.map((role) => (
                                    <option key={role} value={role}>
                                      {role}
                                    </option>
                                  ))}
                                </select>
                              </label>

                              <label className="grid gap-2">
                                <span className="text-sm font-medium text-slate-700">Experience level</span>
                                <select
                                  className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm shadow-slate-100 outline-none focus-visible:ring-2 focus-visible:ring-blue-200"
                                  value={editingProfile.experienceLevel}
                                  onChange={(event) =>
                                    setProfileDraft((current) =>
                                      current ? { ...current, experienceLevel: event.target.value } : current
                                    )
                                  }
                                >
                                  {EXPERIENCE_OPTIONS.map((level) => (
                                    <option key={level} value={level}>
                                      {level}
                                    </option>
                                  ))}
                                </select>
                              </label>
                            </div>

                            <div className="space-y-3">
                              <div className="space-y-1">
                                <p className="text-sm font-medium text-slate-700">Skills</p>
                                <p className="text-xs text-slate-500">
                                  Choose the technologies you want visible on your profile.
                                </p>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {AVAILABLE_SKILLS.map((skill) => {
                                  const isSelected = editingProfile.skills.includes(skill)

                                  return (
                                    <button
                                      key={skill}
                                      type="button"
                                      onClick={() => toggleSkill(skill)}
                                      className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                                        isSelected
                                          ? 'border-blue-200 bg-blue-50 text-blue-700'
                                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                                      }`}
                                    >
                                      {skill}
                                    </button>
                                  )
                                })}
                              </div>
                            </div>

                            <div className="space-y-3">
                              <div className="space-y-1">
                                <p className="text-sm font-medium text-slate-700">Public information</p>
                                <p className="text-xs text-slate-500">
                                  This is useful later when your profile starts supporting project and bounty discovery.
                                </p>
                              </div>
                              <div className="grid gap-4">
                                <Input
                                  label="Location"
                                  value={editingProfile.location}
                                  onChange={(event) =>
                                    setProfileDraft((current) =>
                                      current ? { ...current, location: event.target.value } : current
                                    )
                                  }
                                />
                                <Input
                                  label="Website"
                                  value={editingProfile.website}
                                  onChange={(event) =>
                                    setProfileDraft((current) =>
                                      current ? { ...current, website: event.target.value } : current
                                    )
                                  }
                                />
                                <Input
                                  label="GitHub"
                                  value={editingProfile.githubUsername}
                                  onChange={(event) =>
                                    setProfileDraft((current) =>
                                      current ? { ...current, githubUsername: event.target.value } : current
                                    )
                                  }
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col justify-end gap-3 border-t border-slate-200 pt-5 sm:flex-row">
                          <Button type="button" variant="outline" onClick={handleCancelProfileEdit}>
                            Cancel
                          </Button>
                          <Button type="submit" variant="primary" disabled={isSavingProfile}>
                            {isSavingProfile ? <LoaderCircle size={18} className="animate-spin" /> : null}
                            Save profile
                          </Button>
                        </div>
                      </form>

                      <FeedbackCard feedback={profileFeedback} />
                    </CardBody>
                  </Card>

                  <Card className="shadow-none">
                    <CardBody className="space-y-6 p-6">
                      <div>
                        <Badge variant="secondary" className="mb-4 px-3 py-1.5 text-sm">
                          Account access
                        </Badge>
                        <CardTitle className="text-3xl">Credentials and security</CardTitle>
                        <CardDescription className="mt-2 text-base">
                          Keep the current backend-backed account update flow here.
                        </CardDescription>
                      </div>

                      <form className="space-y-4" onSubmit={handleUpdate}>
                        <Input
                          type="email"
                          label="Current email"
                          value={accountForm.currentEmail}
                          onChange={(event) =>
                            setAccountForm((current) => ({ ...current, currentEmail: event.target.value }))
                          }
                        />

                        <Input
                          type="password"
                          label="Current password"
                          placeholder="Required to save changes"
                          value={accountForm.currentPassword}
                          onChange={(event) =>
                            setAccountForm((current) => ({
                              ...current,
                              currentPassword: event.target.value,
                            }))
                          }
                        />

                        <div className="grid gap-4 md:grid-cols-2">
                          <Input
                            label="New username"
                            value={accountForm.newUsername}
                            onChange={(event) =>
                              setAccountForm((current) => ({ ...current, newUsername: event.target.value }))
                            }
                          />

                          <Input
                            type="email"
                            label="New email"
                            value={accountForm.newEmail}
                            onChange={(event) =>
                              setAccountForm((current) => ({ ...current, newEmail: event.target.value }))
                            }
                          />
                        </div>

                        <Input
                          type="password"
                          label="New password"
                          placeholder="Leave empty to keep the current one"
                          value={accountForm.newPassword}
                          onChange={(event) =>
                            setAccountForm((current) => ({
                              ...current,
                              newPassword: event.target.value,
                            }))
                          }
                        />

                        <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                          <Button type="submit" variant="primary" size="lg" className="sm:min-w-[180px]">
                            Save account changes
                            {isSaving ? <LoaderCircle size={18} className="animate-spin" /> : <ArrowRight size={18} />}
                          </Button>

                          <Button type="button" variant="outline" size="lg" onClick={onSignOut}>
                            Sign out
                          </Button>
                        </div>
                      </form>

                      <FeedbackCard feedback={accountFeedback} />

                      <div className="rounded-3xl border border-red-200 bg-red-50 p-5">
                        <div className="space-y-2">
                          <CardTitle className="text-xl text-red-700">Delete account</CardTitle>
                          <CardDescription className="text-red-700/80">
                            This removes your current account from the platform. Enter your current password first.
                          </CardDescription>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          className="mt-4 border-red-300 text-red-700 hover:bg-red-100"
                          onClick={handleDeleteAccount}
                          disabled={isDeleting}
                        >
                          {isDeleting ? <LoaderCircle size={18} className="animate-spin" /> : null}
                          Delete account
                        </Button>
                      </div>
                    </CardBody>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </CardBody>
        </Card>
      </section>
    </main>
  )
}
