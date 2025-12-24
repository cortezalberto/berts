import { useState, useMemo } from 'react'
import { Plus, Pencil, Trash2, Filter, Star, TrendingUp } from 'lucide-react'
import { PageContainer } from '../components/layout'
import {
  Card,
  Button,
  Table,
  Modal,
  Input,
  Select,
  Textarea,
  ImageUpload,
  Toggle,
  ConfirmDialog,
  Badge,
} from '../components/ui'
import { useCategoryStore } from '../stores/categoryStore'
import { useSubcategoryStore } from '../stores/subcategoryStore'
import { useProductStore } from '../stores/productStore'
import { toast } from '../stores/toastStore'
import type { Product, ProductFormData, TableColumn } from '../types'

const initialFormData: ProductFormData = {
  name: '',
  description: '',
  price: 0,
  image: '',
  category_id: '',
  subcategory_id: '',
  featured: false,
  popular: false,
  badge: '',
  allergens: [],
  is_active: true,
  stock: undefined,
}

export function ProductsPage() {
  const { categories } = useCategoryStore()
  const { subcategories, getByCategory } = useSubcategoryStore()
  const { products, addProduct, updateProduct, deleteProduct } = useProductStore()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [formData, setFormData] = useState<ProductFormData>(initialFormData)
  const [errors, setErrors] = useState<Partial<Record<keyof ProductFormData, string>>>({})
  const [filterCategory, setFilterCategory] = useState<string>('')
  const [filterSubcategory, setFilterSubcategory] = useState<string>('')

  // Filter categories (exclude Home category with id '0')
  const selectableCategories = categories.filter((c) => c.id !== '0')

  const categoryOptions = selectableCategories.map((c) => ({
    value: c.id,
    label: c.name,
  }))

  // Get subcategories for selected category in form
  const formSubcategoryOptions = useMemo(() => {
    if (!formData.category_id) return []
    return getByCategory(formData.category_id).map((s) => ({
      value: s.id,
      label: s.name,
    }))
  }, [formData.category_id, getByCategory])

  // Get subcategories for filter
  const filterSubcategoryOptions = useMemo(() => {
    if (!filterCategory) return []
    return getByCategory(filterCategory).map((s) => ({
      value: s.id,
      label: s.name,
    }))
  }, [filterCategory, getByCategory])

  const filteredProducts = useMemo(() => {
    let result = [...products]
    if (filterCategory) {
      result = result.filter((p) => p.category_id === filterCategory)
    }
    if (filterSubcategory) {
      result = result.filter((p) => p.subcategory_id === filterSubcategory)
    }
    return result.sort((a, b) => a.name.localeCompare(b.name))
  }, [products, filterCategory, filterSubcategory])

  const getCategoryName = (categoryId: string): string => {
    return categories.find((c) => c.id === categoryId)?.name || 'Sin categoria'
  }

  const getSubcategoryName = (subcategoryId: string): string => {
    return subcategories.find((s) => s.id === subcategoryId)?.name || 'Sin subcategoria'
  }

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(price)
  }

  const openCreateModal = () => {
    setSelectedProduct(null)
    const categoryId = filterCategory || selectableCategories[0]?.id || ''
    const subcats = getByCategory(categoryId)
    setFormData({
      ...initialFormData,
      category_id: categoryId,
      subcategory_id: filterSubcategory || subcats[0]?.id || '',
    })
    setErrors({})
    setIsModalOpen(true)
  }

  const openEditModal = (product: Product) => {
    setSelectedProduct(product)
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      image: product.image,
      category_id: product.category_id,
      subcategory_id: product.subcategory_id,
      featured: product.featured,
      popular: product.popular,
      badge: product.badge || '',
      allergens: product.allergens || [],
      is_active: product.is_active ?? true,
      stock: product.stock,
    })
    setErrors({})
    setIsModalOpen(true)
  }

  const openDeleteDialog = (product: Product) => {
    setSelectedProduct(product)
    setIsDeleteOpen(true)
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ProductFormData, string>> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido'
    }
    if (!formData.description.trim()) {
      newErrors.description = 'La descripcion es requerida'
    }
    if (formData.price <= 0) {
      newErrors.price = 'El precio debe ser mayor a 0'
    }
    if (!formData.category_id) {
      newErrors.category_id = 'La categoria es requerida'
    }
    if (!formData.subcategory_id) {
      newErrors.subcategory_id = 'La subcategoria es requerida'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (!validateForm()) return

    try {
      if (selectedProduct) {
        updateProduct(selectedProduct.id, formData)
        toast.success('Producto actualizado correctamente')
      } else {
        addProduct(formData)
        toast.success('Producto creado correctamente')
      }
      setIsModalOpen(false)
    } catch {
      toast.error('Error al guardar el producto')
    }
  }

  const handleDelete = () => {
    if (!selectedProduct) return

    try {
      deleteProduct(selectedProduct.id)
      toast.success('Producto eliminado correctamente')
      setIsDeleteOpen(false)
    } catch {
      toast.error('Error al eliminar el producto')
    }
  }

  const handleCategoryChange = (categoryId: string) => {
    const subcats = getByCategory(categoryId)
    setFormData((prev) => ({
      ...prev,
      category_id: categoryId,
      subcategory_id: subcats[0]?.id || '',
    }))
  }

  const columns: TableColumn<Product>[] = [
    {
      key: 'image',
      label: 'Imagen',
      width: 'w-20',
      render: (item) =>
        item.image ? (
          <img
            src={item.image}
            alt={item.name}
            className="w-12 h-12 rounded-lg object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-600">
            -
          </div>
        ),
    },
    {
      key: 'name',
      label: 'Producto',
      render: (item) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium">{item.name}</span>
            {item.featured && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
            {item.popular && <TrendingUp className="w-4 h-4 text-green-500" />}
          </div>
          <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">
            {item.description}
          </p>
        </div>
      ),
    },
    {
      key: 'price',
      label: 'Precio',
      width: 'w-28',
      render: (item) => (
        <span className="font-medium text-orange-500">{formatPrice(item.price)}</span>
      ),
    },
    {
      key: 'category_id',
      label: 'Categoria',
      render: (item) => (
        <div className="space-y-1">
          <Badge variant="info">{getCategoryName(item.category_id)}</Badge>
          <div className="text-xs text-zinc-500">
            {getSubcategoryName(item.subcategory_id)}
          </div>
        </div>
      ),
    },
    {
      key: 'badge',
      label: 'Badge',
      width: 'w-24',
      render: (item) =>
        item.badge ? (
          <Badge variant="warning">{item.badge}</Badge>
        ) : (
          <span className="text-zinc-600">-</span>
        ),
    },
    {
      key: 'is_active',
      label: 'Estado',
      width: 'w-24',
      render: (item) =>
        item.is_active !== false ? (
          <Badge variant="success">Activo</Badge>
        ) : (
          <Badge variant="danger">Inactivo</Badge>
        ),
    },
    {
      key: 'actions',
      label: 'Acciones',
      width: 'w-28',
      render: (item) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              openEditModal(item)
            }}
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              openDeleteDialog(item)
            }}
            className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <PageContainer
      title="Productos"
      description={`${products.length} productos en total`}
      actions={
        <Button onClick={openCreateModal} leftIcon={<Plus className="w-4 h-4" />}>
          Nuevo Producto
        </Button>
      }
    >
      {/* Filters */}
      <Card className="mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          <Filter className="w-5 h-5 text-zinc-500" />
          <Select
            options={[
              { value: '', label: 'Todas las categorias' },
              ...categoryOptions,
            ]}
            value={filterCategory}
            onChange={(e) => {
              setFilterCategory(e.target.value)
              setFilterSubcategory('')
            }}
            className="w-48"
          />
          {filterCategory && (
            <Select
              options={[
                { value: '', label: 'Todas las subcategorias' },
                ...filterSubcategoryOptions,
              ]}
              value={filterSubcategory}
              onChange={(e) => setFilterSubcategory(e.target.value)}
              className="w-48"
            />
          )}
          {(filterCategory || filterSubcategory) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilterCategory('')
                setFilterSubcategory('')
              }}
            >
              Limpiar filtros
            </Button>
          )}
          <div className="ml-auto text-sm text-zinc-500">
            Mostrando {filteredProducts.length} de {products.length} productos
          </div>
        </div>
      </Card>

      <Card padding="none">
        <Table
          data={filteredProducts}
          columns={columns}
          emptyMessage="No hay productos. Crea uno para comenzar."
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedProduct ? 'Editar Producto' : 'Nuevo Producto'}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>
              {selectedProduct ? 'Guardar' : 'Crear'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Categoria"
              options={categoryOptions}
              value={formData.category_id}
              onChange={(e) => handleCategoryChange(e.target.value)}
              placeholder="Selecciona una categoria"
              error={errors.category_id}
            />

            <Select
              label="Subcategoria"
              options={formSubcategoryOptions}
              value={formData.subcategory_id}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, subcategory_id: e.target.value }))
              }
              placeholder="Selecciona una subcategoria"
              error={errors.subcategory_id}
              disabled={!formData.category_id}
            />
          </div>

          <Input
            label="Nombre"
            value={formData.name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder="Ej: Hamburguesa Clasica"
            error={errors.name}
          />

          <Textarea
            label="Descripcion"
            value={formData.description}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, description: e.target.value }))
            }
            placeholder="Descripcion del producto..."
            error={errors.description}
            rows={2}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Precio"
              type="number"
              value={formData.price}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  price: parseFloat(e.target.value) || 0,
                }))
              }
              min={0}
              step={0.01}
              error={errors.price}
            />

            <Input
              label="Badge (opcional)"
              value={formData.badge || ''}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, badge: e.target.value }))
              }
              placeholder="Ej: VEGANO, NUEVO, PROMO"
            />
          </div>

          <ImageUpload
            label="Imagen"
            value={formData.image}
            onChange={(url) =>
              setFormData((prev) => ({ ...prev, image: url }))
            }
          />

          <div className="flex gap-6">
            <Toggle
              label="Destacado"
              checked={formData.featured}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, featured: e.target.checked }))
              }
            />

            <Toggle
              label="Popular"
              checked={formData.popular}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, popular: e.target.checked }))
              }
            />

            <Toggle
              label="Activo"
              checked={formData.is_active}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, is_active: e.target.checked }))
              }
            />
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Eliminar Producto"
        message={`¿Estas seguro de eliminar "${selectedProduct?.name}"?`}
        confirmLabel="Eliminar"
      />
    </PageContainer>
  )
}
