import {
  ArrowRight,
  FolderKanban,
  ListChecks,
  Settings,
  Trophy,
  User,
  X,
  type LucideIcon,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { Button } from '../ui/button'
import { readStoredUser } from '../../lib/auth-storage'

type MenuItem = {
  label: string
  description: string
  icon: LucideIcon
  action: () => void
  badge?: string
}

export function SideMenu({
  isOpen,
  onClose,
  onSignOut,
}: {
  isOpen: boolean
  onClose: () => void
  onSignOut: () => void
}) {
  const navigate = useNavigate()
  const user = readStoredUser()

  function navigateAndClose(path: string) {
    navigate(path)
    onClose()
  }

  const menuItems: MenuItem[] = [
    {
      label: 'My profile',
      description: user ? 'Profile and activity.' : 'Sign in to manage your profile.',
      icon: User,
      action: () => navigateAndClose('/profile'),
    },
    {
      label: 'Projects',
      description: 'Explore active repositories.',
      icon: FolderKanban,
      action: () => navigateAndClose('/projects'),
    },
    {
      label: 'Tasks',
      description: 'Find open work.',
      icon: ListChecks,
      action: () => navigateAndClose('/tasks'),
    },
    {
      label: 'Builders ranking',
      description: 'Community standings.',
      icon: Trophy,
      action: onClose,
    },
    {
      label: 'Settings',
      description: 'Account preferences.',
      icon: Settings,
      action: () => navigateAndClose('/profile'),
    },
  ]

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-slate-950/55 backdrop-blur-[2px] transition-opacity duration-300 ${
          isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
      />
      <aside
        aria-label="Main menu"
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-[27rem] flex-col overflow-hidden bg-[#101827] text-white shadow-[0_24px_90px_rgba(2,6,23,0.42)] transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="pointer-events-none absolute inset-y-0 left-0 w-px bg-slate-700" />

        <div className="relative flex items-start justify-between gap-4 px-7 pb-7 pt-7">
          <button
            type="button"
            className="group flex items-center gap-3 text-left"
            onClick={() => navigateAndClose('/')}
          >
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-blue-600 text-lg font-bold text-white transition-transform group-hover:scale-105">
              N
            </div>
            <div>
              <p className="text-3xl font-semibold tracking-tight">NexHub</p>
              <p className="text-sm text-slate-400">
                {user ? `Signed in as ${user.username}` : 'Explore without an account'}
              </p>
            </div>
          </button>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full border border-slate-700 bg-transparent text-slate-300 hover:bg-slate-800"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X size={22} />
          </Button>
        </div>

        <nav className="relative flex-1 px-7">
          {menuItems.map((item) => {
            const Icon = item.icon

            return (
              <button
                key={item.label}
                className="group flex w-full items-center gap-4 border-b border-slate-700/70 py-4 text-left transition-colors hover:border-slate-500"
                type="button"
                onClick={item.action}
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-slate-700 bg-slate-900 text-slate-300 transition-colors group-hover:border-blue-500 group-hover:text-white">
                  <Icon size={20} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="text-lg font-medium tracking-[-0.01em] text-white">{item.label}</span>
                  <span className="mt-0.5 block text-sm leading-5 text-slate-400">{item.description}</span>
                </span>
                <ArrowRight
                  size={18}
                  className="text-slate-600 transition-all group-hover:translate-x-1 group-hover:text-slate-300"
                />
              </button>
            )
          })}
        </nav>

        <div className="relative border-t border-slate-700/70 px-7 py-5">
          {user ? (
            <Button
              variant="outline"
              className="h-11 w-full rounded-full border-slate-700 bg-transparent text-white hover:bg-slate-800"
              onClick={onSignOut}
            >
              Sign out
            </Button>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <Button variant="primary" className="h-12 rounded-full" onClick={() => navigateAndClose('/auth/signup')}>
                Join NexHub
              </Button>
              <Button
                variant="outline"
                className="h-12 rounded-full border-slate-700 bg-transparent text-white hover:bg-slate-800"
                onClick={() => navigateAndClose('/auth/login')}
              >
                Sign in
              </Button>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
