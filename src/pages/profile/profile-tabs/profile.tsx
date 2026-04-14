import { ArrowRight, CheckCircle2, LoaderCircle, Mail, Pencil, Shield, UserRound } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'

import { DeveloperAvatar } from '../../../components/app/developer-avatar'
import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import { Card, CardBody, CardDescription, CardTitle } from '../../../components/ui/card'
import { Input } from '../../../components/ui/input'
import Modal from '../../../components/ui/modal'
import type { ApiResponse, AuthUser, User } from '../../../types/app'
import {
  AUTH_DELETE_ENDPOINT,
  AUTH_UPDATE_ENDPOINT,
  readStoredUser,
} from '../../../lib/auth-storage'

export function ProfileTab({
  onUserUpdate,
  onSignOut,
}: {
  onUserUpdate: (user: AuthUser) => void
  onSignOut: () => void
}) {
  const navigate = useNavigate()

  const [user, setUser] = useState<User | null>(readStoredUser())
  const [form, setForm] = useState({
    currentEmail: user?.email ?? '',
    currentPassword: '',
    newUsername: user?.username ?? '',
    newEmail: user?.email ?? '',
    newPassword: '',
  })
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  useEffect(() => {
    const storedUser = readStoredUser()
    if (!storedUser) {
      navigate('/auth/login')
      return
    }

    setUser(storedUser)
    setForm({
      currentEmail: storedUser.email,
      currentPassword: '',
      newUsername: storedUser.username,
      newEmail: storedUser.email,
      newPassword: '',
    })
  }, [navigate])

  const profileRows = useMemo(
    () => [
      {
        label: 'Username',
        value: user?.username ?? 'Unknown user',
        icon: <UserRound size={16} className="text-slate-400" />,
      },
      {
        label: 'Email',
        value: user?.email ?? 'No email registered',
        icon: <Mail size={16} className="text-slate-400" />,
      },
      {
        label: 'Security',
        value: 'Current password is required to save account changes.',
        icon: <Shield size={16} className="text-slate-400" />,
      },
    ],
    [user]
  )

  if (!user) {
    return null
  }

  async function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSaving(true)
    setFeedback(null)

    try {
      const response = await fetch(AUTH_UPDATE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const result = (await response.json()) as ApiResponse<AuthUser>
      const data = result.data

      if (!response.ok || result.status === 'error' || !data) {
        throw new Error(result.message || 'Unable to update account')
      }

      onUserUpdate(data)
      setUser(data.user)
      setForm({
        currentEmail: data.user.email,
        currentPassword: '',
        newUsername: data.user.username,
        newEmail: data.user.email,
        newPassword: '',
      })
      setFeedback({ type: 'success', message: result.message })
      setIsEditOpen(false)
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'Unexpected error',
      })
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDeleteAccount() {
    if (!form.currentPassword) {
      setFeedback({
        type: 'error',
        message: 'Enter your current password before deleting the account.',
      })
      setIsDeleteOpen(false)
      return
    }

    setIsDeleting(true)
    setFeedback(null)

    try {
      const response = await fetch(AUTH_DELETE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.currentEmail,
          password: form.currentPassword,
        }),
      })

      const result = (await response.json()) as ApiResponse<null>
      if (!response.ok || result.status === 'error') {
        throw new Error(result.message || 'Unable to delete account')
      }

      setIsDeleteOpen(false)
      onSignOut()
      navigate('/')
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'Unexpected error',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Card>
      <CardBody className="space-y-6 p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-center gap-4">
            <DeveloperAvatar name={user.username} />
            <div className="space-y-1">
              <Badge variant="secondary" className="px-3 py-1.5 text-sm">
                My profile
              </Badge>
              <CardTitle className="text-3xl">{user.username}</CardTitle>
              <CardDescription className="text-base">{user.email}</CardDescription>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button variant="primary" onClick={() => setIsEditOpen(true)}>
              <Pencil size={16} />
              Edit profile
            </Button>
            <Button type="button" variant="outline" onClick={onSignOut}>
              Sign out
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)]">
          <Card className="shadow-none">
            <CardBody className="space-y-4 p-6">
              <CardTitle className="text-xl">Profile overview</CardTitle>
              <CardDescription className="text-base leading-7 text-slate-600">
                Your account information is shown here. Use edit profile when you want to update your username,
                email, or password.
              </CardDescription>
            </CardBody>
          </Card>

          <Card className="shadow-none">
            <CardBody className="space-y-4 p-6">
              <CardTitle className="text-xl">Current information</CardTitle>
              <div className="grid gap-3 text-sm text-slate-600">
                {profileRows.map((row) => (
                  <div key={row.label} className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2 font-medium text-slate-700">
                      {row.icon}
                      <span>{row.label}</span>
                    </div>
                    <span className="max-w-[220px] text-right">{row.value}</span>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>

        {feedback ? (
          <Card
            className={`shadow-none ${
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

        <Card className="border-red-200 bg-red-50 shadow-none">
          <CardBody className="space-y-4 p-6">
            <div className="space-y-2">
              <CardTitle className="text-xl text-red-700">Delete account</CardTitle>
              <CardDescription className="text-red-700/80">
                This removes your current account from the platform. You will be asked to confirm using your current
                password.
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-100"
              onClick={() => setIsDeleteOpen(true)}
              disabled={isDeleting}
            >
              {isDeleting ? <LoaderCircle size={18} className="animate-spin" /> : null}
              Delete account
            </Button>
          </CardBody>
        </Card>

        <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit profile">
          <form className="grid gap-4" onSubmit={handleUpdate}>
            <Input
              type="email"
              label="Current email"
              value={form.currentEmail}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  currentEmail: event.target.value,
                }))
              }
            />

            <Input
              type="password"
              label="Current password"
              helperText="Required to save changes."
              value={form.currentPassword}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  currentPassword: event.target.value,
                }))
              }
            />

            <Input
              label="New username"
              value={form.newUsername}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  newUsername: event.target.value,
                }))
              }
            />

            <Input
              type="email"
              label="New email"
              value={form.newEmail}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  newEmail: event.target.value,
                }))
              }
            />

            <Input
              type="password"
              label="New password"
              helperText="Leave empty to keep the current one."
              value={form.newPassword}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  newPassword: event.target.value,
                }))
              }
            />

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={isSaving}>
                Save changes
                {isSaving ? <LoaderCircle size={18} className="animate-spin" /> : <ArrowRight size={18} />}
              </Button>
            </div>
          </form>
        </Modal>

        <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Delete account">
          <div className="grid gap-4">
            <CardDescription className="text-base text-slate-600">
              To delete your account, confirm your current password below. This action cannot be undone.
            </CardDescription>
            <Input
              type="password"
              label="Current password"
              value={form.currentPassword}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  currentPassword: event.target.value,
                }))
              }
            />
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => setIsDeleteOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-100"
                onClick={handleDeleteAccount}
                disabled={isDeleting}
              >
                {isDeleting ? <LoaderCircle size={18} className="animate-spin" /> : null}
                Delete account
              </Button>
            </div>
          </div>
        </Modal>
      </CardBody>
    </Card>
  )
}
