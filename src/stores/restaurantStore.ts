import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Restaurant, RestaurantFormData } from '../types'
import { STORAGE_KEYS, STORE_VERSIONS } from '../utils/constants'

interface RestaurantState {
  restaurant: Restaurant | null
  // Actions
  setRestaurant: (restaurant: Restaurant) => void
  updateRestaurant: (data: RestaurantFormData) => void
  createRestaurant: (data: RestaurantFormData) => void
  clearRestaurant: () => void
}

const generateId = () => crypto.randomUUID()

export const useRestaurantStore = create<RestaurantState>()(
  persist(
    (set) => ({
      restaurant: null,

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

      clearRestaurant: () => set({ restaurant: null }),
    }),
    {
      name: STORAGE_KEYS.RESTAURANT,
      version: STORE_VERSIONS.RESTAURANT,
    }
  )
)

// Selectors
export const selectRestaurant = (state: RestaurantState) => state.restaurant
