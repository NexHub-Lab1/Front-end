import { useEffect, useState, type ReactElement } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AppHeader } from '../../components/app/app-header'
import { DeveloperAvatar } from '../../components/app/developer-avatar'
import { Card, CardBody, CardDescription, CardTitle } from '../../components/ui/card'
import type { AuthUser } from '../../types/app'
import { ProfileTab } from './profile-tabs/profile'
import { ProjectsTab } from './profile-tabs/projects'
import { TasksTab } from './profile-tabs/tasks'
import { AssignedTasksTab } from './profile-tabs/assigned-tasks'
import { ToReviewTab } from './profile-tabs/to-review'
import { SubmissionsTab } from './profile-tabs/submissions'
import { WalletTab } from './profile-tabs/wallet'
import { readStoredUser } from '../../lib/auth-storage'

const profileTabKeys = ['profile', 'projects', 'tasks', 'assigned-tasks', 'to-review', 'submissions', 'wallet'] as const

type ProfileTabKey = (typeof profileTabKeys)[number]

function isProfileTabKey(value: string | null): value is ProfileTabKey {
  return value !== null && profileTabKeys.includes(value as ProfileTabKey)
}

export function ProfilePage({
  onUserUpdate,
  onSignOut,
  onOpenMenu,
}: {
  onUserUpdate: (user: AuthUser) => void
  onSignOut: () => void
  onOpenMenu: () => void
}) {
  const user = readStoredUser()
  const [searchParams, setSearchParams] = useSearchParams()
  if (!user) return (
    <div>No user registered, please login or sign up.</div>
  )

  const renderedTabs: Record<ProfileTabKey, ReactElement> = {
    profile: <ProfileTab onSignOut={onSignOut} onUserUpdate={onUserUpdate} />,
    projects: <ProjectsTab />,
    tasks: <TasksTab />,
    'assigned-tasks': <AssignedTasksTab />,
    'to-review': <ToReviewTab />,
    submissions: <SubmissionsTab />,
    wallet: <WalletTab />,
  }

  const [activeTabKey, setActiveTabKey] = useState<ProfileTabKey>(() => {
    const tabParam = searchParams.get('tab')
    return isProfileTabKey(tabParam) ? tabParam : 'profile'
  })

  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (isProfileTabKey(tabParam)) {
      if (tabParam !== activeTabKey) {
        setActiveTabKey(tabParam)
      }
      return
    }

    setSearchParams({ tab: activeTabKey }, { replace: true })
  }, [activeTabKey, searchParams, setSearchParams])

  function capitalize(str: string) {
    return str
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  function changeActiveTab(tabKey: ProfileTabKey) {
    setActiveTabKey(tabKey)
    setSearchParams({ tab: tabKey })
  }

  function showTabs() {
    return profileTabKeys.map((key) => {
      return (
        <div key={key} className={
          "transition-all text-black hover:shadow-indigo-400 shadow-lg rounded-xl border-2  flex items-center h-12 "
          + (key === activeTabKey ? "border-indigo-500" : "border-gray-200")
          } onClick={() => changeActiveTab(key as ProfileTabKey)}>
          <span className="pl-4">{capitalize(key)}</span>
        </div>
      )
    })
  }

  return (
      <main className="min-h-screen px-4 py-5 sm:px-6 lg:px-8">
        <AppHeader onSignOut={onSignOut} onOpenMenu={onOpenMenu} />

        <section className="mx-auto mt-6 h-[80vh] grid max-w-6xl gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <Card>
            <CardBody className="flex flex-col h-full gap-4 p-6">
              <div className="flex items-center gap-4">
                <DeveloperAvatar name={user.username} />
                <div>
                  <CardTitle className="text-2xl">{user.username}</CardTitle>
                  <CardDescription>{user.email}</CardDescription>
                </div>
              </div>
              <hr />
              <section className="flex flex-col gap-2">
                {showTabs()}
              </section>
            </CardBody>
          </Card>

          {renderedTabs[activeTabKey]}
        </section>
      </main>
    )
}
