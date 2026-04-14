import * as React from 'react'

import { cn } from '../../lib/utils'
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverShadow?: boolean
  clickMouse?: boolean
}
const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, hoverShadow, clickMouse, ...props }, ref) => {
    let style = ''
    if (hoverShadow) style += 'hover:translate-x-0.5 hover:shadow-md hover:shadow-indigo-400 transition-all'
    if (clickMouse) style += ' cursor-pointer'
    return (
    <div
      ref={ref}
      className={cn(
          'rounded-3xl border border-slate-200/80 bg-white/90 shadow-[0_18px_38px_rgba(30,64,140,0.06)]'
          + style, 
          className
        )}
      {...props}
    />
  )}
)
Card.displayName = 'Card'

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
  )
)
CardHeader.displayName = 'CardHeader'

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn('text-xl font-semibold tracking-tight text-slate-900', className)} {...props} />
  )
)
CardTitle.displayName = 'CardTitle'

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-sm text-slate-500', className)} {...props} />
  )
)
CardDescription.displayName = 'CardDescription'

const CardBody = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
)
CardBody.displayName = 'CardBody'

export { Card, CardBody, CardDescription, CardHeader, CardTitle }
