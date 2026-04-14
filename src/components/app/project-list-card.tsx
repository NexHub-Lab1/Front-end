import { Clock3, FolderGit2, Star, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Card, CardBody, CardDescription, CardTitle } from '../ui/card'
import { StatLine } from './stat-line'

function normalizeRepoUrl(githubRepo?: string) {
  if (!githubRepo) {
    return null
  }

  if (githubRepo.startsWith('http://') || githubRepo.startsWith('https://')) {
    return githubRepo
  }

  return `https://${githubRepo}`
}

export function ProjectListCard({
  id,
  name,
  description,
  tags,
  status,
  ownerUsername,
  stars,
  followers,
  contributors,
  updatedLabel,
  githubRepo,
  actionLabel,
  onAction,
}: {
  id?: number
  name: string
  description: string
  tags: string[]
  status?: string
  ownerUsername?: string | null
  stars?: number
  followers?: number
  contributors?: number
  updatedLabel?: string
  githubRepo?: string
  actionLabel?: string
  onAction?: () => void
}) {
  const navigate = useNavigate()
  const repoUrl = normalizeRepoUrl(githubRepo)

  function handleAction() {
    if (onAction) {
      onAction()
      return
    }

    if (typeof id === 'number') {
      navigate(`/projects/${id}`)
    }
  }

  return (
    <Card className="shadow-none">
      <CardBody className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-3">
          <div className="space-y-1">
            <CardTitle className="text-2xl font-medium">{name}</CardTitle>
            <CardDescription className="max-w-3xl">{description}</CardDescription>
          </div>

          <div className="flex flex-wrap gap-2">
            {status ? <Badge variant="secondary">{status}</Badge> : null}
            {tags.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>

          <div className="flex flex-wrap gap-4">
            {ownerUsername ? <StatLine icon={<Users size={14} className="text-slate-400" />} text={`by ${ownerUsername}`} /> : null}
            {updatedLabel ? <StatLine icon={<Clock3 size={14} className="text-slate-400" />} text={updatedLabel} /> : null}
            {typeof contributors === 'number' ? (
              <StatLine icon={<Users size={14} className="text-slate-400" />} text={`${contributors} contributors`} />
            ) : null}
            {typeof followers === 'number' ? (
              <StatLine icon={<Users size={14} className="text-slate-400" />} text={`${followers} followers`} />
            ) : null}
            {typeof stars === 'number' ? (
              <StatLine icon={<Star size={14} className="text-amber-400" />} text={`${stars} stars`} />
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:items-end">
          {repoUrl ? (
            <Button variant="outline" asChild>
              <a href={repoUrl} target="_blank" rel="noreferrer">
                <FolderGit2 size={16} />
                Repository
              </a>
            </Button>
          ) : null}
          {actionLabel ? (
            <Button variant="primary" onClick={handleAction} disabled={!onAction && typeof id !== 'number'}>
              {actionLabel}
            </Button>
          ) : null}
        </div>
      </CardBody>
    </Card>
  )
}
