// Category constants
export const HOME_CATEGORY_ID = '0'

// Storage keys for localStorage persistence
export const STORAGE_KEYS = {
  RESTAURANT: 'dashboard-restaurant',
  CATEGORIES: 'dashboard-categories',
  SUBCATEGORIES: 'dashboard-subcategories',
  PRODUCTS: 'dashboard-products',
  ALLERGENS: 'dashboard-allergens',
} as const

// Store versions for migration support
export const STORE_VERSIONS = {
  RESTAURANT: 1,
  CATEGORIES: 1,
  SUBCATEGORIES: 1,
  PRODUCTS: 2,
  ALLERGENS: 1,
} as const

// Currency and locale settings
export const LOCALE = {
  CURRENCY: 'ARS',
  LANGUAGE: 'es-AR',
} as const

// Validation patterns
export const PATTERNS = {
  SLUG: /^[a-z0-9-]+$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
} as const

// Default values
export const DEFAULTS = {
  THEME_COLOR: '#f97316',
  TOAST_DURATION: 3000,
} as const
