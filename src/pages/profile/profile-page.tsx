import { useState, type ReactElement } from 'react'
import { AppHeader } from '../../components/app/app-header'
import { DeveloperAvatar } from '../../components/app/developer-avatar'
import { Card, CardBody, CardDescription, CardTitle } from '../../components/ui/card'
import type { AuthUser } from '../../types/app'
import { ProfileTab } from './profile-tabs/profile'
import { ProjectsTab } from './profile-tabs/projects'

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

  if (!user) return (
    <div>No user registered, please login or sign up.</div>
  )

  const tabs = {
    profile: <ProfileTab user={user} onSignOut={onSignOut} onUserUpdate={onUserUpdate} />,
    projects: <ProjectsTab user={user} />
  }

  const [activeTab, setActiveTab] = useState<{key: String, component: ReactElement | null}>({
    key: 'profile',
    component: tabs.profile
  })

  function capitalize(str:String) {
    return str
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  function changeActiveTab(param: String) {
    setActiveTab({
      key: param,
      component: Object.entries(tabs).filter( ([k, v], idx) => k == param)[0][1]
    })
  }

  function showTabs() {
    return Object.entries(tabs).map(([key, value], idx) => {
      return (
        <div key={idx} className={
          "transition-all text-black hover:shadow-indigo-400 shadow-lg rounded-xl border-2  flex items-center h-12 "
          + (key == activeTab.key ? "border-indigo-500" : "border-gray-200")
          } onClick={() => changeActiveTab(key)}>
          <span className="pl-4">{capitalize(key)}</span>
        </div>
      )
    })
  }

  return (
      <main className="min-h-screen px-4 py-5 sm:px-6 lg:px-8">
        <AppHeader user={user} onSignOut={onSignOut} onOpenMenu={onOpenMenu} />

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

          {activeTab.component}
        </section>
      </main>
    )
}
