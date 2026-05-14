import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AppHeader } from '../../components/app/app-header'
import { DeveloperAvatar } from '../../components/app/developer-avatar'
import { Card, CardBody, CardDescription, CardTitle } from '../../components/ui/card'
import type { AuthUser, User, ProfileDashboardDTO } from '../../types/app'
import { ProfileTab } from './profile-tabs/profile'
import { ProjectsTab } from './profile-tabs/projects'
import { TasksTab } from './profile-tabs/tasks'
import { AssignedTasksTab } from './profile-tabs/assigned-tasks'
import { ToReviewTab } from './profile-tabs/to-review'
import { SubmissionsTab } from './profile-tabs/submissions'
import { fetchProfileDashboard, readStoredProfileDashboard } from '../../lib/dashboard-storage'

const profileTabKeys = ['profile', 'projects', 'tasks', 'assigned-tasks', 'to-review', 'submissions'] as const

type ProfileTabKey = (typeof profileTabKeys)[number]

function isProfileTabKey(value: string | null): value is ProfileTabKey {
  return value !== null && profileTabKeys.includes(value as ProfileTabKey)
}

export function ProfilePage({
  currentUser,
  onUserUpdate,
  onSignOut,
  onOpenMenu,
}: {
  currentUser: User
  onUserUpdate: (user: AuthUser) => void
  onSignOut: () => void
  onOpenMenu: () => void
}) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [dashboardData, setDashboardData] = useState<ProfileDashboardDTO | null>(readStoredProfileDashboard())
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(!dashboardData)

  const [activeTabKey, setActiveTabKey] = useState<ProfileTabKey>(() => {
    const tabParam = searchParams.get('tab')
    return isProfileTabKey(tabParam) ? tabParam : 'profile'
  })

  const loadDashboard = useCallback(async () => {
    if (!currentUser?.id) return;
    
    // Only show spinner if we don't have any data yet
    // We use a functional update or a ref to check the latest data without depending on it
    setIsLoadingDashboard(prevLoading => {
      // If we already have data, don't trigger the "Loading..." full-screen state
      return dashboardData ? false : true;
    });
    
    try {
      const response = await fetchProfileDashboard(currentUser.id)
      if (response.status === 'success' && response.data) {
        setDashboardData(response.data)
      }
    } catch (error) {
      console.error('Failed to load profile dashboard', error)
    } finally {
      setIsLoadingDashboard(false)
    }
    // We intentionally omit dashboardData from here to prevent an infinite loop
    // because dashboardData is updated by this very function.
  }, [currentUser?.id])

  useEffect(() => {
    void loadDashboard()
  }, [loadDashboard])

  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (isProfileTabKey(tabParam)) {
      if (tabParam !== activeTabKey) {
        setActiveTabKey(tabParam)
      }
    } else {
      setSearchParams({ tab: activeTabKey }, { replace: true })
    }
  }, [activeTabKey, searchParams, setSearchParams])

  function capitalize(str: string) {
    return str
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  function changeActiveTab(tabKey: ProfileTabKey) {
    setActiveTabKey(tabKey)
    setSearchParams({ tab: tabKey })
  }

  function renderActiveTab() {
    if (isLoadingDashboard && !dashboardData) {
        return (
            <Card className="w-full">
                <CardBody className="p-12 text-center">
                    <CardDescription>Preparing your dashboard...</CardDescription>
                </CardBody>
            </Card>
        )
    }

    switch (activeTabKey) {
      case 'profile':
        return <ProfileTab user={currentUser} stats={dashboardData?.stats} onSignOut={onSignOut} onUserUpdate={onUserUpdate} />
      case 'projects':
        return <ProjectsTab user={currentUser} />
      case 'tasks':
        return <TasksTab user={currentUser} />
      case 'assigned-tasks':
        return <AssignedTasksTab user={currentUser} />
      case 'to-review':
        return <ToReviewTab user={currentUser} />
      case 'submissions':
        return <SubmissionsTab user={currentUser} />
      default:
        return <ProfileTab user={currentUser} stats={dashboardData?.stats} onSignOut={onSignOut} onUserUpdate={onUserUpdate} />
    }
  }

  return (
    <main className="min-h-screen px-4 py-5 sm:px-6 lg:px-8">
      <AppHeader user={currentUser} onSignOut={onSignOut} onOpenMenu={onOpenMenu} />

      <section className="mx-auto mt-6 h-[80vh] grid max-w-6xl gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Card>
          <CardBody className="flex flex-col h-full gap-4 p-6">
            <div className="flex items-center gap-4">
              <DeveloperAvatar name={currentUser.username} />
              <div>
                <CardTitle className="text-2xl">{currentUser.username}</CardTitle>
                <CardDescription>{currentUser.email}</CardDescription>
              </div>
            </div>
            <hr />
            <section className="flex flex-col gap-2">
              {profileTabKeys.map((key) => (
                <div
                  key={key}
                  className={
                    'transition-all text-black hover:shadow-indigo-400 shadow-lg rounded-xl border-2 flex items-center h-12 cursor-pointer ' +
                    (key === activeTabKey ? 'border-indigo-500' : 'border-gray-200')
                  }
                  onClick={() => changeActiveTab(key as ProfileTabKey)}
                >
                  <span className="pl-4">{capitalize(key)}</span>
                </div>
              ))}
            </section>
          </CardBody>
        </Card>

        {renderActiveTab()}
      </section>
    </main>
  )
}
