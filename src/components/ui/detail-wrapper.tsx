import * as React from 'react'

import { cn } from '../../lib/utils'

export interface DetailWrapperProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Show shadow and border styling for a detail card layout
   */
  variant?: 'default' | 'ghost'
}

/**
 * DetailWrapper component for unified detail page layouts
 * Used in ProjectDetails, ProfileTab, and other detail views
 * Provides consistent card styling across the application
 */
const DetailWrapper = React.forwardRef<HTMLDivElement, DetailWrapperProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const baseStyles =
      'rounded-3xl bg-white/90'

    const variantStyles = {
      default:
        'border border-slate-200/80 shadow-[0_18px_38px_rgba(30,64,140,0.06)]',
      ghost: 'border border-transparent',
    }

    return (
      <div
        ref={ref}
        className={cn(baseStyles, variantStyles[variant], className)}
        {...props}
      />
    )
  }
)
DetailWrapper.displayName = 'DetailWrapper'

/**
 * DetailWrapperHeader for consistent header styling within detail wrappers
 */
const DetailWrapperHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
))
DetailWrapperHeader.displayName = 'DetailWrapperHeader'

/**
 * DetailWrapperBody for consistent body/content styling
 */
const DetailWrapperBody = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
))
DetailWrapperBody.displayName = 'DetailWrapperBody'

export { DetailWrapper, DetailWrapperHeader, DetailWrapperBody }
