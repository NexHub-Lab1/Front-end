import { useEffect, useState } from "react"
import { useParams, useNavigate, useSearchParams } from "react-router-dom"
import { followUser, getUserDetails, getFollowedUsers, unfollowUser } from "../lib/user-storage"
import { fetchProjectsByOwnerId } from "../lib/project-storage"
import { fetchTasksByOwner } from "../lib/task-storage"
import { type UserDetailsResponse, type ProjectResponse, type TaskResponse, type PaginatedResponse } from "../types/app"
import { ArrowLeft, ArrowDown, ArrowRight, Mail, Flame, Calendar, UserPlus, Loader2, CheckCircle, AlertCircle, UserCheck, Sparkles, Star, Users } from "lucide-react"
import { AppHeader } from "../components/app/app-header"
import { StatLine } from "../components/app/stat-line"
import { Button } from "../components/ui/button"
import { Card, CardBody, CardDescription, CardTitle } from "../components/ui/card"
import { Badge } from "../components/ui/badge"
import { readStoredAuthUser } from "../lib/auth-storage"
import { ConnectionList, FollowConnections, type ConnectionView } from "../components/app/follow-connections"
import { PaginationControls } from "../components/ui/pagination-controls"
import { createEmptyPaginatedResponse } from "../lib/pagination"

const formatMoney = (amount: number, currency: string) => {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount)
  } catch (e) {
    return `${amount.toFixed(2)} ${currency}`
  }
}

export default function UserDetails({
  onSignOut,
  onOpenMenu,
}: {
  onSignOut: () => void
  onOpenMenu: () => void
}) {
    const { id } = useParams()
    const navigate = useNavigate()
    const [searchParams, setSearchParams] = useSearchParams()
    const [userDetails, setUserDetails] = useState<UserDetailsResponse | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [showDetails, setShowDetails] = useState(false)
    const [isFollowLoading, setIsFollowLoading] = useState(false)
    const [followSuccess, setFollowSuccess] = useState(false)
    const [followError, setFollowError] = useState<string | null>(null)
    const [isFollowed, setIsFollowed] = useState(false)
    const [connectionsRefreshKey, setConnectionsRefreshKey] = useState(0)
    const currentUser = readStoredAuthUser()?.user
    const currentUserId = currentUser?.id
    const selectedConnections = searchParams.get('connections')
    const connectionView: ConnectionView | null =
        selectedConnections === 'followers' || selectedConnections === 'following'
            ? selectedConnections
            : null

    const [projectsPage, setProjectsPage] = useState<PaginatedResponse<ProjectResponse>>(() => createEmptyPaginatedResponse(0, 6))
    const [tasksPage, setTasksPage] = useState<PaginatedResponse<TaskResponse>>(() => createEmptyPaginatedResponse(0, 6))
    const [projectsPageNum, setProjectsPageNum] = useState(0)
    const [tasksPageNum, setTasksPageNum] = useState(0)
    const [isLoadingProjects, setIsLoadingProjects] = useState(false)
    const [isLoadingTasks, setIsLoadingTasks] = useState(false)

    useEffect(() => {
        async function loadProjects() {
            const parsedId = Number(id)
            if (Number.isNaN(parsedId)) return

            setIsLoadingProjects(true)
            try {
                const response = await fetchProjectsByOwnerId(parsedId, {
                    page: projectsPageNum,
                    size: 6,
                })
                if (response.status === 'success' && response.data) {
                    setProjectsPage(response.data)
                } else {
                    setProjectsPage(createEmptyPaginatedResponse(projectsPageNum, 6))
                }
            } catch (err) {
                console.error("Failed to load user projects", err)
                setProjectsPage(createEmptyPaginatedResponse(projectsPageNum, 6))
            } finally {
                setIsLoadingProjects(false)
            }
        }
        void loadProjects()
    }, [id, projectsPageNum])

    useEffect(() => {
        async function loadTasks() {
            const parsedId = Number(id)
            if (Number.isNaN(parsedId)) return

            setIsLoadingTasks(true)
            try {
                const response = await fetchTasksByOwner(parsedId, {
                    page: tasksPageNum,
                    size: 6,
                })
                if (response.status === 'success' && response.data) {
                    setTasksPage(response.data)
                } else {
                    setTasksPage(createEmptyPaginatedResponse(tasksPageNum, 6))
                }
            } catch (err) {
                console.error("Failed to load user tasks", err)
                setTasksPage(createEmptyPaginatedResponse(tasksPageNum, 6))
            } finally {
                setIsLoadingTasks(false)
            }
        }
        void loadTasks()
    }, [id, tasksPageNum])

    useEffect(() => {
        async function loadUser() {
            const parsedId = Number(id)

            if (!id || Number.isNaN(parsedId)) {
                setError("User id is invalid")
                setIsLoading(false)
                return
            }

            setIsLoading(true)
            setError(null)

            try {
                const response = await getUserDetails(parsedId)

                if (response.status === "error" || !response.data) {
                    throw new Error(response.message || "Unable to load user")
                }

                setUserDetails(response.data)

                // Check if current user has followed this user
                if (currentUserId) {
                    const followedResponse = await getFollowedUsers(currentUserId)
                    if (followedResponse.status === "success" && followedResponse.data) {
                        const isAlreadyFollowed = followedResponse.data.some(
                            (user) => user.id === parsedId
                        )
                        setIsFollowed(isAlreadyFollowed)
                    }
                }
            } catch (fetchError) {
                setUserDetails(null)
                setError(
                    fetchError instanceof Error
                        ? fetchError.message
                        : "Unable to load user",
                )
            } finally {
                setIsLoading(false)
            }
        }

        void loadUser()
    }, [currentUserId, id])

    const handleFollowClick = async () => {
        if (!currentUser || !userDetails) return

        setIsFollowLoading(true)
        setFollowError(null)

        try {
            if (isFollowed) {
                // Unfollow
                const response = await unfollowUser(currentUser.id, userDetails.id)
                if (response.status === "success") {
                    setIsFollowed(false)
                    setFollowSuccess(true)
                    setConnectionsRefreshKey((current) => current + 1)
                    setTimeout(() => setFollowSuccess(false), 2000)
                }
            } else {
                // Follow
                const response = await followUser(currentUser.id, userDetails.id)
                if (response.status === "success") {
                    setIsFollowed(true)
                    setFollowSuccess(true)
                    setConnectionsRefreshKey((current) => current + 1)
                    setTimeout(() => setFollowSuccess(false), 2000)
                }
            }
        } catch (err) {
            setFollowError(
                err instanceof Error ? err.message : "Failed to update follow status"
            )
            setTimeout(() => setFollowError(null), 3000)
        } finally {
            setIsFollowLoading(false)
        }
    }

    return (
        <main className="min-h-screen px-4 py-5 sm:px-6 lg:px-8">
            <AppHeader onSignOut={onSignOut} onOpenMenu={onOpenMenu} />

            <section className="mx-auto mt-6 max-w-5xl space-y-2">
                <Button variant="ghost" onClick={() => navigate(-1)} className="w-fit">
                    <ArrowLeft size={16} className="mr-2" />
                    Back
                </Button>

                {isLoading ? (
                    <Card>
                        <CardBody className="space-y-3 p-6">
                            <CardTitle className="text-3xl">Loading user...</CardTitle>
                            <CardDescription>
                                Please wait while we load the user details.
                            </CardDescription>
                        </CardBody>
                    </Card>
                ) : error ? (
                    <Card>
                        <CardBody className="space-y-3 p-6">
                            <CardTitle className="text-3xl">User not found</CardTitle>
                            <CardDescription>{error}</CardDescription>
                        </CardBody>
                    </Card>
                ) : userDetails ? (
                    <div className={connectionView ? "grid gap-6 lg:grid-cols-[22rem_minmax(0,1fr)] lg:items-start" : "space-y-6"}>
                        <Card className="overflow-hidden">
                            <CardBody className="space-y-6 transition-all bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.14),transparent_35%),linear-gradient(180deg,rgba(255,255,255,1),rgba(248,250,252,1))] p-6">
                                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                                    <div className="space-y-4">
                                        <div className="flex flex-wrap gap-2">
                                            {userDetails.figmaUsername ? (
                                                <Badge variant="secondary">Designer</Badge>
                                            ) : (
                                                <Badge variant="secondary">Developer</Badge>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <CardTitle className="text-4xl">
                                                {userDetails.username}
                                            </CardTitle>
                                            <CardDescription className="max-w-3xl text-base leading-7 text-slate-600">
                                                {userDetails.bio || "No bio added yet"}
                                            </CardDescription>
                                        </div>

                                        <div className="flex items-center gap-2 text-slate-600">
                                            <Mail size={16} />
                                            <span className="text-sm">{userDetails.email}</span>
                                        </div>
                                    </div>
                                    {currentUser && currentUser.id !== userDetails.id ? (
                                        <div className="flex flex-col gap-2 shrink-0">
                                            <Button 
                                                variant={isFollowed ? "secondary" : "primary"}
                                                size="sm" 
                                                className="gap-2 shrink-0"
                                                onClick={handleFollowClick}
                                                disabled={isFollowLoading}
                                            >
                                                {isFollowLoading ? (
                                                    <>
                                                        <Loader2 size={16} className="animate-spin" />
                                                        {isFollowed ? "Unfollowing..." : "Following..."}
                                                    </>
                                                ) : followSuccess ? (
                                                    <>
                                                        <CheckCircle size={16} />
                                                        {!isFollowed ? "Unfollowed" : "Followed!"}
                                                    </>
                                                ) : isFollowed ? (
                                                    <>
                                                        <UserCheck size={16} />
                                                        Following
                                                    </>
                                                ) : (
                                                    <>
                                                        <UserPlus size={16} />
                                                        Follow
                                                    </>
                                                )}
                                            </Button>
                                            {followError && (
                                                <div className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                                                    <AlertCircle size={14} />
                                                    {followError}
                                                </div>
                                            )}
                                        </div>
                                    ) : null}
                                </div>

                                <div className="flex flex-wrap gap-5">
                                    <FollowConnections
                                        userId={userDetails.id}
                                        refreshKey={connectionsRefreshKey}
                                        onSelect={(view) => setSearchParams({ connections: view })}
                                    />
                                    <StatLine
                                        icon={<Flame size={14} className="text-orange-500" />}
                                        text={`${userDetails.streakDay} day streak`}
                                    />
                                    <StatLine
                                        icon={<Sparkles size={14} className="text-amber-500" />}
                                        text={`${userDetails.reputationScore} Rep`}
                                    />
                                    <StatLine
                                        icon={<Star size={14} className="text-blue-500" />}
                                        text={`${userDetails.totalPoints} Pts`}
                                    />
                                    <StatLine
                                        icon={<Calendar size={14} className="text-slate-400" />}
                                        text={`Member since ${new Date(userDetails.created_at).toLocaleDateString()}`}
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
                                                User ID
                                            </span>
                                            <span>{userDetails.id}</span>
                                        </div>
                                        <div className="flex items-center justify-between gap-4">
                                            <span className="font-medium text-slate-700">
                                                Username
                                            </span>
                                            <span>{userDetails.username}</span>
                                        </div>
                                        <div className="flex items-center justify-between gap-4">
                                            <span className="font-medium text-slate-700">
                                                Email
                                            </span>
                                            <span>{userDetails.email}</span>
                                        </div>
                                        <div className="flex items-center justify-between gap-4">
                                            <span className="font-medium text-slate-700">
                                                Reputation Score
                                            </span>
                                            <span>{userDetails.reputationScore}</span>
                                        </div>
                                        <div className="flex items-center justify-between gap-4">
                                            <span className="font-medium text-slate-700">
                                                Total Points
                                            </span>
                                            <span>{userDetails.totalPoints}</span>
                                        </div>
                                        <div className="flex items-center justify-between gap-4">
                                            <span className="font-medium text-slate-700">
                                                Streak Days
                                            </span>
                                            <span>{userDetails.streakDay}</span>
                                        </div>
                                        <div className="flex items-center justify-between gap-4">
                                            <span className="font-medium text-slate-700">
                                                Joined
                                            </span>
                                            <span>
                                                {new Date(userDetails.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between gap-4">
                                            <span className="font-medium text-slate-700">
                                                Last active
                                            </span>
                                            <span>
                                                {new Date(userDetails.last_active_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                ) : null}
                            </CardBody>
                        </Card>

                        {connectionView ? (
                            <ConnectionList
                                userId={userDetails.id}
                                view={connectionView}
                                onBack={() => setSearchParams({})}
                            />
                                                ) : (
                        <div className="w-full space-y-6">
                            <Card className="shadow-none">
                                <CardBody className="space-y-4 p-6">
                                    <CardTitle className="text-xl">About this developer</CardTitle>
                                    <CardDescription className="text-base leading-7 text-slate-600">
                                        {userDetails.bio || "This developer hasn't added a bio yet."}
                                    </CardDescription>
                                    <div className="space-y-2">
                                        <CardTitle className="text-lg">Skills</CardTitle>
                                        {userDetails.skills.length > 0 ? (
                                            <div className="flex flex-wrap gap-2">
                                                {userDetails.skills.map((skill) => (
                                                    <Badge key={skill} variant="secondary">
                                                        {skill}
                                                    </Badge>
                                                ))}
                                            </div>
                                        ) : (
                                            <CardDescription>No skills added yet.</CardDescription>
                                        )}
                                    </div>
                                </CardBody>
                            </Card>

                            {/* Projects of this developer */}
                            <div className="space-y-4 pt-4 border-t border-slate-100">
                                <CardTitle className="text-xl">Projects of this developer</CardTitle>
                                {isLoadingProjects ? (
                                    <Card className="shadow-none">
                                        <CardBody className="p-6 text-center">
                                            <CardDescription>Loading projects...</CardDescription>
                                        </CardBody>
                                    </Card>
                                ) : projectsPage.content.length === 0 ? (
                                    <Card className="shadow-none">
                                        <CardBody className="p-6 text-center">
                                            <CardDescription>This developer hasn't created any projects yet.</CardDescription>
                                        </CardBody>
                                    </Card>
                                ) : (
                                    <>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {projectsPage.content.map((project) => (
                                                <Card
                                                    key={project.id}
                                                    hoverShadow={true}
                                                    className="h-fit cursor-pointer"
                                                    onClick={() => navigate(`/project/${project.id}`)}
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
                                                                text={`${project.contributorCount} contributors`}
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
                                            onPageChange={setProjectsPageNum}
                                        />
                                    </>
                                )}
                            </div>

                            {/* Tasks of this developer */}
                            <div className="space-y-4 pt-6 border-t border-slate-100">
                                <CardTitle className="text-xl">Tasks of this developer</CardTitle>
                                {isLoadingTasks ? (
                                    <Card className="shadow-none">
                                        <CardBody className="p-6 text-center">
                                            <CardDescription>Loading tasks...</CardDescription>
                                        </CardBody>
                                    </Card>
                                ) : tasksPage.content.length === 0 ? (
                                    <Card className="shadow-none">
                                        <CardBody className="p-6 text-center">
                                            <CardDescription>This developer hasn't created any tasks yet.</CardDescription>
                                        </CardBody>
                                    </Card>
                                ) : (
                                    <>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {tasksPage.content.map((task) => (
                                                <Card
                                                    key={task.id}
                                                    hoverShadow={true}
                                                    className="h-fit cursor-pointer"
                                                    onClick={() => navigate(`/task/${task.id}`)}
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
                                                        </div>

                                                        <div className="space-y-2 text-sm text-slate-600">
                                                            <p><span className="font-medium text-slate-800">Reward:</span> {formatMoney(task.rewardAmount, task.rewardCurrency)}</p>
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
                                            onPageChange={setTasksPageNum}
                                        />
                                    </>
                                )}
                            </div>
                        </div>
                        )}
                    </div>
                ) : null}
            </section>
        </main>
    )
}
