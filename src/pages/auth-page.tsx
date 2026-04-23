import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowRight, CheckCircle2, LoaderCircle, LogIn, Sparkles, UserPlus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import type { ApiResponse, AuthMode, AuthUser, User } from '../types/app'
import { BrandMark } from '../components/app/brand-mark'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardBody, CardHeader } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'

import { AUTH_LOG_IN_ENDPOINT, AUTH_SIGN_UP_ENDPOINT } from '../lib/auth-storage'

const initialLogin = {
  email: '',
  password: '',
}

const initialSignup = {
  username: '',
  email: '',
  password: '',
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

async function requestLogin(email: string, password: string): Promise<AuthUser> {
  const response = await fetch(AUTH_LOG_IN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  const result = (await response.json()) as ApiResponse<AuthUser>
  if (!response.ok || result.status === 'error' || !result.data) {
    throw new Error(result.message || 'Login failed')
  }

  return result.data
}

async function requestSignupAndLogin(signupForm: typeof initialSignup): Promise<AuthUser> {
  const signupResponse = await fetch(AUTH_SIGN_UP_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(signupForm),
  })

  const signupResult = (await signupResponse.json()) as ApiResponse<User>
  if (!signupResponse.ok || signupResult.status === 'error' || !signupResult.data) {
    throw new Error(signupResult.message || 'Signup failed')
  }

  return requestLogin(signupForm.email, signupForm.password)
}

export function AuthPage({
  mode,
  onAuthSuccess,
}: {
  mode: AuthMode
  onAuthSuccess: (user: AuthUser) => void
}) {
  const navigate = useNavigate()
  const [loginForm, setLoginForm] = useState(initialLogin)
  const [signupForm, setSignupForm] = useState(initialSignup)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [authErrors, setAuthErrors] = useState<{
    username?: string
    email?: string
    password?: string
  }>({})

  const activeHeading = useMemo(() => {
    return mode === 'login'
      ? {
          eyebrow: 'Welcome back',
          title: 'Sign in to keep building on NexHub',
          description: 'Use your email and password to access your builder account and project workflow.',
          endpoint: AUTH_LOG_IN_ENDPOINT,
        }
      : {
          eyebrow: 'Create account',
          title: 'Join NexHub and start shipping with teams',
          description: 'Create a simple account to explore projects, claim bounties, and grow your reputation.',
          endpoint: AUTH_SIGN_UP_ENDPOINT,
        }
  }, [mode])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!validateAuthForm()) {
      setFeedback(null)
      return
    }

    setIsSubmitting(true)
    setFeedback(null)

    try {
      const authUser = mode === 'login'
        ? await requestLogin(loginForm.email, loginForm.password)
        : await requestSignupAndLogin(signupForm)

      setCurrentUser(authUser.user)
      onAuthSuccess(authUser)
      setFeedback({
        type: 'success',
        message: mode === 'signup'
          ? 'Account created. You are signed in.'
          : 'Login exitoso',
      })

      if (mode === 'signup') {
        setSignupForm(initialSignup)
      } else {
        setLoginForm(initialLogin)
      }

      window.setTimeout(() => {
        navigate('/', { replace: true })
      }, 600)
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

  function validateAuthForm() {
    const activeForm = mode === 'login' ? loginForm : signupForm
    const nextErrors: {
      username?: string
      email?: string
      password?: string
    } = {}

    if (mode === 'signup' && !signupForm.username.trim()) {
      nextErrors.username = 'Username is required.'
    }

    if (!activeForm.email.trim()) {
      nextErrors.email = 'Email is required.'
    } else if (!isValidEmail(activeForm.email)) {
      nextErrors.email = 'Enter a valid email address.'
    }

    if (!activeForm.password.trim()) {
      nextErrors.password = 'Password is required.'
    } else if (activeForm.password.length < 8) {
      nextErrors.password = 'Password must be at least 8 characters.'
    }

    setAuthErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function validateAuthField(field: 'username' | 'email' | 'password', value: string) {
    if (field === 'username') {
      return mode === 'signup' && !value.trim() ? 'Username is required.' : undefined
    }

    if (field === 'email') {
      if (!value.trim()) {
        return 'Email is required.'
      }
      return isValidEmail(value) ? undefined : 'Enter a valid email address.'
    }

    if (!value.trim()) {
      return 'Password is required.'
    }
    return value.length >= 8 ? undefined : 'Password must be at least 8 characters.'
  }

  function updateAuthError(field: 'username' | 'email' | 'password', value: string) {
    setAuthErrors((current) => {
      if (!current[field]) {
        return current
      }

      return {
        ...current,
        [field]: validateAuthField(field, value),
      }
    })
  }

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="grid min-h-[calc(100vh-3rem)] gap-8 lg:grid-cols-[minmax(320px,1.15fr)_minmax(340px,440px)] lg:items-center">
        <section className="space-y-7">
          <button type="button" onClick={() => navigate('/')} className="text-left">
            <BrandMark />
          </button>

          <div className="max-w-3xl">
            <Badge variant="secondary" className="mb-4 px-3 py-1.5 text-sm">
              {activeHeading.eyebrow}
            </Badge>
            <h1 className="text-balance text-4xl font-semibold tracking-tight text-slate-900 md:text-6xl">
              {activeHeading.title}
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-slate-500">{activeHeading.description}</p>
          </div>

          <Card className="max-w-2xl">
            <CardHeader className="flex-row items-center gap-2 pb-0">
              <Sparkles size={18} className="text-indigo-600" />
              <p className="font-semibold text-slate-900">Why builders use NexHub</p>
            </CardHeader>
            <CardBody className="pt-4">
              <ul className="list-disc space-y-3 pl-5 text-slate-500">
                <li>Find projects, claim bounties, and keep your work in one place.</li>
                <li>Build a profile that shows your contributions and growth over time.</li>
                <li>Move between project discovery and execution without friction.</li>
              </ul>
            </CardBody>
          </Card>
        </section>

        <Card className="border-slate-200/90 bg-white/95 shadow-[0_22px_60px_rgba(33,70,144,0.12)]">
          <CardBody className="p-6 sm:p-7">
            <Tabs
              value={mode}
              onValueChange={(value) => {
                setAuthErrors({})
                setFeedback(null)
                navigate(value === 'signup' ? '/auth/signup' : '/auth/login')
              }}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">
                  <LogIn size={16} />
                  <span>Sign in</span>
                </TabsTrigger>
                <TabsTrigger value="signup">
                  <UserPlus size={16} />
                  <span>Sign up</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login" />
              <TabsContent value="signup" />
            </Tabs>

            <p className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
              {mode === 'login'
                ? 'Access your projects, bounties, and builder profile.'
                : 'Create your account with a username, email, and password.'}
            </p>

            <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
              {mode === 'signup' ? (
                <Input
                  label="Username"
                  placeholder="buildername"
                  helperText={authErrors.username}
                  error={Boolean(authErrors.username)}
                  value={signupForm.username}
                  onChange={(event) => {
                    setSignupForm((current) => ({ ...current, username: event.target.value }))
                    updateAuthError('username', event.target.value)
                  }}
                />
              ) : null}

              <Input
                type="email"
                label="Email"
                placeholder="you@nexhub.dev"
                helperText={authErrors.email}
                error={Boolean(authErrors.email)}
                value={mode === 'login' ? loginForm.email : signupForm.email}
                onChange={(event) => {
                  mode === 'login'
                    ? setLoginForm((current) => ({ ...current, email: event.target.value }))
                    : setSignupForm((current) => ({ ...current, email: event.target.value }))
                  updateAuthError('email', event.target.value)
                }}
              />

              <Input
                type="password"
                label="Password"
                placeholder="At least 8 characters"
                helperText={authErrors.password}
                error={Boolean(authErrors.password)}
                value={mode === 'login' ? loginForm.password : signupForm.password}
                onChange={(event) => {
                  mode === 'login'
                    ? setLoginForm((current) => ({ ...current, password: event.target.value }))
                    : setSignupForm((current) => ({ ...current, password: event.target.value }))
                  updateAuthError('password', event.target.value)
                }}
              />

              <Button type="submit" variant="primary" size="lg" className="w-full" disabled={isSubmitting}>
                {mode === 'login' ? 'Sign in to NexHub' : 'Create account'}
                {isSubmitting ? <LoaderCircle size={18} className="animate-spin" /> : <ArrowRight size={18} />}
              </Button>
            </form>

            {feedback ? (
              <Card
                className={`mt-5 shadow-none ${
                  feedback.type === 'success'
                    ? 'border-emerald-200 bg-emerald-50'
                    : 'border-red-200 bg-red-50'
                }`}
              >
                <CardBody className="flex flex-row items-center gap-3 p-4">
                  {feedback.type === 'success' ? (
                    <CheckCircle2 size={18} className="text-emerald-600" />
                  ) : (
                    <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                  )}
                  <p className={feedback.type === 'success' ? 'text-emerald-700' : 'text-red-700'}>
                    {feedback.message}
                  </p>
                </CardBody>
              </Card>
            ) : null}

            <div className="my-5 h-px bg-slate-200" />

            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-slate-900">
                  {currentUser ? 'Welcome to NexHub' : 'Your workspace starts here'}
                </p>
                <Badge variant="secondary">{currentUser ? 'Ready' : 'Private & secure'}</Badge>
              </div>

              {currentUser ? (
                <Card className="bg-slate-50/80 shadow-none">
                  <CardBody className="grid gap-4 p-4 text-left">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Username</p>
                      <p className="mt-1 text-base font-semibold text-slate-900">{currentUser.username}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Email</p>
                      <p className="mt-1 text-base font-semibold text-slate-900">{currentUser.email}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">User ID</p>
                      <p className="mt-1 text-base font-semibold text-slate-900">#{currentUser.id}</p>
                    </div>
                  </CardBody>
                </Card>
              ) : (
                <p className="text-sm leading-6 text-slate-500">
                  Sign in to continue with your builder profile, or create an account to start exploring projects and bounties.
                </p>
              )}
            </div>
          </CardBody>
        </Card>
      </div>
    </main>
  )
}
