import { PageContainer } from '../components/layout'
import { Card, CardHeader, Button } from '../components/ui'
import { RefreshCw, Trash2, Download, Upload } from 'lucide-react'
import { useCategoryStore } from '../stores/categoryStore'
import { useSubcategoryStore } from '../stores/subcategoryStore'
import { useProductStore } from '../stores/productStore'
import { useRestaurantStore } from '../stores/restaurantStore'
import { toast } from '../stores/toastStore'

export function SettingsPage() {
  const categoryStore = useCategoryStore()
  const subcategoryStore = useSubcategoryStore()
  const productStore = useProductStore()
  const restaurantStore = useRestaurantStore()

  const handleExportData = () => {
    const data = {
      restaurant: restaurantStore.restaurant,
      categories: categoryStore.categories,
      subcategories: subcategoryStore.subcategories,
      products: productStore.products,
      exportedAt: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `barijho-backup-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast.success('Datos exportados correctamente')
  }

  const handleImportData = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      try {
        const text = await file.text()
        const data = JSON.parse(text)

        if (data.restaurant) {
          restaurantStore.setRestaurant(data.restaurant)
        }
        if (data.categories) {
          categoryStore.setCategories(data.categories)
        }
        if (data.subcategories) {
          subcategoryStore.setSubcategories(data.subcategories)
        }
        if (data.products) {
          productStore.setProducts(data.products)
        }

        toast.success('Datos importados correctamente')
      } catch {
        toast.error('Error al importar datos. Archivo invalido.')
      }
    }
    input.click()
  }

  const handleResetData = () => {
    if (
      window.confirm(
        '¿Estas seguro de resetear todos los datos? Esta accion no se puede deshacer.'
      )
    ) {
      localStorage.removeItem('dashboard-restaurant')
      localStorage.removeItem('dashboard-categories')
      localStorage.removeItem('dashboard-subcategories')
      localStorage.removeItem('dashboard-products')
      window.location.reload()
    }
  }

  const handleClearCache = () => {
    localStorage.removeItem('dashboard-restaurant')
    localStorage.removeItem('dashboard-categories')
    localStorage.removeItem('dashboard-subcategories')
    localStorage.removeItem('dashboard-products')
    toast.success('Cache limpiado. Recarga la pagina para ver los cambios.')
  }

  return (
    <PageContainer
      title="Configuracion"
      description="Administra la configuracion del dashboard"
    >
      <div className="max-w-2xl space-y-6">
        {/* Data Management */}
        <Card>
          <CardHeader
            title="Gestion de Datos"
            description="Exporta, importa o resetea los datos del dashboard"
          />

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg">
              <div>
                <p className="font-medium text-white">Exportar Datos</p>
                <p className="text-sm text-zinc-500">
                  Descarga un backup de todos los datos
                </p>
              </div>
              <Button
                variant="outline"
                onClick={handleExportData}
                leftIcon={<Download className="w-4 h-4" />}
              >
                Exportar
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg">
              <div>
                <p className="font-medium text-white">Importar Datos</p>
                <p className="text-sm text-zinc-500">
                  Restaura datos desde un archivo backup
                </p>
              </div>
              <Button
                variant="outline"
                onClick={handleImportData}
                leftIcon={<Upload className="w-4 h-4" />}
              >
                Importar
              </Button>
            </div>
          </div>
        </Card>

        {/* Cache */}
        <Card>
          <CardHeader
            title="Cache"
            description="Administra el cache local del navegador"
          />

          <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg">
            <div>
              <p className="font-medium text-white">Limpiar Cache</p>
              <p className="text-sm text-zinc-500">
                Elimina los datos almacenados en el navegador
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleClearCache}
              leftIcon={<RefreshCw className="w-4 h-4" />}
            >
              Limpiar
            </Button>
          </div>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-500/30">
          <CardHeader
            title="Zona de Peligro"
            description="Acciones destructivas e irreversibles"
          />

          <div className="flex items-center justify-between p-4 bg-red-500/10 rounded-lg border border-red-500/30">
            <div>
              <p className="font-medium text-red-400">Resetear Datos</p>
              <p className="text-sm text-red-400/70">
                Elimina todos los datos y restaura los valores por defecto
              </p>
            </div>
            <Button
              variant="danger"
              onClick={handleResetData}
              leftIcon={<Trash2 className="w-4 h-4" />}
            >
              Resetear
            </Button>
          </div>
        </Card>

        {/* Info */}
        <Card>
          <CardHeader title="Informacion" />
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-500">Version</span>
              <span className="text-white">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Categorias</span>
              <span className="text-white">{categoryStore.categories.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Subcategorias</span>
              <span className="text-white">{subcategoryStore.subcategories.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Productos</span>
              <span className="text-white">{productStore.products.length}</span>
            </div>
          </div>
        </Card>
      </div>
    </PageContainer>
  )
}
