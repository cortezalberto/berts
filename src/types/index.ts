// Restaurant types
export interface Restaurant {
  id: string
  name: string
  slug: string
  description: string
  logo?: string
  banner?: string
  theme_color: string
  address?: string
  phone?: string
  email?: string
  created_at?: string
  updated_at?: string
}

// Category types
export interface Category {
  id: string
  name: string
  icon?: string
  image?: string
  order: number
  restaurant_id?: string
  is_active?: boolean
  created_at?: string
  updated_at?: string
}

// Subcategory types
export interface Subcategory {
  id: string
  name: string
  category_id: string
  image: string
  order: number
  is_active?: boolean
  created_at?: string
  updated_at?: string
}

// Allergen types
export interface Allergen {
  id: string
  name: string
  icon?: string
  description?: string
  is_active?: boolean
  created_at?: string
  updated_at?: string
}

export interface AllergenFormData {
  name: string
  icon?: string
  description?: string
  is_active: boolean
}

// Product types
export interface Product {
  id: string
  name: string
  description: string
  price: number
  image: string
  category_id: string
  subcategory_id: string
  featured: boolean
  popular: boolean
  badge?: string | null
  allergen_ids: string[]
  is_active?: boolean
  stock?: number
  created_at?: string
  updated_at?: string
}

// Form types for CRUD operations
export interface CategoryFormData {
  name: string
  icon?: string
  image?: string
  order: number
  is_active: boolean
}

export interface SubcategoryFormData {
  name: string
  category_id: string
  image: string
  order: number
  is_active: boolean
}

export interface ProductFormData {
  name: string
  description: string
  price: number
  image: string
  category_id: string
  subcategory_id: string
  featured: boolean
  popular: boolean
  badge?: string
  allergen_ids: string[]
  is_active: boolean
  stock?: number
}

export interface RestaurantFormData {
  name: string
  slug: string
  description: string
  logo?: string
  banner?: string
  theme_color: string
  address?: string
  phone?: string
  email?: string
}

// Dashboard statistics
export interface DashboardStats {
  totalProducts: number
  totalCategories: number
  totalSubcategories: number
  activeProducts: number
  featuredProducts: number
  popularProducts: number
}

// Table column definition for reusable table component
export interface TableColumn<T> {
  key: keyof T | string
  label: string
  render?: (item: T) => React.ReactNode
  sortable?: boolean
  width?: string
}

// Modal state
export interface ModalState {
  isOpen: boolean
  mode: 'create' | 'edit' | 'delete' | 'view'
  data?: unknown
}

// Toast notification
export interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  duration?: number
}
