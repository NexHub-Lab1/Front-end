import { Code2, Figma } from 'lucide-react'

import type { TaskType } from '../../types/app'
import { Badge } from '../ui/badge'

export function TaskTypeBadge({ taskType }: { taskType?: TaskType | null }) {
  const isDesign = taskType === 'DESIGN'

  return (
    <Badge
      variant="outline"
      className={isDesign
        ? 'border-pink-200 bg-pink-50 text-pink-700'
        : 'border-slate-200 bg-slate-50 text-slate-700'}
    >
      {isDesign ? <Figma size={12} className="mr-1" /> : <Code2 size={12} className="mr-1" />}
      {isDesign ? 'Design' : 'Development'}
    </Badge>
  )
}
