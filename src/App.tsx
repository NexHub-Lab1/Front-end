import { useEffect, useState } from 'react'

import './App.css'
import { SideMenu } from './components/app/side-menu'
import { persistUser, readStoredUser } from './lib/auth-storage'
import { normalizeRoute, navigateTo } from './lib/navigation'
import { AuthPage } from './pages/auth-page'
import { LandingPage } from './pages/landing-page'
import { ProfilePage } from './pages/profile-page'
import type { AppRoute, AuthUser } from './types/app'

function App() {
  const [route, setRoute] = useState<AppRoute>(() => normalizeRoute(window.location.pathname))
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => readStoredUser())
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    function handleRouteChange() {
      setRoute(normalizeRoute(window.location.pathname))
    }

    window.addEventListener('popstate', handleRouteChange)
    return () => window.removeEventListener('popstate', handleRouteChange)
  }, [])

  function handleAuthSuccess(user: AuthUser) {
    setCurrentUser(user)
    persistUser(user)
  }

  async function handleSignOut() {
    try {
      await fetch('/api/auth/signout', { method: 'POST' })
    } catch {
      // local signout should still happen even if backend signout fails
    }

    setCurrentUser(null)
    persistUser(null)
    setIsMenuOpen(false)
    navigateTo('/')
  }

  function handleUserUpdate(user: AuthUser) {
    setCurrentUser(user)
    persistUser(user)
  }

  return (
    <>
      <SideMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        user={currentUser}
        onSignOut={handleSignOut}
      />

      {route === '/auth/login' ? (
        <AuthPage mode="login" onAuthSuccess={handleAuthSuccess} />
      ) : route === '/auth/signup' ? (
        <AuthPage mode="signup" onAuthSuccess={handleAuthSuccess} />
      ) : route === '/profile' ? (
        <ProfilePage
          user={currentUser}
          onUserUpdate={handleUserUpdate}
          onSignOut={handleSignOut}
          onOpenMenu={() => setIsMenuOpen(true)}
        />
      ) : (
        <LandingPage
          user={currentUser}
          onSignOut={handleSignOut}
          onOpenMenu={() => setIsMenuOpen(true)}
        />
      )}
    </>
  )
}

export default App
