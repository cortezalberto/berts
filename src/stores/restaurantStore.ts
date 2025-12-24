import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Restaurant, RestaurantFormData } from '../types'

interface RestaurantState {
  restaurant: Restaurant | null
  isLoading: boolean
  error: string | null

  // Actions
  setRestaurant: (restaurant: Restaurant) => void
  updateRestaurant: (data: RestaurantFormData) => void
  createRestaurant: (data: RestaurantFormData) => void
  clearError: () => void
}

const generateId = () => crypto.randomUUID()

export const useRestaurantStore = create<RestaurantState>()(
  persist(
    (set) => ({
      restaurant: null,
      isLoading: false,
      error: null,

      setRestaurant: (restaurant) => set({ restaurant }),

      createRestaurant: (data) => {
        const newRestaurant: Restaurant = {
          id: generateId(),
          ...data,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        set({ restaurant: newRestaurant })
      },

      updateRestaurant: (data) =>
        set((state) => {
          if (!state.restaurant) return state
          return {
            restaurant: {
              ...state.restaurant,
              ...data,
              updated_at: new Date().toISOString(),
            },
          }
        }),

      clearError: () => set({ error: null }),
    }),
    {
      name: 'dashboard-restaurant',
    }
  )
)
