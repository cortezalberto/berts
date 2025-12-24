import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Filter, Save, DollarSign, Percent } from 'lucide-react'
import { PageContainer } from '../components/layout'
import {
  Card,
  Button,
  Table,
  Modal,
  Input,
  Select,
  Badge,
  Pagination,
} from '../components/ui'
import { usePagination } from '../hooks/usePagination'
import { useCategoryStore, selectCategories } from '../stores/categoryStore'
import { useSubcategoryStore } from '../stores/subcategoryStore'
import { useProductStore, selectProducts } from '../stores/productStore'
import {
  useBranchStore,
  selectBranches,
  selectSelectedBranchId,
  selectBranchById,
} from '../stores/branchStore'
import { toast } from '../stores/toastStore'
import { handleError } from '../utils/logger'
import { HOME_CATEGORY_NAME } from '../utils/constants'
import type { Product, TableColumn, BranchPrice } from '../types'

interface PriceEdit {
  productId: string
  price: number
  branchPrices: BranchPrice[]
  useBranchPrices: boolean
}

export function PricesPage() {
  const navigate = useNavigate()

  const categories = useCategoryStore(selectCategories)
  const getByCategory = useSubcategoryStore((s) => s.getByCategory)
  const products = useProductStore(selectProducts)
  const updateProduct = useProductStore((s) => s.updateProduct)
  const branches = useBranchStore(selectBranches)

  const selectedBranchId = useBranchStore(selectSelectedBranchId)
  const selectedBranch = useBranchStore(selectBranchById(selectedBranchId || ''))

  const [filterCategory, setFilterCategory] = useState<string>('')
  const [filterSubcategory, setFilterSubcategory] = useState<string>('')
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [priceEdits, setPriceEdits] = useState<PriceEdit | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Bulk update modal
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false)
  const [bulkType, setBulkType] = useState<'fixed' | 'percent'>('percent')
  const [bulkValue, setBulkValue] = useState<number>(0)

  const activeBranches = useMemo(
    () => branches.filter((b) => b.is_active !== false),
    [branches]
  )

  // Filtrar categorias por sucursal seleccionada
  const branchCategories = useMemo(() => {
    if (!selectedBranchId) return []
    return categories.filter(
      (c) => c.branch_id === selectedBranchId && c.name !== HOME_CATEGORY_NAME
    )
  }, [categories, selectedBranchId])

  const branchCategoryIds = useMemo(
    () => new Set(branchCategories.map((c) => c.id)),
    [branchCategories]
  )

  const categoryOptions = useMemo(
    () => branchCategories.map((c) => ({ value: c.id, label: c.name })),
    [branchCategories]
  )

  const filterSubcategoryOptions = useMemo(() => {
    if (!filterCategory) return []
    return getByCategory(filterCategory).map((s) => ({
      value: s.id,
      label: s.name,
    }))
  }, [filterCategory, getByCategory])

  const filteredProducts = useMemo(() => {
    let result = products.filter((p) => branchCategoryIds.has(p.category_id))
    if (filterCategory) {
      result = result.filter((p) => p.category_id === filterCategory)
    }
    if (filterSubcategory) {
      result = result.filter((p) => p.subcategory_id === filterSubcategory)
    }
    return result.sort((a, b) => a.name.localeCompare(b.name))
  }, [products, branchCategoryIds, filterCategory, filterSubcategory])

  const {
    paginatedItems: paginatedProducts,
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    setCurrentPage,
  } = usePagination(filteredProducts)

  const getCategoryName = useCallback(
    (categoryId: string): string => {
      return categories.find((c) => c.id === categoryId)?.name || 'Sin categoria'
    },
    [categories]
  )

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(price)
  }

  // Get price display for a product
  const getPriceDisplay = (product: Product): { text: string; detail?: string } => {
    if (!product.use_branch_prices || product.branch_prices.length === 0) {
      return { text: formatPrice(product.price) }
    }

    const activePrices = product.branch_prices
      .filter((bp) => bp.is_active)
      .map((bp) => bp.price)

    if (activePrices.length === 0) {
      return { text: '-', detail: 'Sin sucursales activas' }
    }

    const minPrice = Math.min(...activePrices)
    const maxPrice = Math.max(...activePrices)

    if (minPrice === maxPrice) {
      return { text: formatPrice(minPrice), detail: `${activePrices.length} sucursales` }
    }

    return {
      text: `${formatPrice(minPrice)} - ${formatPrice(maxPrice)}`,
      detail: `${activePrices.length} sucursales`,
    }
  }

  const openEditModal = useCallback((product: Product) => {
    setEditingProduct(product)
    setPriceEdits({
      productId: product.id,
      price: product.price,
      branchPrices: product.branch_prices || [],
      useBranchPrices: product.use_branch_prices || false,
    })
    setIsModalOpen(true)
  }, [])

  const handleSavePrice = useCallback(async () => {
    if (!editingProduct || !priceEdits) return

    setIsSaving(true)
    try {
      updateProduct(editingProduct.id, {
        price: priceEdits.price,
        branch_prices: priceEdits.branchPrices,
        use_branch_prices: priceEdits.useBranchPrices,
      })
      toast.success(`Precio de "${editingProduct.name}" actualizado`)
      setIsModalOpen(false)
      setEditingProduct(null)
      setPriceEdits(null)
    } catch (error) {
      const message = handleError(error, 'PricesPage.handleSavePrice')
      toast.error(`Error al guardar: ${message}`)
    } finally {
      setIsSaving(false)
    }
  }, [editingProduct, priceEdits, updateProduct])

  const handleBranchPriceChange = useCallback(
    (branchId: string, newPrice: number) => {
      if (!priceEdits) return

      const existingIndex = priceEdits.branchPrices.findIndex(
        (bp) => bp.branch_id === branchId
      )

      let newBranchPrices: BranchPrice[]
      if (existingIndex >= 0) {
        newBranchPrices = priceEdits.branchPrices.map((bp) =>
          bp.branch_id === branchId ? { ...bp, price: newPrice } : bp
        )
      } else {
        newBranchPrices = [
          ...priceEdits.branchPrices,
          { branch_id: branchId, price: newPrice, is_active: true },
        ]
      }

      setPriceEdits({ ...priceEdits, branchPrices: newBranchPrices })
    },
    [priceEdits]
  )

  const handleBranchActiveChange = useCallback(
    (branchId: string, isActive: boolean) => {
      if (!priceEdits) return

      const existingIndex = priceEdits.branchPrices.findIndex(
        (bp) => bp.branch_id === branchId
      )

      let newBranchPrices: BranchPrice[]
      if (existingIndex >= 0) {
        newBranchPrices = priceEdits.branchPrices.map((bp) =>
          bp.branch_id === branchId ? { ...bp, is_active: isActive } : bp
        )
      } else {
        newBranchPrices = [
          ...priceEdits.branchPrices,
          { branch_id: branchId, price: priceEdits.price, is_active: isActive },
        ]
      }

      setPriceEdits({ ...priceEdits, branchPrices: newBranchPrices })
    },
    [priceEdits]
  )

  const getBranchPrice = useCallback(
    (branchId: string): BranchPrice => {
      if (!priceEdits) {
        return { branch_id: branchId, price: 0, is_active: true }
      }
      return (
        priceEdits.branchPrices.find((bp) => bp.branch_id === branchId) || {
          branch_id: branchId,
          price: priceEdits.price,
          is_active: true,
        }
      )
    },
    [priceEdits]
  )

  const applyDefaultToAll = useCallback(() => {
    if (!priceEdits) return

    const newBranchPrices = activeBranches.map((b) => {
      const existing = priceEdits.branchPrices.find((bp) => bp.branch_id === b.id)
      return {
        branch_id: b.id,
        price: priceEdits.price,
        is_active: existing?.is_active ?? true,
      }
    })

    setPriceEdits({ ...priceEdits, branchPrices: newBranchPrices })
  }, [priceEdits, activeBranches])

  // Bulk update
  const handleBulkUpdate = useCallback(() => {
    if (bulkValue === 0) {
      toast.error('Ingresa un valor valido')
      return
    }

    let updatedCount = 0
    filteredProducts.forEach((product) => {
      let newPrice: number

      if (bulkType === 'fixed') {
        newPrice = bulkValue
      } else {
        // Percent change
        newPrice = product.price * (1 + bulkValue / 100)
      }

      newPrice = Math.round(newPrice * 100) / 100 // Round to 2 decimals

      if (newPrice > 0) {
        updateProduct(product.id, { price: newPrice })
        updatedCount++
      }
    })

    toast.success(`${updatedCount} productos actualizados`)
    setIsBulkModalOpen(false)
    setBulkValue(0)
  }, [bulkType, bulkValue, filteredProducts, updateProduct])

  const columns: TableColumn<Product>[] = [
    {
      key: 'name',
      label: 'Producto',
      render: (item) => (
        <div>
          <span className="font-medium">{item.name}</span>
          <div className="text-xs text-zinc-500">{getCategoryName(item.category_id)}</div>
        </div>
      ),
    },
    {
      key: 'price',
      label: 'Precio Base',
      width: 'w-32',
      render: (item) => (
        <span className="font-medium text-orange-500">{formatPrice(item.price)}</span>
      ),
    },
    {
      key: 'branch_prices',
      label: 'Precio Sucursales',
      width: 'w-48',
      render: (item) => {
        const display = getPriceDisplay(item)
        if (!item.use_branch_prices) {
          return <span className="text-zinc-500">Precio unico</span>
        }
        return (
          <div>
            <span className="font-medium text-orange-500">{display.text}</span>
            {display.detail && (
              <div className="text-xs text-zinc-500">{display.detail}</div>
            )}
          </div>
        )
      },
    },
    {
      key: 'mode',
      label: 'Modo',
      width: 'w-32',
      render: (item) =>
        item.use_branch_prices ? (
          <Badge variant="info">Por sucursal</Badge>
        ) : (
          <Badge variant="default">Unico</Badge>
        ),
    },
    {
      key: 'actions',
      label: 'Acciones',
      width: 'w-28',
      render: (item) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            openEditModal(item)
          }}
          aria-label={`Editar precio de ${item.name}`}
        >
          <DollarSign className="w-4 h-4 mr-1" aria-hidden="true" />
          Editar
        </Button>
      ),
    },
  ]

  // Si no hay sucursal seleccionada, mostrar mensaje
  if (!selectedBranchId) {
    return (
      <PageContainer
        title="Precios"
        description="Selecciona una sucursal para gestionar precios"
      >
        <Card className="text-center py-12">
          <p className="text-zinc-500 mb-4">
            Selecciona una sucursal desde el Dashboard para gestionar precios
          </p>
          <Button onClick={() => navigate('/')}>Ir al Dashboard</Button>
        </Card>
      </PageContainer>
    )
  }

  return (
    <PageContainer
      title={`Precios - ${selectedBranch?.name || ''}`}
      description={`Gestion de precios de ${selectedBranch?.name || 'la sucursal'}`}
      actions={
        <Button
          onClick={() => setIsBulkModalOpen(true)}
          leftIcon={<Percent className="w-4 h-4" />}
          variant="secondary"
        >
          Actualizar Masivo
        </Button>
      }
    >
      {/* Filters */}
      <Card className="mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          <Filter className="w-5 h-5 text-zinc-500" aria-hidden="true" />
          <Select
            options={[{ value: '', label: 'Todas las categorias' }, ...categoryOptions]}
            value={filterCategory}
            onChange={(e) => {
              setFilterCategory(e.target.value)
              setFilterSubcategory('')
            }}
            className="w-48"
            aria-label="Filtrar por categoria"
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
              aria-label="Filtrar por subcategoria"
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
            {filteredProducts.length} productos
          </div>
        </div>
      </Card>

      <Card padding="none">
        <Table
          data={paginatedProducts}
          columns={columns}
          onRowClick={openEditModal}
          emptyMessage="No hay productos. Crea productos primero."
          ariaLabel="Lista de precios de productos"
        />
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </Card>

      {/* Edit Price Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Editar Precio - ${editingProduct?.name || ''}`}
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSavePrice}
              isLoading={isSaving}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Guardar
            </Button>
          </>
        }
      >
        {priceEdits && (
          <div className="space-y-4">
            {/* Base price */}
            <Input
              label="Precio Base"
              type="number"
              value={priceEdits.price}
              onChange={(e) =>
                setPriceEdits({
                  ...priceEdits,
                  price: parseFloat(e.target.value) || 0,
                })
              }
              min={0}
              step={0.01}
            />

            {/* Toggle for per-branch pricing */}
            <label className="inline-flex items-center gap-3 cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={priceEdits.useBranchPrices}
                  onChange={(e) => {
                    const newValue = e.target.checked
                    setPriceEdits({ ...priceEdits, useBranchPrices: newValue })
                    if (newValue && priceEdits.branchPrices.length === 0) {
                      // Initialize with all branches
                      const initialPrices = activeBranches.map((b) => ({
                        branch_id: b.id,
                        price: priceEdits.price,
                        is_active: true,
                      }))
                      setPriceEdits({
                        ...priceEdits,
                        useBranchPrices: true,
                        branchPrices: initialPrices,
                      })
                    }
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 rounded-full bg-zinc-700 peer-checked:bg-orange-500 transition-colors duration-200 peer-focus:ring-2 peer-focus:ring-orange-500 peer-focus:ring-offset-2 peer-focus:ring-offset-zinc-900" />
                <div className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-200 peer-checked:translate-x-5" />
              </div>
              <span className="text-sm text-zinc-300">
                Precios diferentes por sucursal
              </span>
            </label>

            {/* Branch prices */}
            {priceEdits.useBranchPrices && (
              <div className="space-y-3 pl-2 border-l-2 border-zinc-700">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={applyDefaultToAll}
                  className="text-orange-500 hover:text-orange-400"
                >
                  Aplicar precio base a todas
                </Button>

                <div className="space-y-2">
                  {activeBranches.map((branch) => {
                    const bp = getBranchPrice(branch.id)
                    return (
                      <div
                        key={branch.id}
                        className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-lg"
                      >
                        <input
                          type="checkbox"
                          checked={bp.is_active}
                          onChange={(e) =>
                            handleBranchActiveChange(branch.id, e.target.checked)
                          }
                          className="w-4 h-4 rounded border-zinc-600 bg-zinc-700 text-orange-500 focus:ring-orange-500 focus:ring-offset-zinc-900"
                          aria-label={`Vender en ${branch.name}`}
                        />
                        <div className="flex-1 min-w-0">
                          <span
                            className={`text-sm ${bp.is_active ? 'text-zinc-300' : 'text-zinc-500'}`}
                          >
                            {branch.name}
                          </span>
                        </div>
                        <div className="w-28">
                          <input
                            type="number"
                            value={bp.price}
                            onChange={(e) =>
                              handleBranchPriceChange(
                                branch.id,
                                parseFloat(e.target.value) || 0
                              )
                            }
                            disabled={!bp.is_active}
                            min={0}
                            step={0.01}
                            className={`
                              w-full px-3 py-1.5 text-sm rounded-lg
                              bg-zinc-800 border border-zinc-700 transition-colors
                              ${bp.is_active ? 'text-white' : 'text-zinc-500 opacity-50'}
                              focus:outline-none focus:ring-2 focus:ring-orange-500
                              disabled:cursor-not-allowed
                            `}
                            aria-label={`Precio en ${branch.name}`}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Bulk Update Modal */}
      <Modal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        title="Actualizar Precios Masivamente"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsBulkModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleBulkUpdate}>
              Aplicar a {filteredProducts.length} productos
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-zinc-400">
            Esto actualizara el precio BASE de todos los productos filtrados actualmente
            ({filteredProducts.length} productos).
          </p>

          <Select
            label="Tipo de actualizacion"
            options={[
              { value: 'percent', label: 'Porcentaje (+/-)' },
              { value: 'fixed', label: 'Precio fijo' },
            ]}
            value={bulkType}
            onChange={(e) => setBulkType(e.target.value as 'fixed' | 'percent')}
          />

          <Input
            label={bulkType === 'percent' ? 'Porcentaje (ej: 10 o -5)' : 'Precio fijo'}
            type="number"
            value={bulkValue}
            onChange={(e) => setBulkValue(parseFloat(e.target.value) || 0)}
            step={bulkType === 'percent' ? 1 : 0.01}
            placeholder={bulkType === 'percent' ? 'Ej: 10 para +10%' : 'Ej: 1500'}
          />

          {bulkType === 'percent' && bulkValue !== 0 && (
            <p className="text-sm text-zinc-500">
              {bulkValue > 0 ? 'Aumentar' : 'Reducir'} precios en{' '}
              {Math.abs(bulkValue)}%
            </p>
          )}
        </div>
      </Modal>
    </PageContainer>
  )
}
