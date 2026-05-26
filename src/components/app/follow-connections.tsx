import { ArrowLeft, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { getFollowedUsers, getFollowers } from '../../lib/user-storage'
import type { UserDetailsResponse } from '../../types/app'
import { Button } from '../ui/button'
import { Card, CardBody, CardDescription, CardTitle } from '../ui/card'
import { DeveloperAvatar } from './developer-avatar'

export type ConnectionView = 'followers' | 'following'

export function FollowConnections({
  userId,
  refreshKey = 0,
  onSelect,
}: {
  userId: number
  refreshKey?: number
  onSelect: (view: ConnectionView) => void
}) {
  const [followers, setFollowers] = useState<UserDetailsResponse[]>([])
  const [following, setFollowing] = useState<UserDetailsResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadConnections() {
      setIsLoading(true)

      try {
        const [followersResponse, followingResponse] = await Promise.all([
          getFollowers(userId),
          getFollowedUsers(userId),
        ])

        if (
          followersResponse.status === 'error'
          || followingResponse.status === 'error'
          || !followersResponse.data
          || !followingResponse.data
        ) {
          throw new Error('Unable to load connections')
        }

        setFollowers(followersResponse.data)
        setFollowing(followingResponse.data)
      } catch {
        setFollowers([])
        setFollowing([])
      } finally {
        setIsLoading(false)
      }
    }

    void loadConnections()
  }, [refreshKey, userId])

  return (
    <div className="flex items-center gap-2 text-sm text-slate-500">
      <Users size={16} />
      <button
        type="button"
        className="font-medium transition-colors hover:text-slate-900 hover:underline hover:underline-offset-4"
        onClick={() => onSelect('followers')}
      >
        {isLoading ? '...' : followers.length} followers
      </button>
      <span aria-hidden="true">·</span>
      <button
        type="button"
        className="font-medium transition-colors hover:text-slate-900 hover:underline hover:underline-offset-4"
        onClick={() => onSelect('following')}
      >
        {isLoading ? '...' : following.length} following
      </button>
    </div>
  )
}

export function ConnectionList({
  userId,
  view,
  onBack,
}: {
  userId: number
  view: ConnectionView
  onBack: () => void
}) {
  const navigate = useNavigate()
  const [developers, setDevelopers] = useState<UserDetailsResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const label = view === 'followers' ? 'Followers' : 'Following'

  useEffect(() => {
    async function loadDevelopers() {
      setIsLoading(true)
      setError(null)

      try {
        const response = view === 'followers'
          ? await getFollowers(userId)
          : await getFollowedUsers(userId)

        if (response.status === 'error' || !response.data) {
          throw new Error(response.message || `Unable to load ${view}`)
        }

        setDevelopers(response.data)
      } catch (loadError) {
        setDevelopers([])
        setError(loadError instanceof Error ? loadError.message : `Unable to load ${view}`)
      } finally {
        setIsLoading(false)
      }
    }

    void loadDevelopers()
  }, [userId, view])

  return (
    <Card className="min-h-[32rem] shadow-none">
      <CardBody className="p-0">
        <div className="flex items-center gap-4 border-b border-slate-100 p-6">
          <Button variant="ghost" size="icon" onClick={onBack} aria-label="Back to developer profile">
            <ArrowLeft size={18} />
          </Button>
          <div>
            <CardTitle className="text-2xl">{label}</CardTitle>
            <CardDescription>
              {isLoading ? 'Loading developers...' : `${developers.length} developers`}
            </CardDescription>
          </div>
        </div>

        {error ? (
          <CardDescription className="m-6 rounded-xl bg-red-50 p-4 text-red-600">
            {error}
          </CardDescription>
        ) : !isLoading && developers.length === 0 ? (
          <CardDescription className="m-6 rounded-xl border border-dashed border-slate-200 p-8 text-center">
            No {view} yet.
          </CardDescription>
        ) : (
          <div className="divide-y divide-slate-100 px-6">
            {developers.map((developer) => (
              <div key={developer.id} className="flex items-center gap-4 py-5">
                <DeveloperAvatar name={developer.username} />
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  onClick={() => navigate(`/user/${developer.id}`)}
                >
                  <span className="block truncate text-lg font-medium text-slate-900 hover:text-blue-700">
                    {developer.username}
                  </span>
                  <span className="block truncate text-sm text-slate-500">
                    {developer.bio || 'NexHub developer'}
                  </span>
                </button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/user/${developer.id}`)}
                >
                  View profile
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  )
}
