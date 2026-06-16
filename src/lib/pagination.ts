import type { ApiResponse, PaginatedResponse, PaginationParams } from '../types/app'

export const GRID_PAGE_SIZE = 9
export const PROFILE_PAGE_SIZE = 6
export const DETAIL_PAGE_SIZE = 6
export const LOOKUP_PAGE_SIZE = 100

export function buildPaginationQuery(params?: PaginationParams) {
  if (!params) {
    return ''
  }

  const searchParams = new URLSearchParams()

  if (params.page !== undefined) {
    searchParams.set('page', String(params.page))
  }

  if (params.size !== undefined) {
    searchParams.set('size', String(params.size))
  }

  params.sort?.forEach((sortValue) => {
    searchParams.append('sort', sortValue)
  })

  if (params.search !== undefined && params.search !== '') {
    searchParams.set('search', params.search)
  }

  if (params.status !== undefined && params.status !== '') {
    searchParams.set('status', params.status)
  }

  if (params.userId !== undefined) {
    searchParams.set('userId', String(params.userId))
  }

  const query = searchParams.toString()
  return query ? `?${query}` : ''
}

export function createEmptyPaginatedResponse<T>(page = 0, size = GRID_PAGE_SIZE): PaginatedResponse<T> {
  return {
    content: [],
    page,
    size,
    totalElements: 0,
    totalPages: 0,
    first: true,
    last: true,
    hasNext: false,
    hasPrevious: false,
  }
}

export function normalizePaginatedData<T>(
  data: PaginatedResponse<T> | T[] | null | undefined,
  page = 0,
  size = GRID_PAGE_SIZE,
): PaginatedResponse<T> {
  if (!data) {
    return createEmptyPaginatedResponse<T>(page, size)
  }

  if (Array.isArray(data)) {
    const totalElements = data.length
    const totalPages = totalElements === 0 ? 0 : 1
    return {
      content: data,
      page,
      size,
      totalElements,
      totalPages,
      first: true,
      last: true,
      hasNext: false,
      hasPrevious: false,
    }
  }

  return data
}

export function normalizePaginatedApiResponse<T>(
  response: ApiResponse<PaginatedResponse<T> | T[]>,
  page = 0,
  size = GRID_PAGE_SIZE,
): ApiResponse<PaginatedResponse<T>> {
  return {
    ...response,
    data: normalizePaginatedData(response.data, page, size),
  }
}
