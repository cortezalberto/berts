import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/layout'
import { ErrorBoundary } from './components/ui'
import {
  DashboardPage,
  RestaurantPage,
  BranchesPage,
  CategoriesPage,
  SubcategoriesPage,
  ProductsPage,
  PricesPage,
  AllergensPage,
  PromotionTypesPage,
  PromotionsPage,
  SettingsPage,
} from './pages'

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<DashboardPage />} />
            <Route path="restaurant" element={<RestaurantPage />} />
            <Route path="branches" element={<BranchesPage />} />
            <Route path="categories" element={<CategoriesPage />} />
            <Route path="subcategories" element={<SubcategoriesPage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="prices" element={<PricesPage />} />
            <Route path="allergens" element={<AllergensPage />} />
            <Route path="promotion-types" element={<PromotionTypesPage />} />
            <Route path="promotions" element={<PromotionsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
