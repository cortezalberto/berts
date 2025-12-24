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
- `src/components/ui/` - Reusable UI components (Button, Modal with focus trap, ErrorBoundary, etc.)
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
const categories = useCategoryStore(selectCategories)

// Filter by branch in useMemo
const branchCategories = useMemo(() => {
  if (!selectedBranchId) return []
  return categories.filter(
    (c) => c.branch_id === selectedBranchId && c.name !== HOME_CATEGORY_NAME
  )
}, [categories, selectedBranchId])
```

### Cascade Delete Pattern
When deleting a branch, cascade delete all related data:
```typescript
// In handleDelete for branches:
const branchCategories = getByBranch(selectedBranch.id)
const categoryIds = branchCategories.map((c) => c.id)
deleteByCategories(categoryIds)           // Delete products
deleteByCategories(categoryIds)           // Delete subcategories
deleteByBranchCategory(selectedBranch.id) // Delete categories
deleteBranch(selectedBranch.id)           // Delete branch
```

When deleting allergens, clean orphan references:
```typescript
removeAllergenFromProducts(allergenId)  // Clean allergen_ids arrays
deleteAllergen(allergenId)
```

### Constants and Configuration
All magic strings and configuration live in `src/utils/constants.ts`:
- `HOME_CATEGORY_NAME` - Special category name filter ('Home')
- `STORAGE_KEYS` - localStorage persistence keys (branches, categories, subcategories, products, allergens, promotion-types, promotions, restaurant)
- `STORE_VERSIONS` - For Zustand persist migrations (increment when changing data structure)
- `LOCALE` - Currency (ARS) and language (es-AR)
- `PATTERNS` - Validation regex patterns

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
- `/branches` - Branch management (CRUD)
- `/restaurant` - Restaurant settings
- `/categories` - Category management (branch-scoped)
- `/subcategories` - Subcategory management (branch-scoped)
- `/products` - Product management (branch-scoped)
- `/prices` - Price management (branch-scoped, bulk updates)
- `/allergens` - Allergen management (global)
- `/promotion-types` - Promotion types management (global)
- `/promotions` - Promotions management (multi-branch)
- `/settings` - App settings

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

### Accessibility
- Modal component includes focus trap via `useFocusTrap` hook
- Skip link in Layout for keyboard navigation
- aria-labels on icon-only buttons
- Screen reader text (`sr-only`) in Badge components for status context
- Table component supports keyboard navigation (Enter/Space) for clickable rows and requires `ariaLabel` prop
- Loading states include `role="status"` and sr-only text
- Icons use `aria-hidden="true"` when decorative, `aria-label` when meaningful

### Store Migrations
When modifying data structure, increment version in `STORE_VERSIONS` and add migrate function:
```typescript
persist(
  (set, get) => ({ ... }),
  {
    name: STORAGE_KEYS.PRODUCTS,
    version: STORE_VERSIONS.PRODUCTS,
    migrate: (persistedState, version) => {
      const state = persistedState as { products: Product[] }
      if (version < 2) {
        state.products = state.products.map(p => ({ ...p, allergen_ids: p.allergen_ids ?? [] }))
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
The hook auto-resets to page 1 when filtered data changes.

## Current State

- All data is client-side with mock data in stores (4 branches with categories/products)
- No backend integration - `src/services/` is ready for API client
- Uses `crypto.randomUUID()` for ID generation
- ErrorBoundary wraps the entire app in App.tsx
- 12 predefined allergens (Gluten, Lacteos, Huevos, Pescado, Mariscos, Frutos Secos, Soja, Apio, Mostaza, Sesamo, Sulfitos, Altramuces)
- 4 predefined promotion types (Happy Hour, Combo Familiar, 2x1, Descuento)
