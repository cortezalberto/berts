import { PATTERNS } from './constants'
import type {
  RestaurantFormData,
  BranchFormData,
  CategoryFormData,
  SubcategoryFormData,
  ProductFormData,
  AllergenFormData,
} from '../types'

export type ValidationErrors<T> = Partial<Record<keyof T, string>>

export interface ValidationResult<T> {
  isValid: boolean
  errors: ValidationErrors<T>
}

// Restaurant validation
export function validateRestaurant(data: RestaurantFormData): ValidationResult<RestaurantFormData> {
  const errors: ValidationErrors<RestaurantFormData> = {}

  if (!data.name.trim()) {
    errors.name = 'El nombre es requerido'
  }

  if (!data.slug.trim()) {
    errors.slug = 'El slug es requerido'
  } else if (!PATTERNS.SLUG.test(data.slug)) {
    errors.slug = 'Solo letras minusculas, numeros y guiones'
  }

  if (!data.description.trim()) {
    errors.description = 'La descripcion es requerida'
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

  if (!data.name.trim()) {
    errors.name = 'El nombre es requerido'
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

  if (!data.name.trim()) {
    errors.name = 'El nombre es requerido'
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

  if (!data.name.trim()) {
    errors.name = 'El nombre es requerido'
  }

  if (!data.category_id) {
    errors.category_id = 'La categoria es requerida'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

// Product validation
export function validateProduct(data: ProductFormData): ValidationResult<ProductFormData> {
  const errors: ValidationErrors<ProductFormData> = {}

  if (!data.name.trim()) {
    errors.name = 'El nombre es requerido'
  }

  if (!data.description.trim()) {
    errors.description = 'La descripcion es requerida'
  }

  if (typeof data.price !== 'number' || isNaN(data.price) || data.price <= 0) {
    errors.price = 'El precio debe ser un numero mayor a 0'
  }

  if (!data.category_id) {
    errors.category_id = 'La categoria es requerida'
  }

  if (!data.subcategory_id) {
    errors.subcategory_id = 'La subcategoria es requerida'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

// Allergen validation
export function validateAllergen(data: AllergenFormData): ValidationResult<AllergenFormData> {
  const errors: ValidationErrors<AllergenFormData> = {}

  if (!data.name.trim()) {
    errors.name = 'El nombre es requerido'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}
