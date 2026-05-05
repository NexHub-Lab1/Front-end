import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { getUserDetails } from "../lib/user-storage"
import { type UserDetailsResponse } from "../types/app"
import { ArrowLeft, ArrowDown, ArrowRight, Mail, Flame, Calendar } from "lucide-react"
import { AppHeader } from "../components/app/app-header"
import { StatLine } from "../components/app/stat-line"
import { Button } from "../components/ui/button"
import { Card, CardBody, CardDescription, CardTitle } from "../components/ui/card"
import { Badge } from "../components/ui/badge"
import { readStoredAuthUser } from "../lib/auth-storage"

export default function UserDetails({
  onSignOut,
  onOpenMenu,
}: {
  onSignOut: () => void
  onOpenMenu: () => void
}) {
    const { id } = useParams()
    const navigate = useNavigate()
    const [userDetails, setUserDetails] = useState<UserDetailsResponse | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [showDetails, setShowDetails] = useState(false)
    const currentUser = readStoredAuthUser()?.user

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
    }, [id])

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
                    <>
                        <Card className="overflow-hidden">
                            <CardBody className="space-y-6 transition-all bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.14),transparent_35%),linear-gradient(180deg,rgba(255,255,255,1),rgba(248,250,252,1))] p-6">
                                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                                    <div className="space-y-4">
                                        <div className="flex flex-wrap gap-2">
                                            <Badge variant="secondary">Developer</Badge>
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
                                        <Button variant="primary" size="sm" className="shrink-0">
                                        Follow
                                        </Button>
                                    ) : null}
                                </div>

                                <div className="flex flex-wrap gap-5">
                                    <StatLine
                                        icon={<Flame size={14} className="text-orange-500" />}
                                        text={`${userDetails.streakDay} day streak`}
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

                        <div className="w-full">
                            <Card className="shadow-none">
                                <CardBody className="space-y-4 p-6">
                                    <CardTitle className="text-xl">About this developer</CardTitle>
                                    <CardDescription className="text-base leading-7 text-slate-600">
                                        {userDetails.bio || "This developer hasn't added a bio yet."}
                                    </CardDescription>
                                </CardBody>
                            </Card>
                        </div>
                    </>
                ) : null}
            </section>
        </main>
    )
}