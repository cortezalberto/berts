# Arquitectura del Sistema de Menu Digital para Restaurante Multi-Sucursal

## Documento de Especificacion Tecnica y Flujo de Operaciones

**Version:** 1.0
**Fecha:** Diciembre 2025
**Stack Tecnologico:** React + TypeScript (PWA) | FastAPI (Backend) | PostgreSQL (DB) | WebSockets (Tiempo Real)

---

## INDICE

1. [Vision General del Sistema](#1-vision-general-del-sistema)
2. [Arquitectura de Alto Nivel](#2-arquitectura-de-alto-nivel)
3. [Componentes del Sistema](#3-componentes-del-sistema)
4. [Modelo de Datos](#4-modelo-de-datos)
5. [Flujo de Operaciones Completo](#5-flujo-de-operaciones-completo)
6. [Implementacion de WebSockets](#6-implementacion-de-websockets)
7. [Gestion del Carrito Compartido](#7-gestion-del-carrito-compartido)
8. [Estados de las Comandas](#8-estados-de-las-comandas)
9. [Seguridad y Autenticacion](#9-seguridad-y-autenticacion)
10. [Consideraciones de Escalabilidad](#10-consideraciones-de-escalabilidad)

---

## 1. VISION GENERAL DEL SISTEMA

### 1.1 Descripcion del Problema

El sistema debe gestionar un restaurante con multiples sucursales, donde cada sucursal tiene:
- **Carta personalizada**: Diferentes productos, precios y disponibilidad por sucursal
- **Gestion de mesas**: Configuracion diaria de mesas activas
- **Asignacion de mozos**: Cada mozo atiende un conjunto especifico de mesas
- **Pedidos en tiempo real**: Comunicacion instantanea entre comensales, mozos y cocina
- **Carrito compartido**: Multiples comensales en una mesa pueden agregar productos a un pedido unificado

### 1.2 Actores del Sistema

```
+------------------+     +------------------+     +------------------+     +------------------+
|    COMENSAL      |     |      MOZO        |     |     COCINA       |     |   ADMINISTRADOR  |
|                  |     |                  |     |                  |     |                  |
| - Escanea QR     |     | - Monitorea      |     | - Recibe         |     | - Configura      |
| - Ve carta       |     |   mesas          |     |   comandas       |     |   sucursales     |
| - Agrega al      |     | - Toma pedidos   |     | - Prepara        |     | - Gestiona       |
|   carrito        |     | - Confirma       |     |   platos         |     |   cartas         |
| - Envia pedido   |     |   comandas       |     | - Marca listos   |     | - Asigna mozos   |
+------------------+     +------------------+     +------------------+     +------------------+
        |                        |                        |                        |
        +------------------------+------------------------+------------------------+
                                 |
                    +---------------------------+
                    |    SERVIDOR CENTRAL       |
                    |    (FastAPI + WebSocket)  |
                    +---------------------------+
                                 |
                    +---------------------------+
                    |       PostgreSQL          |
                    +---------------------------+
```

### 1.3 Aplicaciones PWA

| Aplicacion | Usuario | Funcionalidad Principal |
|------------|---------|------------------------|
| **Menu Digital** | Comensales | Visualizar carta, agregar al carrito compartido, enviar pedidos |
| **App Mozo** | Mozos/Camareros | Monitorear mesas asignadas, recibir pedidos, gestionar comandas |
| **Dashboard** | Administradores | Configurar sucursales, cartas, mesas, asignar personal |
| **App Cocina** | Personal de cocina | Recibir comandas, marcar platos en preparacion/listos |

---

## 2. ARQUITECTURA DE ALTO NIVEL

### 2.1 Diagrama de Arquitectura

```
                                    INTERNET
                                        |
                    +-------------------+-------------------+
                    |                   |                   |
            +-------+-------+   +-------+-------+   +-------+-------+
            |  PWA Menu     |   |  PWA Mozo     |   |  Dashboard    |
            |  (Comensal)   |   |  (Tablet)     |   |  (Admin)      |
            |  React + TS   |   |  React + TS   |   |  React + TS   |
            +-------+-------+   +-------+-------+   +-------+-------+
                    |                   |                   |
                    |    WebSocket      |    WebSocket      |    REST API
                    |    Connection     |    Connection     |    + WebSocket
                    |                   |                   |
            +-------+-------------------+-------------------+-------+
            |                                                       |
            |              NGINX (Reverse Proxy / Load Balancer)    |
            |                                                       |
            +-------+-------------------+-------------------+-------+
                    |                   |                   |
            +-------+-------+   +-------+-------+   +-------+-------+
            |   FastAPI     |   |   FastAPI     |   |   FastAPI     |
            |   Instance 1  |   |   Instance 2  |   |   Instance N  |
            +-------+-------+   +-------+-------+   +-------+-------+
                    |                   |                   |
            +-------+-------------------+-------------------+-------+
            |                                                       |
            |                    Redis                              |
            |         (WebSocket Pub/Sub + Session Cache)           |
            |                                                       |
            +-------------------------------------------------------+
                                        |
            +-------------------------------------------------------+
            |                                                       |
            |                    PostgreSQL                         |
            |              (Base de Datos Principal)                |
            |                                                       |
            +-------------------------------------------------------+
```

### 2.2 Justificacion de Tecnologias

| Tecnologia | Justificacion |
|------------|---------------|
| **React + TypeScript** | Type-safety, componentes reutilizables, ecosistema maduro para PWA |
| **FastAPI** | Alto rendimiento, soporte nativo WebSocket, async/await, documentacion automatica |
| **PostgreSQL** | ACID compliant, soporte JSON, escalabilidad, integridad referencial |
| **WebSocket** | Comunicacion bidireccional en tiempo real, baja latencia |
| **Redis** | Pub/Sub para WebSocket scaling, cache de sesiones, carrito compartido |

---

## 3. COMPONENTES DEL SISTEMA

### 3.1 PWA Menu Digital (Comensales)

```typescript
// Estructura de la aplicacion
src/
├── components/
│   ├── Menu/
│   │   ├── CategoryList.tsx       // Lista de categorias de la carta
│   │   ├── ProductCard.tsx        // Tarjeta de producto
│   │   ├── ProductDetail.tsx      // Detalle con opciones/extras
│   │   └── AllergenBadge.tsx      // Indicadores de alergenos
│   ├── Cart/
│   │   ├── SharedCart.tsx         // Carrito compartido de la mesa
│   │   ├── CartItem.tsx           // Item individual del carrito
│   │   ├── CartSummary.tsx        // Resumen y total
│   │   └── CartSync.tsx           // Sincronizacion en tiempo real
│   ├── Order/
│   │   ├── OrderConfirmation.tsx  // Confirmacion antes de enviar
│   │   ├── OrderStatus.tsx        // Estado del pedido en tiempo real
│   │   └── OrderHistory.tsx       // Historial de pedidos de la mesa
│   └── QR/
│       └── QRScanner.tsx          // Escaner de codigo QR
├── hooks/
│   ├── useWebSocket.ts            // Hook para conexion WebSocket
│   ├── useSharedCart.ts           // Hook para carrito compartido
│   └── useTableSession.ts         // Hook para sesion de mesa
├── services/
│   ├── api.ts                     // Cliente REST API
│   └── websocket.ts               // Cliente WebSocket
├── stores/
│   ├── cartStore.ts               // Estado del carrito (Zustand)
│   ├── menuStore.ts               // Estado del menu
│   └── sessionStore.ts            // Sesion de mesa
└── types/
    └── index.ts                   // Tipos TypeScript
```

### 3.2 PWA App Mozo (Tablets)

```typescript
// Estructura de la aplicacion
src/
├── components/
│   ├── Tables/
│   │   ├── TableGrid.tsx          // Grilla de mesas asignadas
│   │   ├── TableCard.tsx          // Estado visual de cada mesa
│   │   └── TableDetail.tsx        // Detalle de mesa y pedidos
│   ├── Orders/
│   │   ├── IncomingOrders.tsx     // Pedidos entrantes (notificaciones)
│   │   ├── OrderCard.tsx          // Tarjeta de pedido
│   │   ├── OrderActions.tsx       // Acciones: tomar, confirmar, etc.
│   │   └── OrderTimeline.tsx      // Timeline de estados
│   ├── Notifications/
│   │   ├── NotificationBell.tsx   // Campana de notificaciones
│   │   ├── NotificationList.tsx   // Lista de notificaciones
│   │   └── NotificationToast.tsx  // Toast de nuevo pedido
│   └── Kitchen/
│       └── KitchenStatus.tsx      // Estado de platos en cocina
├── hooks/
│   ├── useWebSocket.ts            // Conexion WebSocket
│   ├── useNotifications.ts        // Gestion de notificaciones
│   └── useAssignedTables.ts       // Mesas asignadas al mozo
├── services/
│   ├── api.ts                     // Cliente REST API
│   └── websocket.ts               // Cliente WebSocket
└── stores/
    ├── tablesStore.ts             // Estado de mesas
    ├── ordersStore.ts             // Estado de pedidos
    └── notificationStore.ts       // Estado de notificaciones
```

### 3.3 Backend FastAPI

```python
# Estructura del backend
app/
├── main.py                        # Punto de entrada FastAPI
├── config.py                      # Configuracion (env vars)
├── database.py                    # Conexion PostgreSQL
├── redis_client.py                # Conexion Redis
│
├── api/
│   ├── v1/
│   │   ├── __init__.py
│   │   ├── auth.py                # Endpoints de autenticacion
│   │   ├── branches.py            # CRUD sucursales
│   │   ├── categories.py          # CRUD categorias
│   │   ├── products.py            # CRUD productos
│   │   ├── tables.py              # CRUD mesas
│   │   ├── waiters.py             # CRUD mozos
│   │   ├── orders.py              # CRUD pedidos/comandas
│   │   └── menu.py                # Endpoints publicos del menu
│   └── websocket/
│       ├── __init__.py
│       ├── connection_manager.py  # Gestor de conexiones WS
│       ├── handlers.py            # Handlers de mensajes WS
│       ├── events.py              # Definicion de eventos
│       └── rooms.py               # Gestion de rooms (mesas, mozos)
│
├── models/
│   ├── __init__.py
│   ├── branch.py                  # Modelo Sucursal
│   ├── category.py                # Modelo Categoria
│   ├── product.py                 # Modelo Producto
│   ├── table.py                   # Modelo Mesa
│   ├── waiter.py                  # Modelo Mozo
│   ├── order.py                   # Modelo Pedido/Comanda
│   ├── order_item.py              # Modelo Item de Pedido
│   └── cart.py                    # Modelo Carrito Compartido
│
├── schemas/
│   ├── __init__.py
│   ├── auth.py                    # Schemas de autenticacion
│   ├── branch.py                  # Schemas de sucursal
│   ├── order.py                   # Schemas de pedido
│   └── websocket.py               # Schemas de mensajes WS
│
├── services/
│   ├── __init__.py
│   ├── auth_service.py            # Logica de autenticacion
│   ├── order_service.py           # Logica de pedidos
│   ├── cart_service.py            # Logica de carrito compartido
│   ├── notification_service.py   # Logica de notificaciones
│   └── table_service.py           # Logica de mesas
│
└── utils/
    ├── __init__.py
    ├── qr_generator.py            # Generador de QR
    └── validators.py              # Validadores custom
```

---

## 4. MODELO DE DATOS

### 4.1 Diagrama Entidad-Relacion

```
+------------------+       +------------------+       +------------------+
|   RESTAURANT     |       |     BRANCH       |       |     WAITER       |
+------------------+       +------------------+       +------------------+
| id (PK)          |<----->| id (PK)          |<----->| id (PK)          |
| name             |   1:N | restaurant_id(FK)|   N:1 | branch_id (FK)   |
| slug             |       | name             |       | name             |
| logo_url         |       | address          |       | email            |
| created_at       |       | phone            |       | pin_code         |
+------------------+       | is_active        |       | is_active        |
                           | settings (JSON)  |       | created_at       |
                           +------------------+       +------------------+
                                   |                          |
                                   | 1:N                      | N:M
                                   v                          v
+------------------+       +------------------+       +------------------+
|    CATEGORY      |       |      TABLE       |       | WAITER_TABLE     |
+------------------+       +------------------+       +------------------+
| id (PK)          |       | id (PK)          |       | waiter_id (FK)   |
| branch_id (FK)   |       | branch_id (FK)   |       | table_id (FK)    |
| name             |       | number           |       | assigned_date    |
| description      |       | capacity         |       | shift            |
| image_url        |       | qr_code          |       +------------------+
| order            |       | qr_token (unique)|
| is_active        |       | status           |
+------------------+       | is_active        |
        |                  +------------------+
        | 1:N                      |
        v                          | 1:N
+------------------+               v
|    PRODUCT       |       +------------------+
+------------------+       |   TABLE_SESSION  |
| id (PK)          |       +------------------+
| category_id (FK) |       | id (PK)          |
| name             |       | table_id (FK)    |
| description      |       | session_token    |
| base_price       |       | started_at       |
| image_url        |       | closed_at        |
| allergen_ids[]   |       | status           |
| is_active        |       +------------------+
| order            |               |
+------------------+               | 1:N
        |                          v
        | 1:N              +------------------+
        v                  |   SHARED_CART    |
+------------------+       +------------------+
|  BRANCH_PRODUCT  |       | id (PK)          |
+------------------+       | session_id (FK)  |
| branch_id (FK)   |       | items (JSON)     |
| product_id (FK)  |       | updated_at       |
| price            |       | version          |
| is_available     |       +------------------+
| stock            |               |
+------------------+               | 1:N
                                   v
                           +------------------+
                           |      ORDER       |
                           +------------------+
                           | id (PK)          |
                           | session_id (FK)  |
                           | waiter_id (FK)   |
                           | order_number     |
                           | status           |
                           | total            |
                           | notes            |
                           | created_at       |
                           | updated_at       |
                           +------------------+
                                   |
                                   | 1:N
                                   v
                           +------------------+
                           |   ORDER_ITEM     |
                           +------------------+
                           | id (PK)          |
                           | order_id (FK)    |
                           | product_id (FK)  |
                           | quantity         |
                           | unit_price       |
                           | notes            |
                           | status           |
                           +------------------+
```

### 4.2 Definicion SQL

```sql
-- Tabla de Restaurantes
CREATE TABLE restaurants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    logo_url TEXT,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Sucursales
CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(restaurant_id, name)
);

-- Tabla de Categorias (por sucursal)
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(branch_id, name)
);

-- Tabla de Productos (global)
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    base_price DECIMAL(10,2) NOT NULL,
    image_url TEXT,
    allergen_ids UUID[] DEFAULT '{}',
    preparation_time INTEGER, -- minutos
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Precios por Sucursal
CREATE TABLE branch_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    price DECIMAL(10,2) NOT NULL,
    is_available BOOLEAN DEFAULT true,
    stock INTEGER, -- NULL = ilimitado
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(branch_id, product_id)
);

-- Tabla de Mesas
CREATE TABLE tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    table_number VARCHAR(20) NOT NULL,
    capacity INTEGER DEFAULT 4,
    qr_token VARCHAR(64) UNIQUE NOT NULL, -- Token unico para el QR
    status VARCHAR(20) DEFAULT 'available', -- available, occupied, reserved, inactive
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(branch_id, table_number)
);

-- Tabla de Mozos
CREATE TABLE waiters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    pin_code VARCHAR(6) NOT NULL, -- PIN para login rapido
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Asignacion Mozo-Mesa (por turno/dia)
CREATE TABLE waiter_table_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    waiter_id UUID NOT NULL REFERENCES waiters(id) ON DELETE CASCADE,
    table_id UUID NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
    assigned_date DATE NOT NULL,
    shift VARCHAR(20) NOT NULL, -- morning, afternoon, night
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(table_id, assigned_date, shift)
);

-- Tabla de Sesiones de Mesa
CREATE TABLE table_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_id UUID NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
    session_token VARCHAR(64) UNIQUE NOT NULL,
    diners_count INTEGER DEFAULT 1,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    closed_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'active', -- active, closed, cancelled
    CONSTRAINT check_session_status CHECK (status IN ('active', 'closed', 'cancelled'))
);

-- Tabla de Carrito Compartido
CREATE TABLE shared_carts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES table_sessions(id) ON DELETE CASCADE,
    items JSONB DEFAULT '[]',
    version INTEGER DEFAULT 1, -- Para control de concurrencia optimista
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(session_id)
);

-- Tabla de Pedidos/Comandas
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES table_sessions(id) ON DELETE CASCADE,
    waiter_id UUID REFERENCES waiters(id) ON DELETE SET NULL,
    order_number SERIAL,
    status VARCHAR(30) NOT NULL DEFAULT 'requested',
    subtotal DECIMAL(10,2) NOT NULL,
    tax DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT check_order_status CHECK (
        status IN ('requested', 'taken', 'confirmed', 'preparing', 'ready', 'delivered', 'paid', 'cancelled')
    )
);

-- Tabla de Items del Pedido
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL,
    notes TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT check_item_status CHECK (
        status IN ('pending', 'preparing', 'ready', 'delivered', 'cancelled')
    )
);

-- Indices para optimizacion
CREATE INDEX idx_branches_restaurant ON branches(restaurant_id);
CREATE INDEX idx_categories_branch ON categories(branch_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_tables_branch ON tables(branch_id);
CREATE INDEX idx_orders_session ON orders(session_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_waiter ON orders(waiter_id);
CREATE INDEX idx_waiter_assignments_date ON waiter_table_assignments(assigned_date);
CREATE INDEX idx_table_sessions_active ON table_sessions(table_id) WHERE status = 'active';
```

---

## 5. FLUJO DE OPERACIONES COMPLETO

### 5.1 Diagrama de Secuencia Principal

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│Comensal │     │   QR    │     │ Server  │     │  Redis  │     │  Mozo   │     │ Cocina  │
│  (PWA)  │     │         │     │(FastAPI)│     │         │     │  (PWA)  │     │  (PWA)  │
└────┬────┘     └────┬────┘     └────┬────┘     └────┬────┘     └────┬────┘     └────┬────┘
     │               │               │               │               │               │
     │   FASE 1: INICIO DE SESION DE MESA                           │               │
     │               │               │               │               │               │
     │ Escanea QR    │               │               │               │               │
     │──────────────>│               │               │               │               │
     │               │               │               │               │               │
     │ URL: /menu?   │               │               │               │               │
     │ token=ABC123  │               │               │               │               │
     │<──────────────│               │               │               │               │
     │               │               │               │               │               │
     │ GET /api/v1/menu/session?token=ABC123         │               │               │
     │──────────────────────────────>│               │               │               │
     │               │               │               │               │               │
     │               │               │ Valida token  │               │               │
     │               │               │ Busca mesa    │               │               │
     │               │               │ Crea sesion   │               │               │
     │               │               │──────────────>│               │               │
     │               │               │ Cache session │               │               │
     │               │               │<──────────────│               │               │
     │               │               │               │               │               │
     │ { session_id, table_number, branch_info, menu }               │               │
     │<──────────────────────────────│               │               │               │
     │               │               │               │               │               │
     │   FASE 2: CONEXION WEBSOCKET                 │               │               │
     │               │               │               │               │               │
     │ WS Connect: /ws/table/{session_id}            │               │               │
     │──────────────────────────────>│               │               │               │
     │               │               │               │               │               │
     │               │               │ Subscribe to  │               │               │
     │               │               │ room:table:   │               │               │
     │               │               │ {session_id}  │               │               │
     │               │               │──────────────>│               │               │
     │               │               │<──────────────│               │               │
     │               │               │               │               │               │
     │ WS: { type: "connected", cart: {...} }        │               │               │
     │<──────────────────────────────│               │               │               │
     │               │               │               │               │               │
     │   FASE 3: CARRITO COMPARTIDO                 │               │               │
     │               │               │               │               │               │
     │ WS: { type: "cart:add", product_id, qty }     │               │               │
     │──────────────────────────────>│               │               │               │
     │               │               │               │               │               │
     │               │               │ Update cart   │               │               │
     │               │               │ in Redis      │               │               │
     │               │               │──────────────>│               │               │
     │               │               │<──────────────│               │               │
     │               │               │               │               │               │
     │               │               │ Publish to    │               │               │
     │               │               │ room:table:X  │               │               │
     │               │               │──────────────>│               │               │
     │               │               │               │               │               │
     │ WS: { type: "cart:updated", cart: {...} }     │ (a todos los  │               │
     │<──────────────────────────────│<──────────────│ comensales    │               │
     │               │               │               │ de la mesa)   │               │
     │               │               │               │               │               │
     │   FASE 4: ENVIO DEL PEDIDO                   │               │               │
     │               │               │               │               │               │
     │ WS: { type: "order:submit", cart_version }    │               │               │
     │──────────────────────────────>│               │               │               │
     │               │               │               │               │               │
     │               │               │ Validate cart │               │               │
     │               │               │ version       │               │               │
     │               │               │──────────────>│               │               │
     │               │               │<──────────────│               │               │
     │               │               │               │               │               │
     │               │               │ Create order  │               │               │
     │               │               │ status:       │               │               │
     │               │               │ "REQUESTED"   │               │               │
     │               │               │               │               │               │
     │               │               │ Find assigned │               │               │
     │               │               │ waiter        │               │               │
     │               │               │               │               │               │
     │               │               │ Publish to    │               │               │
     │               │               │ room:waiter:Y │               │               │
     │               │               │──────────────>│               │               │
     │               │               │               │──────────────>│               │
     │               │               │               │               │               │
     │ WS: { type: "order:created", order_id, status: "requested" }  │               │
     │<──────────────────────────────│               │               │               │
     │               │               │               │               │               │
     │               │               │               │ WS: { type:   │               │
     │               │               │               │ "order:new",  │               │
     │               │               │               │ order: {...}} │               │
     │               │               │               │──────────────>│               │
     │               │               │               │               │               │
     │   FASE 5: MOZO TOMA EL PEDIDO                │               │               │
     │               │               │               │               │               │
     │               │               │               │               │ WS: { type:   │
     │               │               │               │               │ "order:take", │
     │               │               │               │               │ order_id }    │
     │               │               │               │               │──────────────>│
     │               │               │               │               │               │
     │               │               │ Update order  │               │               │
     │               │               │ status:       │               │               │
     │               │               │ "TAKEN"       │               │               │
     │               │               │               │               │               │
     │               │               │ Publish to    │               │               │
     │               │               │ room:table:X  │               │               │
     │               │               │──────────────>│               │               │
     │               │               │               │               │               │
     │ WS: { type: "order:status", order_id, status: "taken" }       │               │
     │<──────────────────────────────│<──────────────│               │               │
     │               │               │               │               │               │
     │   FASE 6: MOZO CONFIRMA A COCINA             │               │               │
     │               │               │               │               │               │
     │               │               │               │               │ WS: { type:   │
     │               │               │               │               │"order:confirm"│
     │               │               │               │               │ order_id }    │
     │               │               │               │               │──────────────>│
     │               │               │               │               │               │
     │               │               │ Update order  │               │               │
     │               │               │ status:       │               │               │
     │               │               │ "CONFIRMED"   │               │               │
     │               │               │               │               │               │
     │               │               │ Publish to    │               │               │
     │               │               │ room:kitchen  │               │               │
     │               │               │──────────────>│               │               │
     │               │               │               │──────────────────────────────>│
     │               │               │               │               │               │
     │ WS: { type: "order:status", status: "confirmed" }             │               │
     │<──────────────────────────────│               │               │               │
     │               │               │               │               │ WS: { type:   │
     │               │               │               │               │ "order:new",  │
     │               │               │               │               │ order }       │
     │               │               │               │               │<──────────────│
     │               │               │               │               │               │
     │   FASE 7: COCINA PREPARA Y NOTIFICA          │               │               │
     │               │               │               │               │               │
     │               │               │               │               │               │ WS: { type:
     │               │               │               │               │               │"item:ready",
     │               │               │               │               │               │ item_id }
     │               │               │<─────────────────────────────────────────────│
     │               │               │               │               │               │
     │               │               │ Update item   │               │               │
     │               │               │ status:"ready"│               │               │
     │               │               │               │               │               │
     │               │               │ Publish to    │               │               │
     │               │               │ waiter & table│               │               │
     │               │               │──────────────>│               │               │
     │               │               │               │──────────────>│               │
     │               │               │               │               │               │
     │ WS: { type: "item:ready", item }              │ WS: { type:   │               │
     │<──────────────────────────────│               │ "item:ready"} │               │
     │               │               │               │──────────────>│               │
     │               │               │               │               │               │
     │   FASE 8: CICLO CONTINUA...                  │               │               │
     │               │               │               │               │               │
```

### 5.2 Flujo Detallado por Fase

#### FASE 1: Configuracion Inicial del Dia (Dashboard Admin)

```
1. Administrador inicia sesion en Dashboard
2. Selecciona sucursal
3. Configura mesas activas para el dia:
   - Activa/desactiva mesas
   - Genera QR codes para mesas nuevas
4. Asigna mozos a mesas:
   - Selecciona turno (manana/tarde/noche)
   - Arrastra mozos a mesas o asigna por zona
5. Sistema guarda asignaciones en waiter_table_assignments
```

#### FASE 2: Comensal Escanea QR

```
1. Comensal escanea QR de la mesa
2. QR contiene URL: https://menu.restaurant.com/m?t={qr_token}
3. PWA Menu recibe el token
4. PWA hace request: GET /api/v1/menu/session?token={qr_token}
5. Backend:
   a. Valida que el token existe y la mesa esta activa
   b. Busca sesion activa para esa mesa
   c. Si no existe, crea nueva sesion (table_sessions)
   d. Crea carrito vacio (shared_carts)
   e. Retorna: session_id, session_token, branch_info, menu completo
6. PWA almacena session_token en localStorage
7. PWA establece conexion WebSocket
```

#### FASE 3: Carrito Compartido en Tiempo Real

```
1. Comensal A agrega producto al carrito
2. PWA envia via WebSocket:
   {
     type: "cart:add",
     product_id: "uuid",
     quantity: 2,
     notes: "sin cebolla",
     cart_version: 1
   }
3. Backend:
   a. Valida version del carrito (optimistic locking)
   b. Actualiza carrito en Redis (atomico)
   c. Incrementa version
   d. Publica a room:table:{session_id}
4. Todos los comensales de la mesa reciben:
   {
     type: "cart:updated",
     cart: { items: [...], total: 2500, version: 2 },
     updated_by: "Comensal A"
   }
5. PWAs actualizan UI instantaneamente
```

#### FASE 4: Envio del Pedido

```
1. Cualquier comensal puede enviar el pedido
2. PWA envia via WebSocket:
   {
     type: "order:submit",
     cart_version: 5,
     notes: "para compartir"
   }
3. Backend:
   a. Valida version del carrito
   b. Crea registro en orders con status: "requested"
   c. Crea registros en order_items
   d. Vacia el carrito compartido
   e. Busca mozo asignado a esa mesa (waiter_table_assignments)
   f. Publica a room:waiter:{waiter_id}
   g. Publica a room:table:{session_id}
4. Comensal recibe confirmacion:
   {
     type: "order:created",
     order: { id, number: 42, status: "requested", items: [...] }
   }
5. Mozo recibe notificacion:
   {
     type: "order:new",
     order: { id, table_number: "5", items: [...], created_at }
   }
```

#### FASE 5: Mozo Toma el Pedido

```
1. Mozo ve notificacion en su tablet (sonido + visual)
2. Mozo presiona "Tomar Pedido"
3. PWA Mozo envia via WebSocket:
   {
     type: "order:take",
     order_id: "uuid"
   }
4. Backend:
   a. Valida que el mozo esta asignado a esa mesa
   b. Actualiza order.status = "taken"
   c. Actualiza order.waiter_id
   d. Publica a room:table:{session_id}
5. Comensal ve actualizacion:
   {
     type: "order:status",
     order_id: "uuid",
     status: "taken",
     waiter_name: "Carlos"
   }
6. UI del comensal muestra: "Carlos ha tomado tu pedido"
```

#### FASE 6: Mozo Confirma a Cocina

```
1. Mozo revisa el pedido (puede modificar si es necesario)
2. Mozo presiona "Enviar a Cocina"
3. PWA Mozo envia via WebSocket:
   {
     type: "order:confirm",
     order_id: "uuid",
     modifications: [] // opcional
   }
4. Backend:
   a. Actualiza order.status = "confirmed"
   b. Actualiza order_items.status = "pending"
   c. Publica a room:kitchen:{branch_id}
   d. Publica a room:table:{session_id}
5. Cocina recibe:
   {
     type: "order:new",
     order: {
       id, table_number: "5",
       items: [
         { id, name: "Hamburguesa", quantity: 2, notes: "sin cebolla" },
         { id, name: "Papas fritas", quantity: 1 }
       ]
     }
   }
6. Comensal ve: "Tu pedido esta siendo preparado"
```

#### FASE 7: Cocina Prepara

```
1. Cocina ve pedido en pantalla
2. Cocinero marca item como "en preparacion":
   {
     type: "item:preparing",
     item_id: "uuid"
   }
3. Backend actualiza order_item.status = "preparing"
4. Cuando item esta listo:
   {
     type: "item:ready",
     item_id: "uuid"
   }
5. Backend:
   a. Actualiza order_item.status = "ready"
   b. Si todos los items estan listos, order.status = "ready"
   c. Publica a room:waiter:{waiter_id}
   d. Publica a room:table:{session_id}
6. Mozo ve notificacion: "Pedido Mesa 5 listo para servir"
7. Comensal ve: "Tu Hamburguesa esta lista!"
```

#### FASE 8: Entrega y Pago

```
1. Mozo lleva platos a la mesa
2. Mozo marca como entregado:
   {
     type: "order:delivered",
     order_id: "uuid"
   }
3. Backend actualiza order.status = "delivered"
4. Cuando cliente paga:
   {
     type: "order:paid",
     order_id: "uuid",
     payment_method: "cash|card|transfer"
   }
5. Backend:
   a. Actualiza order.status = "paid"
   b. Si no hay mas pedidos pendientes, puede cerrar sesion de mesa
```

---

## 6. IMPLEMENTACION DE WEBSOCKETS

### 6.1 Arquitectura WebSocket con FastAPI

```python
# app/api/websocket/connection_manager.py

from fastapi import WebSocket
from typing import Dict, Set
import json
import redis.asyncio as redis
from dataclasses import dataclass
from enum import Enum


class RoomType(Enum):
    TABLE = "table"      # room:table:{session_id}
    WAITER = "waiter"    # room:waiter:{waiter_id}
    KITCHEN = "kitchen"  # room:kitchen:{branch_id}
    ADMIN = "admin"      # room:admin:{branch_id}


@dataclass
class Connection:
    websocket: WebSocket
    user_type: str  # "customer", "waiter", "kitchen", "admin"
    user_id: str | None
    rooms: Set[str]


class ConnectionManager:
    """
    Gestor de conexiones WebSocket con soporte para:
    - Multiples instancias de servidor (via Redis Pub/Sub)
    - Rooms para segmentar mensajes
    - Reconexion automatica
    """

    def __init__(self, redis_url: str):
        self.active_connections: Dict[str, Connection] = {}
        self.redis_url = redis_url
        self.redis: redis.Redis | None = None
        self.pubsub: redis.client.PubSub | None = None

    async def initialize(self):
        """Inicializa conexion a Redis y suscripcion Pub/Sub"""
        self.redis = await redis.from_url(self.redis_url)
        self.pubsub = self.redis.pubsub()
        # Suscribirse a canal de broadcast
        await self.pubsub.subscribe("ws:broadcast")

    async def connect(
        self,
        websocket: WebSocket,
        connection_id: str,
        user_type: str,
        user_id: str | None = None
    ) -> Connection:
        """Acepta nueva conexion WebSocket"""
        await websocket.accept()

        connection = Connection(
            websocket=websocket,
            user_type=user_type,
            user_id=user_id,
            rooms=set()
        )

        self.active_connections[connection_id] = connection
        return connection

    async def disconnect(self, connection_id: str):
        """Cierra conexion y limpia recursos"""
        if connection_id in self.active_connections:
            connection = self.active_connections[connection_id]

            # Desuscribirse de todas las rooms
            for room in connection.rooms:
                await self.leave_room(connection_id, room)

            del self.active_connections[connection_id]

    async def join_room(self, connection_id: str, room: str):
        """Une conexion a una room"""
        if connection_id in self.active_connections:
            self.active_connections[connection_id].rooms.add(room)

            # Suscribirse a canal Redis de la room
            await self.pubsub.subscribe(f"ws:room:{room}")

    async def leave_room(self, connection_id: str, room: str):
        """Remueve conexion de una room"""
        if connection_id in self.active_connections:
            self.active_connections[connection_id].rooms.discard(room)

    async def send_to_connection(self, connection_id: str, message: dict):
        """Envia mensaje a una conexion especifica"""
        if connection_id in self.active_connections:
            connection = self.active_connections[connection_id]
            try:
                await connection.websocket.send_json(message)
            except Exception:
                await self.disconnect(connection_id)

    async def broadcast_to_room(self, room: str, message: dict):
        """
        Broadcast a todos los miembros de una room.
        Usa Redis Pub/Sub para soportar multiples instancias.
        """
        # Publicar en Redis para que otras instancias reciban
        await self.redis.publish(
            f"ws:room:{room}",
            json.dumps(message)
        )

        # Enviar a conexiones locales
        await self._send_to_local_room(room, message)

    async def _send_to_local_room(self, room: str, message: dict):
        """Envia a conexiones locales de una room"""
        disconnected = []

        for conn_id, connection in self.active_connections.items():
            if room in connection.rooms:
                try:
                    await connection.websocket.send_json(message)
                except Exception:
                    disconnected.append(conn_id)

        # Limpiar conexiones muertas
        for conn_id in disconnected:
            await self.disconnect(conn_id)

    async def listen_redis(self):
        """
        Loop que escucha mensajes de Redis Pub/Sub
        para mensajes de otras instancias del servidor
        """
        async for message in self.pubsub.listen():
            if message["type"] == "message":
                channel = message["channel"].decode()

                if channel.startswith("ws:room:"):
                    room = channel.replace("ws:room:", "")
                    data = json.loads(message["data"])
                    await self._send_to_local_room(room, data)


# Singleton global
manager = ConnectionManager(redis_url="redis://localhost:6379")
```

### 6.2 Endpoint WebSocket Principal

```python
# app/api/websocket/handlers.py

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
from typing import Optional
import uuid
from .connection_manager import manager, RoomType
from .events import WebSocketEvent, EventType
from app.services.cart_service import CartService
from app.services.order_service import OrderService
from app.services.auth_service import verify_session_token, verify_waiter_token

router = APIRouter()


@router.websocket("/ws/table/{session_id}")
async def websocket_table_endpoint(
    websocket: WebSocket,
    session_id: str,
    token: str = Query(...)
):
    """
    WebSocket para comensales de una mesa.

    Eventos que puede recibir:
    - cart:add, cart:remove, cart:update, cart:clear
    - order:submit

    Eventos que puede emitir:
    - cart:updated
    - order:created, order:status
    - item:ready
    """
    # Validar token de sesion
    session = await verify_session_token(token, session_id)
    if not session:
        await websocket.close(code=4001, reason="Invalid session")
        return

    connection_id = str(uuid.uuid4())

    try:
        # Conectar
        connection = await manager.connect(
            websocket=websocket,
            connection_id=connection_id,
            user_type="customer",
            user_id=None
        )

        # Unirse a room de la mesa
        room = f"table:{session_id}"
        await manager.join_room(connection_id, room)

        # Enviar estado inicial
        cart = await CartService.get_cart(session_id)
        orders = await OrderService.get_active_orders(session_id)

        await manager.send_to_connection(connection_id, {
            "type": "connected",
            "session_id": session_id,
            "cart": cart,
            "active_orders": orders
        })

        # Loop de mensajes
        while True:
            data = await websocket.receive_json()
            await handle_table_message(connection_id, session_id, data)

    except WebSocketDisconnect:
        await manager.disconnect(connection_id)
    except Exception as e:
        await manager.disconnect(connection_id)
        raise


@router.websocket("/ws/waiter/{waiter_id}")
async def websocket_waiter_endpoint(
    websocket: WebSocket,
    waiter_id: str,
    token: str = Query(...)
):
    """
    WebSocket para mozos.

    Eventos que puede recibir:
    - order:take, order:confirm, order:modify
    - item:delivered

    Eventos que puede emitir:
    - order:new (nuevo pedido en sus mesas)
    - item:ready (plato listo de cocina)
    - table:status (cambio de estado de mesa)
    """
    # Validar token del mozo
    waiter = await verify_waiter_token(token, waiter_id)
    if not waiter:
        await websocket.close(code=4001, reason="Invalid credentials")
        return

    connection_id = str(uuid.uuid4())

    try:
        connection = await manager.connect(
            websocket=websocket,
            connection_id=connection_id,
            user_type="waiter",
            user_id=waiter_id
        )

        # Unirse a room del mozo
        await manager.join_room(connection_id, f"waiter:{waiter_id}")

        # Obtener mesas asignadas y unirse a sus rooms
        assigned_tables = await get_waiter_assigned_tables(waiter_id)
        for table in assigned_tables:
            if table.active_session_id:
                await manager.join_room(
                    connection_id,
                    f"table:{table.active_session_id}"
                )

        # Enviar estado inicial
        pending_orders = await OrderService.get_waiter_pending_orders(waiter_id)

        await manager.send_to_connection(connection_id, {
            "type": "connected",
            "waiter_id": waiter_id,
            "assigned_tables": [t.dict() for t in assigned_tables],
            "pending_orders": pending_orders
        })

        # Loop de mensajes
        while True:
            data = await websocket.receive_json()
            await handle_waiter_message(connection_id, waiter_id, data)

    except WebSocketDisconnect:
        await manager.disconnect(connection_id)


@router.websocket("/ws/kitchen/{branch_id}")
async def websocket_kitchen_endpoint(
    websocket: WebSocket,
    branch_id: str,
    token: str = Query(...)
):
    """
    WebSocket para pantalla de cocina.

    Eventos que puede recibir:
    - item:preparing, item:ready, item:cancelled

    Eventos que puede emitir:
    - order:new (nuevo pedido confirmado)
    """
    # Validar token de cocina
    if not await verify_kitchen_token(token, branch_id):
        await websocket.close(code=4001, reason="Invalid credentials")
        return

    connection_id = str(uuid.uuid4())

    try:
        connection = await manager.connect(
            websocket=websocket,
            connection_id=connection_id,
            user_type="kitchen",
            user_id=branch_id
        )

        # Unirse a room de cocina de la sucursal
        await manager.join_room(connection_id, f"kitchen:{branch_id}")

        # Enviar pedidos activos
        active_orders = await OrderService.get_kitchen_orders(branch_id)

        await manager.send_to_connection(connection_id, {
            "type": "connected",
            "branch_id": branch_id,
            "active_orders": active_orders
        })

        while True:
            data = await websocket.receive_json()
            await handle_kitchen_message(connection_id, branch_id, data)

    except WebSocketDisconnect:
        await manager.disconnect(connection_id)


# ============================================================
# HANDLERS DE MENSAJES
# ============================================================

async def handle_table_message(connection_id: str, session_id: str, data: dict):
    """Procesa mensajes de comensales"""
    event_type = data.get("type")

    if event_type == "cart:add":
        await handle_cart_add(session_id, data)

    elif event_type == "cart:remove":
        await handle_cart_remove(session_id, data)

    elif event_type == "cart:update":
        await handle_cart_update(session_id, data)

    elif event_type == "cart:clear":
        await handle_cart_clear(session_id)

    elif event_type == "order:submit":
        await handle_order_submit(session_id, data)

    elif event_type == "ping":
        await manager.send_to_connection(connection_id, {"type": "pong"})


async def handle_cart_add(session_id: str, data: dict):
    """Agrega item al carrito compartido"""
    product_id = data.get("product_id")
    quantity = data.get("quantity", 1)
    notes = data.get("notes", "")
    cart_version = data.get("cart_version")

    # Actualizar carrito con control de concurrencia
    result = await CartService.add_item(
        session_id=session_id,
        product_id=product_id,
        quantity=quantity,
        notes=notes,
        expected_version=cart_version
    )

    if result.success:
        # Broadcast a todos en la mesa
        await manager.broadcast_to_room(f"table:{session_id}", {
            "type": "cart:updated",
            "cart": result.cart,
            "action": "add",
            "product_id": product_id
        })
    else:
        # Conflicto de version - enviar cart actual
        await manager.broadcast_to_room(f"table:{session_id}", {
            "type": "cart:conflict",
            "cart": result.cart,
            "message": "El carrito fue modificado por otro comensal"
        })


async def handle_order_submit(session_id: str, data: dict):
    """Procesa envio de pedido"""
    cart_version = data.get("cart_version")
    notes = data.get("notes", "")

    # Crear pedido
    result = await OrderService.create_order(
        session_id=session_id,
        expected_cart_version=cart_version,
        notes=notes
    )

    if not result.success:
        # Error - notificar al que envio
        await manager.broadcast_to_room(f"table:{session_id}", {
            "type": "order:error",
            "message": result.error
        })
        return

    order = result.order

    # Notificar a la mesa
    await manager.broadcast_to_room(f"table:{session_id}", {
        "type": "order:created",
        "order": {
            "id": str(order.id),
            "number": order.order_number,
            "status": order.status,
            "items": [item.dict() for item in order.items],
            "total": float(order.total)
        },
        "cart": {"items": [], "total": 0, "version": result.new_cart_version}
    })

    # Notificar al mozo asignado
    waiter_id = await get_assigned_waiter(session_id)
    if waiter_id:
        table = await get_table_by_session(session_id)

        await manager.broadcast_to_room(f"waiter:{waiter_id}", {
            "type": "order:new",
            "order": {
                "id": str(order.id),
                "number": order.order_number,
                "table_number": table.table_number,
                "items": [item.dict() for item in order.items],
                "total": float(order.total),
                "notes": notes,
                "created_at": order.created_at.isoformat()
            }
        })


async def handle_waiter_message(connection_id: str, waiter_id: str, data: dict):
    """Procesa mensajes del mozo"""
    event_type = data.get("type")

    if event_type == "order:take":
        order_id = data.get("order_id")
        await handle_order_take(waiter_id, order_id)

    elif event_type == "order:confirm":
        order_id = data.get("order_id")
        modifications = data.get("modifications", [])
        await handle_order_confirm(waiter_id, order_id, modifications)

    elif event_type == "order:delivered":
        order_id = data.get("order_id")
        await handle_order_delivered(waiter_id, order_id)


async def handle_order_take(waiter_id: str, order_id: str):
    """Mozo toma el pedido"""
    order = await OrderService.take_order(order_id, waiter_id)

    if order:
        session_id = str(order.session_id)

        # Notificar a la mesa
        await manager.broadcast_to_room(f"table:{session_id}", {
            "type": "order:status",
            "order_id": order_id,
            "status": "taken",
            "waiter_name": order.waiter.name
        })

        # Confirmar al mozo
        await manager.broadcast_to_room(f"waiter:{waiter_id}", {
            "type": "order:taken",
            "order_id": order_id
        })


async def handle_order_confirm(waiter_id: str, order_id: str, modifications: list):
    """Mozo confirma pedido a cocina"""
    order = await OrderService.confirm_order(order_id, waiter_id, modifications)

    if order:
        session_id = str(order.session_id)
        branch_id = str(order.session.table.branch_id)

        # Notificar a la mesa
        await manager.broadcast_to_room(f"table:{session_id}", {
            "type": "order:status",
            "order_id": order_id,
            "status": "confirmed",
            "message": "Tu pedido esta siendo preparado"
        })

        # Notificar a cocina
        await manager.broadcast_to_room(f"kitchen:{branch_id}", {
            "type": "order:new",
            "order": {
                "id": str(order.id),
                "number": order.order_number,
                "table_number": order.session.table.table_number,
                "items": [{
                    "id": str(item.id),
                    "name": item.product.name,
                    "quantity": item.quantity,
                    "notes": item.notes,
                    "status": item.status
                } for item in order.items],
                "created_at": order.created_at.isoformat(),
                "waiter_name": order.waiter.name
            }
        })


async def handle_kitchen_message(connection_id: str, branch_id: str, data: dict):
    """Procesa mensajes de cocina"""
    event_type = data.get("type")

    if event_type == "item:preparing":
        item_id = data.get("item_id")
        await handle_item_preparing(branch_id, item_id)

    elif event_type == "item:ready":
        item_id = data.get("item_id")
        await handle_item_ready(branch_id, item_id)


async def handle_item_ready(branch_id: str, item_id: str):
    """Cocina marca item como listo"""
    item = await OrderService.mark_item_ready(item_id)

    if item:
        order = item.order
        session_id = str(order.session_id)
        waiter_id = str(order.waiter_id)

        # Notificar al mozo
        await manager.broadcast_to_room(f"waiter:{waiter_id}", {
            "type": "item:ready",
            "order_id": str(order.id),
            "order_number": order.order_number,
            "table_number": order.session.table.table_number,
            "item": {
                "id": str(item.id),
                "name": item.product.name,
                "quantity": item.quantity
            }
        })

        # Notificar a la mesa
        await manager.broadcast_to_room(f"table:{session_id}", {
            "type": "item:ready",
            "item_name": item.product.name,
            "quantity": item.quantity
        })

        # Si todos los items estan listos, notificar orden completa
        if await OrderService.is_order_ready(str(order.id)):
            await manager.broadcast_to_room(f"waiter:{waiter_id}", {
                "type": "order:ready",
                "order_id": str(order.id),
                "table_number": order.session.table.table_number
            })
```

### 6.3 Cliente WebSocket (React)

```typescript
// src/services/websocket.ts

import { useEffect, useRef, useCallback, useState } from 'react'

interface WebSocketMessage {
  type: string
  [key: string]: unknown
}

interface UseWebSocketOptions {
  url: string
  token: string
  onMessage?: (message: WebSocketMessage) => void
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: Event) => void
  reconnectInterval?: number
  maxReconnectAttempts?: number
}

interface UseWebSocketReturn {
  isConnected: boolean
  send: (message: WebSocketMessage) => void
  reconnect: () => void
}

export function useWebSocket({
  url,
  token,
  onMessage,
  onConnect,
  onDisconnect,
  onError,
  reconnectInterval = 3000,
  maxReconnectAttempts = 10,
}: UseWebSocketOptions): UseWebSocketReturn {
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()
  const [isConnected, setIsConnected] = useState(false)

  // Refs para callbacks para evitar re-conexiones
  const onMessageRef = useRef(onMessage)
  const onConnectRef = useRef(onConnect)
  const onDisconnectRef = useRef(onDisconnect)
  const onErrorRef = useRef(onError)

  useEffect(() => {
    onMessageRef.current = onMessage
    onConnectRef.current = onConnect
    onDisconnectRef.current = onDisconnect
    onErrorRef.current = onError
  })

  const connect = useCallback(() => {
    // Limpiar conexion anterior
    if (wsRef.current) {
      wsRef.current.close()
    }

    // Construir URL con token
    const wsUrl = `${url}?token=${encodeURIComponent(token)}`
    const ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      console.log('[WebSocket] Connected')
      setIsConnected(true)
      reconnectAttemptsRef.current = 0
      onConnectRef.current?.()
    }

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as WebSocketMessage
        console.log('[WebSocket] Message:', message.type)
        onMessageRef.current?.(message)
      } catch (error) {
        console.error('[WebSocket] Parse error:', error)
      }
    }

    ws.onclose = (event) => {
      console.log('[WebSocket] Disconnected:', event.code, event.reason)
      setIsConnected(false)
      onDisconnectRef.current?.()

      // Intentar reconectar si no fue cierre intencional
      if (event.code !== 1000 && event.code !== 4001) {
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++
          console.log(
            `[WebSocket] Reconnecting (${reconnectAttemptsRef.current}/${maxReconnectAttempts})...`
          )
          reconnectTimeoutRef.current = setTimeout(connect, reconnectInterval)
        } else {
          console.error('[WebSocket] Max reconnect attempts reached')
        }
      }
    }

    ws.onerror = (error) => {
      console.error('[WebSocket] Error:', error)
      onErrorRef.current?.(error)
    }

    wsRef.current = ws
  }, [url, token, reconnectInterval, maxReconnectAttempts])

  // Conectar al montar
  useEffect(() => {
    connect()

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounted')
      }
    }
  }, [connect])

  // Funcion para enviar mensajes
  const send = useCallback((message: WebSocketMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message))
    } else {
      console.warn('[WebSocket] Cannot send - not connected')
    }
  }, [])

  // Funcion para forzar reconexion
  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0
    connect()
  }, [connect])

  return { isConnected, send, reconnect }
}


// ============================================================
// HOOK ESPECIALIZADO PARA MESA (COMENSAL)
// ============================================================

interface TableWebSocketOptions {
  sessionId: string
  sessionToken: string
  onCartUpdated?: (cart: Cart) => void
  onOrderCreated?: (order: Order) => void
  onOrderStatusChanged?: (orderId: string, status: string) => void
  onItemReady?: (itemName: string) => void
}

export function useTableWebSocket({
  sessionId,
  sessionToken,
  onCartUpdated,
  onOrderCreated,
  onOrderStatusChanged,
  onItemReady,
}: TableWebSocketOptions) {
  const baseUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8000'
  const url = `${baseUrl}/ws/table/${sessionId}`

  const handleMessage = useCallback((message: WebSocketMessage) => {
    switch (message.type) {
      case 'connected':
        console.log('[Table WS] Session established')
        if (message.cart) {
          onCartUpdated?.(message.cart as Cart)
        }
        break

      case 'cart:updated':
      case 'cart:conflict':
        onCartUpdated?.(message.cart as Cart)
        break

      case 'order:created':
        onOrderCreated?.(message.order as Order)
        if (message.cart) {
          onCartUpdated?.(message.cart as Cart)
        }
        break

      case 'order:status':
        onOrderStatusChanged?.(
          message.order_id as string,
          message.status as string
        )
        break

      case 'item:ready':
        onItemReady?.(message.item_name as string)
        break
    }
  }, [onCartUpdated, onOrderCreated, onOrderStatusChanged, onItemReady])

  const { isConnected, send, reconnect } = useWebSocket({
    url,
    token: sessionToken,
    onMessage: handleMessage,
  })

  // Acciones del carrito
  const addToCart = useCallback(
    (productId: string, quantity: number, notes?: string, cartVersion?: number) => {
      send({
        type: 'cart:add',
        product_id: productId,
        quantity,
        notes: notes || '',
        cart_version: cartVersion,
      })
    },
    [send]
  )

  const removeFromCart = useCallback(
    (productId: string, cartVersion?: number) => {
      send({
        type: 'cart:remove',
        product_id: productId,
        cart_version: cartVersion,
      })
    },
    [send]
  )

  const updateCartItem = useCallback(
    (productId: string, quantity: number, notes?: string, cartVersion?: number) => {
      send({
        type: 'cart:update',
        product_id: productId,
        quantity,
        notes,
        cart_version: cartVersion,
      })
    },
    [send]
  )

  const submitOrder = useCallback(
    (cartVersion: number, notes?: string) => {
      send({
        type: 'order:submit',
        cart_version: cartVersion,
        notes: notes || '',
      })
    },
    [send]
  )

  return {
    isConnected,
    reconnect,
    addToCart,
    removeFromCart,
    updateCartItem,
    submitOrder,
  }
}


// ============================================================
// HOOK ESPECIALIZADO PARA MOZO
// ============================================================

interface WaiterWebSocketOptions {
  waiterId: string
  waiterToken: string
  onNewOrder?: (order: Order) => void
  onItemReady?: (orderInfo: { orderId: string; tableNumber: string; item: OrderItem }) => void
  onOrderReady?: (orderId: string, tableNumber: string) => void
}

export function useWaiterWebSocket({
  waiterId,
  waiterToken,
  onNewOrder,
  onItemReady,
  onOrderReady,
}: WaiterWebSocketOptions) {
  const baseUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8000'
  const url = `${baseUrl}/ws/waiter/${waiterId}`

  const handleMessage = useCallback((message: WebSocketMessage) => {
    switch (message.type) {
      case 'order:new':
        onNewOrder?.(message.order as Order)
        // Reproducir sonido de notificacion
        playNotificationSound()
        break

      case 'item:ready':
        onItemReady?.({
          orderId: message.order_id as string,
          tableNumber: message.table_number as string,
          item: message.item as OrderItem,
        })
        break

      case 'order:ready':
        onOrderReady?.(
          message.order_id as string,
          message.table_number as string
        )
        playNotificationSound()
        break
    }
  }, [onNewOrder, onItemReady, onOrderReady])

  const { isConnected, send, reconnect } = useWebSocket({
    url,
    token: waiterToken,
    onMessage: handleMessage,
  })

  // Acciones del mozo
  const takeOrder = useCallback(
    (orderId: string) => {
      send({ type: 'order:take', order_id: orderId })
    },
    [send]
  )

  const confirmOrder = useCallback(
    (orderId: string, modifications?: OrderModification[]) => {
      send({
        type: 'order:confirm',
        order_id: orderId,
        modifications: modifications || [],
      })
    },
    [send]
  )

  const markDelivered = useCallback(
    (orderId: string) => {
      send({ type: 'order:delivered', order_id: orderId })
    },
    [send]
  )

  return {
    isConnected,
    reconnect,
    takeOrder,
    confirmOrder,
    markDelivered,
  }
}


// ============================================================
// UTILIDADES
// ============================================================

function playNotificationSound() {
  const audio = new Audio('/sounds/notification.mp3')
  audio.volume = 0.5
  audio.play().catch(() => {
    // Ignorar error si autoplay esta bloqueado
  })
}
```

---

## 7. GESTION DEL CARRITO COMPARTIDO

### 7.1 Arquitectura del Carrito

```
+------------------+     +------------------+     +------------------+
|   Comensal A     |     |   Comensal B     |     |   Comensal C     |
|   (Celular)      |     |   (Celular)      |     |   (Celular)      |
+--------+---------+     +--------+---------+     +--------+---------+
         |                        |                        |
         |    WebSocket           |    WebSocket           |    WebSocket
         |                        |                        |
+--------+------------------------+------------------------+---------+
|                                                                     |
|                         SERVIDOR FastAPI                            |
|                                                                     |
+--------+------------------------+------------------------+----------+
         |                        |                        |
         |                        v                        |
         |              +------------------+               |
         |              |      Redis       |               |
         |              |                  |               |
         |              | cart:{session}   |               |
         |              | - items[]        |               |
         |              | - version        |               |
         |              | - updated_at     |               |
         |              +------------------+               |
         |                        |                        |
         +------------------------+------------------------+
                                  |
                                  v
                        +------------------+
                        |   PostgreSQL     |
                        | (persistencia)   |
                        +------------------+
```

### 7.2 Servicio de Carrito (Backend)

```python
# app/services/cart_service.py

import json
from typing import Optional, List
from dataclasses import dataclass
from datetime import datetime
import redis.asyncio as redis
from app.database import get_db
from app.models import Product, BranchProduct, SharedCart
from app.schemas.cart import CartItem, Cart


@dataclass
class CartOperationResult:
    success: bool
    cart: Cart
    error: Optional[str] = None


class CartService:
    """
    Servicio para gestion del carrito compartido.
    Usa Redis para operaciones en tiempo real con control de concurrencia optimista.
    Persiste a PostgreSQL periodicamente.
    """

    CART_PREFIX = "cart:"
    CART_TTL = 86400  # 24 horas

    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client

    async def get_cart(self, session_id: str) -> Cart:
        """Obtiene el carrito actual de una sesion"""
        key = f"{self.CART_PREFIX}{session_id}"

        # Intentar obtener de Redis
        data = await self.redis.get(key)

        if data:
            cart_data = json.loads(data)
            return Cart(**cart_data)

        # Si no esta en Redis, buscar en PostgreSQL
        async with get_db() as db:
            shared_cart = await db.query(SharedCart).filter(
                SharedCart.session_id == session_id
            ).first()

            if shared_cart:
                cart = Cart(
                    items=shared_cart.items,
                    version=shared_cart.version,
                    updated_at=shared_cart.updated_at.isoformat()
                )
                # Cachear en Redis
                await self._save_to_redis(session_id, cart)
                return cart

        # Carrito nuevo
        return Cart(items=[], version=1, updated_at=datetime.utcnow().isoformat())

    async def add_item(
        self,
        session_id: str,
        product_id: str,
        quantity: int,
        notes: str = "",
        expected_version: Optional[int] = None
    ) -> CartOperationResult:
        """
        Agrega item al carrito con control de concurrencia optimista.
        """
        key = f"{self.CART_PREFIX}{session_id}"

        # Usar WATCH para transaccion atomica
        async with self.redis.pipeline(transaction=True) as pipe:
            try:
                # Watch the key
                await pipe.watch(key)

                # Obtener carrito actual
                data = await self.redis.get(key)
                if data:
                    cart_data = json.loads(data)
                    current_version = cart_data.get("version", 1)
                    items = cart_data.get("items", [])
                else:
                    current_version = 1
                    items = []

                # Verificar version si se proporciono
                if expected_version and expected_version != current_version:
                    await pipe.unwatch()
                    return CartOperationResult(
                        success=False,
                        cart=Cart(items=items, version=current_version),
                        error="VERSION_CONFLICT"
                    )

                # Validar producto y obtener info
                product_info = await self._get_product_info(session_id, product_id)
                if not product_info:
                    await pipe.unwatch()
                    return CartOperationResult(
                        success=False,
                        cart=Cart(items=items, version=current_version),
                        error="PRODUCT_NOT_AVAILABLE"
                    )

                # Buscar si el producto ya esta en el carrito
                existing_index = next(
                    (i for i, item in enumerate(items) if item["product_id"] == product_id),
                    None
                )

                if existing_index is not None:
                    # Actualizar cantidad existente
                    items[existing_index]["quantity"] += quantity
                    if notes:
                        items[existing_index]["notes"] = notes
                else:
                    # Agregar nuevo item
                    items.append({
                        "product_id": product_id,
                        "product_name": product_info["name"],
                        "unit_price": product_info["price"],
                        "quantity": quantity,
                        "notes": notes,
                        "added_at": datetime.utcnow().isoformat()
                    })

                # Calcular total
                total = sum(item["unit_price"] * item["quantity"] for item in items)

                # Nueva version
                new_version = current_version + 1

                new_cart = Cart(
                    items=items,
                    total=total,
                    version=new_version,
                    updated_at=datetime.utcnow().isoformat()
                )

                # Ejecutar transaccion
                pipe.multi()
                pipe.set(key, json.dumps(new_cart.dict()), ex=self.CART_TTL)
                await pipe.execute()

                # Persistir a PostgreSQL async
                await self._persist_to_db(session_id, new_cart)

                return CartOperationResult(success=True, cart=new_cart)

            except redis.WatchError:
                # Otro cliente modifico el carrito
                current_cart = await self.get_cart(session_id)
                return CartOperationResult(
                    success=False,
                    cart=current_cart,
                    error="CONCURRENT_MODIFICATION"
                )

    async def remove_item(
        self,
        session_id: str,
        product_id: str,
        expected_version: Optional[int] = None
    ) -> CartOperationResult:
        """Remueve item del carrito"""
        key = f"{self.CART_PREFIX}{session_id}"

        async with self.redis.pipeline(transaction=True) as pipe:
            try:
                await pipe.watch(key)

                data = await self.redis.get(key)
                if not data:
                    await pipe.unwatch()
                    return CartOperationResult(
                        success=False,
                        cart=Cart(items=[], version=1),
                        error="CART_EMPTY"
                    )

                cart_data = json.loads(data)
                current_version = cart_data.get("version", 1)
                items = cart_data.get("items", [])

                if expected_version and expected_version != current_version:
                    await pipe.unwatch()
                    return CartOperationResult(
                        success=False,
                        cart=Cart(items=items, version=current_version),
                        error="VERSION_CONFLICT"
                    )

                # Filtrar item
                new_items = [item for item in items if item["product_id"] != product_id]

                if len(new_items) == len(items):
                    await pipe.unwatch()
                    return CartOperationResult(
                        success=False,
                        cart=Cart(items=items, version=current_version),
                        error="ITEM_NOT_FOUND"
                    )

                total = sum(item["unit_price"] * item["quantity"] for item in new_items)
                new_version = current_version + 1

                new_cart = Cart(
                    items=new_items,
                    total=total,
                    version=new_version,
                    updated_at=datetime.utcnow().isoformat()
                )

                pipe.multi()
                pipe.set(key, json.dumps(new_cart.dict()), ex=self.CART_TTL)
                await pipe.execute()

                await self._persist_to_db(session_id, new_cart)

                return CartOperationResult(success=True, cart=new_cart)

            except redis.WatchError:
                current_cart = await self.get_cart(session_id)
                return CartOperationResult(
                    success=False,
                    cart=current_cart,
                    error="CONCURRENT_MODIFICATION"
                )

    async def clear_cart(self, session_id: str) -> CartOperationResult:
        """Vacia el carrito"""
        key = f"{self.CART_PREFIX}{session_id}"

        data = await self.redis.get(key)
        current_version = 1
        if data:
            cart_data = json.loads(data)
            current_version = cart_data.get("version", 1)

        new_cart = Cart(
            items=[],
            total=0,
            version=current_version + 1,
            updated_at=datetime.utcnow().isoformat()
        )

        await self.redis.set(key, json.dumps(new_cart.dict()), ex=self.CART_TTL)
        await self._persist_to_db(session_id, new_cart)

        return CartOperationResult(success=True, cart=new_cart)

    async def _get_product_info(self, session_id: str, product_id: str) -> Optional[dict]:
        """Obtiene info del producto con precio de la sucursal"""
        async with get_db() as db:
            # Obtener branch_id de la sesion
            session = await db.query(TableSession).filter(
                TableSession.id == session_id
            ).first()

            if not session:
                return None

            table = await db.query(Table).filter(
                Table.id == session.table_id
            ).first()

            branch_id = table.branch_id

            # Obtener producto con precio de sucursal
            result = await db.query(Product, BranchProduct).join(
                BranchProduct,
                Product.id == BranchProduct.product_id
            ).filter(
                Product.id == product_id,
                BranchProduct.branch_id == branch_id,
                BranchProduct.is_available == True,
                Product.is_active == True
            ).first()

            if not result:
                return None

            product, branch_product = result

            return {
                "id": str(product.id),
                "name": product.name,
                "price": float(branch_product.price),
                "image_url": product.image_url
            }

    async def _save_to_redis(self, session_id: str, cart: Cart):
        """Guarda carrito en Redis"""
        key = f"{self.CART_PREFIX}{session_id}"
        await self.redis.set(key, json.dumps(cart.dict()), ex=self.CART_TTL)

    async def _persist_to_db(self, session_id: str, cart: Cart):
        """Persiste carrito a PostgreSQL"""
        async with get_db() as db:
            shared_cart = await db.query(SharedCart).filter(
                SharedCart.session_id == session_id
            ).first()

            if shared_cart:
                shared_cart.items = cart.items
                shared_cart.version = cart.version
                shared_cart.updated_at = datetime.utcnow()
            else:
                shared_cart = SharedCart(
                    session_id=session_id,
                    items=cart.items,
                    version=cart.version
                )
                db.add(shared_cart)

            await db.commit()
```

### 7.3 Store de Carrito Compartido (Frontend)

```typescript
// src/stores/sharedCartStore.ts

import { create } from 'zustand'

interface CartItem {
  product_id: string
  product_name: string
  unit_price: number
  quantity: number
  notes: string
  added_at: string
}

interface Cart {
  items: CartItem[]
  total: number
  version: number
  updated_at: string
}

interface SharedCartState {
  cart: Cart
  isLoading: boolean
  error: string | null
  lastSyncedVersion: number

  // Actions
  setCart: (cart: Cart) => void
  optimisticAddItem: (item: Omit<CartItem, 'added_at'>) => void
  optimisticRemoveItem: (productId: string) => void
  optimisticUpdateQuantity: (productId: string, quantity: number) => void
  revertToVersion: (cart: Cart) => void
  setError: (error: string | null) => void
  setLoading: (loading: boolean) => void
}

export const useSharedCartStore = create<SharedCartState>((set, get) => ({
  cart: {
    items: [],
    total: 0,
    version: 0,
    updated_at: new Date().toISOString(),
  },
  isLoading: false,
  error: null,
  lastSyncedVersion: 0,

  setCart: (cart) => {
    set({
      cart,
      lastSyncedVersion: cart.version,
      error: null,
    })
  },

  optimisticAddItem: (item) => {
    const { cart } = get()

    const existingIndex = cart.items.findIndex(
      (i) => i.product_id === item.product_id
    )

    let newItems: CartItem[]

    if (existingIndex >= 0) {
      newItems = cart.items.map((i, index) =>
        index === existingIndex
          ? { ...i, quantity: i.quantity + item.quantity, notes: item.notes || i.notes }
          : i
      )
    } else {
      newItems = [
        ...cart.items,
        { ...item, added_at: new Date().toISOString() },
      ]
    }

    const newTotal = newItems.reduce(
      (sum, i) => sum + i.unit_price * i.quantity,
      0
    )

    set({
      cart: {
        ...cart,
        items: newItems,
        total: newTotal,
        // No incrementar version - eso lo hace el servidor
      },
    })
  },

  optimisticRemoveItem: (productId) => {
    const { cart } = get()

    const newItems = cart.items.filter((i) => i.product_id !== productId)
    const newTotal = newItems.reduce(
      (sum, i) => sum + i.unit_price * i.quantity,
      0
    )

    set({
      cart: {
        ...cart,
        items: newItems,
        total: newTotal,
      },
    })
  },

  optimisticUpdateQuantity: (productId, quantity) => {
    const { cart } = get()

    const newItems = quantity > 0
      ? cart.items.map((i) =>
          i.product_id === productId ? { ...i, quantity } : i
        )
      : cart.items.filter((i) => i.product_id !== productId)

    const newTotal = newItems.reduce(
      (sum, i) => sum + i.unit_price * i.quantity,
      0
    )

    set({
      cart: {
        ...cart,
        items: newItems,
        total: newTotal,
      },
    })
  },

  revertToVersion: (cart) => {
    set({
      cart,
      error: 'El carrito fue modificado. Se actualizo con los cambios mas recientes.',
    })
  },

  setError: (error) => set({ error }),
  setLoading: (isLoading) => set({ isLoading }),
}))

// Selectores
export const selectCartItems = (state: SharedCartState) => state.cart.items
export const selectCartTotal = (state: SharedCartState) => state.cart.total
export const selectCartVersion = (state: SharedCartState) => state.cart.version
export const selectCartItemCount = (state: SharedCartState) =>
  state.cart.items.reduce((sum, item) => sum + item.quantity, 0)
export const selectIsCartEmpty = (state: SharedCartState) =>
  state.cart.items.length === 0
```

---

## 8. ESTADOS DE LAS COMANDAS

### 8.1 Diagrama de Estados

```
                                    +-------------+
                                    |  CANCELLED  |
                                    +-------------+
                                          ^
                                          | (cualquier estado)
                                          |
+-------------+     +-------------+     +-------------+     +-------------+
|  REQUESTED  | --> |    TAKEN    | --> |  CONFIRMED  | --> |  PREPARING  |
+-------------+     +-------------+     +-------------+     +-------------+
     ^                                                             |
     |                                                             v
     |                                                      +-------------+
     |                                                      |    READY    |
     |                                                      +-------------+
     |                                                             |
     |                                                             v
     |                                                      +-------------+
     |                                                      |  DELIVERED  |
     |                                                      +-------------+
     |                                                             |
     |                                                             v
     |                                                      +-------------+
     +------------------------------------------------------|    PAID     |
           (nuevo pedido de la misma mesa)                  +-------------+
```

### 8.2 Descripcion de Estados

| Estado | Descripcion | Actor que cambia | Siguiente estado |
|--------|-------------|------------------|------------------|
| **REQUESTED** | Pedido enviado por comensal, esperando atencion del mozo | Comensal | TAKEN, CANCELLED |
| **TAKEN** | Mozo ha visto y tomado el pedido | Mozo | CONFIRMED, CANCELLED |
| **CONFIRMED** | Mozo confirmo y envio a cocina | Mozo | PREPARING |
| **PREPARING** | Cocina esta preparando los platos | Cocina | READY |
| **READY** | Todos los platos estan listos para servir | Cocina | DELIVERED |
| **DELIVERED** | Pedido entregado en la mesa | Mozo | PAID |
| **PAID** | Cliente pago el pedido | Mozo/Caja | - (final) |
| **CANCELLED** | Pedido cancelado | Mozo/Admin | - (final) |

### 8.3 Estados de Items Individuales

```
+-------------+     +-------------+     +-------------+     +-------------+
|   PENDING   | --> |  PREPARING  | --> |    READY    | --> |  DELIVERED  |
+-------------+     +-------------+     +-------------+     +-------------+
                                                                   |
                    +-------------+                                |
                    |  CANCELLED  | <------------------------------+
                    +-------------+
```

---

## 9. SEGURIDAD Y AUTENTICACION

### 9.1 Flujo de Autenticacion

```
+------------------+     +------------------+     +------------------+
|    DASHBOARD     |     |    APP MOZO      |     |   MENU DIGITAL   |
|  (Admin/Manager) |     |    (Waiter)      |     |   (Customer)     |
+--------+---------+     +--------+---------+     +--------+---------+
         |                        |                        |
         | 1. Login               | 1. PIN + Branch        | 1. Scan QR
         | email/password         |                        |
         v                        v                        v
+------------------+     +------------------+     +------------------+
|  JWT Token       |     |  JWT Token       |     | Session Token    |
|  (access+refresh)|     |  (access only)   |     | (ephemeral)      |
|  Role: admin     |     |  Role: waiter    |     | No auth required |
+------------------+     +------------------+     +------------------+
         |                        |                        |
         | 2. Include in          | 2. Include in          | 2. Include in
         |    Authorization       |    Authorization       |    Query param
         |    header              |    header              |    ?token=XXX
         v                        v                        v
+------------------------------------------------------------------+
|                         FastAPI Backend                           |
|                                                                   |
|  - Validate JWT signature                                         |
|  - Check token expiration                                         |
|  - Verify role permissions                                        |
|  - For session tokens: validate session exists and is active      |
+------------------------------------------------------------------+
```

### 9.2 Generacion de QR Codes

```python
# app/utils/qr_generator.py

import qrcode
import secrets
from io import BytesIO
import base64
from typing import Tuple


def generate_table_qr(
    branch_slug: str,
    table_number: str,
    base_url: str = "https://menu.restaurant.com"
) -> Tuple[str, str]:
    """
    Genera QR code para una mesa.

    Returns:
        Tuple[token, qr_image_base64]
    """
    # Generar token unico y seguro
    token = secrets.token_urlsafe(32)

    # URL del menu
    menu_url = f"{base_url}/m?t={token}"

    # Generar QR
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=10,
        border=4,
    )
    qr.add_data(menu_url)
    qr.make(fit=True)

    # Crear imagen
    img = qr.make_image(fill_color="black", back_color="white")

    # Convertir a base64
    buffer = BytesIO()
    img.save(buffer, format="PNG")
    qr_base64 = base64.b64encode(buffer.getvalue()).decode()

    return token, f"data:image/png;base64,{qr_base64}"


def validate_qr_token(token: str) -> bool:
    """Valida formato del token"""
    try:
        # Token debe ser base64url de 32 bytes = 43 caracteres
        if len(token) != 43:
            return False
        # Intentar decodificar
        base64.urlsafe_b64decode(token + "=")
        return True
    except Exception:
        return False
```

### 9.3 Middleware de Autenticacion

```python
# app/middleware/auth.py

from fastapi import Request, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from datetime import datetime
from typing import Optional
from app.config import settings


security = HTTPBearer(auto_error=False)


class AuthMiddleware:
    """Middleware de autenticacion JWT"""

    def __init__(self, required_roles: Optional[list] = None):
        self.required_roles = required_roles or []

    async def __call__(
        self,
        request: Request,
        credentials: HTTPAuthorizationCredentials = Depends(security)
    ):
        if not credentials:
            raise HTTPException(status_code=401, detail="Token required")

        try:
            payload = jwt.decode(
                credentials.credentials,
                settings.JWT_SECRET,
                algorithms=["HS256"]
            )

            # Verificar expiracion
            exp = payload.get("exp")
            if exp and datetime.utcnow().timestamp() > exp:
                raise HTTPException(status_code=401, detail="Token expired")

            # Verificar rol si es requerido
            user_role = payload.get("role")
            if self.required_roles and user_role not in self.required_roles:
                raise HTTPException(status_code=403, detail="Insufficient permissions")

            # Agregar usuario al request
            request.state.user = {
                "id": payload.get("sub"),
                "role": user_role,
                "branch_id": payload.get("branch_id")
            }

            return payload

        except jwt.InvalidTokenError as e:
            raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")


# Dependencias reutilizables
require_admin = AuthMiddleware(required_roles=["admin", "manager"])
require_waiter = AuthMiddleware(required_roles=["admin", "manager", "waiter"])
require_kitchen = AuthMiddleware(required_roles=["admin", "manager", "kitchen"])
```

---

## 10. CONSIDERACIONES DE ESCALABILIDAD

### 10.1 Arquitectura para Alta Disponibilidad

```
                            +-------------------+
                            |   Load Balancer   |
                            |   (AWS ALB/NLB)   |
                            +--------+----------+
                                     |
              +----------------------+----------------------+
              |                      |                      |
     +--------+--------+    +--------+--------+    +--------+--------+
     |  FastAPI Node 1 |    |  FastAPI Node 2 |    |  FastAPI Node N |
     |  (Auto-scaling) |    |  (Auto-scaling) |    |  (Auto-scaling) |
     +--------+--------+    +--------+--------+    +--------+--------+
              |                      |                      |
              +----------------------+----------------------+
                                     |
              +----------------------+----------------------+
              |                                             |
     +--------+--------+                           +--------+--------+
     |  Redis Cluster  |                           |   PostgreSQL    |
     |  (ElastiCache)  |                           |   (RDS + Read   |
     |                 |                           |    Replicas)    |
     | - Pub/Sub       |                           |                 |
     | - Cart Cache    |                           | - Primary (W)   |
     | - Session Cache |                           | - Replica (R)   |
     +-----------------+                           +-----------------+
```

### 10.2 Metricas y Monitoreo

```python
# app/middleware/metrics.py

from prometheus_client import Counter, Histogram, Gauge
import time
from functools import wraps


# Metricas de WebSocket
ws_connections = Gauge(
    'websocket_active_connections',
    'Number of active WebSocket connections',
    ['connection_type']  # customer, waiter, kitchen
)

ws_messages = Counter(
    'websocket_messages_total',
    'Total WebSocket messages',
    ['direction', 'message_type']  # inbound/outbound, cart:add/order:submit/etc
)

# Metricas de pedidos
orders_created = Counter(
    'orders_created_total',
    'Total orders created',
    ['branch_id', 'status']
)

order_processing_time = Histogram(
    'order_processing_seconds',
    'Time from requested to delivered',
    ['branch_id'],
    buckets=[60, 120, 300, 600, 900, 1200, 1800]  # 1min to 30min
)

# Metricas de carrito
cart_operations = Counter(
    'cart_operations_total',
    'Cart operations',
    ['operation', 'result']  # add/remove/clear, success/conflict/error
)


def track_ws_connection(connection_type: str):
    """Decorator para trackear conexiones WebSocket"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            ws_connections.labels(connection_type=connection_type).inc()
            try:
                return await func(*args, **kwargs)
            finally:
                ws_connections.labels(connection_type=connection_type).dec()
        return wrapper
    return decorator
```

### 10.3 Checklist de Produccion

```
PRE-DEPLOYMENT CHECKLIST
========================

[ ] Seguridad
    [ ] HTTPS habilitado en todos los endpoints
    [ ] JWT secrets rotados y seguros (min 256 bits)
    [ ] Rate limiting configurado
    [ ] CORS configurado correctamente
    [ ] Headers de seguridad (CSP, X-Frame-Options, etc.)
    [ ] Sanitizacion de inputs implementada

[ ] Base de Datos
    [ ] Indices creados para queries frecuentes
    [ ] Connection pooling configurado
    [ ] Backups automaticos habilitados
    [ ] Read replicas para queries de lectura

[ ] Redis
    [ ] Cluster mode para alta disponibilidad
    [ ] Persistence habilitada (RDB + AOF)
    [ ] Memory limits configurados
    [ ] Eviction policy definida

[ ] WebSockets
    [ ] Heartbeat/ping-pong implementado
    [ ] Reconexion automatica en clientes
    [ ] Graceful shutdown manejado
    [ ] Message queuing para picos de trafico

[ ] Monitoreo
    [ ] Logging estructurado (JSON)
    [ ] Metricas Prometheus expuestas
    [ ] Alertas configuradas
    [ ] Distributed tracing (opcional)

[ ] PWA
    [ ] Service Worker para offline
    [ ] Manifest.json configurado
    [ ] Push notifications (opcional)
    [ ] Assets cacheados correctamente

[ ] Performance
    [ ] CDN para assets estaticos
    [ ] Compresion gzip/brotli
    [ ] Lazy loading de componentes
    [ ] Database query optimization
```

---

## ANEXO A: VARIABLES DE ENTORNO

```bash
# .env.example

# Database
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/restaurant_db
DATABASE_POOL_SIZE=20
DATABASE_MAX_OVERFLOW=10

# Redis
REDIS_URL=redis://localhost:6379/0
REDIS_PASSWORD=

# JWT
JWT_SECRET=your-super-secret-key-min-256-bits
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7

# WebSocket
WS_HEARTBEAT_INTERVAL=30
WS_MAX_CONNECTIONS_PER_IP=10

# Application
APP_ENV=production
APP_DEBUG=false
APP_BASE_URL=https://api.restaurant.com
MENU_BASE_URL=https://menu.restaurant.com

# CORS
CORS_ORIGINS=["https://menu.restaurant.com","https://dashboard.restaurant.com"]

# Logging
LOG_LEVEL=INFO
LOG_FORMAT=json
```

---

## ANEXO B: COMANDOS DE DESARROLLO

```bash
# Backend (FastAPI)
cd backend

# Instalar dependencias
pip install -r requirements.txt

# Ejecutar migraciones
alembic upgrade head

# Iniciar servidor desarrollo
uvicorn app.main:app --reload --port 8000

# Ejecutar tests
pytest -v

# Generar documentacion API
# Disponible en http://localhost:8000/docs


# Frontend (React PWA)
cd frontend

# Instalar dependencias
npm install

# Desarrollo
npm run dev

# Build produccion
npm run build

# Preview build
npm run preview

# Tests
npm run test
```

---

**Documento preparado para implementacion del sistema de Menu Digital Multi-Sucursal con WebSockets.**

*Para consultas tecnicas adicionales o clarificaciones sobre la arquitectura, contactar al equipo de desarrollo.*
