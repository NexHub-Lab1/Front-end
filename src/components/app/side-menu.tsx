import { FolderKanban, Settings, Trophy, User, WalletCards, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import type { AuthUser } from '../../types/app'
import { Button } from '../ui/button'

export function SideMenu({
  isOpen,
  onClose,
  user,
  onSignOut,
}: {
  isOpen: boolean
  onClose: () => void
  user: AuthUser | null
  onSignOut: () => void
}) {
  const navigate = useNavigate()

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-slate-900/30 transition-opacity ${
          isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
      />
      <aside
        className={`fixed right-0 top-0 z-50 h-full w-full max-w-sm border-l border-slate-200 bg-slate-100 p-8 shadow-2xl transition-transform ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="mb-10 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-5xl font-semibold tracking-tight text-slate-900">NexHub</p>
            {user ? <p className="text-sm text-slate-500">{user.username}</p> : null}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close menu">
            <X size={22} />
          </Button>
        </div>

        <nav className="space-y-6">
          <button className="menu-item" type="button" onClick={onClose}>
            <WalletCards size={34} />
            <span>Bounties</span>
          </button>

          <button
            className="menu-item"
            type="button"
            onClick={() => {
              navigate('/profile')
              onClose()
            }}
          >
            <User size={34} />
            <span>My profile</span>
          </button>

          <button className="menu-item" type="button" onClick={onClose}>
            <FolderKanban size={34} />
            <span>Projects</span>
          </button>

          <button className="menu-item" type="button" onClick={onClose}>
            <Trophy size={34} />
            <span>Builders ranking</span>
          </button>

          <button
            className="menu-item"
            type="button"
            onClick={() => {
              navigate('/profile')
              onClose()
            }}
          >
            <Settings size={34} />
            <span>Settings</span>
          </button>
        </nav>

        {user ? (
          <div className="mt-10">
            <Button variant="outline" className="w-full" onClick={onSignOut}>
              Sign out
            </Button>
          </div>
        ) : null}
      </aside>
    </>
  )
}
