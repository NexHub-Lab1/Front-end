import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowRight, CheckCircle2, LoaderCircle, LogIn, Sparkles, UserPlus } from 'lucide-react'
import './App.css'

type AuthMode = 'login' | 'signup'

type AuthUser = {
  id: number
  username: string
  email: string
}

type ApiResponse<T> = {
  status: 'success' | 'error'
  message: string
  data: T | null
  timestamp: string
}

const initialLogin = {
  email: '',
  password: '',
}

const initialSignup = {
  username: '',
  email: '',
  password: '',
}

function App() {
  const [mode, setMode] = useState<AuthMode>('login')
  const [loginForm, setLoginForm] = useState(initialLogin)
  const [signupForm, setSignupForm] = useState(initialSignup)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)

  const activeHeading = useMemo(() => {
    return mode === 'login'
      ? {
          eyebrow: 'Welcome back',
          title: 'Sign in to keep building on NexHub',
          description: 'Use your email and password to access your builder account and project workflow.',
          endpoint: '/api/auth/login',
        }
      : {
          eyebrow: 'Create account',
          title: 'Join NexHub and start shipping with teams',
          description: 'Create a simple account to explore projects, claim bounties, and grow your reputation.',
          endpoint: '/api/auth/signup',
        }
  }, [mode])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setFeedback(null)

    const payload = mode === 'login' ? loginForm : signupForm

    try {
      const response = await fetch(activeHeading.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const result = (await response.json()) as ApiResponse<AuthUser>

      if (!response.ok || result.status === 'error') {
        throw new Error(result.message || 'Request failed')
      }

      setCurrentUser(result.data)
      setFeedback({
        type: 'success',
        message: result.message,
      })

      if (mode === 'signup') {
        setSignupForm(initialSignup)
      } else {
        setLoginForm(initialLogin)
      }
    } catch (error) {
      setCurrentUser(null)
      setFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'Unexpected error',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-hero">
        <div className="brand-lockup">
          <div className="brand-mark">N</div>
          <div>
            <p className="brand-name">NexHub</p>
            <p className="brand-tag">Project owners and builders, connected through clear work.</p>
          </div>
        </div>

        <div className="hero-copy">
          <span className="eyebrow">{activeHeading.eyebrow}</span>
          <h1>{activeHeading.title}</h1>
          <p>{activeHeading.description}</p>
        </div>

        <div className="hero-panel">
          <div className="hero-panel-header">
            <Sparkles size={18} />
            <span>Why builders use NexHub</span>
          </div>
          <ul className="hero-points">
            <li>Find projects, claim bounties, and keep your work in one place.</li>
            <li>Build a profile that shows your contributions and growth over time.</li>
            <li>Move between project discovery and execution without friction.</li>
          </ul>
        </div>
      </section>

      <section className="auth-card">
        <div className="auth-card-header">
          <div className="mode-switcher" role="tablist" aria-label="Authentication mode">
            <button
              type="button"
              className={mode === 'login' ? 'mode-switcher-button active' : 'mode-switcher-button'}
              onClick={() => setMode('login')}
            >
              <LogIn size={16} />
              Sign in
            </button>
            <button
              type="button"
              className={mode === 'signup' ? 'mode-switcher-button active' : 'mode-switcher-button'}
              onClick={() => setMode('signup')}
            >
              <UserPlus size={16} />
              Sign up
            </button>
          </div>
          <p className="endpoint-badge">
            {mode === 'login'
              ? 'Access your projects, bounties, and builder profile.'
              : 'Create your account with a username, email, and password.'}
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === 'signup' ? (
            <label className="field">
              <span>Username</span>
              <input
                type="text"
                placeholder="buildername"
                value={signupForm.username}
                onChange={(event) =>
                  setSignupForm((current) => ({ ...current, username: event.target.value }))
                }
                required
              />
            </label>
          ) : null}

          <label className="field">
            <span>Email</span>
            <input
              type="email"
              placeholder="you@nexhub.dev"
              value={mode === 'login' ? loginForm.email : signupForm.email}
              onChange={(event) =>
                mode === 'login'
                  ? setLoginForm((current) => ({ ...current, email: event.target.value }))
                  : setSignupForm((current) => ({ ...current, email: event.target.value }))
              }
              required
            />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              type="password"
              placeholder="At least 8 characters"
              value={mode === 'login' ? loginForm.password : signupForm.password}
              onChange={(event) =>
                mode === 'login'
                  ? setLoginForm((current) => ({ ...current, password: event.target.value }))
                  : setSignupForm((current) => ({ ...current, password: event.target.value }))
              }
              required
            />
          </label>

          <button className="submit-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? <LoaderCircle className="spin" size={18} /> : <ArrowRight size={18} />}
            {mode === 'login' ? 'Sign in to NexHub' : 'Create account'}
          </button>
        </form>

        {feedback ? (
          <div className={feedback.type === 'success' ? 'feedback success' : 'feedback error'}>
            {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <span className="feedback-dot" />}
            <p>{feedback.message}</p>
          </div>
        ) : null}

        <div className="result-panel">
          <div className="result-panel-header">
            <span>{currentUser ? 'Welcome to NexHub' : 'Your workspace starts here'}</span>
            <span className="result-status">{currentUser ? 'Ready' : 'Private & secure'}</span>
          </div>

          {currentUser ? (
            <div className="user-summary">
              <div>
                <p className="user-summary-label">Username</p>
                <p className="user-summary-value">{currentUser.username}</p>
              </div>
              <div>
                <p className="user-summary-label">Email</p>
                <p className="user-summary-value">{currentUser.email}</p>
              </div>
              <div>
                <p className="user-summary-label">User ID</p>
                <p className="user-summary-value">#{currentUser.id}</p>
              </div>
            </div>
          ) : (
            <p className="result-placeholder">
              Sign in to continue with your builder profile, or create an account to start exploring projects and bounties.
            </p>
          )}
        </div>
      </section>
    </main>
  )
}

export default App
