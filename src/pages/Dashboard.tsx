import { memo, useMemo } from 'react'
import {
  Package,
  FolderTree,
  Layers,
  Star,
  TrendingUp,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import { PageContainer } from '../components/layout'
import { Card } from '../components/ui'
import {
  useCategoryStore,
  selectCategories,
} from '../stores/categoryStore'
import {
  useSubcategoryStore,
  selectSubcategories,
} from '../stores/subcategoryStore'
import {
  useProductStore,
  selectProducts,
} from '../stores/productStore'
import { useRestaurantStore, selectRestaurant } from '../stores/restaurantStore'
import { HOME_CATEGORY_ID, LOCALE } from '../utils/constants'

interface StatCardProps {
  title: string
  value: number | string
  icon: React.ReactNode
  trend?: { value: number; isPositive: boolean }
  description?: string
}

const StatCard = memo(function StatCard({
  title,
  value,
  icon,
  trend,
  description,
}: StatCardProps) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-white">{value}</p>
          {trend && (
            <div className="mt-2 flex items-center gap-1">
              {trend.isPositive ? (
                <ArrowUpRight className="w-4 h-4 text-green-500" aria-hidden="true" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-red-500" aria-hidden="true" />
              )}
              <span
                className={`text-sm font-medium ${
                  trend.isPositive ? 'text-green-500' : 'text-red-500'
                }`}
              >
                {trend.value}%
              </span>
              <span className="text-sm text-zinc-500">vs mes anterior</span>
            </div>
          )}
          {description && (
            <p className="mt-1 text-sm text-zinc-500">{description}</p>
          )}
        </div>
        <div className="p-3 bg-orange-500/10 rounded-xl" aria-hidden="true">
          {icon}
        </div>
      </div>
    </Card>
  )
})

interface RecentItemProps {
  name: string
  category: string
  price: number
  image?: string
}

const RecentItem = memo(function RecentItem({
  name,
  category,
  price,
  image,
}: RecentItemProps) {
  const formattedPrice = useMemo(() => {
    return new Intl.NumberFormat(LOCALE.LANGUAGE, {
      style: 'currency',
      currency: LOCALE.CURRENCY,
    }).format(price)
  }, [price])

  return (
    <div className="flex items-center gap-3 py-3 border-b border-zinc-800 last:border-0">
      {image ? (
        <img
          src={image}
          alt={name}
          className="w-10 h-10 rounded-lg object-cover"
        />
      ) : (
        <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center">
          <Package className="w-5 h-5 text-zinc-600" aria-hidden="true" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-white truncate">{name}</p>
        <p className="text-xs text-zinc-500">{category}</p>
      </div>
      <p className="font-medium text-orange-500">{formattedPrice}</p>
    </div>
  )
})

export function DashboardPage() {
  // Using basic selectors that return stable references
  const restaurant = useRestaurantStore(selectRestaurant)
  const products = useProductStore(selectProducts)
  const categories = useCategoryStore(selectCategories)
  const subcategories = useSubcategoryStore(selectSubcategories)

  // Derive filtered data with useMemo to avoid infinite loops
  const activeProducts = useMemo(
    () => products.filter((p) => p.is_active !== false),
    [products]
  )
  const featuredProducts = useMemo(
    () => products.filter((p) => p.featured),
    [products]
  )
  const popularProducts = useMemo(
    () => products.filter((p) => p.popular),
    [products]
  )
  const activeCategories = useMemo(
    () => categories.filter((c) => c.is_active !== false && c.id !== HOME_CATEGORY_ID),
    [categories]
  )

  // Memoized calculations
  const activeSubcategoriesCount = useMemo(
    () => subcategories.filter((s) => s.is_active !== false).length,
    [subcategories]
  )

  const recentProducts = useMemo(() => {
    return [...products]
      .sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0
        return dateB - dateA
      })
      .slice(0, 5)
  }, [products])

  const getCategoryName = useMemo(() => {
    const categoryMap = new Map(activeCategories.map((c) => [c.id, c.name]))
    return (categoryId: string): string => categoryMap.get(categoryId) || 'Sin categoria'
  }, [activeCategories])

  const productsByCategory = useMemo(() => {
    return activeCategories
      .filter((c) => c.id !== HOME_CATEGORY_ID)
      .map((category) => {
        const count = products.filter((p) => p.category_id === category.id).length
        return { name: category.name, count }
      })
  }, [activeCategories, products])

  const averagePrice = useMemo(() => {
    if (products.length === 0) return '0.00'
    return (products.reduce((sum, p) => sum + p.price, 0) / products.length).toFixed(2)
  }, [products])

  const productsWithBadge = useMemo(
    () => products.filter((p) => p.badge).length,
    [products]
  )

  return (
    <PageContainer
      title={`Bienvenido${restaurant ? `, ${restaurant.name}` : ''}`}
      description="Panel de administracion del restaurante"
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Productos"
          value={products.length}
          icon={<Package className="w-6 h-6 text-orange-500" />}
          description={`${activeProducts.length} activos`}
        />
        <StatCard
          title="Categorias"
          value={activeCategories.length}
          icon={<FolderTree className="w-6 h-6 text-orange-500" />}
          description={`${subcategories.length} subcategorias`}
        />
        <StatCard
          title="Productos Destacados"
          value={featuredProducts.length}
          icon={<Star className="w-6 h-6 text-orange-500" />}
        />
        <StatCard
          title="Productos Populares"
          value={popularProducts.length}
          icon={<TrendingUp className="w-6 h-6 text-orange-500" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Products */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">
              Productos Recientes
            </h3>
            <a
              href="/products"
              className="text-sm text-orange-500 hover:text-orange-400"
            >
              Ver todos
            </a>
          </div>
          <div>
            {recentProducts.length > 0 ? (
              recentProducts.map((product) => (
                <RecentItem
                  key={product.id}
                  name={product.name}
                  category={getCategoryName(product.category_id)}
                  price={product.price}
                  image={product.image}
                />
              ))
            ) : (
              <p className="text-zinc-500 text-center py-8">
                No hay productos aun
              </p>
            )}
          </div>
        </Card>

        {/* Products by Category */}
        <Card>
          <h3 className="text-lg font-semibold text-white mb-4">
            Productos por Categoria
          </h3>
          <div className="space-y-4">
            {productsByCategory.map((item) => (
              <div key={item.name} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-white">
                      {item.name}
                    </span>
                    <span className="text-sm text-zinc-500">
                      {item.count} productos
                    </span>
                  </div>
                  <div
                    className="h-2 bg-zinc-800 rounded-full overflow-hidden"
                    role="progressbar"
                    aria-valuenow={products.length > 0 ? (item.count / products.length) * 100 : 0}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div
                      className="h-full bg-orange-500 rounded-full transition-all"
                      style={{
                        width: `${
                          products.length > 0
                            ? (item.count / products.length) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
            {productsByCategory.length === 0 && (
              <p className="text-zinc-500 text-center py-4">
                No hay categorias
              </p>
            )}
          </div>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-500" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm text-zinc-500">Subcategorias Activas</p>
              <p className="text-xl font-bold text-white">
                {activeSubcategoriesCount}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Layers className="w-5 h-5 text-blue-500" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm text-zinc-500">Promedio Precio</p>
              <p className="text-xl font-bold text-white">${averagePrice}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Package className="w-5 h-5 text-purple-500" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm text-zinc-500">Con Badge</p>
              <p className="text-xl font-bold text-white">{productsWithBadge}</p>
            </div>
          </div>
        </Card>
      </div>
    </PageContainer>
  )
}
