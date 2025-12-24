import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Category, CategoryFormData } from '../types'

interface CategoryState {
  categories: Category[]
  isLoading: boolean
  error: string | null

  // Actions
  setCategories: (categories: Category[]) => void
  addCategory: (data: CategoryFormData) => Category
  updateCategory: (id: string, data: Partial<CategoryFormData>) => void
  deleteCategory: (id: string) => void
  reorderCategories: (categories: Category[]) => void
  clearError: () => void
}

const generateId = () => crypto.randomUUID()

// Initial mock categories
const initialCategories: Category[] = [
  { id: '0', name: 'Home', order: 0, is_active: true },
  {
    id: '1',
    name: 'Comidas',
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=400&fit=crop',
    order: 1,
    is_active: true,
  },
  {
    id: '2',
    name: 'Bebidas',
    image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=400&h=400&fit=crop',
    order: 2,
    is_active: true,
  },
  {
    id: '3',
    name: 'Postres',
    image: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&h=400&fit=crop',
    order: 3,
    is_active: true,
  },
]

export const useCategoryStore = create<CategoryState>()(
  persist(
    (set, get) => ({
      categories: initialCategories,
      isLoading: false,
      error: null,

      setCategories: (categories) => set({ categories }),

      addCategory: (data) => {
        const categories = get().categories
        const maxOrder = Math.max(...categories.map((c) => c.order), 0)
        const newCategory: Category = {
          id: generateId(),
          ...data,
          order: data.order ?? maxOrder + 1,
          is_active: data.is_active ?? true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        set({ categories: [...categories, newCategory] })
        return newCategory
      },

      updateCategory: (id, data) =>
        set((state) => ({
          categories: state.categories.map((cat) =>
            cat.id === id
              ? { ...cat, ...data, updated_at: new Date().toISOString() }
              : cat
          ),
        })),

      deleteCategory: (id) =>
        set((state) => ({
          categories: state.categories.filter((cat) => cat.id !== id),
        })),

      reorderCategories: (categories) => set({ categories }),

      clearError: () => set({ error: null }),
    }),
    {
      name: 'dashboard-categories',
    }
  )
)
