import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { RestaurantTable, RestaurantTableFormData } from '../types'
import { STORAGE_KEYS, STORE_VERSIONS, TABLE_DEFAULT_TIME } from '../utils/constants'

interface TableState {
  tables: RestaurantTable[]
  // Actions
  setTables: (tables: RestaurantTable[]) => void
  addTable: (data: RestaurantTableFormData) => RestaurantTable
  updateTable: (id: string, data: Partial<RestaurantTableFormData>) => void
  deleteTable: (id: string) => void
  deleteByBranch: (branchId: string) => void
  getByBranch: (branchId: string) => RestaurantTable[]
  getNextTableNumber: (branchId: string) => number
}

const generateId = () => crypto.randomUUID()

// Initial mock tables for demo
// Time rules by status:
// - libre: order_time=00:00, close_time=00:00
// - ocupada: order_time=00:00, close_time=00:00
// - solicito_pedido: order_time=HH:mm (hora del pedido), close_time=00:00
// - pedido_cumplido: order_time=HH:mm (mantiene hora del pedido), close_time=00:00
// - cuenta_solicitada: order_time=HH:mm, close_time=HH:mm (close >= order)
const initialTables: RestaurantTable[] = [
  // Branch 1 - Centro tables
  {
    id: 'table-1',
    branch_id: 'branch-1',
    number: 1,
    capacity: 4,
    sector: 'Interior',
    status: 'libre',
    order_time: TABLE_DEFAULT_TIME,
    close_time: TABLE_DEFAULT_TIME,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'table-2',
    branch_id: 'branch-1',
    number: 2,
    capacity: 2,
    sector: 'Interior',
    status: 'cuenta_solicitada',
    order_time: '12:30',              // cuenta_solicitada: ambas horas con valor
    close_time: '14:15',              // close_time >= order_time
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'table-3',
    branch_id: 'branch-1',
    number: 3,
    capacity: 6,
    sector: 'Terraza',
    status: 'ocupada',
    order_time: TABLE_DEFAULT_TIME,
    close_time: TABLE_DEFAULT_TIME,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'table-4',
    branch_id: 'branch-1',
    number: 4,
    capacity: 8,
    sector: 'VIP',
    status: 'pedido_cumplido',
    order_time: '11:45',                 // pedido_cumplido: mantiene hora del pedido
    close_time: TABLE_DEFAULT_TIME,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  // Branch 2 - Norte tables
  {
    id: 'table-5',
    branch_id: 'branch-2',
    number: 1,
    capacity: 4,
    sector: 'Interior',
    status: 'libre',
    order_time: TABLE_DEFAULT_TIME,
    close_time: TABLE_DEFAULT_TIME,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'table-6',
    branch_id: 'branch-2',
    number: 2,
    capacity: 4,
    sector: 'Interior',
    status: 'solicito_pedido',
    order_time: '13:00',              // solicito_pedido: order_time tiene valor
    close_time: TABLE_DEFAULT_TIME,   // close_time en 00:00
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'table-7',
    branch_id: 'branch-2',
    number: 3,
    capacity: 2,
    sector: 'Barra',
    status: 'libre',
    order_time: TABLE_DEFAULT_TIME,
    close_time: TABLE_DEFAULT_TIME,
    is_active: true,
    created_at: new Date().toISOString(),
  },
]

export const useTableStore = create<TableState>()(
  persist(
    (set, get) => ({
      tables: initialTables,

      setTables: (tables) => set({ tables }),

      addTable: (data) => {
        const newTable: RestaurantTable = {
          id: generateId(),
          ...data,
          is_active: data.is_active ?? true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        set((state) => ({ tables: [...state.tables, newTable] }))
        return newTable
      },

      updateTable: (id, data) =>
        set((state) => ({
          tables: state.tables.map((table) =>
            table.id === id
              ? { ...table, ...data, updated_at: new Date().toISOString() }
              : table
          ),
        })),

      deleteTable: (id) =>
        set((state) => ({
          tables: state.tables.filter((table) => table.id !== id),
        })),

      deleteByBranch: (branchId) =>
        set((state) => ({
          tables: state.tables.filter((table) => table.branch_id !== branchId),
        })),

      getByBranch: (branchId) => {
        return get().tables.filter((table) => table.branch_id === branchId)
      },

      getNextTableNumber: (branchId) => {
        const branchTables = get().tables.filter((t) => t.branch_id === branchId)
        if (branchTables.length === 0) return 1
        const maxNumber = Math.max(...branchTables.map((t) => t.number))
        return maxNumber + 1
      },
    }),
    {
      name: STORAGE_KEYS.TABLES,
      version: STORE_VERSIONS.TABLES,
      migrate: (persistedState, version) => {
        const state = persistedState as { tables: RestaurantTable[] }

        // Ensure tables array exists
        if (!Array.isArray(state.tables)) {
          state.tables = initialTables
          return state
        }

        // v2: Add order_time and close_time fields
        if (version < 2) {
          state.tables = state.tables.map((table) => ({
            ...table,
            order_time: table.order_time ?? TABLE_DEFAULT_TIME,
            close_time: table.close_time ?? TABLE_DEFAULT_TIME,
          }))
        }

        // v3/v4/v5/v6: Update time rules based on status
        // - libre/ocupada: both times = 00:00
        // - solicito_pedido/pedido_cumplido: order_time = value, close_time = 00:00
        // - cuenta_solicitada: both times have values
        if (version < 6) {
          state.tables = state.tables.map((table) => {
            if (table.status === 'libre' || table.status === 'ocupada') {
              return {
                ...table,
                order_time: TABLE_DEFAULT_TIME,
                close_time: TABLE_DEFAULT_TIME,
              }
            }
            if (table.status === 'solicito_pedido' || table.status === 'pedido_cumplido') {
              return {
                ...table,
                // Keep existing order_time or use current time if missing
                order_time: table.order_time && table.order_time !== TABLE_DEFAULT_TIME
                  ? table.order_time
                  : new Date().toTimeString().slice(0, 5),
                close_time: TABLE_DEFAULT_TIME,
              }
            }
            return table
          })
        }

        return state
      },
    }
  )
)

// Selectors
export const selectTables = (state: TableState) => state.tables
export const selectTableById = (id: string) => (state: TableState) =>
  state.tables.find((t) => t.id === id)
export const selectTablesByBranch = (branchId: string | null) => (state: TableState) =>
  branchId ? state.tables.filter((t) => t.branch_id === branchId) : []
