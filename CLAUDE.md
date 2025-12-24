# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Restaurant Admin Dashboard ("barijho") for managing menu items - restaurants, categories, subcategories, and products. Built with React 19, TypeScript, and Vite. The UI is in Spanish.

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
- `src/components/layout/` - Layout, Sidebar (fixed w-64), PageContainer
- `src/components/ui/` - Reusable UI components (Button, Modal, Table, Toast, etc.)
- `src/pages/` - Page components for each route
- `src/stores/` - Zustand stores with persist middleware
- `src/types/index.ts` - Centralized TypeScript interfaces
- `src/hooks/` - Custom hooks (empty, ready for use)
- `src/services/` - API layer (empty, ready for backend integration)

### State Management Pattern
All Zustand stores follow this pattern:
```typescript
const useStore = create<State>()(
  persist(
    (set, get) => ({
      data: [],
      addItem: (data) => set(...),
      updateItem: (id, data) => set(...),
      deleteItem: (id) => set(...)
    }),
    { name: 'persistence-key' }
  )
)
```

Stores persist to localStorage with keys: `dashboard-categories`, `dashboard-subcategories`, `dashboard-products`, `dashboard-restaurant`.

### Routing
Routes are nested under the main Layout component:
- `/` - Dashboard
- `/restaurant` - Restaurant settings
- `/categories` - Category management
- `/subcategories` - Subcategory management
- `/products` - Product management
- `/settings` - App settings

### Type System
Types are centralized in `src/types/index.ts`. Data models (Restaurant, Category, Product) are separate from form data types (RestaurantFormData, etc.).

### Styling
- Dark theme with zinc backgrounds (bg-zinc-950)
- Orange-500 as primary accent color
- Custom animations defined in index.css (fade-in, zoom-in-95, slide-in-from-right)

## Current State

- All data is client-side with mock data in stores
- No backend integration - `src/services/` is ready for API client
- Uses `crypto.randomUUID()` for ID generation
