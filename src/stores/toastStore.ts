import { create } from 'zustand'
import type { Toast } from '../types'

interface ToastState {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  clearToasts: () => void
}

const generateId = () => crypto.randomUUID()

// Map para almacenar timeout IDs y poder cancelarlos
const timeoutIds = new Map<string, ReturnType<typeof setTimeout>>()

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  addToast: (toast) => {
    const id = generateId()
    const newToast: Toast = { ...toast, id }

    set((state) => ({ toasts: [...state.toasts, newToast] }))

    // Auto-remove after duration
    const duration = toast.duration ?? 3000
    const timeoutId = setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }))
      timeoutIds.delete(id)
    }, duration)

    timeoutIds.set(id, timeoutId)
  },

  removeToast: (id) => {
    // Cancelar el timeout si existe
    const timeoutId = timeoutIds.get(id)
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutIds.delete(id)
    }

    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }))
  },

  clearToasts: () => {
    // Cancelar todos los timeouts
    timeoutIds.forEach((timeoutId) => clearTimeout(timeoutId))
    timeoutIds.clear()

    set({ toasts: [] })
  },
}))

// Helper functions
export const toast = {
  success: (message: string, duration?: number) =>
    useToastStore.getState().addToast({ type: 'success', message, duration }),
  error: (message: string, duration?: number) =>
    useToastStore.getState().addToast({ type: 'error', message, duration }),
  warning: (message: string, duration?: number) =>
    useToastStore.getState().addToast({ type: 'warning', message, duration }),
  info: (message: string, duration?: number) =>
    useToastStore.getState().addToast({ type: 'info', message, duration }),
}
