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

// Initial restaurant mock data
const initialRestaurant: Restaurant = {
  id: 'restaurant-1',
  name: 'Barijho',
  slug: 'barijho',
  description: 'Restaurante de comida rapida con las mejores hamburguesas de la ciudad',
  theme_color: '#f97316',
  address: 'Av. Principal 123',
  phone: '+54 11 1234-5678',
  email: 'info@barijho.com',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

export const useRestaurantStore = create<RestaurantState>()(
  persist(
    (set) => ({
      restaurant: initialRestaurant,

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
