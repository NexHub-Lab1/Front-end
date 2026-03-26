import type { ReactNode } from 'react'

export function StatLine({
  icon,
  text,
}: {
  icon: ReactNode
  text: string
}) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-slate-500">
      {icon}
      {text}
    </span>
  )
}
