import { Menu, Search, User } from 'lucide-react'

import { navigateTo } from '../../lib/navigation'
import type { AuthUser } from '../../types/app'
import { Button } from '../ui/button'
import { BrandMark } from './brand-mark'

export function AppHeader({
  user,
  onSignOut,
  onOpenMenu,
}: {
  user: AuthUser | null
  onSignOut: () => void
  onOpenMenu: () => void
}) {
  return (
    <header className="rounded-3xl border border-slate-200/80 bg-white/80 px-4 py-3 shadow-sm backdrop-blur">
      <div className="grid items-center gap-4 md:grid-cols-[auto_minmax(240px,1fr)_auto]">
        <button type="button" onClick={() => navigateTo('/')} className="text-left">
          <BrandMark />
        </button>

        <div className="hidden md:block">
          <div className="flex h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 shadow-sm">
            <Search size={18} className="text-slate-400" />
            <input
              type="text"
              placeholder="Search"
              aria-label="Search"
              className="w-full border-0 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
            />
          </div>
        </div>

        <nav className="flex items-center justify-end gap-2 sm:gap-3">
          {user ? (
            <>
              <Button variant="ghost" className="hidden sm:inline-flex" onClick={() => navigateTo('/profile')}>
                <User size={16} />
                {user.username}
              </Button>
              <Button variant="outline" className="hidden sm:inline-flex" onClick={onSignOut}>
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Button variant="primary" onClick={() => navigateTo('/auth/login')}>
                Sign in
              </Button>
              <Button variant="ghost" className="hidden sm:inline-flex" onClick={() => navigateTo('/auth/signup')}>
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
