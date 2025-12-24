# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Restaurant Admin Dashboard ("barijho") for managing menu items - restaurants, categories, subcategories, products, and allergens. Built with React 19, TypeScript, and Vite. The UI is in Spanish.

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
- `src/hooks/` - Custom hooks (useModal, useFocusTrap)
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

### Constants and Configuration
All magic strings and configuration live in `src/utils/constants.ts`:
- `HOME_CATEGORY_ID` - Special category ID ('0')
- `STORAGE_KEYS` - localStorage persistence keys (categories, subcategories, products, allergens, restaurant)
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
- `/` - Dashboard
- `/restaurant` - Restaurant settings
- `/categories` - Category management
- `/subcategories` - Subcategory management
- `/products` - Product management
- `/allergens` - Allergen management
- `/settings` - App settings

### Type System
Types centralized in `src/types/index.ts`. Data models (Restaurant, Category, Product, Allergen) are separate from form data types (RestaurantFormData, etc.).

### Master-Detail Relationships
Products have a many-to-many relationship with Allergens via `allergen_ids: string[]`. Use the `AllergenSelect` component for multi-select in forms:
```typescript
<AllergenSelect
  label="Alergenos"
  value={formData.allergen_ids}
  onChange={(ids) => setFormData(prev => ({ ...prev, allergen_ids: ids }))}
/>
```

### Styling
- Dark theme with zinc backgrounds (bg-zinc-950)
- Orange-500 as primary accent color
- Custom animations in index.css (fade-in, zoom-in-95, slide-in-from-right)

### Accessibility
- Modal component includes focus trap via `useFocusTrap` hook
- Skip link in Layout for keyboard navigation
- aria-labels on icon-only buttons
- Screen reader text (`sr-only`) in Badge components for status context
- Table component supports keyboard navigation (Enter/Space) for clickable rows
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

## Current State

- All data is client-side with mock data in stores
- No backend integration - `src/services/` is ready for API client
- Uses `crypto.randomUUID()` for ID generation
- ErrorBoundary wraps the entire app in App.tsx
- 12 predefined allergens (Gluten, Lácteos, Huevos, Pescado, Mariscos, Frutos Secos, Soja, Apio, Mostaza, Sésamo, Sulfitos, Altramuces)
