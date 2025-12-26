import { useState, useMemo, useCallback, useId } from 'react'
import { Plus, Pencil, Trash2, Users, Archive } from 'lucide-react'
import { PageContainer } from '../components/layout'
import {
  Card,
  Button,
  Table,
  Modal,
  Input,
  Select,
  Toggle,
  ConfirmDialog,
  Badge,
  Pagination,
  HelpButton,
} from '../components/ui'
import { usePagination } from '../hooks/usePagination'
import { useTableStore, selectTables } from '../stores/tableStore'
import { useBranchStore, selectBranches } from '../stores/branchStore'
import { useOrderHistoryStore } from '../stores/orderHistoryStore'
import { toast } from '../stores/toastStore'
import { validateTable, type ValidationErrors } from '../utils/validation'
import { handleError } from '../utils/logger'
import { helpContent } from '../utils/helpContent'
import { TABLE_STATUS_LABELS, TABLE_SECTORS, TABLE_DEFAULT_TIME } from '../utils/constants'
import type { RestaurantTable, RestaurantTableFormData, TableColumn, TableStatus } from '../types'

const initialFormData: RestaurantTableFormData = {
  branch_id: '',
  number: 1,
  capacity: 4,
  sector: 'Interior',
  status: 'libre',
  order_time: TABLE_DEFAULT_TIME,
  close_time: TABLE_DEFAULT_TIME,
  is_active: true,
}

const statusOptions: { value: TableStatus; label: string }[] = [
  { value: 'libre', label: 'Libre' },
  { value: 'solicito_pedido', label: 'Solicito Pedido' },
  { value: 'pedido_cumplido', label: 'Pedido Cumplido' },
  { value: 'cuenta_solicitada', label: 'Cuenta Solicitada' },
  { value: 'ocupada', label: 'Ocupada' },
]

function getStatusBadge(status: TableStatus) {
  switch (status) {
    case 'libre':
      return <Badge variant="success"><span className="sr-only">Estado:</span> Libre</Badge>
    case 'solicito_pedido':
      return <Badge variant="warning"><span className="sr-only">Estado:</span> Solicito Pedido</Badge>
    case 'pedido_cumplido':
      return <Badge variant="info"><span className="sr-only">Estado:</span> Pedido Cumplido</Badge>
    case 'cuenta_solicitada':
      return <Badge variant="secondary"><span className="sr-only">Estado:</span> Cuenta Solicitada</Badge>
    case 'ocupada':
      return <Badge variant="danger"><span className="sr-only">Estado:</span> Ocupada</Badge>
    default:
      return <Badge><span className="sr-only">Estado:</span> {TABLE_STATUS_LABELS[status] || status}</Badge>
  }
}

export function TablesPage() {
  const tables = useTableStore(selectTables)
  const addTable = useTableStore((s) => s.addTable)
  const updateTable = useTableStore((s) => s.updateTable)
  const deleteTable = useTableStore((s) => s.deleteTable)
  const getNextTableNumber = useTableStore((s) => s.getNextTableNumber)

  const branches = useBranchStore(selectBranches)

  const createOrderHistory = useOrderHistoryStore((s) => s.createOrderHistory)
  const closeOrderHistory = useOrderHistoryStore((s) => s.closeOrderHistory)
  const getActiveOrderHistory = useOrderHistoryStore((s) => s.getActiveOrderHistory)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null)
  const [formData, setFormData] = useState<RestaurantTableFormData>(initialFormData)
  const [errors, setErrors] = useState<ValidationErrors<RestaurantTableFormData>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [filterBranchId, setFilterBranchId] = useState<string>(() => branches[0]?.id || '')
  const [filterStatus, setFilterStatus] = useState<string>('')

  // Unique IDs for form fields
  const filterBranchSelectId = useId()
  const filterStatusSelectId = useId()

  // Filter tables by branch and status
  const filteredTables = useMemo(() => {
    // Always filter by selected branch
    let result = tables.filter((t) => t.branch_id === filterBranchId)
    if (filterStatus) {
      result = result.filter((t) => t.status === filterStatus)
    }
    return result
  }, [tables, filterBranchId, filterStatus])

  // Sort by branch name, then by number
  const sortedTables = useMemo(() => {
    return [...filteredTables].sort((a, b) => {
      const branchA = branches.find((br) => br.id === a.branch_id)?.name || ''
      const branchB = branches.find((br) => br.id === b.branch_id)?.name || ''
      const branchCompare = branchA.localeCompare(branchB)
      if (branchCompare !== 0) return branchCompare
      return a.number - b.number
    })
  }, [filteredTables, branches])

  const {
    paginatedItems: paginatedTables,
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    setCurrentPage,
  } = usePagination(sortedTables)

  const getBranchName = useCallback(
    (branchId: string) => {
      const branch = branches.find((b) => b.id === branchId)
      return branch?.name || 'Sin sucursal'
    },
    [branches]
  )

  const openCreateModal = useCallback(() => {
    const defaultBranchId = branches.length > 0 ? branches[0].id : ''
    const nextNumber = defaultBranchId ? getNextTableNumber(defaultBranchId) : 1
    setSelectedTable(null)
    setFormData({
      ...initialFormData,
      branch_id: defaultBranchId,
      number: nextNumber,
    })
    setErrors({})
    setIsModalOpen(true)
  }, [branches, getNextTableNumber])

  const openEditModal = useCallback((table: RestaurantTable) => {
    setSelectedTable(table)
    setFormData({
      branch_id: table.branch_id,
      number: table.number,
      capacity: table.capacity,
      sector: table.sector,
      status: table.status,
      order_time: table.order_time ?? TABLE_DEFAULT_TIME,
      close_time: table.close_time ?? TABLE_DEFAULT_TIME,
      is_active: table.is_active ?? true,
    })
    setErrors({})
    setIsModalOpen(true)
  }, [])

  const openDeleteDialog = useCallback((table: RestaurantTable) => {
    setSelectedTable(table)
    setIsDeleteOpen(true)
  }, [])

  const handleBranchChange = useCallback(
    (branchId: string) => {
      const nextNumber = getNextTableNumber(branchId)
      setFormData((prev) => ({
        ...prev,
        branch_id: branchId,
        number: selectedTable ? prev.number : nextNumber,
      }))
    },
    [getNextTableNumber, selectedTable]
  )

  // Get current time in HH:mm format
  const getCurrentTime = useCallback(() => {
    const now = new Date()
    return now.toTimeString().slice(0, 5)
  }, [])

  const handleStatusChange = useCallback((newStatus: TableStatus) => {
    setFormData((prev) => {
      // Time rules by status:
      // - libre: order_time=00:00, close_time=00:00
      // - ocupada: order_time=00:00, close_time=00:00
      // - solicito_pedido: order_time=current time (if new), close_time=00:00
      // - pedido_cumplido: order_time=HH:mm (mantiene hora del pedido), close_time=00:00
      // - cuenta_solicitada: order_time=HH:mm, close_time=current time (if new)

      if (newStatus === 'libre' || newStatus === 'ocupada') {
        return {
          ...prev,
          status: newStatus,
          order_time: TABLE_DEFAULT_TIME,
          close_time: TABLE_DEFAULT_TIME,
        }
      }

      if (newStatus === 'solicito_pedido') {
        // If coming from status without order_time, set to current time
        const orderTime = (prev.status === 'libre' || prev.status === 'ocupada')
          ? getCurrentTime()
          : prev.order_time
        return {
          ...prev,
          status: newStatus,
          order_time: orderTime === TABLE_DEFAULT_TIME ? getCurrentTime() : orderTime,
          close_time: TABLE_DEFAULT_TIME,
        }
      }

      if (newStatus === 'pedido_cumplido') {
        // Keep order_time, reset close_time to 00:00
        const orderTime = prev.order_time === TABLE_DEFAULT_TIME ? getCurrentTime() : prev.order_time
        return {
          ...prev,
          status: newStatus,
          order_time: orderTime,
          close_time: TABLE_DEFAULT_TIME,
        }
      }

      if (newStatus === 'cuenta_solicitada') {
        // Keep order_time, set close_time to current if not set
        const orderTime = prev.order_time === TABLE_DEFAULT_TIME ? getCurrentTime() : prev.order_time
        const closeTime = prev.close_time === TABLE_DEFAULT_TIME ? getCurrentTime() : prev.close_time
        return {
          ...prev,
          status: newStatus,
          order_time: orderTime,
          close_time: closeTime,
        }
      }

      return { ...prev, status: newStatus }
    })
  }, [getCurrentTime])

  const handleSubmit = useCallback(() => {
    const validation = validateTable(formData, {
      existingTables: tables,
      editingTableId: selectedTable?.id,
    })
    if (!validation.isValid) {
      setErrors(validation.errors)
      return
    }

    setIsSubmitting(true)
    try {
      if (selectedTable) {
        updateTable(selectedTable.id, formData)
        toast.success('Mesa actualizada correctamente')
      } else {
        addTable(formData)
        toast.success('Mesa creada correctamente')
      }
      setIsModalOpen(false)
    } catch (error) {
      const message = handleError(error, 'TablesPage.handleSubmit')
      toast.error(`Error al guardar la mesa: ${message}`)
    } finally {
      setIsSubmitting(false)
    }
  }, [formData, selectedTable, updateTable, addTable, tables])

  const handleDelete = useCallback(() => {
    if (!selectedTable) return

    try {
      // Validate table exists before delete
      const tableExists = tables.some((t) => t.id === selectedTable.id)
      if (!tableExists) {
        toast.error('La mesa ya no existe')
        setIsDeleteOpen(false)
        return
      }

      deleteTable(selectedTable.id)
      toast.success('Mesa eliminada correctamente')
      setIsDeleteOpen(false)
    } catch (error) {
      const message = handleError(error, 'TablesPage.handleDelete')
      toast.error(`Error al eliminar la mesa: ${message}`)
    }
  }, [selectedTable, tables, deleteTable])

  const handleArchive = useCallback((table: RestaurantTable) => {
    try {
      // Get current time for close_time
      const closeTime = getCurrentTime()

      // Check if there's an active order history for this table
      const activeHistory = getActiveOrderHistory(table.id)

      if (activeHistory) {
        // Close the existing order history
        closeOrderHistory(activeHistory.id, closeTime)
      } else {
        // Create and immediately close a new order history record
        const newHistory = createOrderHistory({
          branch_id: table.branch_id,
          table_id: table.id,
          table_number: table.number,
        })
        closeOrderHistory(newHistory.id, closeTime)
      }

      // Reset table to libre status with times at 00:00
      updateTable(table.id, {
        status: 'libre',
        order_time: TABLE_DEFAULT_TIME,
        close_time: TABLE_DEFAULT_TIME,
      })

      toast.success(`Mesa #${table.number} archivada y liberada`)
    } catch (error) {
      const message = handleError(error, 'TablesPage.handleArchive')
      toast.error(`Error al archivar: ${message}`)
    }
  }, [createOrderHistory, closeOrderHistory, getActiveOrderHistory, getCurrentTime, updateTable])

  const columns: TableColumn<RestaurantTable>[] = useMemo(
    () => [
      {
        key: 'number',
        label: 'Mesa',
        width: 'w-20',
        render: (item) => (
          <span className="font-bold text-lg text-orange-500">#{item.number}</span>
        ),
      },
      {
        key: 'branch_id',
        label: 'Sucursal',
        render: (item) => (
          <span className="text-zinc-300">{getBranchName(item.branch_id)}</span>
        ),
      },
      {
        key: 'capacity',
        label: 'Capacidad',
        width: 'w-28',
        render: (item) => (
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-zinc-500" aria-hidden="true" />
            <span>{item.capacity} personas</span>
          </div>
        ),
      },
      {
        key: 'sector',
        label: 'Sector',
        render: (item) => <span className="text-zinc-400">{item.sector}</span>,
      },
      {
        key: 'status',
        label: 'Estado',
        width: 'w-36',
        render: (item) => getStatusBadge(item.status),
      },
      {
        key: 'order_time',
        label: 'Hora Pedido',
        width: 'w-28',
        render: (item) => (
          <span className={item.status === 'libre' ? 'text-zinc-500' : 'text-zinc-300'}>
            {item.order_time || TABLE_DEFAULT_TIME}
          </span>
        ),
      },
      {
        key: 'close_time',
        label: 'Hora Cierre',
        width: 'w-28',
        render: (item) => (
          <span className={item.status === 'libre' ? 'text-zinc-500' : 'text-zinc-300'}>
            {item.close_time || TABLE_DEFAULT_TIME}
          </span>
        ),
      },
      {
        key: 'is_active',
        label: 'Activa',
        width: 'w-24',
        render: (item) =>
          item.is_active !== false ? (
            <Badge variant="success">
              <span className="sr-only">Mesa</span> Activa
            </Badge>
          ) : (
            <Badge variant="danger">
              <span className="sr-only">Mesa</span> Inactiva
            </Badge>
          ),
      },
      {
        key: 'actions',
        label: 'Acciones',
        width: 'w-36',
        render: (item) => (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                openEditModal(item)
              }}
              aria-label={`Editar mesa ${item.number}`}
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
              aria-label={`Eliminar mesa ${item.number}`}
            >
              <Trash2 className="w-4 h-4" aria-hidden="true" />
            </Button>
            {item.status === 'cuenta_solicitada' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  handleArchive(item)
                }}
                className="text-green-500 hover:text-green-400 hover:bg-green-500/10"
                aria-label={`Liberar mesa ${item.number}`}
                title="Liberar mesa y archivar en historial"
              >
                <Archive className="w-4 h-4" aria-hidden="true" />
              </Button>
            )}
          </div>
        ),
      },
    ],
    [getBranchName, openEditModal, openDeleteDialog, handleArchive]
  )

  const branchOptions = useMemo(
    () =>
      branches.map((b) => ({
        value: b.id,
        label: b.name,
      })),
    [branches]
  )

  const sectorOptions = useMemo(
    () =>
      TABLE_SECTORS.map((sector) => ({
        value: sector,
        label: sector,
      })),
    []
  )

  const filterStatusOptions = useMemo(
    () => [
      { value: '', label: 'Todos los estados' },
      ...statusOptions,
    ],
    []
  )

  return (
    <PageContainer
      title="Mesas"
      description="Administra las mesas de las sucursales"
      helpContent={helpContent.tables}
      actions={
        <Button
          onClick={openCreateModal}
          leftIcon={<Plus className="w-4 h-4" />}
          disabled={branches.length === 0}
        >
          Nueva Mesa
        </Button>
      }
    >
      {/* Filters by branch and status */}
      <div className="mb-4 flex items-center gap-4">
        <Select
          id={filterBranchSelectId}
          options={branchOptions}
          value={filterBranchId}
          onChange={(e) => setFilterBranchId(e.target.value)}
          className="w-64"
          aria-label="Filtrar mesas por sucursal"
        />
        <Select
          id={filterStatusSelectId}
          options={filterStatusOptions}
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="w-48"
          aria-label="Filtrar mesas por estado"
        />
      </div>

      {branches.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-zinc-500">
            No hay sucursales. Crea una sucursal primero para poder agregar mesas.
          </p>
        </Card>
      ) : (
        <Card padding="none">
          <Table
            data={paginatedTables}
            columns={columns}
            emptyMessage="No hay mesas. Crea una para comenzar."
            ariaLabel="Lista de mesas"
          />
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </Card>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedTable ? 'Editar Mesa' : 'Nueva Mesa'}
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} isLoading={isSubmitting}>
              {selectedTable ? 'Guardar' : 'Crear'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <HelpButton
              title="Formulario de Mesa"
              size="sm"
              content={
                <div className="space-y-3">
                  <p>
                    <strong>Completa los siguientes campos</strong> para crear o editar una mesa:
                  </p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>
                      <strong>Sucursal:</strong> Selecciona a que sucursal pertenece la mesa. Es obligatorio.
                    </li>
                    <li>
                      <strong>Numero de mesa:</strong> Identificador unico de la mesa dentro de la sucursal.
                    </li>
                    <li>
                      <strong>Capacidad:</strong> Cantidad maxima de comensales (1-50).
                    </li>
                    <li>
                      <strong>Sector:</strong> Ubicacion dentro del local (Interior, Terraza, VIP, etc.).
                    </li>
                    <li>
                      <strong>Estado:</strong> Estado actual de la mesa para el seguimiento de pedidos.
                    </li>
                    <li>
                      <strong>Hora Pedido:</strong> Hora del primer pedido de la mesa (formato HH:mm).
                    </li>
                    <li>
                      <strong>Hora Cierre:</strong> Hora estimada de cierre de la mesa (formato HH:mm).
                    </li>
                    <li>
                      <strong>Mesa activa:</strong> Activa o desactiva la disponibilidad de la mesa.
                    </li>
                  </ul>
                  <div className="bg-zinc-800 p-3 rounded-lg mt-3">
                    <p className="text-orange-400 font-medium text-sm">Consejo:</p>
                    <p className="text-sm mt-1">
                      Organiza las mesas por sectores para facilitar el seguimiento de pedidos y la asignacion de mozos.
                    </p>
                  </div>
                </div>
              }
            />
            <span className="text-sm text-zinc-400">Ayuda sobre el formulario</span>
          </div>

          {/* Branch Select */}
          <Select
            label="Sucursal"
            options={branchOptions}
            placeholder="Seleccionar sucursal"
            value={formData.branch_id}
            onChange={(e) => handleBranchChange(e.target.value)}
            error={errors.branch_id}
          />

          {/* Table Number */}
          <Input
            label="Numero de mesa"
            type="number"
            min={1}
            value={formData.number}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                number: parseInt(e.target.value, 10) || 1,
              }))
            }
            error={errors.number}
          />

          {/* Capacity */}
          <Input
            label="Capacidad (comensales)"
            type="number"
            min={1}
            max={50}
            value={formData.capacity}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                capacity: parseInt(e.target.value, 10) || 1,
              }))
            }
            error={errors.capacity}
          />

          {/* Sector */}
          <Select
            label="Sector"
            options={sectorOptions}
            value={formData.sector}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, sector: e.target.value }))
            }
            error={errors.sector}
          />

          {/* Status */}
          <Select
            label="Estado"
            options={statusOptions}
            value={formData.status}
            onChange={(e) => handleStatusChange(e.target.value as TableStatus)}
            error={errors.status}
          />

          {/* Time fields - editable based on status rules */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Hora Pedido"
              type="time"
              value={formData.order_time}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, order_time: e.target.value }))
              }
              disabled={formData.status === 'libre' || formData.status === 'ocupada'}
              error={errors.order_time}
            />
            <Input
              label="Hora Cierre"
              type="time"
              value={formData.close_time}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, close_time: e.target.value }))
              }
              disabled={formData.status !== 'cuenta_solicitada'}
              error={errors.close_time}
            />
          </div>
          <p className="text-xs text-zinc-500 -mt-2">
            {formData.status === 'solicito_pedido' || formData.status === 'pedido_cumplido'
              ? 'Hora de pedido requerida. Hora de cierre en 00:00.'
              : formData.status === 'cuenta_solicitada'
                ? 'Ambas horas requeridas. Hora de cierre debe ser >= hora de pedido.'
                : 'Ambas horas en 00:00 para este estado.'}
          </p>

          {/* Active Toggle */}
          <Toggle
            label="Mesa activa"
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
        title="Eliminar Mesa"
        message={`¿Estas seguro de eliminar la mesa #${selectedTable?.number} de ${selectedTable ? getBranchName(selectedTable.branch_id) : ''}?`}
        confirmLabel="Eliminar"
      />
    </PageContainer>
  )
}
