import { useState } from 'react'
import { Figma, Link2, LoaderCircle } from 'lucide-react'

import { importFigmaProject } from '../../lib/project-storage'
import { Button } from '../ui/button'
import { Card, CardBody, CardDescription } from '../ui/card'
import Modal from '../ui/modal'

export function ImportFigmaModal({
  isOpen,
  onClose,
  onImported,
}: {
  isOpen: boolean
  onClose: () => void
  onImported?: () => void | Promise<void>
}) {
  const [figmaUrl, setFigmaUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleImport(e: React.FormEvent) {
    e.preventDefault()
    if (!figmaUrl.trim()) {
      setError('Please enter a valid Figma file or design URL.')
      return
    }

    if (!figmaUrl.includes('figma.com')) {
      setError('The URL must be a valid Figma link (containing figma.com).')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await importFigmaProject(figmaUrl.trim())
      if (response.status === 'error' || !response.data) {
        setError(response.message || 'Unable to import Figma project.')
        return
      }

      setFigmaUrl('')
      await onImported?.()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to import Figma project.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Import from Figma">
      <form onSubmit={handleImport} className="space-y-4">
        <Card className="border-slate-200 bg-slate-50/80 shadow-none">
          <CardBody className="flex flex-row items-center gap-3 p-4">
            <Figma size={18} className="text-slate-700 animate-pulse" />
            <CardDescription>
              Enter the link of your Figma file or design. We'll automatically fetch its name, thumbnail, and details to create your NexHub project.
            </CardDescription>
          </CardBody>
        </Card>

        {error ? (
          <Card className="border-red-100 bg-red-50/70 shadow-none">
            <CardBody className="p-4">
              <CardDescription className="text-red-700">{error}</CardDescription>
            </CardBody>
          </Card>
        ) : null}

        <div className="space-y-2">
          <label htmlFor="figmaUrl" className="text-sm font-medium text-slate-700 block">
            Figma File or Design URL
          </label>
          <div className="relative">
            <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              id="figmaUrl"
              type="text"
              placeholder="https://www.figma.com/design/..."
              value={figmaUrl}
              onChange={(e) => {
                setFigmaUrl(e.target.value)
                setError(null)
              }}
              disabled={isLoading}
              className="w-full pl-10 pr-4 py-2.5 text-sm border rounded-xl border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-100 placeholder-slate-400 bg-slate-50/50 focus:bg-white transition-all disabled:opacity-50"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <LoaderCircle size={16} className="animate-spin mr-2" />
                Importing...
              </>
            ) : (
              'Import'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
