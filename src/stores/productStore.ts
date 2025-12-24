import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Product, ProductFormData } from '../types'

interface ProductState {
  products: Product[]
  isLoading: boolean
  error: string | null

  // Actions
  setProducts: (products: Product[]) => void
  addProduct: (data: ProductFormData) => Product
  updateProduct: (id: string, data: Partial<ProductFormData>) => void
  deleteProduct: (id: string) => void
  getByCategory: (categoryId: string) => Product[]
  getBySubcategory: (subcategoryId: string) => Product[]
  deleteByCategory: (categoryId: string) => void
  deleteBySubcategory: (subcategoryId: string) => void
  clearError: () => void
}

const generateId = () => crypto.randomUUID()

// Initial mock products
const initialProducts: Product[] = [
  {
    id: '1',
    name: 'Tofu Frito',
    description: 'Cebolla con queso fundido',
    price: 12.5,
    image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&h=400&fit=crop',
    category_id: '1',
    subcategory_id: 'sub-5',
    featured: true,
    popular: true,
    badge: 'TEX MEX',
    is_active: true,
  },
  {
    id: '2',
    name: 'Risotto de Hongos',
    description: 'Parmesano con hierbas frescas',
    price: 18.0,
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=400&fit=crop',
    category_id: '1',
    subcategory_id: 'sub-2',
    featured: true,
    popular: true,
    is_active: true,
  },
  {
    id: '3',
    name: 'Hamburguesa Clasica',
    description: 'Medallon de carne con salsa especial',
    price: 15.0,
    image: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=400&h=400&fit=crop',
    category_id: '1',
    subcategory_id: 'sub-1',
    featured: true,
    popular: true,
    is_active: true,
  },
  {
    id: '4',
    name: 'Bowl Veggie',
    description: 'Vegetales frescos y quinoa',
    price: 14.0,
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=400&fit=crop',
    category_id: '1',
    subcategory_id: 'sub-3',
    featured: false,
    popular: true,
    badge: 'VEGANO',
    is_active: true,
  },
  {
    id: '5',
    name: 'Salmon a la Parrilla',
    description: 'Con salsa de limon y manteca',
    price: 24.0,
    image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=400&fit=crop',
    category_id: '1',
    subcategory_id: 'sub-4',
    featured: true,
    popular: false,
    is_active: true,
  },
  {
    id: '6',
    name: 'Pasta Carbonara',
    description: 'Pasta cremosa con panceta',
    price: 16.0,
    image: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400&h=400&fit=crop',
    category_id: '1',
    subcategory_id: 'sub-2',
    featured: false,
    popular: true,
    is_active: true,
  },
  {
    id: '7',
    name: 'Cerveza Artesanal',
    description: 'Seleccion de IPA local',
    price: 7.0,
    image: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=400&h=400&fit=crop',
    category_id: '2',
    subcategory_id: 'sub-6',
    featured: false,
    popular: true,
    is_active: true,
  },
  {
    id: '8',
    name: 'Limonada Fresca',
    description: 'Casera con menta',
    price: 5.0,
    image: 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=400&h=400&fit=crop',
    category_id: '2',
    subcategory_id: 'sub-8',
    featured: false,
    popular: true,
    is_active: true,
  },
  {
    id: '9',
    name: 'Torta de Chocolate',
    description: 'Chocolate negro intenso',
    price: 9.0,
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=400&fit=crop',
    category_id: '3',
    subcategory_id: 'sub-10',
    featured: true,
    popular: true,
    is_active: true,
  },
  {
    id: '10',
    name: 'Helado',
    description: 'Seleccion de tres bochas',
    price: 7.0,
    image: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=400&h=400&fit=crop',
    category_id: '3',
    subcategory_id: 'sub-11',
    featured: false,
    popular: true,
    is_active: true,
  },
  {
    id: '11',
    name: 'Hamburguesa BBQ',
    description: 'Con bacon y salsa barbacoa',
    price: 17.0,
    image: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400&h=400&fit=crop',
    category_id: '1',
    subcategory_id: 'sub-1',
    featured: false,
    popular: true,
    badge: 'BBQ',
    is_active: true,
  },
  {
    id: '12',
    name: 'Mojito Clasico',
    description: 'Ron, menta, lima y soda',
    price: 10.0,
    image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=400&h=400&fit=crop',
    category_id: '2',
    subcategory_id: 'sub-7',
    featured: true,
    popular: true,
    is_active: true,
  },
  {
    id: '13',
    name: 'Vino Tinto Reserva',
    description: 'Malbec argentino',
    price: 15.0,
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&h=400&fit=crop',
    category_id: '2',
    subcategory_id: 'sub-9',
    featured: false,
    popular: false,
    is_active: true,
  },
  {
    id: '14',
    name: 'Ensalada de Frutas',
    description: 'Frutas frescas de estacion',
    price: 8.0,
    image: 'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=400&h=400&fit=crop',
    category_id: '3',
    subcategory_id: 'sub-12',
    featured: false,
    popular: true,
    badge: 'SALUDABLE',
    is_active: true,
  },
]

export const useProductStore = create<ProductState>()(
  persist(
    (set, get) => ({
      products: initialProducts,
      isLoading: false,
      error: null,

      setProducts: (products) => set({ products }),

      addProduct: (data) => {
        const newProduct: Product = {
          id: generateId(),
          ...data,
          is_active: data.is_active ?? true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        set((state) => ({ products: [...state.products, newProduct] }))
        return newProduct
      },

      updateProduct: (id, data) =>
        set((state) => ({
          products: state.products.map((prod) =>
            prod.id === id
              ? { ...prod, ...data, updated_at: new Date().toISOString() }
              : prod
          ),
        })),

      deleteProduct: (id) =>
        set((state) => ({
          products: state.products.filter((prod) => prod.id !== id),
        })),

      getByCategory: (categoryId) => {
        return get().products.filter((p) => p.category_id === categoryId)
      },

      getBySubcategory: (subcategoryId) => {
        return get().products.filter((p) => p.subcategory_id === subcategoryId)
      },

      deleteByCategory: (categoryId) =>
        set((state) => ({
          products: state.products.filter(
            (prod) => prod.category_id !== categoryId
          ),
        })),

      deleteBySubcategory: (subcategoryId) =>
        set((state) => ({
          products: state.products.filter(
            (prod) => prod.subcategory_id !== subcategoryId
          ),
        })),

      clearError: () => set({ error: null }),
    }),
    {
      name: 'dashboard-products',
    }
  )
)
