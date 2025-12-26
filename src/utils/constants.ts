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
  TABLES: 'dashboard-tables',
  ORDER_HISTORY: 'dashboard-order-history',
} as const

// Store versions for migration support
// Increment when changing data structure to trigger migration
export const STORE_VERSIONS = {
  RESTAURANT: 1,
  BRANCHES: 4,          // v4: Added opening_time and closing_time fields
  CATEGORIES: 3,
  SUBCATEGORIES: 3,
  PRODUCTS: 5,
  ALLERGENS: 2,       // v2: Non-destructive merge
  PROMOTIONS: 3,      // v3: Non-destructive merge
  PROMOTION_TYPES: 2, // v2: Non-destructive merge
  TABLES: 6,          // v6: pedido_cumplido keeps order_time from solicito_pedido
  ORDER_HISTORY: 1,   // v1: Initial version
} as const

// Table status labels for UI display
export const TABLE_STATUS_LABELS: Record<string, string> = {
  libre: 'Libre',
  solicito_pedido: 'Solicito Pedido',
  pedido_cumplido: 'Pedido Cumplido',
  cuenta_solicitada: 'Cuenta Solicitada',
  ocupada: 'Ocupada',
} as const

// Common table sectors
export const TABLE_SECTORS = [
  'Interior',
  'Terraza',
  'VIP',
  'Barra',
  'Jardin',
  'Salon Principal',
] as const

// Default time for table (00:00 when libre/ocupada, or close_time when solicito_pedido)
export const TABLE_DEFAULT_TIME = '00:00' as const

// Default branch operating hours
export const BRANCH_DEFAULT_OPENING_TIME = '09:00' as const
export const BRANCH_DEFAULT_CLOSING_TIME = '23:00' as const

// Currency and locale settings
export const LOCALE = {
  CURRENCY: 'ARS',
  LANGUAGE: 'es-AR',
} as const

// Validation patterns
export const PATTERNS = {
  SLUG: /^[a-z0-9-]+$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  TIME: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,  // HH:mm format (00:00 - 23:59)
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
