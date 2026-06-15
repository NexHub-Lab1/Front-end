import { ArrowLeft, Flame, Mail, Sparkles, Star, User } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { AppHeader } from '../components/app/app-header'
import { StatLine } from '../components/app/stat-line'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardBody, CardDescription, CardTitle } from '../components/ui/card'
import { PaginationControls } from '../components/ui/pagination-controls'
import { fetchAllUserDetails } from '../lib/user-storage'
import type { UserDetailsResponse } from '../types/app'
import { GRID_PAGE_SIZE } from '../lib/pagination'

export function UsersPage({
  onSignOut,
  onOpenMenu,
}: {
  onSignOut: () => void
  onOpenMenu: () => void
}) {
  const navigate = useNavigate()
  const [users, setUsers] = useState<UserDetailsResponse[]>([])
  const [currentPage, setCurrentPage] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    async function loadUsers() {
      setIsLoading(true)
      setLoadError(null)

      try {
        const response = await fetchAllUserDetails()
        if (response.status === 'success' && response.data) {
          setUsers(response.data)
        } else {
          setUsers([])
          setLoadError(response.message || 'Unable to load developers.')
        }
      } catch (error) {
        console.error(error)
        setUsers([])
        setLoadError('Unable to load developers.')
      } finally {
        setIsLoading(false)
      }
    }

    void loadUsers()
  }, [])

  // Client-side pagination calculations
  const totalElements = users.length
  const totalPages = Math.ceil(totalElements / GRID_PAGE_SIZE)
  const startIndex = currentPage * GRID_PAGE_SIZE
  const endIndex = startIndex + GRID_PAGE_SIZE
  const paginatedUsers = users.slice(startIndex, endIndex)

  return (
    <main className="min-h-screen px-4 py-5 sm:px-6 lg:px-8">
      <AppHeader onSignOut={onSignOut} onOpenMenu={onOpenMenu} />

      <section className="mt-6 space-y-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 w-fit">
          <ArrowLeft size={16} className="mr-2" />
          Back
        </Button>

        <Card>
          <CardBody className="space-y-5 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="mb-2 text-3xl font-semibold tracking-tight text-slate-900">
                  Developers
                </h2>
                <CardDescription className="max-w-2xl text-base">
                  Explore active builders, creators, and contributors across NexHub.
                </CardDescription>
              </div>
            </div>

            {loadError ? (
              <Card className="border-red-100 bg-red-50/70 shadow-none">
                <CardBody className="p-5">
                  <CardDescription className="text-red-700">{loadError}</CardDescription>
                </CardBody>
              </Card>
            ) : isLoading ? (
              <Card className="shadow-none">
                <CardBody className="p-6 text-center">
                  <CardDescription>Loading developers...</CardDescription>
                </CardBody>
              </Card>
            ) : users.length === 0 ? (
              <Card className="shadow-none">
                <CardBody className="p-6 text-center">
                  <CardDescription>No developers found.</CardDescription>
                </CardBody>
              </Card>
            ) : (
              <>
                <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-3">
                  {paginatedUsers.map((dev) => (
                    <Card key={dev.id} className="h-full shadow-none" hoverShadow={true}>
                      <CardBody className="flex h-full flex-col gap-4 p-5">
                        <div className="min-w-0 flex-1 space-y-3">
                          <div className="min-h-[5rem] space-y-1">
                            <CardTitle className="text-2xl font-medium flex items-center gap-2">
                              <User size={20} className="text-slate-400 shrink-0" />
                              <span className="truncate">{dev.username}</span>
                            </CardTitle>
                            <CardDescription className="line-clamp-2 min-h-10">
                              {dev.bio || "No bio added yet."}
                            </CardDescription>
                          </div>

                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Mail size={14} className="shrink-0" />
                            <span className="truncate">{dev.email}</span>
                          </div>

                          <div className="flex flex-wrap gap-4 py-2 border-y border-slate-100/80">
                            <StatLine
                              icon={<Sparkles size={14} className="text-amber-500" />}
                              text={`${dev.reputationScore} Rep`}
                            />
                            <StatLine
                              icon={<Star size={14} className="text-blue-500" />}
                              text={`${dev.totalPoints} Pts`}
                            />
                            <StatLine
                              icon={<Flame size={14} className="text-orange-500" />}
                              text={`${dev.streakDay} day streak`}
                            />
                          </div>

                          {dev.skills.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {dev.skills.slice(0, 4).map((skill) => (
                                <Badge key={skill} variant="secondary" className="text-[10px]">
                                  {skill}
                                </Badge>
                              ))}
                              {dev.skills.length > 4 && (
                                <Badge variant="outline" className="text-[10px]">
                                  +{dev.skills.length - 4}
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <CardDescription className="text-xs">No skills listed yet.</CardDescription>
                          )}
                        </div>

                        <div className="mt-auto flex w-full items-center">
                          <Button
                            variant="primary"
                            className="w-full"
                            onClick={() => navigate(`/user/${dev.id}`)}
                          >
                            View profile
                          </Button>
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>

                <PaginationControls
                  page={currentPage}
                  totalPages={totalPages}
                  totalElements={totalElements}
                  itemLabel="developer"
                  isLoading={isLoading}
                  onPageChange={setCurrentPage}
                />
              </>
            )}
          </CardBody>
        </Card>
      </section>
    </main>
  )
}
