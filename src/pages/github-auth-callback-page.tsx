import { useEffect, useState } from 'react'
import { LoaderCircle } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { Card, CardBody, CardDescription, CardTitle } from '../components/ui/card'
import type { AuthUser } from '../types/app'

export function GithubAuthCallbackPage({
  onAuthSuccess,
}: {
  onAuthSuccess: (user: AuthUser) => void
}) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [message, setMessage] = useState('Finishing GitHub sign in...')

  useEffect(() => {
    const error = searchParams.get('error')
    if (error) {
      navigate(`/auth/login?error=${encodeURIComponent(error)}`, { replace: true })
      return
    }

    const token = searchParams.get('token')
    const id = searchParams.get('id')
    const username = searchParams.get('username')
    const email = searchParams.get('email')
    const firstGithubLogin = searchParams.get('firstGithubLogin') === 'true'
    const githubUsername = searchParams.get('githubUsername')

    if (!token || !id || !username || !email) {
      navigate('/auth/login?error=GitHub sign in did not complete correctly.', { replace: true })
      return
    }

    onAuthSuccess({
      token,
      user: {
        id: Number(id),
        username,
        email,
        githubId: searchParams.get('githubId') ? Number(searchParams.get('githubId')) : null,
        githubUsername,
        profileImageUrl: searchParams.get('profileImageUrl'),
      },
    })

    setMessage(firstGithubLogin ? 'GitHub connected. Redirecting to your repositories...' : 'GitHub connected. Redirecting...')
    navigate(firstGithubLogin && githubUsername ? '/projects?importGithub=1' : '/projects', { replace: true })
  }, [navigate, onAuthSuccess, searchParams])

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-6 sm:px-6 lg:px-8">
      <Card className="w-full max-w-lg">
        <CardBody className="flex flex-col items-center gap-4 p-8 text-center">
          <LoaderCircle size={28} className="animate-spin text-indigo-600" />
          <CardTitle>Connecting GitHub</CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardBody>
      </Card>
    </main>
  )
}
