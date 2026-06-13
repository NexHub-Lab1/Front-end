import {
  Sparkles,
  Star,
  User as UserIcon,
  Folder,
  Briefcase,
  ClipboardCheck,
  CheckSquare,
  Send,
  MessageSquare,
  Wallet,
} from 'lucide-react'
import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AppHeader } from '../../components/app/app-header'
import { DeveloperAvatar } from '../../components/app/developer-avatar'
import { StatLine } from '../../components/app/stat-line'
import { Card, CardBody, CardDescription, CardTitle } from '../../components/ui/card'
import type { AuthUser, User, ProfileDashboardDTO } from '../../types/app'
import { ProfileTab } from './profile-tabs/profile'
import { ProjectsTab } from './profile-tabs/projects'
import { TasksTab } from './profile-tabs/tasks'
import { AssignedTasksTab } from './profile-tabs/assigned-tasks'
import { ToReviewTab } from './profile-tabs/to-review'
import { SubmissionsTab } from './profile-tabs/submissions'
import { WalletTab } from './profile-tabs/wallet'
import { ChatsTab } from './profile-tabs/chats'
import { fetchProfileDashboard, readStoredProfileDashboard } from '../../lib/dashboard-storage'
import { ConnectionList, FollowConnections, type ConnectionView } from '../../components/app/follow-connections'

const profileTabKeys = ['profile', 'projects', 'tasks', 'assigned-tasks', 'to-review', 'submissions', 'wallet', 'chats'] as const

type ProfileTabKey = (typeof profileTabKeys)[number]

function isProfileTabKey(value: string | null): value is ProfileTabKey {
  return value !== null && profileTabKeys.includes(value as ProfileTabKey)
}

const tabIcons: Record<ProfileTabKey, React.ReactNode> = {
  profile: <UserIcon size={18} />,
  projects: <Folder size={18} />,
  tasks: <Briefcase size={18} />,
  'assigned-tasks': <ClipboardCheck size={18} />,
  'to-review': <CheckSquare size={18} />,
  submissions: <Send size={18} />,
  wallet: <Wallet size={18} />,
  chats: <MessageSquare size={18} />,
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
  const selectedConnections = searchParams.get('connections')
  const connectionView: ConnectionView | null =
    selectedConnections === 'followers' || selectedConnections === 'following'
      ? selectedConnections
      : null

  const [activeTabKey, setActiveTabKey] = useState<ProfileTabKey>(() => {
    const tabParam = searchParams.get('tab')
    return isProfileTabKey(tabParam) ? tabParam : 'profile'
  })

  const loadDashboard = useCallback(async () => {
    if (!currentUser?.id) return;
    
    setIsLoadingDashboard(() => {
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
  }, [currentUser?.id])

  useEffect(() => {
    void loadDashboard()
  }, [loadDashboard])

  useEffect(() => {
    if (connectionView) {
      return
    }

    const tabParam = searchParams.get('tab')
    if (isProfileTabKey(tabParam)) {
      if (tabParam !== activeTabKey) {
        setActiveTabKey(tabParam)
      }
    } else {
      setSearchParams({ tab: activeTabKey }, { replace: true })
    }
  }, [activeTabKey, connectionView, searchParams, setSearchParams])

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
    if (connectionView) {
      return (
        <ConnectionList
          userId={currentUser.id}
          view={connectionView}
          onBack={() => setSearchParams({ tab: activeTabKey })}
        />
      )
    }

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
        return <ProfileTab onSignOut={onSignOut} onUserUpdate={onUserUpdate} />
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
      case 'wallet':
        return <WalletTab />
      case 'chats':
        return <ChatsTab user={currentUser} />
      default:
        return <ProfileTab onSignOut={onSignOut} onUserUpdate={onUserUpdate} />
    }
  }

  return (
    <main className="min-h-screen px-4 py-5 sm:px-6 lg:px-8">
      <AppHeader onSignOut={onSignOut} onOpenMenu={onOpenMenu} />

      <section className="mx-auto mt-6 grid max-w-6xl gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Card className="overflow-hidden lg:sticky lg:top-6 self-start">
          <CardBody className="flex flex-col gap-4 p-6 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.14),transparent_35%),linear-gradient(180deg,rgba(255,255,255,1),rgba(248,250,252,1))]">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <DeveloperAvatar name={currentUser.username} />
                <div className="space-y-1">
                  <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
                    {currentUser.username}
                  </CardTitle>
                  <CardDescription className="text-sm font-medium text-slate-500">
                    {currentUser.email}
                  </CardDescription>
                </div>
              </div>

              {dashboardData?.stats && (
                <div className="flex flex-wrap gap-4 pt-2">
                  <StatLine 
                    icon={<Sparkles size={16} className="text-amber-500" />} 
                    text={`${dashboardData.stats.reputationScore} Rep`} 
                  />
                  <StatLine 
                    icon={<Star size={16} className="text-blue-500" />} 
                    text={`${dashboardData.stats.totalPoints} Pts`} 
                  />
                </div>
              )}

              <FollowConnections
                userId={currentUser.id}
                onSelect={(view) => setSearchParams({ connections: view })}
              />
            </div>

            <hr className="border-slate-100" />

            <nav className="flex flex-col gap-2">
              {profileTabKeys.map((key) => {
                const isActive = key === activeTabKey
                return (
                  <div
                    key={key}
                    className={
                      `group transition-all flex items-center gap-3 h-12 px-4 rounded-xl cursor-pointer font-medium
                      ${isActive 
                        ? 'bg-blue-50 text-blue-700 shadow-sm shadow-blue-100/50 border border-blue-100' 
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                      }`
                    }
                    onClick={() => changeActiveTab(key as ProfileTabKey)}
                  >
                    <span className={isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600 transition-colors'}>
                      {tabIcons[key]}
                    </span>
                    <span>{capitalize(key)}</span>
                  </div>
                )
              })}
            </nav>
          </CardBody>
        </Card>
        <div className="[&>div]:min-h-[600px]">
          {renderActiveTab()}
        </div>
      </section>
    </main>
  )
}
