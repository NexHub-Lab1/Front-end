import { useState } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'

import './App.css'
import { SideMenu } from './components/app/side-menu'
import { persistUser, readStoredUser } from './lib/auth-storage'
import { AuthPage } from './pages/auth-page'
import { LandingPage } from './pages/landing-page'
import { ProfilePage } from './pages/profile/profile-page'
import { ProjectsPage } from './pages/projects-page'
import type { AuthUser } from './types/app'

function App() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => readStoredUser())
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const navigate = useNavigate()

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
    navigate('/')
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

      <Routes>
        <Route
          path="/auth/login"
          element={<AuthPage mode="login" onAuthSuccess={handleAuthSuccess} />}
        />
        <Route
          path="/auth/signup"
          element={<AuthPage mode="signup" onAuthSuccess={handleAuthSuccess} />}
        />
        <Route
          path="/profile"
          element={
            currentUser ? (
              <ProfilePage
                user={currentUser}
                onUserUpdate={handleUserUpdate}
                onSignOut={handleSignOut}
                onOpenMenu={() => setIsMenuOpen(true)}
              />
            ) : (
              <Navigate to="/auth/login" replace />
            )
          }
        />
        <Route
          path="/projects"
          element={
            <ProjectsPage
              user={currentUser}
              onSignOut={handleSignOut}
              onOpenMenu={() => setIsMenuOpen(true)}
            />
          }
        />
        <Route
          path="/"
          element={
            <LandingPage
              user={currentUser}
              onSignOut={handleSignOut}
              onOpenMenu={() => setIsMenuOpen(true)}
            />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default App
