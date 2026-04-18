import { Menu, User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { Button } from '../ui/button'
import { BrandMark } from './brand-mark'
import { readStoredUser } from '../../lib/auth-storage'

export function AppHeader({
  onOpenMenu,
}: {
  onSignOut: () => void
  onOpenMenu: () => void
}) {
  const navigate = useNavigate()
  const user = readStoredUser()
  return (
    <header className="rounded-3xl border border-slate-200/80 bg-white/80 px-4 py-3 shadow-sm backdrop-blur">
      <div className="grid items-center gap-4 md:grid-cols-[auto_minmax(240px,1fr)_auto]">
        <button type="button" onClick={() => navigate('/')} className="text-left cursor-pointer">
          <BrandMark />
        </button>

        <nav className="flex items-center justify-end gap-2 sm:gap-3">
          {user ? (
            <>
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
