import { useEffect } from 'react'
import { LoaderCircle } from 'lucide-react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'

import { Card, CardBody, CardDescription, CardTitle } from '../components/ui/card'
import type { AuthUser } from '../types/app'

export function FigmaAuthCallbackPage({
  onAuthSuccess,
}: {
  onAuthSuccess: (user: AuthUser) => void
}) {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const error = searchParams.get('error')
    if (error) {
      navigate(`/auth/login?error=${encodeURIComponent(error)}`, { replace: true })
      return
    }

    const callbackParams = new URLSearchParams(location.hash.replace(/^#/, ''))
    const token = callbackParams.get('token')
    const id = callbackParams.get('id')
    const username = callbackParams.get('username')
    const email = callbackParams.get('email')
    const figmaUsername = callbackParams.get('figmaUsername')
    const figmaId = callbackParams.get('figmaId')

    if (!token || !id || !username || !email) {
      navigate('/auth/login?error=Figma sign in did not complete correctly.', { replace: true })
      return
    }

    onAuthSuccess({
      token,
      user: {
        id: Number(id),
        username,
        email,
        figmaId: figmaId || null,
        figmaUsername: figmaUsername || null,
        profileImageUrl: callbackParams.get('profileImageUrl'),
        skills: [],
      },
    })

    navigate('/projects', { replace: true })
  }, [location.hash, navigate, onAuthSuccess, searchParams])

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-6 sm:px-6 lg:px-8">
      <Card className="w-full max-w-lg">
        <CardBody className="flex flex-col items-center gap-4 p-8 text-center">
          <LoaderCircle size={28} className="animate-spin text-indigo-600" />
          <CardTitle>Connecting Figma</CardTitle>
          <CardDescription>Finishing Figma sign in...</CardDescription>
        </CardBody>
      </Card>
    </main>
  )
}
