import type { ReactNode } from 'react'

export function SectionTitle({
  title,
  right,
}: {
  title: string
  right?: ReactNode
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="text-3xl font-semibold tracking-tight text-slate-900">{title}</h2>
      {right}
    </div>
  )
}
