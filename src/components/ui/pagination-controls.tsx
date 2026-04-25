import { ChevronLeft, ChevronRight } from 'lucide-react'

import { Button } from './button'

function getVisiblePages(currentPage: number, totalPages: number) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index)
  }

  const start = Math.max(0, Math.min(currentPage - 1, totalPages - 5))
  return Array.from({ length: 5 }, (_, index) => start + index)
}

export function PaginationControls({
  page,
  totalPages,
  totalElements,
  itemLabel,
  onPageChange,
  isLoading = false,
}: {
  page: number
  totalPages: number
  totalElements: number
  itemLabel: string
  onPageChange: (page: number) => void
  isLoading?: boolean
}) {
  if (totalPages <= 1) {
    return null
  }

  const visiblePages = getVisiblePages(page, totalPages)

  return (
    <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-slate-500">
        {totalElements} {itemLabel}
        {totalElements === 1 ? '' : 's'} total
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isLoading || page === 0}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft size={14} />
          Previous
        </Button>

        {visiblePages.map((visiblePage) => (
          <Button
            key={visiblePage}
            type="button"
            variant={visiblePage === page ? 'primary' : 'outline'}
            size="sm"
            disabled={isLoading}
            onClick={() => onPageChange(visiblePage)}
          >
            {visiblePage + 1}
          </Button>
        ))}

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isLoading || page >= totalPages - 1}
          onClick={() => onPageChange(page + 1)}
        >
          Next
          <ChevronRight size={14} />
        </Button>
      </div>
    </div>
  )
}
