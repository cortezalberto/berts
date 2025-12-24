import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Allergen, AllergenFormData } from '../types'
import { STORAGE_KEYS, STORE_VERSIONS } from '../utils/constants'

interface AllergenState {
  allergens: Allergen[]
  // Actions
  setAllergens: (allergens: Allergen[]) => void
  addAllergen: (data: AllergenFormData) => Allergen
  updateAllergen: (id: string, data: Partial<AllergenFormData>) => void
  deleteAllergen: (id: string) => void
}

const generateId = () => crypto.randomUUID()

// Initial common allergens
const initialAllergens: Allergen[] = [
  {
    id: 'alg-1',
    name: 'Gluten',
    icon: '🌾',
    description: 'Cereales que contienen gluten (trigo, centeno, cebada, avena)',
    is_active: true,
  },
  {
    id: 'alg-2',
    name: 'Lacteos',
    icon: '🥛',
    description: 'Leche y productos lacteos',
    is_active: true,
  },
  {
    id: 'alg-3',
    name: 'Huevos',
    icon: '🥚',
    description: 'Huevos y productos derivados',
    is_active: true,
  },
  {
    id: 'alg-4',
    name: 'Pescado',
    icon: '🐟',
    description: 'Pescado y productos derivados',
    is_active: true,
  },
  {
    id: 'alg-5',
    name: 'Mariscos',
    icon: '🦐',
    description: 'Crustaceos y moluscos',
    is_active: true,
  },
  {
    id: 'alg-6',
    name: 'Frutos Secos',
    icon: '🥜',
    description: 'Mani, nueces, almendras, avellanas, etc.',
    is_active: true,
  },
  {
    id: 'alg-7',
    name: 'Soja',
    icon: '🫘',
    description: 'Soja y productos derivados',
    is_active: true,
  },
  {
    id: 'alg-8',
    name: 'Apio',
    icon: '🥬',
    description: 'Apio y productos derivados',
    is_active: true,
  },
  {
    id: 'alg-9',
    name: 'Mostaza',
    icon: '🟡',
    description: 'Mostaza y productos derivados',
    is_active: true,
  },
  {
    id: 'alg-10',
    name: 'Sesamo',
    icon: '⚪',
    description: 'Semillas de sesamo',
    is_active: true,
  },
  {
    id: 'alg-11',
    name: 'Sulfitos',
    icon: '🍷',
    description: 'Dioxido de azufre y sulfitos',
    is_active: true,
  },
  {
    id: 'alg-12',
    name: 'Altramuces',
    icon: '🌱',
    description: 'Altramuces y productos derivados',
    is_active: true,
  },
]

export const useAllergenStore = create<AllergenState>()(
  persist(
    (set) => ({
      allergens: initialAllergens,

      setAllergens: (allergens) => set({ allergens }),

      addAllergen: (data) => {
        const newAllergen: Allergen = {
          id: generateId(),
          ...data,
          is_active: data.is_active ?? true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        set((state) => ({ allergens: [...state.allergens, newAllergen] }))
        return newAllergen
      },

      updateAllergen: (id, data) =>
        set((state) => ({
          allergens: state.allergens.map((alg) =>
            alg.id === id
              ? { ...alg, ...data, updated_at: new Date().toISOString() }
              : alg
          ),
        })),

      deleteAllergen: (id) =>
        set((state) => ({
          allergens: state.allergens.filter((alg) => alg.id !== id),
        })),
    }),
    {
      name: STORAGE_KEYS.ALLERGENS,
      version: STORE_VERSIONS.ALLERGENS,
    }
  )
)

// Selectors - only use selectors that return stable references
export const selectAllergens = (state: AllergenState) => state.allergens
export const selectAllergenById = (id: string) => (state: AllergenState) =>
  state.allergens.find((a) => a.id === id)
