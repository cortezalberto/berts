import { PATTERNS } from './constants'
import type {
  RestaurantFormData,
  BranchFormData,
  CategoryFormData,
  SubcategoryFormData,
  ProductFormData,
  AllergenFormData,
  PromotionFormData,
  PromotionTypeFormData,
} from '../types'

export type ValidationErrors<T> = Partial<Record<keyof T, string>>

export interface ValidationResult<T> {
  isValid: boolean
  errors: ValidationErrors<T>
}

// Validation constants
const MIN_NAME_LENGTH = 2
const MAX_NAME_LENGTH = 100
const MAX_DESCRIPTION_LENGTH = 500
const MAX_ADDRESS_LENGTH = 200

// Phone validation: accepts formats like +54 11 1234-5678, (011) 4567-8901, etc.
function isValidPhone(phone: string): boolean {
  if (!phone || phone.trim() === '') return true // Empty is valid (optional field)
  // Remove all spaces, dashes, and parentheses for validation
  const cleaned = phone.replace(/[\s\-()]/g, '')
  // Must be digits, optionally starting with +
  return /^\+?\d{6,15}$/.test(cleaned)
}

// Restaurant validation
export function validateRestaurant(data: RestaurantFormData): ValidationResult<RestaurantFormData> {
  const errors: ValidationErrors<RestaurantFormData> = {}

  const trimmedName = data.name.trim()
  if (!trimmedName) {
    errors.name = 'El nombre es requerido'
  } else if (trimmedName.length < MIN_NAME_LENGTH) {
    errors.name = `El nombre debe tener al menos ${MIN_NAME_LENGTH} caracteres`
  } else if (trimmedName.length > MAX_NAME_LENGTH) {
    errors.name = `El nombre no puede exceder ${MAX_NAME_LENGTH} caracteres`
  }

  if (!data.slug.trim()) {
    errors.slug = 'El slug es requerido'
  } else if (!PATTERNS.SLUG.test(data.slug)) {
    errors.slug = 'Solo letras minusculas, numeros y guiones'
  }

  const trimmedDescription = data.description.trim()
  if (!trimmedDescription) {
    errors.description = 'La descripcion es requerida'
  } else if (trimmedDescription.length > MAX_DESCRIPTION_LENGTH) {
    errors.description = `La descripcion no puede exceder ${MAX_DESCRIPTION_LENGTH} caracteres`
  }

  if (data.address && data.address.length > MAX_ADDRESS_LENGTH) {
    errors.address = `La direccion no puede exceder ${MAX_ADDRESS_LENGTH} caracteres`
  }

  if (data.phone && !isValidPhone(data.phone)) {
    errors.phone = 'Telefono invalido (ej: +54 11 1234-5678)'
  }

  if (data.email && !PATTERNS.EMAIL.test(data.email)) {
    errors.email = 'Email invalido'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

// Branch validation
export function validateBranch(data: BranchFormData): ValidationResult<BranchFormData> {
  const errors: ValidationErrors<BranchFormData> = {}

  const trimmedName = data.name.trim()
  if (!trimmedName) {
    errors.name = 'El nombre es requerido'
  } else if (trimmedName.length < MIN_NAME_LENGTH) {
    errors.name = `El nombre debe tener al menos ${MIN_NAME_LENGTH} caracteres`
  } else if (trimmedName.length > MAX_NAME_LENGTH) {
    errors.name = `El nombre no puede exceder ${MAX_NAME_LENGTH} caracteres`
  }

  if (data.address && data.address.length > MAX_ADDRESS_LENGTH) {
    errors.address = `La direccion no puede exceder ${MAX_ADDRESS_LENGTH} caracteres`
  }

  if (data.phone && !isValidPhone(data.phone)) {
    errors.phone = 'Telefono invalido (ej: +54 11 1234-5678)'
  }

  if (data.email && !PATTERNS.EMAIL.test(data.email)) {
    errors.email = 'Email invalido'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

// Category validation
export function validateCategory(data: CategoryFormData): ValidationResult<CategoryFormData> {
  const errors: ValidationErrors<CategoryFormData> = {}

  const trimmedName = data.name.trim()
  if (!trimmedName) {
    errors.name = 'El nombre es requerido'
  } else if (trimmedName.length < MIN_NAME_LENGTH) {
    errors.name = `El nombre debe tener al menos ${MIN_NAME_LENGTH} caracteres`
  } else if (trimmedName.length > MAX_NAME_LENGTH) {
    errors.name = `El nombre no puede exceder ${MAX_NAME_LENGTH} caracteres`
  }

  if (!data.branch_id) {
    errors.branch_id = 'La sucursal es requerida'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

// Subcategory validation
export function validateSubcategory(data: SubcategoryFormData): ValidationResult<SubcategoryFormData> {
  const errors: ValidationErrors<SubcategoryFormData> = {}

  const trimmedName = data.name.trim()
  if (!trimmedName) {
    errors.name = 'El nombre es requerido'
  } else if (trimmedName.length < MIN_NAME_LENGTH) {
    errors.name = `El nombre debe tener al menos ${MIN_NAME_LENGTH} caracteres`
  } else if (trimmedName.length > MAX_NAME_LENGTH) {
    errors.name = `El nombre no puede exceder ${MAX_NAME_LENGTH} caracteres`
  }

  if (!data.category_id) {
    errors.category_id = 'La categoria es requerida'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

// Branch price errors type (keyed by branch_id)
export type BranchPriceErrors = Record<string, string>

// Product validation result with branch price errors
export interface ProductValidationResult extends ValidationResult<ProductFormData> {
  branchPriceErrors: BranchPriceErrors
}

// Product validation
export function validateProduct(data: ProductFormData): ProductValidationResult {
  const errors: ValidationErrors<ProductFormData> = {}
  const branchPriceErrors: BranchPriceErrors = {}

  const trimmedName = data.name.trim()
  if (!trimmedName) {
    errors.name = 'El nombre es requerido'
  } else if (trimmedName.length < MIN_NAME_LENGTH) {
    errors.name = `El nombre debe tener al menos ${MIN_NAME_LENGTH} caracteres`
  } else if (trimmedName.length > MAX_NAME_LENGTH) {
    errors.name = `El nombre no puede exceder ${MAX_NAME_LENGTH} caracteres`
  }

  const trimmedDescription = data.description.trim()
  if (!trimmedDescription) {
    errors.description = 'La descripcion es requerida'
  } else if (trimmedDescription.length > MAX_DESCRIPTION_LENGTH) {
    errors.description = `La descripcion no puede exceder ${MAX_DESCRIPTION_LENGTH} caracteres`
  }

  // Price validation depends on mode
  if (data.use_branch_prices) {
    // Branch prices mode: validate individual branch prices
    const branchPrices = data.branch_prices ?? []
    const activeBranchPrices = branchPrices.filter(bp => bp.is_active)

    if (activeBranchPrices.length === 0) {
      errors.branch_prices = 'Debe seleccionar al menos una sucursal'
    }

    // Validate each active branch price
    activeBranchPrices.forEach(bp => {
      if (typeof bp.price !== 'number' || isNaN(bp.price) || bp.price <= 0) {
        branchPriceErrors[bp.branch_id] = 'El precio debe ser mayor a 0'
      }
    })
  } else {
    // Single price mode: validate base price
    if (typeof data.price !== 'number' || isNaN(data.price) || data.price <= 0) {
      errors.price = 'El precio debe ser un numero mayor a 0'
    }
  }

  if (!data.category_id) {
    errors.category_id = 'La categoria es requerida'
  }

  if (!data.subcategory_id) {
    errors.subcategory_id = 'La subcategoria es requerida'
  }

  return {
    isValid: Object.keys(errors).length === 0 && Object.keys(branchPriceErrors).length === 0,
    errors,
    branchPriceErrors,
  }
}

// Allergen validation
export function validateAllergen(data: AllergenFormData): ValidationResult<AllergenFormData> {
  const errors: ValidationErrors<AllergenFormData> = {}

  const trimmedName = data.name.trim()
  if (!trimmedName) {
    errors.name = 'El nombre es requerido'
  } else if (trimmedName.length < MIN_NAME_LENGTH) {
    errors.name = `El nombre debe tener al menos ${MIN_NAME_LENGTH} caracteres`
  } else if (trimmedName.length > MAX_NAME_LENGTH) {
    errors.name = `El nombre no puede exceder ${MAX_NAME_LENGTH} caracteres`
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

// Promotion Type validation
export function validatePromotionType(data: PromotionTypeFormData): ValidationResult<PromotionTypeFormData> {
  const errors: ValidationErrors<PromotionTypeFormData> = {}

  const trimmedName = data.name.trim()
  if (!trimmedName) {
    errors.name = 'El nombre es requerido'
  } else if (trimmedName.length < MIN_NAME_LENGTH) {
    errors.name = `El nombre debe tener al menos ${MIN_NAME_LENGTH} caracteres`
  } else if (trimmedName.length > MAX_NAME_LENGTH) {
    errors.name = `El nombre no puede exceder ${MAX_NAME_LENGTH} caracteres`
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

// Promotion validation options
interface PromotionValidationOptions {
  isEditing?: boolean  // true when editing an existing promotion
}

// Helper to get local date string in YYYY-MM-DD format (consistent timezone)
function getLocalDateString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Helper to get local time string in HH:mm format (consistent timezone)
function getLocalTimeString(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

// Promotion validation
export function validatePromotion(
  data: PromotionFormData,
  options: PromotionValidationOptions = {}
): ValidationResult<PromotionFormData> {
  const errors: ValidationErrors<PromotionFormData> = {}
  const now = new Date()
  // Use local timezone consistently (not mixing UTC with local)
  const today = getLocalDateString(now)
  const currentTime = getLocalTimeString(now)

  const trimmedName = data.name.trim()
  if (!trimmedName) {
    errors.name = 'El nombre es requerido'
  } else if (trimmedName.length < MIN_NAME_LENGTH) {
    errors.name = `El nombre debe tener al menos ${MIN_NAME_LENGTH} caracteres`
  } else if (trimmedName.length > MAX_NAME_LENGTH) {
    errors.name = `El nombre no puede exceder ${MAX_NAME_LENGTH} caracteres`
  }

  if (typeof data.price !== 'number' || isNaN(data.price) || data.price <= 0) {
    errors.price = 'El precio debe ser un numero mayor a 0'
  }

  if (!data.start_date) {
    errors.start_date = 'La fecha de inicio es requerida'
  } else if (!options.isEditing) {
    // Solo validar fecha futura al crear nueva promocion
    if (data.start_date < today) {
      errors.start_date = 'La fecha de inicio debe ser igual o posterior a hoy'
    } else if (data.start_date === today && data.start_time && data.start_time < currentTime) {
      errors.start_time = 'La hora de inicio debe ser posterior a la hora actual'
    }
  }

  if (!data.end_date) {
    errors.end_date = 'La fecha de fin es requerida'
  } else if (data.start_date && data.end_date < data.start_date) {
    errors.end_date = 'La fecha de fin debe ser igual o posterior a la de inicio'
  }

  // Al activar una promocion, la fecha de fin no puede ser anterior a hoy
  if (data.is_active && data.end_date && data.end_date < today) {
    errors.end_date = 'No se puede activar una promocion con fecha de fin anterior a hoy'
  }

  // Si es el mismo dia, validar que hora de fin sea posterior a hora de inicio
  if (data.start_date && data.end_date && data.start_date === data.end_date) {
    if (data.start_time && data.end_time && data.end_time <= data.start_time) {
      errors.end_time = 'La hora de fin debe ser posterior a la hora de inicio'
    }
  }

  if (!data.start_time) {
    errors.start_time = errors.start_time || 'La hora de inicio es requerida'
  }

  if (!data.end_time) {
    errors.end_time = errors.end_time || 'La hora de fin es requerida'
  }

  if (!data.promotion_type_id) {
    errors.promotion_type_id = 'El tipo de promocion es requerido'
  }

  if (!data.items || data.items.length === 0) {
    errors.items = 'Debes agregar al menos un producto al combo'
  }

  if (!data.branch_ids || data.branch_ids.length === 0) {
    errors.branch_ids = 'Debes seleccionar al menos una sucursal'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}
