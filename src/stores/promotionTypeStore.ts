import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { STORAGE_KEYS, STORE_VERSIONS } from '../utils/constants'
import type { PromotionType, PromotionTypeFormData } from '../types'

interface PromotionTypeState {
  promotionTypes: PromotionType[]
  addPromotionType: (data: PromotionTypeFormData) => void
  updatePromotionType: (id: string, data: Partial<PromotionTypeFormData>) => void
  deletePromotionType: (id: string) => void
}

const initialPromotionTypes: PromotionType[] = [
  {
    id: 'promo-type-1',
    name: 'Happy Hour',
    description: 'Promociones de horario especial con descuentos',
    icon: '🍺',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'promo-type-2',
    name: 'Combo Familiar',
    description: 'Combos pensados para familias',
    icon: '👨‍👩‍👧‍👦',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'promo-type-3',
    name: '2x1',
    description: 'Promociones de dos por uno',
    icon: '🎉',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'promo-type-4',
    name: 'Descuento',
    description: 'Descuentos porcentuales o fijos',
    icon: '💰',
    is_active: true,
    created_at: new Date().toISOString(),
  },
]

export const usePromotionTypeStore = create<PromotionTypeState>()(
  persist(
    (set) => ({
      promotionTypes: initialPromotionTypes,

      addPromotionType: (data) =>
        set((state) => ({
          promotionTypes: [
            ...state.promotionTypes,
            {
              id: crypto.randomUUID(),
              ...data,
              created_at: new Date().toISOString(),
            },
          ],
        })),

      updatePromotionType: (id, data) =>
        set((state) => ({
          promotionTypes: state.promotionTypes.map((pt) =>
            pt.id === id
              ? { ...pt, ...data, updated_at: new Date().toISOString() }
              : pt
          ),
        })),

      deletePromotionType: (id) =>
        set((state) => ({
          promotionTypes: state.promotionTypes.filter((pt) => pt.id !== id),
        })),
    }),
    {
      name: STORAGE_KEYS.PROMOTION_TYPES,
      version: STORE_VERSIONS.PROMOTION_TYPES,
    }
  )
)

// Selectors
export const selectPromotionTypes = (state: PromotionTypeState) => state.promotionTypes
export const selectActivePromotionTypes = (state: PromotionTypeState) =>
  state.promotionTypes.filter((pt) => pt.is_active !== false)
export const selectPromotionTypeById = (id: string) => (state: PromotionTypeState) =>
  state.promotionTypes.find((pt) => pt.id === id)
