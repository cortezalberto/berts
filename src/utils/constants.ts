// Category constants
export const HOME_CATEGORY_NAME = 'Home'

// Storage keys for localStorage persistence
export const STORAGE_KEYS = {
  RESTAURANT: 'dashboard-restaurant',
  BRANCHES: 'dashboard-branches',
  CATEGORIES: 'dashboard-categories',
  SUBCATEGORIES: 'dashboard-subcategories',
  PRODUCTS: 'dashboard-products',
  ALLERGENS: 'dashboard-allergens',
  PROMOTIONS: 'dashboard-promotions',
  PROMOTION_TYPES: 'dashboard-promotion-types',
} as const

// Store versions for migration support
// Increment when changing data structure to trigger migration
export const STORE_VERSIONS = {
  RESTAURANT: 1,
  BRANCHES: 3,
  CATEGORIES: 3,
  SUBCATEGORIES: 3,
  PRODUCTS: 5,
  ALLERGENS: 2,       // v2: Non-destructive merge
  PROMOTIONS: 3,      // v3: Non-destructive merge
  PROMOTION_TYPES: 2, // v2: Non-destructive merge
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
  ITEMS_PER_PAGE: 10,
} as const

// Centralized price formatter using locale settings
export function formatPrice(price: number): string {
  // Handle edge cases
  if (!Number.isFinite(price)) {
    return '$0,00'
  }
  return new Intl.NumberFormat(LOCALE.LANGUAGE, {
    style: 'currency',
    currency: LOCALE.CURRENCY,
  }).format(price)
}

// Sanitize text input to prevent XSS (basic HTML escape)
export function sanitizeText(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
