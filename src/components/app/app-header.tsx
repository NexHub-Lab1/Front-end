import { Menu, User } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'

import { Button } from '../ui/button'
import { BrandMark } from './brand-mark'
import { readStoredUser } from '../../lib/auth-storage'
import { NotificationBell } from './notification-bell'

export function AppHeader({
  onOpenMenu,
}: {
  onSignOut: () => void
  onOpenMenu: () => void
}) {
  const navigate = useNavigate()
  const location = useLocation()
  const user = readStoredUser()
  const isProjectsActive = location.pathname === '/projects'
  const isTasksActive = location.pathname === '/tasks'

  return (
    <header className="sticky top-0 z-30 rounded-3xl border border-slate-200/80 bg-white/80 px-4 py-3 shadow-sm backdrop-blur">
      <div className="grid items-center gap-4 md:grid-cols-[auto_minmax(240px,1fr)_auto]">
        <div className="flex items-center gap-4">
          <button type="button" onClick={() => navigate('/')} className="text-left cursor-pointer">
            <BrandMark />
          </button>
          
          <div className="hidden md:flex items-center gap-1.5 pl-2 border-l border-slate-200">
            <Button
              variant="ghost"
              onClick={() => navigate('/projects')}
              className={isProjectsActive ? "text-blue-600 font-bold bg-blue-50/50 hover:text-blue-700 hover:bg-blue-50" : "text-slate-600 hover:text-slate-900"}
            >
              Projects
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate('/tasks')}
              className={isTasksActive ? "text-blue-600 font-bold bg-blue-50/50 hover:text-blue-700 hover:bg-blue-50" : "text-slate-600 hover:text-slate-900"}
            >
              Tasks
            </Button>
          </div>
        </div>

        <nav className="flex items-center justify-end gap-2 sm:gap-3">
          {user ? (
            <>
              <NotificationBell />
              <Button variant="ghost" className="hidden sm:inline-flex" onClick={() => navigate('/profile')}>
                <User size={16} />
                {user.username}
              </Button>
            </>
          ) : (
            <>
              <Button variant="primary" onClick={() => navigate('/auth/login')}>
                Sign in
              </Button>
              <Button variant="ghost" className="hidden sm:inline-flex" onClick={() => navigate('/auth/signup')}>
                Sign up
              </Button>
            </>
          )}
          <Button variant="ghost" size="icon" aria-label="Menu" onClick={onOpenMenu}>
            <Menu size={22} />
          </Button>
        </nav>
      </div>
    </header>
  )
}
