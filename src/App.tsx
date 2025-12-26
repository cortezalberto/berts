import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/layout'
import { ErrorBoundary } from './components/ui'
import {
  DashboardPage,
  RestaurantPage,
  BranchesPage,
  TablesPage,
  StaffPage,
  OrdersPage,
  CategoriesPage,
  SubcategoriesPage,
  ProductsPage,
  PricesPage,
  AllergensPage,
  PromotionTypesPage,
  PromotionsPage,
  SettingsPage,
  SalesPage,
  HistoryBranchesPage,
  HistoryCustomersPage,
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
            <Route path="branches/tables" element={<TablesPage />} />
            <Route path="branches/staff" element={<StaffPage />} />
            <Route path="branches/orders" element={<OrdersPage />} />
            <Route path="categories" element={<CategoriesPage />} />
            <Route path="subcategories" element={<SubcategoriesPage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="prices" element={<PricesPage />} />
            <Route path="allergens" element={<AllergensPage />} />
            <Route path="promotion-types" element={<PromotionTypesPage />} />
            <Route path="promotions" element={<PromotionsPage />} />
            <Route path="statistics/sales" element={<SalesPage />} />
            <Route path="statistics/history/branches" element={<HistoryBranchesPage />} />
            <Route path="statistics/history/customers" element={<HistoryCustomersPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
