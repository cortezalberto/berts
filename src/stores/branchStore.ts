import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Branch, BranchFormData } from '../types'
import { STORAGE_KEYS, STORE_VERSIONS } from '../utils/constants'

interface BranchState {
  branches: Branch[]
  selectedBranchId: string | null
  // Actions
  setBranches: (branches: Branch[]) => void
  addBranch: (data: BranchFormData & { restaurant_id: string }) => Branch
  updateBranch: (id: string, data: Partial<BranchFormData>) => void
  deleteBranch: (id: string) => void
  selectBranch: (id: string | null) => void
  getByRestaurant: (restaurantId: string) => Branch[]
}

const generateId = () => crypto.randomUUID()

// Mock data: 4 sucursales de Barijho
const initialBranches: Branch[] = [
  {
    id: 'branch-1',
    name: 'Barijho Centro',
    restaurant_id: 'barijho-main',
    address: 'Av. Corrientes 1234, CABA',
    phone: '+54 11 1234-5678',
    email: 'centro@barijho.com',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop',
    is_active: true,
    order: 1,
    created_at: new Date().toISOString(),
  },
  {
    id: 'branch-2',
    name: 'Barijho Norte',
    restaurant_id: 'barijho-main',
    address: 'Av. Cabildo 2345, CABA',
    phone: '+54 11 2345-6789',
    email: 'norte@barijho.com',
    image: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=400&h=300&fit=crop',
    is_active: true,
    order: 2,
    created_at: new Date().toISOString(),
  },
  {
    id: 'branch-3',
    name: 'Barijho Sur',
    restaurant_id: 'barijho-main',
    address: 'Av. Caseros 3456, CABA',
    phone: '+54 11 3456-7890',
    email: 'sur@barijho.com',
    image: 'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=400&h=300&fit=crop',
    is_active: true,
    order: 3,
    created_at: new Date().toISOString(),
  },
  {
    id: 'branch-4',
    name: 'Barijho Este',
    restaurant_id: 'barijho-main',
    address: 'Av. Santa Fe 4567, CABA',
    phone: '+54 11 4567-8901',
    email: 'este@barijho.com',
    image: 'https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=400&h=300&fit=crop',
    is_active: true,
    order: 4,
    created_at: new Date().toISOString(),
  },
]

export const useBranchStore = create<BranchState>()(
  persist(
    (set, get) => ({
      branches: initialBranches,
      selectedBranchId: null,

      setBranches: (branches) => set({ branches }),

      addBranch: (data) => {
        const branches = get().branches
        const maxOrder = Math.max(...branches.map((b) => b.order), 0)
        const newBranch: Branch = {
          id: generateId(),
          ...data,
          order: data.order ?? maxOrder + 1,
          is_active: data.is_active ?? true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        set({ branches: [...branches, newBranch] })
        return newBranch
      },

      updateBranch: (id, data) =>
        set((state) => ({
          branches: state.branches.map((branch) =>
            branch.id === id
              ? { ...branch, ...data, updated_at: new Date().toISOString() }
              : branch
          ),
        })),

      deleteBranch: (id) =>
        set((state) => ({
          branches: state.branches.filter((branch) => branch.id !== id),
          selectedBranchId: state.selectedBranchId === id ? null : state.selectedBranchId,
        })),

      selectBranch: (id) => set({ selectedBranchId: id }),

      getByRestaurant: (restaurantId) => {
        return get()
          .branches.filter((b) => b.restaurant_id === restaurantId)
          .sort((a, b) => a.order - b.order)
      },
    }),
    {
      name: STORAGE_KEYS.BRANCHES,
      version: STORE_VERSIONS.BRANCHES,
      migrate: (persistedState, version) => {
        const state = persistedState as { branches: Branch[]; selectedBranchId: string | null }
        // Version 2: Reset a datos iniciales para limpiar datos corruptos
        if (version < 2) {
          state.branches = initialBranches
          state.selectedBranchId = null
        }
        return state
      },
    }
  )
)

// Selectors
export const selectBranches = (state: BranchState) => state.branches
export const selectSelectedBranchId = (state: BranchState) => state.selectedBranchId
export const selectBranchById = (id: string) => (state: BranchState) =>
  state.branches.find((b) => b.id === id)
