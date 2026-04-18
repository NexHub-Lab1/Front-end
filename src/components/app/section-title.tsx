import type { ReactNode } from 'react'
import { Button } from '../ui/button'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function SectionTitle({
  title,
  goBack,
  right,
}: {
  title: string
  goBack?: Boolean
  right?: ReactNode
}) {
  const navigate = useNavigate()
  return (
    <div className="mb-4 flex items-center gap-3">
      {goBack ? <>
        <Button variant="ghost" onClick={() => navigate(-1) }>
          <ArrowLeft size={16}/>
        </Button>
      </> : null}
      <h2 className="text-3xl font-semibold tracking-tight text-slate-900">{title}</h2>
      {right}
    </div>
  )
}
