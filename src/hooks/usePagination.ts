import { useState, useMemo, useCallback } from 'react'

interface UsePaginationOptions {
  itemsPerPage?: number
}

interface UsePaginationResult<T> {
  currentPage: number
  totalPages: number
  paginatedItems: T[]
  totalItems: number
  itemsPerPage: number
  setCurrentPage: (page: number) => void
  goToFirstPage: () => void
  goToLastPage: () => void
  goToNextPage: () => void
  goToPreviousPage: () => void
}

export function usePagination<T>(
  items: T[],
  options: UsePaginationOptions = {}
): UsePaginationResult<T> {
  const { itemsPerPage = 10 } = options
  const [currentPage, setCurrentPageInternal] = useState(1)

  const totalItems = items.length
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage))

  // Calculate safe page (auto-correct if current exceeds total after filtering)
  const safePage = currentPage > totalPages ? 1 : currentPage

  // Wrap setCurrentPage to clamp values within valid range
  const setCurrentPage = useCallback(
    (page: number) => {
      setCurrentPageInternal(Math.max(1, Math.min(page, totalPages)))
    },
    [totalPages]
  )

  const paginatedItems = useMemo(() => {
    const startIndex = (safePage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return items.slice(startIndex, endIndex)
  }, [items, safePage, itemsPerPage])

  const goToFirstPage = useCallback(() => setCurrentPage(1), [setCurrentPage])
  const goToLastPage = useCallback(() => setCurrentPage(totalPages), [setCurrentPage, totalPages])
  const goToNextPage = useCallback(() => {
    setCurrentPageInternal((prev) => Math.min(prev + 1, totalPages))
  }, [totalPages])
  const goToPreviousPage = useCallback(() => {
    setCurrentPageInternal((prev) => Math.max(prev - 1, 1))
  }, [])

  return {
    currentPage: safePage,
    totalPages,
    paginatedItems,
    totalItems,
    itemsPerPage,
    setCurrentPage,
    goToFirstPage,
    goToLastPage,
    goToNextPage,
    goToPreviousPage,
  }
}
