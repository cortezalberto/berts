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
  const [currentPage, setCurrentPage] = useState(1)

  const totalItems = items.length
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage))

  // Reset to page 1 if current page exceeds total pages (e.g., after filtering)
  const safePage = useMemo(() => {
    if (currentPage > totalPages) {
      return 1
    }
    return currentPage
  }, [currentPage, totalPages])

  // Update current page if it became invalid
  useMemo(() => {
    if (currentPage !== safePage) {
      setCurrentPage(safePage)
    }
  }, [currentPage, safePage])

  const paginatedItems = useMemo(() => {
    const startIndex = (safePage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return items.slice(startIndex, endIndex)
  }, [items, safePage, itemsPerPage])

  const goToFirstPage = useCallback(() => setCurrentPage(1), [])
  const goToLastPage = useCallback(() => setCurrentPage(totalPages), [totalPages])
  const goToNextPage = useCallback(() => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
  }, [totalPages])
  const goToPreviousPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(prev - 1, 1))
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
