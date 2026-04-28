import { useEffect, useState } from 'react'
import { ExternalLink, Github, LoaderCircle, Lock } from 'lucide-react'

import { fetchGithubRepositories } from '../../lib/github-storage'
import { createProject } from '../../lib/project-storage'
import type { GithubRepository } from '../../types/app'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Card, CardBody, CardDescription, CardTitle } from '../ui/card'
import Modal from '../ui/modal'

export function ImportGithubReposModal({
  isOpen,
  onClose,
  onImported,
}: {
  isOpen: boolean
  onClose: () => void
  onImported?: () => void | Promise<void>
}) {
  const [repositories, setRepositories] = useState<GithubRepository[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [importingRepoId, setImportingRepoId] = useState<number | null>(null)

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const loadRepositories = async () => {
      setIsLoading(true)
      setLoadError(null)

      try {
        const response = await fetchGithubRepositories()
        if (response.status === 'success' && response.data) {
          setRepositories(response.data)
        } else {
          setRepositories([])
          setLoadError(response.message || 'Unable to load GitHub repositories.')
        }
      } catch (error) {
        setRepositories([])
        setLoadError(error instanceof Error ? error.message : 'Unable to load GitHub repositories.')
      } finally {
        setIsLoading(false)
      }
    }

    loadRepositories().catch((error) => {
      console.error(error)
      setRepositories([])
      setLoadError('Unable to load GitHub repositories.')
      setIsLoading(false)
    })
  }, [isOpen])

  async function handleImport(repository: GithubRepository) {
    try {
      setImportingRepoId(repository.id)
      const response = await createProject({
        ownerId: 0,
        name: repository.name,
        description: repository.description?.trim() || `${repository.fullName} imported from GitHub.`,
        githubRepo: repository.htmlUrl,
        status: 'OPEN',
        tags: [],
      })

      if (response.status === 'error' || !response.data) {
        setLoadError(response.message || 'Unable to import GitHub repository.')
        return
      }

      await onImported?.()
      onClose()
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Unable to import GitHub repository.')
    } finally {
      setImportingRepoId(null)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Import from GitHub">
      <div className="space-y-4">
        <Card className="border-slate-200 bg-slate-50/80 shadow-none">
          <CardBody className="flex flex-row items-center gap-3 p-4">
            <Github size={18} className="text-slate-700" />
            <CardDescription>
              Import one of your GitHub repositories as a NexHub project. You can edit the details later.
            </CardDescription>
          </CardBody>
        </Card>

        {loadError ? (
          <Card className="border-red-100 bg-red-50/70 shadow-none">
            <CardBody className="p-4">
              <CardDescription className="text-red-700">{loadError}</CardDescription>
            </CardBody>
          </Card>
        ) : null}

        {isLoading ? (
          <div className="flex items-center justify-center py-8 text-slate-500">
            <LoaderCircle size={18} className="mr-2 animate-spin" />
            Loading repositories...
          </div>
        ) : repositories.length === 0 ? (
          <Card className="shadow-none">
            <CardBody className="p-6 text-center">
              <CardDescription>No GitHub repositories available to import.</CardDescription>
            </CardBody>
          </Card>
        ) : (
          <div className="grid gap-3">
            {repositories.map((repository) => (
              <Card key={repository.id} className="shadow-none">
                <CardBody className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle className="text-lg">{repository.fullName}</CardTitle>
                      {repository.isPrivate ? (
                        <Badge variant="secondary">
                          <Lock size={12} />
                          Private
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Public</Badge>
                      )}
                    </div>
                    <CardDescription>
                      {repository.description?.trim() || 'No description provided on GitHub.'}
                    </CardDescription>
                    <a
                      className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700"
                      href={repository.htmlUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View repository
                      <ExternalLink size={14} />
                    </a>
                  </div>

                  <Button
                    variant="primary"
                    onClick={() => handleImport(repository)}
                    disabled={importingRepoId === repository.id}
                    className="sm:self-center"
                  >
                    {importingRepoId === repository.id ? (
                      <>
                        <LoaderCircle size={16} className="animate-spin" />
                        Importing...
                      </>
                    ) : (
                      'Import'
                    )}
                  </Button>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Modal>
  )
}
