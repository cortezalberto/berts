import { useState, useMemo } from 'react'
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
} from '../components/ui'
import { useCategoryStore } from '../stores/categoryStore'
import { useSubcategoryStore } from '../stores/subcategoryStore'
import { useProductStore } from '../stores/productStore'
import { toast } from '../stores/toastStore'
import type { Subcategory, SubcategoryFormData, TableColumn } from '../types'

const initialFormData: SubcategoryFormData = {
  name: '',
  category_id: '',
  image: '',
  order: 0,
  is_active: true,
}

export function SubcategoriesPage() {
  const { categories } = useCategoryStore()
  const {
    subcategories,
    addSubcategory,
    updateSubcategory,
    deleteSubcategory,
    getByCategory,
  } = useSubcategoryStore()
  const {
    deleteBySubcategory: deleteProductsBySubcategory,
    getBySubcategory,
  } = useProductStore()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedSubcategory, setSelectedSubcategory] = useState<Subcategory | null>(null)
  const [formData, setFormData] = useState<SubcategoryFormData>(initialFormData)
  const [errors, setErrors] = useState<Partial<Record<keyof SubcategoryFormData, string>>>({})
  const [filterCategory, setFilterCategory] = useState<string>('')

  // Filter categories (exclude Home category with id '0')
  const selectableCategories = categories.filter((c) => c.id !== '0')

  const categoryOptions = selectableCategories.map((c) => ({
    value: c.id,
    label: c.name,
  }))

  const filteredSubcategories = useMemo(() => {
    let result = [...subcategories]
    if (filterCategory) {
      result = result.filter((s) => s.category_id === filterCategory)
    }
    return result.sort((a, b) => {
      if (a.category_id !== b.category_id) {
        return a.category_id.localeCompare(b.category_id)
      }
      return a.order - b.order
    })
  }, [subcategories, filterCategory])

  const getCategoryName = (categoryId: string): string => {
    return categories.find((c) => c.id === categoryId)?.name || 'Sin categoria'
  }

  const openCreateModal = () => {
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
  }

  const openEditModal = (subcategory: Subcategory) => {
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
  }

  const openDeleteDialog = (subcategory: Subcategory) => {
    setSelectedSubcategory(subcategory)
    setIsDeleteOpen(true)
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof SubcategoryFormData, string>> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido'
    }
    if (!formData.category_id) {
      newErrors.category_id = 'La categoria es requerida'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (!validateForm()) return

    try {
      if (selectedSubcategory) {
        updateSubcategory(selectedSubcategory.id, formData)
        toast.success('Subcategoria actualizada correctamente')
      } else {
        addSubcategory(formData)
        toast.success('Subcategoria creada correctamente')
      }
      setIsModalOpen(false)
    } catch {
      toast.error('Error al guardar la subcategoria')
    }
  }

  const handleDelete = () => {
    if (!selectedSubcategory) return

    try {
      // Delete associated products
      deleteProductsBySubcategory(selectedSubcategory.id)
      deleteSubcategory(selectedSubcategory.id)
      toast.success('Subcategoria eliminada correctamente')
      setIsDeleteOpen(false)
    } catch {
      toast.error('Error al eliminar la subcategoria')
    }
  }

  const columns: TableColumn<Subcategory>[] = [
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
      label: 'Nombre',
      render: (item) => <span className="font-medium">{item.name}</span>,
    },
    {
      key: 'category_id',
      label: 'Categoria',
      render: (item) => (
        <Badge variant="info">{getCategoryName(item.category_id)}</Badge>
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
          <Badge variant="success">Activa</Badge>
        ) : (
          <Badge variant="danger">Inactiva</Badge>
        ),
    },
    {
      key: 'products',
      label: 'Productos',
      width: 'w-28',
      render: (item) => {
        const count = getBySubcategory(item.id).length
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
      title="Subcategorias"
      description="Administra las subcategorias del menu"
      actions={
        <Button onClick={openCreateModal} leftIcon={<Plus className="w-4 h-4" />}>
          Nueva Subcategoria
        </Button>
      }
    >
      {/* Filters */}
      <Card className="mb-6">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-zinc-500" />
          <Select
            options={[
              { value: '', label: 'Todas las categorias' },
              ...categoryOptions,
            ]}
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-64"
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
          data={filteredSubcategories}
          columns={columns}
          emptyMessage="No hay subcategorias. Crea una para comenzar."
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
            <Button onClick={handleSubmit}>
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
