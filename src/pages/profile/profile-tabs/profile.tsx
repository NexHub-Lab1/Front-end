import { ArrowRight, CheckCircle2, LoaderCircle, Pencil, Plus, Shield, X } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'

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
  readStoredUserToken,
} from '../../../lib/auth-storage'

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

function normalizeSkill(value: string) {
  return value.trim().replace(/\s+/g, ' ')
}

async function parseApiResponse<T>(response: Response, fallbackMessage: string): Promise<ApiResponse<T>> {
  const text = await response.text()
  if (!text) {
    return {
      status: 'error',
      message: response.status === 401 || response.status === 403
        ? 'Your session expired. Please sign in again.'
        : fallbackMessage,
      data: null,
      timestamp: new Date().toISOString(),
    }
  }

  try {
    return JSON.parse(text) as ApiResponse<T>
  } catch {
    return {
      status: 'error',
      message: fallbackMessage,
      data: null,
      timestamp: new Date().toISOString(),
    }
  }
}

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
    skills: user?.skills ?? [],
  })
  const [skillInput, setSkillInput] = useState('')
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [editErrors, setEditErrors] = useState<{
    currentEmail?: string
    currentPassword?: string
    newUsername?: string
    newEmail?: string
    newPassword?: string
    skills?: string
  }>({})
  const [deleteErrors, setDeleteErrors] = useState<{
    currentPassword?: string
  }>({})
  const isGithubUser = Boolean(user?.githubId || user?.githubUsername)

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
      skills: storedUser.skills ?? [],
    })
    setSkillInput('')
    setEditErrors({})
    setDeleteErrors({})
  }, [navigate])

  if (!user) {
    return null
  }

  async function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!validateEditProfileForm()) {
      setFeedback(null)
      return
    }

    setIsSaving(true)
    setFeedback(null)

    try {
      const token = readStoredUserToken()
      const response = await fetch(AUTH_UPDATE_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,
          currentPassword: isGithubUser ? '' : form.currentPassword,
          newPassword: isGithubUser ? '' : form.newPassword,
        }),
      })

      const result = await parseApiResponse<AuthUser>(response, 'Unable to update account')
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
        skills: data.user.skills ?? [],
      })
      setSkillInput('')
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
    const nextErrors = {
      currentPassword: form.currentPassword.trim() ? undefined : 'Current password is required.',
    }

    setDeleteErrors(nextErrors)
    if (nextErrors.currentPassword) {
      setFeedback(null)
      return
    }

    setIsDeleting(true)
    setFeedback(null)

    try {
      const token = readStoredUserToken()
      const response = await fetch(AUTH_DELETE_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: form.currentEmail,
          password: form.currentPassword,
        }),
      })

      const result = await parseApiResponse<null>(response, 'Unable to delete account')
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

  function validateEditProfileForm() {
    const nextErrors: {
      currentEmail?: string
      currentPassword?: string
      newUsername?: string
      newEmail?: string
      newPassword?: string
      skills?: string
    } = {}

    if (!form.currentEmail.trim()) {
      nextErrors.currentEmail = 'Current email is required.'
    } else if (!isValidEmail(form.currentEmail)) {
      nextErrors.currentEmail = 'Enter a valid current email.'
    }

    if (!isGithubUser && !form.currentPassword.trim()) {
      nextErrors.currentPassword = 'Current password is required.'
    }

    if (!form.newUsername.trim()) {
      nextErrors.newUsername = 'Username is required.'
    }

    if (!form.newEmail.trim()) {
      nextErrors.newEmail = 'New email is required.'
    } else if (!isValidEmail(form.newEmail)) {
      nextErrors.newEmail = 'Enter a valid new email.'
    }

    if (isGithubUser && form.newPassword.trim()) {
      nextErrors.newPassword = 'Password changes are disabled for GitHub accounts.'
    } else if (form.newPassword && form.newPassword.length < 8) {
      nextErrors.newPassword = 'New password must be at least 8 characters.'
    }

    setEditErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function validateEditProfileField(field: keyof typeof editErrors, value: string) {
    if (field === 'currentEmail') {
      if (!value.trim()) {
        return 'Current email is required.'
      }
      return isValidEmail(value) ? undefined : 'Enter a valid current email.'
    }

    if (field === 'currentPassword') {
      if (isGithubUser) {
        return undefined
      }
      return value.trim() ? undefined : 'Current password is required.'
    }

    if (field === 'newUsername') {
      return value.trim() ? undefined : 'Username is required.'
    }

    if (field === 'newEmail') {
      if (!value.trim()) {
        return 'New email is required.'
      }
      return isValidEmail(value) ? undefined : 'Enter a valid new email.'
    }

    if (isGithubUser) {
      return value.trim() ? 'Password changes are disabled for GitHub accounts.' : undefined
    }

    return !value || value.length >= 8 ? undefined : 'New password must be at least 8 characters.'
  }

  function updateEditError(field: keyof typeof editErrors, value: string) {
    setEditErrors((current) => {
      if (!current[field]) {
        return current
      }

      return {
        ...current,
        [field]: validateEditProfileField(field, value),
      }
    })
  }

  function handleAddSkill() {
    const nextSkill = normalizeSkill(skillInput)

    if (!nextSkill) {
      setEditErrors((current) => ({
        ...current,
        skills: 'Type a skill before adding it.',
      }))
      return
    }

    const alreadyAdded = form.skills.some(
      (skill) => skill.toLowerCase() === nextSkill.toLowerCase()
    )
    if (alreadyAdded) {
      setEditErrors((current) => ({
        ...current,
        skills: 'That skill is already in your profile.',
      }))
      return
    }

    setForm((current) => ({
      ...current,
      skills: [...current.skills, nextSkill],
    }))
    setSkillInput('')
    setEditErrors((current) => ({
      ...current,
      skills: undefined,
    }))
  }

  function handleRemoveSkill(skillToRemove: string) {
    setForm((current) => ({
      ...current,
      skills: current.skills.filter((skill) => skill !== skillToRemove),
    }))
    setEditErrors((current) => ({
      ...current,
      skills: undefined,
    }))
  }

  return (
    <Card className="overflow-hidden">
      <CardBody className="space-y-8 p-6 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.14),transparent_35%),linear-gradient(180deg,rgba(255,255,255,1),rgba(248,250,252,1))]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <Badge variant="secondary" className="px-3 py-1 text-xs font-semibold uppercase tracking-wider">
              Account Overview
            </Badge>
            <CardTitle className="text-3xl font-bold text-slate-900">Profile Settings</CardTitle>
            <CardDescription className="text-base text-slate-500">
              Manage your personal information and platform presence.
            </CardDescription>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button variant="primary" onClick={() => setIsEditOpen(true)} className="shadow-md shadow-blue-200/50">
              <Pencil size={16} className="mr-2" />
              Edit profile
            </Button>
            <Button type="button" variant="outline" onClick={onSignOut} className="bg-white/50 backdrop-blur-sm">
              Sign out
            </Button>
          </div>
        </div>

        <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
          <Card className="bg-white/40 backdrop-blur-sm shadow-none border-slate-100 hover:border-blue-200 transition-colors">
            <CardBody className="p-4 flex flex-col gap-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Username</span>
              <span className="text-lg font-bold text-slate-900 truncate">{user.username}</span>
            </CardBody>
          </Card>
          <Card className="bg-white/40 backdrop-blur-sm shadow-none border-slate-100 hover:border-blue-200 transition-colors">
            <CardBody className="p-4 flex flex-col gap-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Email Address</span>
              <span className="text-lg font-bold text-slate-900 truncate">{user.email}</span>
            </CardBody>
          </Card>
          <Card className="bg-white/40 backdrop-blur-sm shadow-none border-slate-100 hover:border-blue-200 transition-colors col-span-2 md:col-span-1">
            <CardBody className="p-4 flex flex-col gap-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Auth Provider</span>
              <span className="text-lg font-bold text-slate-900">{isGithubUser ? 'GitHub' : 'Credentials'}</span>
            </CardBody>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="shadow-none bg-white/60 border-slate-100">
            <CardBody className="space-y-4 p-6">
              <div className="flex items-center gap-2">
                <Shield size={20} className="text-blue-500" />
                <CardTitle className="text-xl">Security & Privacy</CardTitle>
              </div>
              <CardDescription className="text-sm leading-6 text-slate-600">
                {isGithubUser
                  ? 'Your account is linked with GitHub. Security is managed through your GitHub account settings.'
                  : 'To keep your account secure, ensure you use a strong password. You can change your password by clicking the Edit Profile button above.'}
              </CardDescription>
            </CardBody>
          </Card>

          <Card className="shadow-none bg-white/60 border-slate-100">
            <CardBody className="space-y-4 p-6">
              <div className="flex items-center gap-2">
                <LoaderCircle size={20} className="text-blue-500" />
                <CardTitle className="text-xl">Platform Status</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-sm font-medium text-slate-700">Active Contributor</span>
              </div>
              <CardDescription className="text-xs text-slate-500">
                Account created: {new Date().toLocaleDateString()} {/* Placeholder for real date */}
              </CardDescription>
            </CardBody>
          </Card>
        </div>

        <Card className="shadow-none bg-white/60 border-slate-100">
          <CardBody className="space-y-4 p-6">
            <div className="space-y-2">
              <CardTitle className="text-xl">Expertise & Skills</CardTitle>
              <CardDescription className="text-sm">
                These tags showcase your technical strengths and help personalize your experience.
              </CardDescription>
            </div>
            {user.skills && user.skills.length > 0 ? (
              <div className="flex flex-wrap gap-2 pt-2">
                {user.skills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="bg-blue-100/50 text-blue-700 border-blue-100 hover:bg-blue-100">
                    {skill}
                  </Badge>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border-2 border-dashed border-slate-200 p-8 text-center">
                <CardDescription>No skills highlighted yet. Add some to stand out!</CardDescription>
              </div>
            )}
          </CardBody>
        </Card>

        {feedback ? (
          <Card
            className={`shadow-none ${feedback.type === 'success'
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
                This removes your current account when it has no activity. If you have projects, tasks, assignments, or
                submissions, the account will be deactivated so history stays intact.
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
              helperText={editErrors.currentEmail}
              error={Boolean(editErrors.currentEmail)}
              value={form.currentEmail}
              onChange={(event) => {
                setForm((current) => ({
                  ...current,
                  currentEmail: event.target.value,
                }))
                updateEditError('currentEmail', event.target.value)
              }}
            />

            {!isGithubUser ? (
              <Input
                type="password"
                label="Current password"
                helperText={editErrors.currentPassword || 'Required to save changes.'}
                error={Boolean(editErrors.currentPassword)}
                value={form.currentPassword}
                onChange={(event) => {
                  setForm((current) => ({
                    ...current,
                    currentPassword: event.target.value,
                  }))
                  updateEditError('currentPassword', event.target.value)
                  if (deleteErrors.currentPassword) {
                    setDeleteErrors({
                      currentPassword: event.target.value.trim() ? undefined : 'Current password is required.',
                    })
                  }
                }}
              />
            ) : null}

            <Input
              label="New username"
              helperText={editErrors.newUsername}
              error={Boolean(editErrors.newUsername)}
              value={form.newUsername}
              onChange={(event) => {
                setForm((current) => ({
                  ...current,
                  newUsername: event.target.value,
                }))
                updateEditError('newUsername', event.target.value)
              }}
            />

            <Input
              type="email"
              label="New email"
              helperText={editErrors.newEmail}
              error={Boolean(editErrors.newEmail)}
              value={form.newEmail}
              onChange={(event) => {
                setForm((current) => ({
                  ...current,
                  newEmail: event.target.value,
                }))
                updateEditError('newEmail', event.target.value)
              }}
            />

            {!isGithubUser ? (
              <Input
                type="password"
                label="New password"
                helperText={editErrors.newPassword || 'Leave empty to keep the current one.'}
                error={Boolean(editErrors.newPassword)}
                value={form.newPassword}
                onChange={(event) => {
                  setForm((current) => ({
                    ...current,
                    newPassword: event.target.value,
                  }))
                  updateEditError('newPassword', event.target.value)
                }}
              />
            ) : null}

            <div className="grid gap-2">
              <span className="text-sm font-medium text-slate-700">Skills</span>
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="flex-1">
                  <Input
                    value={skillInput}
                    placeholder="Add a skill, for example React"
                    helperText={editErrors.skills}
                    error={Boolean(editErrors.skills)}
                    onChange={(event) => {
                      setSkillInput(event.target.value)
                      if (editErrors.skills) {
                        setEditErrors((current) => ({
                          ...current,
                          skills: undefined,
                        }))
                      }
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        handleAddSkill()
                      }
                    }}
                  />
                </div>
                <Button type="button" variant="outline" onClick={handleAddSkill}>
                  <Plus size={16} />
                  Add skill
                </Button>
              </div>
              {form.skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {form.skills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="gap-2 pr-1">
                      <span>{skill}</span>
                      <button
                        type="button"
                        className="rounded-full p-0.5 text-blue-700 hover:bg-blue-100"
                        aria-label={`Remove ${skill}`}
                        onClick={() => handleRemoveSkill(skill)}
                      >
                        <X size={12} />
                      </button>
                    </Badge>
                  ))}
                </div>
              ) : (
                <CardDescription>Add skills to improve future task recommendations.</CardDescription>
              )}
            </div>

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
              Confirm your current password below. Accounts with platform activity are deactivated instead of hard
              deleted, so related project and task history does not break.
            </CardDescription>
            <Input
              type="password"
              label="Current password"
              helperText={deleteErrors.currentPassword}
              error={Boolean(deleteErrors.currentPassword)}
              value={form.currentPassword}
              onChange={(event) => {
                setForm((current) => ({
                  ...current,
                  currentPassword: event.target.value,
                }))
                setDeleteErrors({
                  currentPassword: event.target.value.trim() ? undefined : 'Current password is required.',
                })
                updateEditError('currentPassword', event.target.value)
              }}
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
