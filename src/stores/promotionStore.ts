import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Promotion, PromotionFormData } from '../types'
import { STORAGE_KEYS, STORE_VERSIONS } from '../utils/constants'

interface PromotionState {
  promotions: Promotion[]
  // Actions
  setPromotions: (promotions: Promotion[]) => void
  addPromotion: (data: PromotionFormData) => Promotion
  updatePromotion: (id: string, data: Partial<PromotionFormData>) => void
  deletePromotion: (id: string) => void
  // Cascade cleanup actions
  removeBranchFromPromotions: (branchId: string) => void
  clearPromotionType: (promotionTypeId: string) => void
  // Queries
  getByBranch: (branchId: string) => Promotion[]
}

const generateId = () => crypto.randomUUID()

// Initial promotions mock data
const initialPromotions: Promotion[] = [
  {
    id: 'promo-1',
    name: 'Combo Familiar',
    description: '4 hamburguesas + 2 papas grandes + 4 bebidas',
    price: 15000,
    start_date: '2024-01-01',
    end_date: '2024-12-31',
    start_time: '11:00',
    end_time: '23:00',
    promotion_type_id: 'promo-type-2',
    branch_ids: ['branch-1', 'branch-2', 'branch-3', 'branch-4'],
    items: [
      { product_id: 'b1-prod-1', quantity: 4 },
      { product_id: 'b1-prod-2', quantity: 2 },
    ],
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'promo-2',
    name: 'Happy Hour Cerveza',
    description: 'Promocion de cerveza en horario especial',
    price: 5000,
    start_date: '2024-06-01',
    end_date: '2024-08-31',
    start_time: '17:00',
    end_time: '20:00',
    promotion_type_id: 'promo-type-1',
    branch_ids: ['branch-2'],
    items: [
      { product_id: 'b1-prod-1', quantity: 1 },
      { product_id: 'b1-prod-2', quantity: 1 },
    ],
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

export const usePromotionStore = create<PromotionState>()(
  persist(
    (set, get) => ({
      promotions: initialPromotions,

      setPromotions: (promotions) => set({ promotions }),

      addPromotion: (data) => {
        const newPromotion: Promotion = {
          id: generateId(),
          ...data,
          is_active: data.is_active ?? true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        set((state) => ({ promotions: [...state.promotions, newPromotion] }))
        return newPromotion
      },

      updatePromotion: (id, data) =>
        set((state) => ({
          promotions: state.promotions.map((promo) =>
            promo.id === id
              ? { ...promo, ...data, updated_at: new Date().toISOString() }
              : promo
          ),
        })),

      deletePromotion: (id) =>
        set((state) => ({
          promotions: state.promotions.filter((promo) => promo.id !== id),
        })),

      removeBranchFromPromotions: (branchId) =>
        set((state) => ({
          // Remove branch from promotions, delete promotion if no branches remain
          promotions: state.promotions
            .map((promo) => ({
              ...promo,
              branch_ids: promo.branch_ids.filter((id) => id !== branchId),
            }))
            .filter((promo) => promo.branch_ids.length > 0),
        })),

      clearPromotionType: (promotionTypeId) =>
        set((state) => ({
          // Delete promotions that use this promotion type (they become invalid)
          promotions: state.promotions.filter(
            (promo) => promo.promotion_type_id !== promotionTypeId
          ),
        })),

      getByBranch: (branchId) => {
        return get().promotions.filter((promo) =>
          promo.branch_ids.includes(branchId)
        )
      },
    }),
    {
      name: STORAGE_KEYS.PROMOTIONS,
      version: STORE_VERSIONS.PROMOTIONS,
      migrate: (persistedState, version) => {
        const state = persistedState as { promotions: Promotion[] }
        if (version < 2) {
          // Migration: Add start_time, end_time, promotion_type_id to existing promotions
          state.promotions = state.promotions.map((p) => ({
            ...p,
            start_time: p.start_time ?? '00:00',
            end_time: p.end_time ?? '23:59',
            promotion_type_id: p.promotion_type_id ?? '',
          }))
        }
        return state
      },
    }
  )
)

// Selectors
export const selectPromotions = (state: PromotionState) => state.promotions
export const selectPromotionById = (id: string) => (state: PromotionState) =>
  state.promotions.find((p) => p.id === id)
