import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/layout'
import {
  DashboardPage,
  RestaurantPage,
  CategoriesPage,
  SubcategoriesPage,
  ProductsPage,
  SettingsPage,
} from './pages'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="restaurant" element={<RestaurantPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="subcategories" element={<SubcategoriesPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
