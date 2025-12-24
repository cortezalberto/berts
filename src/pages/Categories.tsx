import { useState } from 'react'
import { Plus, Pencil, Trash2, GripVertical } from 'lucide-react'
import { PageContainer } from '../components/layout'
import {
  Card,
  Button,
  Table,
  Modal,
  Input,
  ImageUpload,
  Toggle,
  ConfirmDialog,
  Badge,
} from '../components/ui'
import { useCategoryStore } from '../stores/categoryStore'
import { useSubcategoryStore } from '../stores/subcategoryStore'
import { useProductStore } from '../stores/productStore'
import { toast } from '../stores/toastStore'
import type { Category, CategoryFormData, TableColumn } from '../types'

const initialFormData: CategoryFormData = {
  name: '',
  icon: '',
  image: '',
  order: 0,
  is_active: true,
}

export function CategoriesPage() {
  const { categories, addCategory, updateCategory, deleteCategory } =
    useCategoryStore()
  const { deleteByCategory: deleteSubcategoriesByCategory, getByCategory } =
    useSubcategoryStore()
  const { deleteByCategory: deleteProductsByCategory } = useProductStore()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState<CategoryFormData>(initialFormData)
  const [errors, setErrors] = useState<Partial<Record<keyof CategoryFormData, string>>>({})

  const sortedCategories = [...categories].sort((a, b) => a.order - b.order)

  const openCreateModal = () => {
    setSelectedCategory(null)
    setFormData({
      ...initialFormData,
      order: Math.max(...categories.map((c) => c.order), 0) + 1,
    })
    setErrors({})
    setIsModalOpen(true)
  }

  const openEditModal = (category: Category) => {
    setSelectedCategory(category)
    setFormData({
      name: category.name,
      icon: category.icon || '',
      image: category.image || '',
      order: category.order,
      is_active: category.is_active ?? true,
    })
    setErrors({})
    setIsModalOpen(true)
  }

  const openDeleteDialog = (category: Category) => {
    setSelectedCategory(category)
    setIsDeleteOpen(true)
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CategoryFormData, string>> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (!validateForm()) return

    try {
      if (selectedCategory) {
        updateCategory(selectedCategory.id, formData)
        toast.success('Categoria actualizada correctamente')
      } else {
        addCategory(formData)
        toast.success('Categoria creada correctamente')
      }
      setIsModalOpen(false)
    } catch {
      toast.error('Error al guardar la categoria')
    }
  }

  const handleDelete = () => {
    if (!selectedCategory) return

    try {
      // Check for subcategories
      const subcats = getByCategory(selectedCategory.id)
      if (subcats.length > 0) {
        deleteSubcategoriesByCategory(selectedCategory.id)
        deleteProductsByCategory(selectedCategory.id)
      }

      deleteCategory(selectedCategory.id)
      toast.success('Categoria eliminada correctamente')
      setIsDeleteOpen(false)
    } catch {
      toast.error('Error al eliminar la categoria')
    }
  }

  const columns: TableColumn<Category>[] = [
    {
      key: 'order',
      label: '',
      width: 'w-10',
      render: () => (
        <GripVertical className="w-4 h-4 text-zinc-600 cursor-grab" />
      ),
    },
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
      key: 'subcategories',
      label: 'Subcategorias',
      width: 'w-32',
      render: (item) => {
        const count = getByCategory(item.id).length
        return <span className="text-zinc-500">{count} subcategorias</span>
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
      title="Categorias"
      description="Administra las categorias del menu"
      actions={
        <Button onClick={openCreateModal} leftIcon={<Plus className="w-4 h-4" />}>
          Nueva Categoria
        </Button>
      }
    >
      <Card padding="none">
        <Table
          data={sortedCategories}
          columns={columns}
          emptyMessage="No hay categorias. Crea una para comenzar."
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedCategory ? 'Editar Categoria' : 'Nueva Categoria'}
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>
              {selectedCategory ? 'Guardar' : 'Crear'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Nombre"
            value={formData.name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder="Ej: Comidas, Bebidas, Postres"
            error={errors.name}
          />

          <Input
            label="Icono (emoji o codigo)"
            value={formData.icon}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, icon: e.target.value }))
            }
            placeholder="Ej: 🍔 o utensils"
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
            label="Categoria activa"
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
        title="Eliminar Categoria"
        message={`¿Estas seguro de eliminar "${selectedCategory?.name}"? Esto tambien eliminara todas las subcategorias y productos asociados.`}
        confirmLabel="Eliminar"
      />
    </PageContainer>
  )
}
