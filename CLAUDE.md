# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Restaurant Admin Dashboard ("barijho") for managing menu items with multi-branch support. Built with React 19, TypeScript, and Vite. The UI is in Spanish.

**Data Hierarchy:**
```
Restaurant (1) → Branch (N) → Category (N) → Subcategory (N) → Product (N)
                    ↑                                              ↓
              Promotion (M:N via branch_ids[])              Allergen (M:N)
                    ↓                                              ↓
            PromotionItem (N) → Product ←─────────────── BranchPrice (N)
```

**Branch Selection:** No branch is selected by default. Users must select a branch from the Dashboard to view/edit categories, subcategories, products, and prices.

## Commands

```bash
npm run dev       # Start dev server (port 5177)
npm run build     # Production build
npm run lint      # Run ESLint
npm run preview   # Preview production build
```

## Architecture

### Tech Stack
- React 19 + React Router 7 (nested routes under Layout)
- TypeScript 5.9 (strict mode)
- Zustand 5 for state management with localStorage persistence
- Tailwind CSS 4 for styling
- Lucide React for icons

### Directory Structure
- `src/components/layout/` - Layout (with skip links), Sidebar, PageContainer
- `src/components/ui/` - Reusable UI components (Button, Modal, HelpButton, ErrorBoundary, etc.)
- `src/pages/` - Page components for each route
- `src/stores/` - Zustand stores with persist middleware and selectors
- `src/types/index.ts` - Centralized TypeScript interfaces
- `src/hooks/` - Custom hooks (usePagination, useFocusTrap, useModal)
- `src/utils/` - Constants, validation, and logging utilities
- `src/services/` - API layer (empty, ready for backend integration)

### State Management Pattern
All Zustand stores use selectors for optimized re-renders. Never destructure from store calls:
```typescript
// Store definition with version for migrations
export const useStore = create<State>()(
  persist(
    (set, get) => ({ ... }),
    { name: STORAGE_KEYS.STORE_NAME, version: STORE_VERSIONS.STORE_NAME }
  )
)

// Selectors exported from store files
export const selectItems = (state: State) => state.items

// Usage in components (avoids unnecessary re-renders)
const items = useStore(selectItems)           // ✓ Use selectors
const addItem = useStore((s) => s.addItem)    // ✓ Use inline for actions
// const { items } = useStore()               // ✗ Never destructure
```

For derived/filtered data, use `useMemo` to avoid infinite loops:
```typescript
const filteredItems = useMemo(() =>
  items.filter(i => i.active),
  [items]
)
```

### Branch-Scoped Data
Categories, subcategories, and products are scoped by branch. Use `selectedBranchId` from branchStore:
```typescript
const selectedBranchId = useBranchStore(selectSelectedBranchId)
const selectedBranch = useBranchStore(selectBranchById(selectedBranchId))  // Pass null directly, not ''
const categories = useCategoryStore(selectCategories)

// Filter by branch in useMemo - use HOME_CATEGORY_NAME, never id '0'
const branchCategories = useMemo(() => {
  if (!selectedBranchId) return []
  return categories.filter(
    (c) => c.branch_id === selectedBranchId && c.name !== HOME_CATEGORY_NAME
  )
}, [categories, selectedBranchId])
```

**Important:** The `selectBranchById` selector accepts `string | null`. Pass `selectedBranchId` directly without fallback to empty string.

### Cascade Delete Pattern
When deleting a branch, validate existence first and cascade delete all related data:
```typescript
// In handleDelete for branches:
const branchExists = branches.some((b) => b.id === selectedBranch.id)
if (!branchExists) return  // Validate before cascade

const branchCategories = getByBranch(selectedBranch.id)
const categoryIds = branchCategories.map((c) => c.id)
if (categoryIds.length > 0) {
  deleteByProductCategories(categoryIds)  // Delete products
  deleteByCategories(categoryIds)         // Delete subcategories
}
deleteByBranchCategory(selectedBranch.id) // Delete categories
removeBranchFromPromotions(selectedBranch.id) // Remove from promotions (deletes if empty)
deleteBranch(selectedBranch.id)           // Delete branch
```

When deleting allergens, clean orphan references first, then delete:
```typescript
// Validate existence first
const allergenExists = allergens.some((a) => a.id === allergenId)
if (!allergenExists) return

removeAllergenFromProducts(allergenId)  // Clean allergen_ids arrays FIRST
deleteAllergen(allergenId)              // Then delete allergen
```

When deleting promotion types, validate existence and delete related promotions:
```typescript
// Validate existence first
const typeExists = promotionTypes.some((pt) => pt.id === typeId)
if (!typeExists) return

clearPromotionType(typeId)  // Deletes all promotions with this type
deletePromotionType(typeId)
```

When deleting products, promotions that become empty are also deleted:
```typescript
removeProductFromPromotions(productId)  // Removes product, deletes empty promotions
```

### Constants and Configuration
All magic strings and configuration live in `src/utils/constants.ts`:
- `HOME_CATEGORY_NAME` - Special category name filter ('Home')
- `STORAGE_KEYS` - localStorage persistence keys (branches, categories, subcategories, products, allergens, promotion-types, promotions, restaurant)
- `STORE_VERSIONS` - For Zustand persist migrations (increment when changing data structure)
- `LOCALE` - Currency (ARS) and language (es-AR)
- `PATTERNS` - Validation regex patterns
- `formatPrice(price)` - Centralized price formatter with edge case handling
- `sanitizeText(text)` - HTML escape for XSS prevention

### Validation
Centralized validation in `src/utils/validation.ts`. Always use these validators instead of inline validation:
```typescript
const { isValid, errors } = validateCategory(formData)
// errors is typed as ValidationErrors<CategoryFormData>

// In state declaration:
const [errors, setErrors] = useState<ValidationErrors<CategoryFormData>>({})
```

### Error Handling
Use `handleError()` from `src/utils/logger.ts` in catch blocks:
```typescript
catch (error) {
  const message = handleError(error, 'ComponentName.functionName')
  toast.error(message)
}
```

### Routing
Routes nested under Layout component (includes skip link for accessibility):
- `/` - Dashboard (branch selection)
- `/restaurant` - Restaurant settings
- **Gestión > Sucursales:**
  - `/branches` - Branch management (CRUD)
  - `/branches/tables` - Tables management (placeholder)
  - `/branches/staff` - Staff management (placeholder)
  - `/branches/orders` - Orders management (placeholder)
- **Gestión > Productos:**
  - `/categories` - Category management (branch-scoped)
  - `/subcategories` - Subcategory management (branch-scoped)
  - `/products` - Product/Platos management (branch-scoped)
  - `/allergens` - Allergen management (global)
- **Marketing:**
  - `/prices` - Price management (branch-scoped, bulk updates)
  - `/promotion-types` - Promotion types management (global)
  - `/promotions` - Promotions management (multi-branch)
- `/settings` - App settings

### Sidebar Navigation Structure
The sidebar uses a hierarchical collapsible navigation defined in `src/components/layout/Sidebar.tsx`:
```
Dashboard
Restaurante
▸ Gestión (collapsible group)
  ▸ Sucursales (collapsible subgroup)
    - Todas → /branches
    - Mesas → /branches/tables
    - Personal → /branches/staff
    - Pedidos → /branches/orders
  ▸ Productos (collapsible subgroup)
    - Categorías → /categories
    - Subcategorías → /subcategories
    - Platos → /products
    - Alérgenos → /allergens
▸ Marketing (collapsible group)
  - Precios → /prices
  - Tipos de Promo → /promotion-types
  - Promociones → /promotions
Configuración (bottom)
```

Groups auto-expand when navigating to a child route. State is managed with `openGroups: Record<string, boolean>`.

### Type System
Types centralized in `src/types/index.ts`. Data models (Restaurant, Branch, Category, Product, Allergen, PromotionType, Promotion) are separate from form data types (RestaurantFormData, etc.).

### Per-Branch Pricing
Products support per-branch pricing with the `BranchPrice` type:
```typescript
interface BranchPrice {
  branch_id: string
  price: number
  is_active: boolean  // false = product not sold at this branch
}

interface Product {
  price: number                  // Base price (used when use_branch_prices is false)
  branch_prices: BranchPrice[]   // Per-branch pricing
  use_branch_prices: boolean     // Toggle for per-branch mode
  // ...other fields
}
```

Use `BranchPriceInput` component for the UI. Validation returns both `errors` and `branchPriceErrors`:
```typescript
const validation = validateProduct(formData)
if (!validation.isValid) {
  setErrors(validation.errors)
  setBranchPriceErrors(validation.branchPriceErrors)  // Record<branch_id, string>
  return
}
```

**Important:** Always use null-safe access for arrays that may be undefined:
```typescript
// branch_prices
const branchPrices = item.branch_prices ?? []
if (!item.use_branch_prices || branchPrices.length === 0) {
  // Show base price
}

// allergen_ids in store operations
allergen_ids: (prod.allergen_ids ?? []).filter((id) => id !== allergenId)
```

### Master-Detail Relationships
Products have a many-to-many relationship with Allergens via `allergen_ids: string[]`. Use the `AllergenSelect` component for multi-select in forms:
```typescript
<AllergenSelect
  label="Alergenos"
  value={formData.allergen_ids}
  onChange={(ids) => setFormData(prev => ({ ...prev, allergen_ids: ids }))}
/>
```

### Promotions System
Promotions are combos of products with time-based scheduling. Use `ProductSelect` for products, `BranchCheckboxes` for branches:
```typescript
interface Promotion {
  id: string
  name: string
  price: number
  start_date: string        // YYYY-MM-DD
  end_date: string          // YYYY-MM-DD
  start_time: string        // HH:mm (e.g., "17:00")
  end_time: string          // HH:mm (e.g., "20:00")
  promotion_type_id: string // Reference to PromotionType
  branch_ids: string[]      // Explicit list of branch IDs
  items: PromotionItem[]    // Products in the combo
  is_active: boolean
}

// Validation with context:
const validation = validatePromotion(formData, { isEditing: !!selectedPromotion })
```

**Promotion Validation Rules:**
- New promotions: `start_date` and `start_time` must be in the future
- Editing: start date/time validation is skipped (allows editing past promotions)
- `end_date` must be >= `start_date`
- Cannot activate a promotion with `end_date` in the past
- Same-day promotions: `end_time` must be > `start_time`

Note: `branch_ids` always contains explicit IDs. All branches selected by default when creating.

### Styling
- Dark theme with zinc backgrounds (bg-zinc-950)
- Orange-500 as primary accent color
- Custom animations in index.css (fade-in, zoom-in-95, slide-in-from-right)

### Help System
Each page includes a centered red help button (`HelpButton`) that opens a modal with detailed page functionality:
```typescript
import { helpContent } from '../utils/helpContent'

<PageContainer
  title="Productos"
  description="..."
  helpContent={helpContent.products}  // ReactNode with Spanish help text
>
```

Help content is centralized in `src/utils/helpContent.tsx` with entries for: dashboard, restaurant, branches, categories, subcategories, products, prices, allergens, promotionTypes, promotions, settings.

**Form Modal Help:** Each create/edit modal includes a small HelpButton (`size="sm"`) at the top of the form that explains all fields:
```typescript
<Modal isOpen={isModalOpen} onClose={...} title="..." footer={...}>
  <div className="space-y-4">
    <div className="flex items-center gap-2 mb-2">
      <HelpButton
        title="Formulario de Categoria"
        size="sm"
        content={
          <div className="space-y-3">
            <p><strong>Completa los siguientes campos</strong>...</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Nombre:</strong> ...</li>
            </ul>
            <div className="bg-zinc-800 p-3 rounded-lg mt-3">
              <p className="text-orange-400 font-medium text-sm">Consejo:</p>
              <p className="text-sm mt-1">...</p>
            </div>
          </div>
        }
      />
      <span className="text-sm text-zinc-400">Ayuda sobre el formulario</span>
    </div>
    {/* Form fields */}
  </div>
</Modal>
```

### Accessibility
- Modal component includes focus trap via `useFocusTrap` hook
- Skip link in Layout for keyboard navigation
- aria-labels on icon-only buttons (use proper Spanish accents: "página", "notificación")
- Screen reader text (`sr-only`) in Badge components for status context
- Table component supports keyboard navigation (Enter/Space) for clickable rows and requires `ariaLabel` prop
- Loading states include `role="status"` and sr-only text
- Icons use `aria-hidden="true"` when decorative, `aria-label` when meaningful
- HelpButton provides contextual help for each page
- Toast notifications use `role="alert"` and `aria-live` (assertive for errors, polite for others)
- Form inputs use `useId()` hook for unique IDs (never hardcode IDs)

### Store Migrations
When modifying data structure, increment version in `STORE_VERSIONS` and add migrate function. **Always use non-destructive merging** to preserve user data:
```typescript
persist(
  (set, get) => ({ ... }),
  {
    name: STORAGE_KEYS.PRODUCTS,
    version: STORE_VERSIONS.PRODUCTS,
    migrate: (persistedState, version) => {
      const state = persistedState as { products: Product[] }

      // Validate array exists
      if (!Array.isArray(state.products)) {
        state.products = initialProducts
        return state
      }

      // Non-destructive merge: only add missing initial items
      if (version < 4) {
        const existingIds = new Set(state.products.map(p => p.id))
        const missing = initialProducts.filter(p => !existingIds.has(p.id))
        state.products = [...state.products, ...missing]
      }

      // Add new fields with defaults
      if (version < 5) {
        state.products = state.products.map(p => ({
          ...p,
          newField: p.newField ?? defaultValue,
        }))
      }

      return state
    },
  }
)
```

### Toast Notifications
Use the `toast` helper from `src/stores/toastStore.ts`:
```typescript
import { toast } from '../stores/toastStore'

toast.success('Operacion exitosa')
toast.error('Error al guardar')
toast.warning('Advertencia')
toast.info('Informacion')
```
**Limits:** Maximum 5 toasts displayed simultaneously to prevent memory issues. Oldest toast is removed when limit is reached.

### Pagination
All listing pages use the `usePagination` hook with 10 items per page:
```typescript
import { usePagination } from '../hooks/usePagination'
import { Pagination } from '../components/ui'

const {
  paginatedItems,
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  setCurrentPage,
} = usePagination(sortedItems)

// In JSX:
<Table data={paginatedItems} columns={columns} ... />
<Pagination
  currentPage={currentPage}
  totalPages={totalPages}
  totalItems={totalItems}
  itemsPerPage={itemsPerPage}
  onPageChange={setCurrentPage}
/>
```
The hook auto-resets to page 1 when `currentPage > totalPages` (e.g., after filtering reduces items). Uses `useLayoutEffect` with a ref flag to prevent infinite loops.

### Price Formatting
Use the centralized `formatPrice` function from `src/utils/constants.ts`:
```typescript
import { formatPrice } from '../utils/constants'

// Usage: {formatPrice(item.price)} → "$ 5.000,00"
// Handles edge cases like NaN and Infinity
```

### Event Listener Pattern in Modals
When registering event listeners in useEffect that depend on callback props, use `useRef` and update in a separate effect to avoid setting refs during render:
```typescript
// Use ref to avoid re-registering listeners when onClose changes
const onCloseRef = useRef(onClose)

// Update ref in effect (NOT during render - causes linter error)
useEffect(() => {
  onCloseRef.current = onClose
}, [onClose])

useEffect(() => {
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') onCloseRef.current()
  }

  if (isOpen) {
    document.addEventListener('keydown', handleEscape)
  }

  return () => {
    document.removeEventListener('keydown', handleEscape)
  }
}, [isOpen])  // Only depend on isOpen, not onClose
```

### Nested Modals
The Modal component tracks open modal count via `document.body.dataset.modalCount`. This ensures:
- Body overflow is only restored when the **last** modal closes
- Nested modals (e.g., confirm dialog inside edit modal) work correctly
- No scroll restoration bugs when closing inner modals

## Mock Data Structure

All stores contain consistent mock data for development. Key relationships:
- **Restaurant**: Single restaurant with `id: 'restaurant-1'`
- **Branches**: 4 branches (`branch-1` to `branch-4`) all linked to `restaurant_id: 'restaurant-1'`
- **Products**: IDs are simple strings (`'1'` to `'14'` for branch-1 products)
- **Promotions**: Reference products by their actual IDs (e.g., `product_id: '3'` for Hamburguesa Clasica)

When adding mock data, ensure:
1. Foreign keys match existing entities (e.g., `restaurant_id` matches the actual restaurant)
2. Product IDs in promotions reference existing products from productStore
3. Dates are set to the future for active promotions

## Security Patterns

### File Import Security
`Settings.tsx` validates imported JSON files:
```typescript
// Maximum file size (5MB) to prevent DoS
const MAX_IMPORT_FILE_SIZE = 5 * 1024 * 1024

// Validate file type and size before processing
if (file.size > MAX_IMPORT_FILE_SIZE) {
  toast.error('Archivo muy grande. El tamaño máximo es 5MB.')
  return
}
if (!file.name.endsWith('.json')) {
  toast.error('Solo se permiten archivos .json')
  return
}

// Deep structure validation before importing
const validateImportData = (data: unknown) => {
  // Validates restaurant has name/slug
  // Validates categories have id/name/branch_id
  // Validates subcategories have id/name/category_id
  // Validates products have id/name/category_id
}
```

### URL Sanitization
`ImageUpload` component validates URLs to prevent XSS:
```typescript
// Only http:// and https:// protocols allowed
// Blocks javascript:, data:, and other dangerous protocols
const sanitized = sanitizeImageUrl(inputUrl)
if (!sanitized) {
  setUrlError('URL invalida. Usa una URL http:// o https://')
  return
}
```

### Text Sanitization
Use `sanitizeText()` from constants when rendering user input in contexts where HTML could be interpreted:
```typescript
import { sanitizeText } from '../utils/constants'
const safe = sanitizeText(userInput)  // Escapes &, <, >, ", '
```

### Validation Consistency
All validators in `validation.ts` use:
- `MIN_NAME_LENGTH = 2`, `MAX_NAME_LENGTH = 100` for name fields
- `MAX_DESCRIPTION_LENGTH = 500`, `MAX_ADDRESS_LENGTH = 200` for text fields
- `isValidPhone()` for phone validation (accepts formats like +54 11 1234-5678)
- Local timezone helpers (`getLocalDateString`, `getLocalTimeString`) for date/time comparisons
- Trimmed input before validation
- Prices must be > 0 (not just >= 0)

### Number Input Handling
Always use safe parsing for number inputs to handle edge cases:
```typescript
// WRONG: parseFloat can return incorrect values
onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}

// CORRECT: Handle empty strings and validate
onChange={(e) => {
  const value = e.target.value.trim()
  const parsed = value === '' ? 0 : Number(value)
  setPrice(isNaN(parsed) ? 0 : Math.max(0, parsed))
}}

// For parseInt, always specify radix 10
parseInt(e.target.value, 10) || 0
```

### Error Message Security
`handleError()` in `logger.ts` returns user-friendly messages that don't expose internal details:
```typescript
// Internal: "TypeError: Cannot read property 'x' of undefined"
// User sees: "Ocurrió un error. Intenta nuevamente."

// Errors are classified and mapped to safe messages:
// - network errors → "Error de conexión. Verifica tu internet."
// - validation errors → "Los datos ingresados no son válidos."
// - 404 errors → "El recurso solicitado no existe."
// - auth errors → "No tienes permisos para esta acción."
```

## Current State

- All data is client-side with mock data in stores (4 branches with categories/products)
- No backend integration - `src/services/` is ready for API client
- Uses `crypto.randomUUID()` for ID generation
- ErrorBoundary wraps the entire app in App.tsx
- 12 predefined allergens (Gluten, Lacteos, Huevos, Pescado, Mariscos, Frutos Secos, Soja, Apio, Mostaza, Sesamo, Sulfitos, Altramuces)
- 4 predefined promotion types (Happy Hour, Combo Familiar, 2x1, Descuento)
- Tables, Staff, and Orders pages are placeholder stubs under `/branches/*`
- Store versions: BRANCHES=3, CATEGORIES=3, SUBCATEGORIES=3, PRODUCTS=5, ALLERGENS=2, PROMOTIONS=3, PROMOTION_TYPES=2
