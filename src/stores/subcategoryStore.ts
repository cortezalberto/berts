import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Subcategory, SubcategoryFormData } from '../types'
import { STORAGE_KEYS, STORE_VERSIONS } from '../utils/constants'

interface SubcategoryState {
  subcategories: Subcategory[]
  // Actions
  setSubcategories: (subcategories: Subcategory[]) => void
  addSubcategory: (data: SubcategoryFormData) => Subcategory
  updateSubcategory: (id: string, data: Partial<SubcategoryFormData>) => void
  deleteSubcategory: (id: string) => void
  getByCategory: (categoryId: string) => Subcategory[]
  deleteByCategory: (categoryId: string) => void
}

const generateId = () => crypto.randomUUID()

// Initial mock subcategories
const initialSubcategories: Subcategory[] = [
  // Food subcategories (category_id: '1')
  {
    id: 'sub-1',
    name: 'Hamburguesas',
    category_id: '1',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=400&fit=crop',
    order: 1,
    is_active: true,
  },
  {
    id: 'sub-2',
    name: 'Pastas',
    category_id: '1',
    image: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400&h=400&fit=crop',
    order: 2,
    is_active: true,
  },
  {
    id: 'sub-3',
    name: 'Ensaladas',
    category_id: '1',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=400&fit=crop',
    order: 3,
    is_active: true,
  },
  {
    id: 'sub-4',
    name: 'Mariscos',
    category_id: '1',
    image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=400&fit=crop',
    order: 4,
    is_active: true,
  },
  {
    id: 'sub-5',
    name: 'Entradas',
    category_id: '1',
    image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&h=400&fit=crop',
    order: 5,
    is_active: true,
  },
  // Drinks subcategories (category_id: '2')
  {
    id: 'sub-6',
    name: 'Cervezas',
    category_id: '2',
    image: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=400&h=400&fit=crop',
    order: 1,
    is_active: true,
  },
  {
    id: 'sub-7',
    name: 'Cocteles',
    category_id: '2',
    image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=400&h=400&fit=crop',
    order: 2,
    is_active: true,
  },
  {
    id: 'sub-8',
    name: 'Refrescos',
    category_id: '2',
    image: 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=400&h=400&fit=crop',
    order: 3,
    is_active: true,
  },
  {
    id: 'sub-9',
    name: 'Vinos',
    category_id: '2',
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&h=400&fit=crop',
    order: 4,
    is_active: true,
  },
  // Desserts subcategories (category_id: '3')
  {
    id: 'sub-10',
    name: 'Tortas',
    category_id: '3',
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=400&fit=crop',
    order: 1,
    is_active: true,
  },
  {
    id: 'sub-11',
    name: 'Helados',
    category_id: '3',
    image: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=400&h=400&fit=crop',
    order: 2,
    is_active: true,
  },
  {
    id: 'sub-12',
    name: 'Frutas',
    category_id: '3',
    image: 'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=400&h=400&fit=crop',
    order: 3,
    is_active: true,
  },
]

export const useSubcategoryStore = create<SubcategoryState>()(
  persist(
    (set, get) => ({
      subcategories: initialSubcategories,

      setSubcategories: (subcategories) => set({ subcategories }),

      addSubcategory: (data) => {
        const subcategories = get().subcategories
        const categorySubcats = subcategories.filter(
          (s) => s.category_id === data.category_id
        )
        const maxOrder = Math.max(...categorySubcats.map((s) => s.order), 0)
        const newSubcategory: Subcategory = {
          id: generateId(),
          ...data,
          order: data.order ?? maxOrder + 1,
          is_active: data.is_active ?? true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        set({ subcategories: [...subcategories, newSubcategory] })
        return newSubcategory
      },

      updateSubcategory: (id, data) =>
        set((state) => ({
          subcategories: state.subcategories.map((sub) =>
            sub.id === id
              ? { ...sub, ...data, updated_at: new Date().toISOString() }
              : sub
          ),
        })),

      deleteSubcategory: (id) =>
        set((state) => ({
          subcategories: state.subcategories.filter((sub) => sub.id !== id),
        })),

      getByCategory: (categoryId) => {
        return get()
          .subcategories.filter((s) => s.category_id === categoryId)
          .sort((a, b) => a.order - b.order)
      },

      deleteByCategory: (categoryId) =>
        set((state) => ({
          subcategories: state.subcategories.filter(
            (sub) => sub.category_id !== categoryId
          ),
        })),
    }),
    {
      name: STORAGE_KEYS.SUBCATEGORIES,
      version: STORE_VERSIONS.SUBCATEGORIES,
    }
  )
)

// Selectors - only use selectors that return stable references
// For filtered data, use useMemo in components to avoid infinite loops
export const selectSubcategories = (state: SubcategoryState) => state.subcategories
export const selectSubcategoryById = (id: string) => (state: SubcategoryState) =>
  state.subcategories.find((s) => s.id === id)
