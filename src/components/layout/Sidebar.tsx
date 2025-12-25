import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Building2,
  GitBranch,
  FolderTree,
  Layers,
  Package,
  DollarSign,
  AlertTriangle,
  Tags,
  Percent,
  Settings,
  LogOut,
  ChevronDown,
  ClipboardList,
} from 'lucide-react'
import { useBranchStore, selectSelectedBranchId, selectBranchById } from '../../stores/branchStore'

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

interface NavGroup {
  name: string
  icon: React.ComponentType<{ className?: string }>
  children: NavItem[]
}

type NavigationItem = NavItem | NavGroup

function isNavGroup(item: NavigationItem): item is NavGroup {
  return 'children' in item
}

const navigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Restaurante', href: '/restaurant', icon: Building2 },
  {
    name: 'Gestion',
    icon: ClipboardList,
    children: [
      { name: 'Sucursales', href: '/branches', icon: GitBranch },
      { name: 'Categorias', href: '/categories', icon: FolderTree },
      { name: 'Subcategorias', href: '/subcategories', icon: Layers },
      { name: 'Productos', href: '/products', icon: Package },
    ],
  },
  { name: 'Precios', href: '/prices', icon: DollarSign },
  { name: 'Alergenos', href: '/allergens', icon: AlertTriangle },
  { name: 'Tipos de Promo', href: '/promotion-types', icon: Tags },
  { name: 'Promociones', href: '/promotions', icon: Percent },
]

const bottomNavigation = [
  { name: 'Configuracion', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const location = useLocation()
  const selectedBranchId = useBranchStore(selectSelectedBranchId)
  const selectedBranch = useBranchStore(selectBranchById(selectedBranchId))

  // Check if any child route is active to auto-expand the group
  const gestionPaths = ['/branches', '/categories', '/subcategories', '/products']
  const isGestionActive = gestionPaths.some((path) => location.pathname === path)
  const [isGestionOpen, setIsGestionOpen] = useState(isGestionActive)

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">B</span>
          </div>
          <span className="text-white font-semibold text-lg">barijho</span>
        </div>
      </div>

      {/* Selected Branch Indicator */}
      {selectedBranch && (
        <div className="px-4 py-3 border-b border-zinc-800 bg-orange-500/5">
          <p className="text-xs text-zinc-500 uppercase tracking-wider">
            Sucursal activa
          </p>
          <p className="text-sm font-medium text-orange-500 truncate">
            {selectedBranch.name}
          </p>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          if (isNavGroup(item)) {
            const isOpen = item.name === 'Gestion' ? isGestionOpen : false
            const hasActiveChild = item.children.some(
              (child) => location.pathname === child.href
            )

            return (
              <div key={item.name}>
                <button
                  onClick={() => {
                    if (item.name === 'Gestion') {
                      setIsGestionOpen(!isGestionOpen)
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-150 ${
                    hasActiveChild
                      ? 'text-orange-500'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                  }`}
                  aria-expanded={isOpen}
                >
                  <item.icon className="w-5 h-5" aria-hidden="true" />
                  <span className="font-medium flex-1 text-left">{item.name}</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                    aria-hidden="true"
                  />
                </button>
                {isOpen && (
                  <div className="mt-1 ml-4 pl-3 border-l border-zinc-800 space-y-1">
                    {item.children.map((child) => (
                      <NavLink
                        key={child.name}
                        to={child.href}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-150 ${
                            isActive
                              ? 'bg-orange-500/10 text-orange-500'
                              : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                          }`
                        }
                      >
                        <child.icon className="w-4 h-4" aria-hidden="true" />
                        <span className="text-sm font-medium">{child.name}</span>
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            )
          }

          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-150 ${
                  isActive
                    ? 'bg-orange-500/10 text-orange-500'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`
              }
            >
              <item.icon className="w-5 h-5" aria-hidden="true" />
              <span className="font-medium">{item.name}</span>
            </NavLink>
          )
        })}
      </nav>

      {/* Bottom Navigation */}
      <div className="px-3 py-4 border-t border-zinc-800 space-y-1">
        {bottomNavigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-150 ${
                isActive
                  ? 'bg-orange-500/10 text-orange-500'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`
            }
          >
            <item.icon className="w-5 h-5" aria-hidden="true" />
            <span className="font-medium">{item.name}</span>
          </NavLink>
        ))}

        <button
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors duration-150"
          onClick={() => {
            // TODO: Implement logout
            console.log('Logout')
          }}
        >
          <LogOut className="w-5 h-5" aria-hidden="true" />
          <span className="font-medium">Cerrar Sesion</span>
        </button>
      </div>
    </aside>
  )
}
