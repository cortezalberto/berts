import { useState, useCallback } from 'react'

export type ModalMode = 'create' | 'edit' | 'view'

export interface UseModalReturn<T> {
  isOpen: boolean
  mode: ModalMode
  selectedItem: T | null
  openCreate: () => void
  openEdit: (item: T) => void
  openView: (item: T) => void
  close: () => void
}

export function useModal<T>(): UseModalReturn<T> {
  const [isOpen, setIsOpen] = useState(false)
  const [mode, setMode] = useState<ModalMode>('create')
  const [selectedItem, setSelectedItem] = useState<T | null>(null)

  const openCreate = useCallback(() => {
    setSelectedItem(null)
    setMode('create')
    setIsOpen(true)
  }, [])

  const openEdit = useCallback((item: T) => {
    setSelectedItem(item)
    setMode('edit')
    setIsOpen(true)
  }, [])

  const openView = useCallback((item: T) => {
    setSelectedItem(item)
    setMode('view')
    setIsOpen(true)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
  }, [])

  return {
    isOpen,
    mode,
    selectedItem,
    openCreate,
    openEdit,
    openView,
    close,
  }
}
