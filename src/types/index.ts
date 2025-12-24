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

// Branch types (sucursales)
export interface Branch {
  id: string
  name: string
  restaurant_id: string
  address?: string
  phone?: string
  email?: string
  image?: string
  is_active?: boolean
  order: number
  created_at?: string
  updated_at?: string
}

export interface BranchFormData {
  name: string
  address?: string
  phone?: string
  email?: string
  image?: string
  is_active: boolean
  order: number
}

// Category types
export interface Category {
  id: string
  name: string
  icon?: string
  image?: string
  order: number
  branch_id: string
  is_active?: boolean
  created_at?: string
  updated_at?: string
}

// Subcategory types
export interface Subcategory {
  id: string
  name: string
  category_id: string
  image?: string
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

// Branch price for products (per-branch pricing)
export interface BranchPrice {
  branch_id: string
  price: number
  is_active: boolean  // true = product is sold at this branch
}

// Product types
export interface Product {
  id: string
  name: string
  description: string
  price: number                    // Base price (used when use_branch_prices is false)
  branch_prices: BranchPrice[]     // Per-branch pricing
  use_branch_prices: boolean       // Toggle for per-branch pricing mode
  image: string
  category_id: string
  subcategory_id: string
  featured: boolean
  popular: boolean
  badge?: string
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
  branch_id: string
  is_active: boolean
}

export interface SubcategoryFormData {
  name: string
  category_id: string
  image?: string
  order: number
  is_active: boolean
}

export interface ProductFormData {
  name: string
  description: string
  price: number                    // Base price
  branch_prices: BranchPrice[]     // Per-branch pricing
  use_branch_prices: boolean       // Toggle for per-branch pricing mode
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

// Promotion Type types
export interface PromotionType {
  id: string
  name: string
  description?: string
  icon?: string
  is_active?: boolean
  created_at?: string
  updated_at?: string
}

export interface PromotionTypeFormData {
  name: string
  description?: string
  icon?: string
  is_active: boolean
}

// Promotion types
export interface PromotionItem {
  product_id: string
  quantity: number
}

export interface Promotion {
  id: string
  name: string
  description?: string
  price: number
  image?: string
  start_date: string
  end_date: string
  start_time: string
  end_time: string
  promotion_type_id: string
  branch_ids: string[]
  items: PromotionItem[]
  is_active?: boolean
  created_at?: string
  updated_at?: string
}

export interface PromotionFormData {
  name: string
  description: string
  price: number
  image: string
  start_date: string
  end_date: string
  start_time: string
  end_time: string
  promotion_type_id: string
  branch_ids: string[]
  items: PromotionItem[]
  is_active: boolean
}
