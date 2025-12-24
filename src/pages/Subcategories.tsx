import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Pencil, Trash2, Filter } from 'lucide-react'
import { PageContainer } from '../components/layout'
import {
  Card,
  Button,
  Table,
  Modal,
  Input,
  Select,
  ImageUpload,
  Toggle,
  ConfirmDialog,
  Badge,
  Pagination,
} from '../components/ui'
import { usePagination } from '../hooks/usePagination'
import { useCategoryStore, selectCategories } from '../stores/categoryStore'
import {
  useSubcategoryStore,
  selectSubcategories,
} from '../stores/subcategoryStore'
import { useProductStore, selectProducts } from '../stores/productStore'
import {
  useBranchStore,
  selectSelectedBranchId,
  selectBranchById,
} from '../stores/branchStore'
import { toast } from '../stores/toastStore'
import { validateSubcategory, type ValidationErrors } from '../utils/validation'
import { handleError } from '../utils/logger'
import { HOME_CATEGORY_NAME } from '../utils/constants'
import type { Subcategory, SubcategoryFormData, TableColumn } from '../types'

const initialFormData: SubcategoryFormData = {
  name: '',
  category_id: '',
  image: '',
  order: 0,
  is_active: true,
}

export function SubcategoriesPage() {
  const navigate = useNavigate()

  // Use selectors for stable references
  const categories = useCategoryStore(selectCategories)
  const subcategories = useSubcategoryStore(selectSubcategories)
  const addSubcategory = useSubcategoryStore((s) => s.addSubcategory)
  const updateSubcategory = useSubcategoryStore((s) => s.updateSubcategory)
  const deleteSubcategory = useSubcategoryStore((s) => s.deleteSubcategory)
  const getByCategory = useSubcategoryStore((s) => s.getByCategory)

  const products = useProductStore(selectProducts)
  const deleteProductsBySubcategory = useProductStore((s) => s.deleteBySubcategory)

  const selectedBranchId = useBranchStore(selectSelectedBranchId)
  const selectedBranch = useBranchStore(selectBranchById(selectedBranchId || ''))

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedSubcategory, setSelectedSubcategory] = useState<Subcategory | null>(null)
  const [formData, setFormData] = useState<SubcategoryFormData>(initialFormData)
  const [errors, setErrors] = useState<ValidationErrors<SubcategoryFormData>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [filterCategory, setFilterCategory] = useState<string>('')

  // Filtrar categorias por sucursal seleccionada
  const branchCategories = useMemo(() => {
    if (!selectedBranchId) return []
    return categories.filter(
      (c) => c.branch_id === selectedBranchId && c.name !== HOME_CATEGORY_NAME
    )
  }, [categories, selectedBranchId])

  // Memoized derived data
  const selectableCategories = useMemo(
    () => branchCategories.filter((c) => c.id !== '0'),
    [branchCategories]
  )

  const categoryOptions = useMemo(
    () => selectableCategories.map((c) => ({ value: c.id, label: c.name })),
    [selectableCategories]
  )

  const categoryMap = useMemo(
    () => new Map(branchCategories.map((c) => [c.id, c.name])),
    [branchCategories]
  )

  // Pre-calculate product counts per subcategory for O(1) lookup
  const productCountMap = useMemo(() => {
    const counts = new Map<string, number>()
    products.forEach((p) => {
      counts.set(p.subcategory_id, (counts.get(p.subcategory_id) || 0) + 1)
    })
    return counts
  }, [products])

  // Obtener IDs de categorias de esta sucursal
  const branchCategoryIds = useMemo(
    () => new Set(branchCategories.map((c) => c.id)),
    [branchCategories]
  )

  const filteredSubcategories = useMemo(() => {
    // Filtrar por sucursal primero
    let result = subcategories.filter((s) => branchCategoryIds.has(s.category_id))
    if (filterCategory) {
      result = result.filter((s) => s.category_id === filterCategory)
    }
    return result.sort((a, b) => {
      if (a.category_id !== b.category_id) {
        return a.category_id.localeCompare(b.category_id)
      }
      return a.order - b.order
    })
  }, [subcategories, branchCategoryIds, filterCategory])

  const {
    paginatedItems: paginatedSubcategories,
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    setCurrentPage,
  } = usePagination(filteredSubcategories)

  const openCreateModal = useCallback(() => {
    if (!selectedBranchId) {
      toast.error('Selecciona una sucursal primero')
      return
    }
    if (selectableCategories.length === 0) {
      toast.error('No hay categorias en esta sucursal. Crea una primero.')
      return
    }
    setSelectedSubcategory(null)
    const categoryId = filterCategory || selectableCategories[0]?.id || ''
    const categorySubcats = getByCategory(categoryId)
    setFormData({
      ...initialFormData,
      category_id: categoryId,
      order: Math.max(...categorySubcats.map((s) => s.order), 0) + 1,
    })
    setErrors({})
    setIsModalOpen(true)
  }, [filterCategory, selectableCategories, getByCategory, selectedBranchId])

  const openEditModal = useCallback((subcategory: Subcategory) => {
    setSelectedSubcategory(subcategory)
    setFormData({
      name: subcategory.name,
      category_id: subcategory.category_id,
      image: subcategory.image,
      order: subcategory.order,
      is_active: subcategory.is_active ?? true,
    })
    setErrors({})
    setIsModalOpen(true)
  }, [])

  const openDeleteDialog = useCallback((subcategory: Subcategory) => {
    setSelectedSubcategory(subcategory)
    setIsDeleteOpen(true)
  }, [])

  const handleSubmit = useCallback(async () => {
    const validation = validateSubcategory(formData)
    if (!validation.isValid) {
      setErrors(validation.errors)
      return
    }

    setIsSubmitting(true)
    try {
      if (selectedSubcategory) {
        updateSubcategory(selectedSubcategory.id, formData)
        toast.success('Subcategoria actualizada correctamente')
      } else {
        addSubcategory(formData)
        toast.success('Subcategoria creada correctamente')
      }
      setIsModalOpen(false)
    } catch (error) {
      const message = handleError(error, 'SubcategoriesPage.handleSubmit')
      toast.error(`Error al guardar la subcategoria: ${message}`)
    } finally {
      setIsSubmitting(false)
    }
  }, [formData, selectedSubcategory, updateSubcategory, addSubcategory])

  const handleDelete = useCallback(() => {
    if (!selectedSubcategory) return

    try {
      deleteProductsBySubcategory(selectedSubcategory.id)
      deleteSubcategory(selectedSubcategory.id)
      toast.success('Subcategoria eliminada correctamente')
      setIsDeleteOpen(false)
    } catch (error) {
      const message = handleError(error, 'SubcategoriesPage.handleDelete')
      toast.error(`Error al eliminar la subcategoria: ${message}`)
    }
  }, [selectedSubcategory, deleteProductsBySubcategory, deleteSubcategory])

  const columns: TableColumn<Subcategory>[] = useMemo(
    () => [
      {
        key: 'image',
        label: 'Imagen',
        width: 'w-20',
        render: (item) =>
          item.image ? (
            <img
              src={item.image}
              alt={`Imagen de ${item.name}`}
              className="w-12 h-12 rounded-lg object-cover"
            />
          ) : (
            <div
              className="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-600"
              aria-label="Sin imagen"
            >
              -
            </div>
          ),
      },
      {
        key: 'name',
        label: 'Nombre',
        render: (item) => <span className="font-medium">{item.name}</span>,
      },
      {
        key: 'category_id',
        label: 'Categoria',
        render: (item) => (
          <Badge variant="info">{categoryMap.get(item.category_id) || 'Sin categoria'}</Badge>
        ),
      },
      {
        key: 'order',
        label: 'Orden',
        width: 'w-20',
        render: (item) => item.order,
      },
      {
        key: 'is_active',
        label: 'Estado',
        width: 'w-24',
        render: (item) =>
          item.is_active !== false ? (
            <Badge variant="success">
              <span className="sr-only">Estado:</span> Activa
            </Badge>
          ) : (
            <Badge variant="danger">
              <span className="sr-only">Estado:</span> Inactiva
            </Badge>
          ),
      },
      {
        key: 'products',
        label: 'Productos',
        width: 'w-28',
        render: (item) => {
          const count = productCountMap.get(item.id) || 0
          return <span className="text-zinc-500">{count} productos</span>
        },
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
              aria-label={`Editar ${item.name}`}
            >
              <Pencil className="w-4 h-4" aria-hidden="true" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                openDeleteDialog(item)
              }}
              className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
              aria-label={`Eliminar ${item.name}`}
            >
              <Trash2 className="w-4 h-4" aria-hidden="true" />
            </Button>
          </div>
        ),
      },
    ],
    [categoryMap, productCountMap, openEditModal, openDeleteDialog]
  )

  // Si no hay sucursal seleccionada, mostrar mensaje
  if (!selectedBranchId) {
    return (
      <PageContainer
        title="Subcategorias"
        description="Selecciona una sucursal para ver sus subcategorias"
      >
        <Card className="text-center py-12">
          <p className="text-zinc-500 mb-4">
            Selecciona una sucursal desde el Dashboard para ver sus subcategorias
          </p>
          <Button onClick={() => navigate('/')}>Ir al Dashboard</Button>
        </Card>
      </PageContainer>
    )
  }

  return (
    <PageContainer
      title={`Subcategorias - ${selectedBranch?.name || ''}`}
      description={`Administra las subcategorias de ${selectedBranch?.name || 'la sucursal'}`}
      actions={
        <Button onClick={openCreateModal} leftIcon={<Plus className="w-4 h-4" />}>
          Nueva Subcategoria
        </Button>
      }
    >
      {/* Filters */}
      <Card className="mb-6">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-zinc-500" aria-hidden="true" />
          <Select
            options={[
              { value: '', label: 'Todas las categorias' },
              ...categoryOptions,
            ]}
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-64"
            aria-label="Filtrar por categoria"
          />
          {filterCategory && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilterCategory('')}
            >
              Limpiar filtro
            </Button>
          )}
        </div>
      </Card>

      <Card padding="none">
        <Table
          data={paginatedSubcategories}
          columns={columns}
          emptyMessage="No hay subcategorias. Crea una para comenzar."
          ariaLabel="Lista de subcategorias"
        />
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedSubcategory ? 'Editar Subcategoria' : 'Nueva Subcategoria'}
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} isLoading={isSubmitting}>
              {selectedSubcategory ? 'Guardar' : 'Crear'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            label="Categoria"
            options={categoryOptions}
            value={formData.category_id}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, category_id: e.target.value }))
            }
            placeholder="Selecciona una categoria"
            error={errors.category_id}
          />

          <Input
            label="Nombre"
            value={formData.name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder="Ej: Hamburguesas, Pastas, Cervezas"
            error={errors.name}
          />

          <ImageUpload
            label="Imagen"
            value={formData.image}
            onChange={(url) =>
              setFormData((prev) => ({ ...prev, image: url }))
            }
          />

          <Input
            label="Orden"
            type="number"
            value={formData.order}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, order: parseInt(e.target.value) || 0 }))
            }
            min={0}
          />

          <Toggle
            label="Subcategoria activa"
            checked={formData.is_active}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, is_active: e.target.checked }))
            }
          />
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Eliminar Subcategoria"
        message={`¿Estas seguro de eliminar "${selectedSubcategory?.name}"? Esto tambien eliminara todos los productos asociados.`}
        confirmLabel="Eliminar"
      />
    </PageContainer>
  )
}
