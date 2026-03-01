# Documentación Maestra de la API - SmartEconomat

Esta es la documentación **técnica y detallada** de la API. Diseñada para ser la fuente de verdad del sistema.

## 🏗️ 1. Arquitectura y Conceptos Fundamentales

### 🆔 Gestión de Identificadores (IDs)
El sistema utiliza **UUID v7** para todos los identificadores primarios.
- **¿Por qué UUID v7?**: A diferencia de v4 (completamente aleatorio), v7 incluye un componente temporal. Esto permite que los IDs sean cronológicamente ordenables, lo cual mejora drásticamente el rendimiento de los índices en bases de datos (especialmente en inserciones masivas).
- **Formato**: `018f4e2a-1234-7abc-bdef-0123456789ab`
- **Origen**: Son generados automáticamente por la base de datos PostgreSQL al insertar un nuevo registro.

### 🧩 El Eje Central: Producto-Proveedor
El sistema no gestiona el stock directamente sobre un "Producto", sino sobre la relación **ProductoProveedor**.
- **Producto**: Ficha técnica (Nombre, marca, unidad).
- **Proveedor**: Entidad comercial.
- **ProductoProveedor**: El nexo. Aquí reside el precio pactado, el histórico de precios y es la entidad a la que se asocia el **Inventario (Stock)**. Un mismo producto físico puede tener 3 stocks diferentes si lo sirven 3 proveedores distintos.

---

## 🌐 2. Estándares de Comunicación

### Base URL y Headers
- **Base URL**: `http://localhost:3000/v1`
- **Headers Obligatorios**:
    - `Content-Type: application/json`
    - `Authorization: Bearer <JWT_TOKEN>` (Para rutas protegidas)

### Estructura Global de Respuesta (`ApiResponse`)
Todas las peticiones devuelven un objeto estandarizado para facilitar el manejo en el frontend:

```json
{
  "success": true,
  "message": "Operación exitosa",
  "data": { ... }, 
  "meta": {
    "app": "SmartEconomat",
    "version": "1.0.0",
    "timestamp": "2024-02-22T10:00:00.000Z",
    "requestId": "uuid-peticion"
  }
}
```
> [!NOTE]
> El `requestId` (header `x-request-id`) es vital para depuración. Si algo falla, este ID permite localizar la traza exacta en los logs del servidor.

---

## 🔐 3. Autenticación (`/auth`)
El flujo de entrada al sistema. Todas las respuestas de éxito establecen una **Cookie `access_token`** (`httpOnly: true`).

| Método | Endpoint | Descripción | Payload |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | Registro de nuevo usuario (Nivel: INVITADO) | `RegisterUserDto` |
| `POST` | `/auth/login` | Login y obtención de Bearer Token | `LoginUserDto` |

> [!IMPORTANT]
> - Al registrarse, el usuario queda en estado `activo: false` y con el rol `INVITADO` por defecto. Un administrador debe activarlo manualmente.
> - El backend devuelve el token en el cuerpo (`access_token`) y también lo guarda en una Cookie.

**Ejemplo Login:**
- **Request Body**: `{ "email": "admin@example.com", "password": "password123" }`
- **Response Data**:
```json
{
  "access_token": "ey..."
}
```

---

## 👥 4. Gestión de Usuarios (`/usuarios`)
Gestión de cuentas, perfiles y permisos. *Requiere `JwtAuthGuard` y `RolesGuard`.*

### Perfil de Usuario (Auto-gestión)
| Método | Endpoint | Descripción | Roles Permitidos |
| :--- | :--- | :--- | :--- |
| `GET` | `/usuarios/perfil` | Obtener datos del usuario logueado | Todos |
| `PATCH` | `/usuarios/perfil` | Actualizar nombre o email propio | Todos |
| `PATCH` | `/usuarios/perfil/password` | Cambiar contraseña (validando antigua) | Todos |

### Administración de Personal
| Método | Endpoint | Descripción | Roles Permitidos |
| :--- | :--- | :--- | :--- |
| `GET` | `/usuarios` | Listar todos los usuarios (paginado) | `ADMINISTRADOR` |
| `GET` | `/usuarios/:id` | Detalle, pedidos y movimientos asociados | `ADMINISTRADOR` |
| `PATCH` | `/usuarios/:id` | Editar cualquier campo del usuario | `ADMINISTRADOR` |
| `PATCH` | `/usuarios/:id/activar` | Alternar estado `activo` (Boolean) | `ADMINISTRADOR` |
| `PATCH` | `/usuarios/:id/rol` | Cambiar nivel de acceso (`INVITADO`, etc.) | `ADMINISTRADOR` |
| `PATCH` | `/usuarios/:id/password` | Reset forzoso de contraseña | `ADMINISTRADOR` |
| `DELETE` | `/usuarios/:id` | Borrado físico del registro | `ADMINISTRADOR` |

> [!IMPORTANT]
> - **Estado Inicial**: Los usuarios recién registrados (`/auth/register`) tienen por defecto `activo: false` y rol `INVITADO`. 
> - **Activación**: Un administrador debe usar el endpoint `/activar` antes de que el usuario pueda hacer login.

---

## 🛒 5. Catálogo de Productos (`/productos`)
Relación técnica de los productos base. *Requiere `JwtAuthGuard` y `RolesGuard`.*

| Método | Endpoint | Descripción | Roles Permitidos |
| :--- | :--- | :--- | :--- |
| `POST` | `/productos` | Crear nuevo producto | `ADMINISTRADOR`, `PROFESOR` |
| `GET` | `/productos` | Listar todos los productos | `ADMIN`, `PROFESOR`, `ALUMNO` |
| `GET` | `/productos/:id` | Ficha técnica y proveedores | `ADMIN`, `PROFESOR`, `ALUMNO` |
| `PATCH` | `/productos/:id` | Editar ficha técnica | `ADMINISTRADOR`, `PROFESOR` |
| `DELETE` | `/productos/:id` | Borrado lógico del producto | `ADMINISTRADOR` |

### 🔍 Filtrado y Paginación (`GET /productos`)
Este endpoint soporta búsqueda avanzada y paginación mediante **Query Parameters**.

**Parámetros de consulta disponibles:**
| Parámetro | Tipo | Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `page` | `number` | No | Página a consultar (Default: 1) |
| `limit` | `number` | No | Elementos por página (Max: 100, Default: 20) |
| `searchTerm` | `string` | No | Búsqueda parcial por nombre del producto |
| `codigoBarras` | `string` | No | Búsqueda exacta por código de barras |
| `tipo` | `string` | No | Filtro de categorías (ej: `verdura,bebida,fruta`) |
| `alergenos` | `string` | No | Lista de alérgenos (ej: `gluten,soja,lacteos`) |
| `marcas` | `string` | No | Filtrar por marcas específicas (ej: `Nestle,Bio`) |
| `minStock` | `boolean`| No | Si es `true`, solo devuelve productos con stock disponible |

**Estructura de respuesta paginada (`PaginatedResponseDto`):**
```json
{
  "data": [...],         // Array de objetos Producto
  "total": 120,          // Total de registros que coinciden con el filtro
  "page": 1,             // Página actual devuelta
  "limit": 20,           // Límite de elementos aplicado
  "totalPages": 6        // Total de páginas calculadas (ceil(total / limit))
}
```

> [!TIP]
> Al crear o editar un producto mediante `POST` o `PATCH`, puedes enviar un array de `proveedores` en el cuerpo de la petición. Esto creará automáticamente las entidades `ProductoProveedor` vinculadas, permitiendo definir precios pactados y marcas de proveedor en un solo paso.

---

## 💰 6. Relación Producto-Proveedor (`/producto-proveedor`)
Gestión de suministros específicos. *Requiere `JwtAuthGuard` y `RolesGuard`.*

| Método | Endpoint | Descripción | Roles Permitidos |
| :--- | :--- | :--- | :--- |
| `GET` | `/producto-proveedor/search` | Buscar relaciones (autocomplete) | `ADMINISTRADOR`, `PROFESOR` |
| `PATCH` | `/producto-proveedor/:id/precio` | Actualizar precio pactado | `ADMINISTRADOR`, `PROFESOR` |
| `GET` | `/producto-proveedor/:id/historial` | Consultar histórico de precios | `ADMINISTRADOR`, `PROFESOR` |

### 🔎 Autocompletado de Suministros (`GET /search`)
Diseñado para selectores dinámicos en formularios de pedidos o inventario.

| Parámetro | Tipo | Descripción |
| :--- | :--- | :--- |
| `q` | `string`| Término de búsqueda (busca en producto y marca) |
| `limit` | `number`| Máximo de sugerencias sugeridas (Máx: 50) |
| `offset`| `number`| Salto de registros para scroll infinito |

---

## 🚛 7. Proveedores (`/proveedor`)
Entidades comerciales que suministran productos. *Requiere `JwtAuthGuard` y `RolesGuard`.*

| Método | Endpoint | Descripción | Roles Permitidos |
| :--- | :--- | :--- | :--- |
| `POST` | `/proveedor` | Registrar nuevo proveedor | `ADMINISTRADOR`, `PROFESOR` |
| `GET` | `/proveedor` | Listar auxiliares (paginado + búsqueda) | `ADMINISTRADOR`, `PROFESOR` |
| `GET` | `/proveedor/:id` | Ficha de contacto y sucursal | `ADMINISTRADOR`, `PROFESOR` |
| `PATCH` | `/proveedor/:id` | Modificar datos comerciales | `ADMINISTRADOR`, `PROFESOR` |
| `DELETE` | `/proveedor/:id` | Borrar proveedor (Solo si no tiene productos) | `ADMINISTRADOR` |

### 🔍 Búsqueda de Proveedores (`GET /proveedor`)
Permite localizar proveedores mediante filtros en la URL.

| Parámetro | Tipo | Descripción |
| :--- | :--- | :--- |
| `page` | `number`| Página a consultar (Default: 1) |
| `limit` | `number`| Elementos por página (Máx: 100, Default: 20) |
| `searchTerm`| `string`| Búsqueda parcial por **nombre**, **NIF**, **contacto** o **email** |

**Estructura de respuesta:** Sigue el estándar `PaginatedResponseDto` detallado en la sección de Productos.

---

## 📦 8. Pedidos de Compra (`/pedidos`)
Gestión de órdenes y seguimiento de suministros. *Requiere `JwtAuthGuard` y `RolesGuard`.*

| Método | Endpoint | Descripción | Roles Permitidos |
| :--- | :--- | :--- | :--- |
| `POST` | `/pedidos` | Crear un nuevo pedido | `ADMINISTRADOR`, `PROFESOR` |
| `GET` | `/pedidos` | Listar todos los pedidos (paginado) | `ADMINISTRADOR`, `PROFESOR` |
| `GET` | `/pedidos/:id` | Detalle completo (incluye líneas y recepciones) | `ADMINISTRADOR`, `PROFESOR` |
| `PATCH` | `/pedidos/:id` | Actualizar datos o productos del pedido | `ADMINISTRADOR`, `PROFESOR` |
| `PATCH` | `/pedidos/:id/fecha-entrega` | Cambiar previsión de llegada | `ADMINISTRADOR`, `PROFESOR` |
| `PATCH` | `/pedidos/:id/cancelar` | Anular pedido (con motivo) | `ADMINISTRADOR`, `PROFESOR` |
| `DELETE` | `/pedidos/:id` | Eliminar pedido (Solo PENDIENTE/CANCELADO) | `ADMINISTRADOR` |

### 🚦 Estados del Pedido
El flujo de una orden se rige por los siguientes estados:

1.  **`PENDIENTE`**: Recién creado, esperando envío o validación.
2.  **`EN_PROCESO`**: Orden enviada al proveedor, esperando recepción.
3.  **`RECIBIDO`**: Mercancía recibida al 100% satisfactoriamente.
4.  **`PARCIAL`**: Mercancía recibida parcialmente (esperando el resto).
5.  **`INCIDENCIA`**: Recibido con discrepancias (faltas/roturas) por resolver.
6.  **`CANCELADO`**: Orden anulada (no genera stock).

> [!TIP]
> Al crear un pedido (`POST /pedidos`), el backend espera una lista de productos en el campo `pedidoProductos` o `productos`. Cada línea debe incluir el `productoProveedorId`, la `cantidad` y el `precioUnitario`.

---

## 📥 9. Recepción de Mercancía (`/recepcion`)
Punto crítico donde se actualiza el stock real y se cierran pedidos. *Requiere `JwtAuthGuard` y `RolesGuard`.*

| Método | Endpoint | Descripción | Roles Permitidos |
| :--- | :--- | :--- | :--- |
| `POST` | `/recepcion` | **Procesar recepción (Stock + Movimientos + Pedidos)** | `ADMINISTRADOR`, `PROFESOR` |
| `GET` | `/recepcion` | Listar histórico de recepciones (paginado) | `ADMINISTRADOR`, `PROFESOR` |
| `GET` | `/recepcion/:id` | Detalle (incluye productos, pedidos y albaranes) | `ADMINISTRADOR`, `PROFESOR` |
| `PATCH` | `/recepcion/:id` | Editar notas o datos de cabecera | `ADMINISTRADOR`, `PROFESOR` |
| `DELETE` | `/recepcion/:id` | Anular recepción (Revierte stock si es posible) | `ADMINISTRADOR` |

### 🚀 Capacidades del Proceso (`POST /recepcion`)
Este endpoint es un **Proceso Maestro** que realiza múltiples acciones atómicas:
1.  **Multi-Pedido**: Puede recepcionar varios pedidos de un mismo proveedor en una sola firma.
2.  **Alta Directa**: Permite crear productos nuevos que no estaban en el catálogo original directamente desde el formulario de recepción.
3.  **Trazabilidad**: Genera automáticamente **Movimientos de Inventario** y crea **Lotes** (FEFO).
4.  **Gestión de Incidencias**: Si hay discrepancias, genera registros en el módulo de incidencias.

### 🚦 Estados de la Recepción
-   **`COMPLETADA`**: Todo lo recibido coincide exactamente con lo pedido.
-   **`PARCIAL`**: Se ha recibido menos cantidad de la esperada en alguna línea.
-   **`CON_INCIDENCIAS`**: Se han detectado discrepancias graves (roturas, excesos o faltas totales).

### ⚠️ Generación de Incidencias Automáticas
Si durante el proceso de recepción se detectan discrepancias, el sistema devuelve un objeto `incidencias` en la respuesta:

**Estructura de Incidencia en Respuesta:**
- `id`: UUID de la incidencia.
- `estado`: `PENDIENTE DE RESOLUCIÓN`.
- `datosOriginales`: Snapshot inmutable de la discrepancia detectada (Producto, Cantidad Pedida vs Recibida, Tipo de Incidencia).

> [!IMPORTANT]
> El payload del `POST` permite enviar `productosNuevos` (objetos con código de barras y nombre). El sistema los dará de alta en el catálogo base y les asignará stock en una sola transacción.

---

## 🔄 10. Movimientos de Inventario (`/movimientos`)
Auditoría total de lo que entra y sale. *Requiere `JwtAuthGuard` y `RolesGuard`.*

| Método | Endpoint | Descripción | Roles Permitidos |
| :--- | :--- | :--- | :--- |
| `POST` | `/movimientos` | Crear ajuste, entrada o salida | `ADMINISTRADOR`, `PROFESOR` |
| `GET` | `/movimientos` | Listado general auditable | `ADMIN`, `PROFESOR`, `ALUMNO` |
| `GET` | `/movimientos/historial` | Consulta filtrada avanzada (Trazabilidad) | `ADMINISTRADOR`, `PROFESOR` |
| `GET` | `/movimientos/:id` | Detalle de transacción única | `ADMIN`, `PROFESOR`, `ALUMNO` |
| `PATCH` | `/movimientos/:id` | Editar descripción/motivo | `ADMINISTRADOR` |
| `DELETE` | `/movimientos/:id` | Eliminar traza (Borrado lógico) | `ADMINISTRADOR` |

### 🔍 Trazabilidad y Filtros (`GET /movimientos/historial`)
Permite reconstruir la historia de un producto o la actividad de un usuario.

| Parámetro | Tipo | Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `entityId` | `UUID` | No* | UUID del ProductoProveedor para filtrar stock específico |
| `userId` | `UUID` | No* | UUID del Usuario para auditar acciones |
| `type` | `string` | No | `entrada`, `salida`, `ajuste`, `pedido`, `entrada_compra` |
| `startDate`| `string` | No | Fecha inicio (ISO 8601) |
| `endDate` | `string` | No | Fecha fin (ISO 8601) |
| `sortBy` | `string` | No | `createdAt` o `cantidad` |
| `sortOrder`| `string` | No | `ASC` o `DESC` |

*\*Debe proporcionarse al menos `entityId` o `userId` para que la consulta sea válida.*

---

## 📊 11. Dashboard y Control (`/dashboard`)
KPIs y estadísticas consolidadas en tiempo real. *Requiere `JwtAuthGuard` y `RolesGuard`.*

| Método | Endpoint | Descripción | Roles Permitidos |
| :--- | :--- | :--- | :--- |
| `GET` | `/dashboard/stats` | Obtener KPIs generales y estadísticas actuales | `ADMINISTRADOR`, `PROFESOR` |

**Estructura de Respuesta (`DashboardStatsDto`):**
```json
{
  "totalProductos": 150,
  "productosEsteMes": 12,
  "totalProveedores": 45,
  "inventario": {
    "valorTotal": 12500.50,
    "totalItems": 320,
    "itemsBajoStock": 15
  },
  "pedidos": {
    "pendientes": 8,
    "completadosHoy": 2,
    "costeTotalPendiente": 3450.00,
    "incidencias": 1
  },
  "alertas": {
    "porCaducar": 5,
    "caducados": 2
  },
  "movimientosRecientes": [...] // Últimas transacciones registradas
}
```

---

## 🔔 12. Alertas de Inventario (`/alertas`)
Detección proactiva de problemas. *Requiere `JwtAuthGuard` y `RolesGuard`.*

| Método | Endpoint | Descripción | Roles Permitidos |
| :--- | :--- | :--- | :--- |
| `GET` | `/alertas/caducidad` | Productos próximos a expirar | `ADMINISTRADOR`, `PROFESOR` |
| `GET` | `/alertas/stock` | Productos bajo stock de seguridad | `ADMINISTRADOR`, `PROFESOR` |

---

## 🍳 13. Recetas (`/recetas`)
Gestión integrada de fórmulas culinarias y sus ingredientes. *Requiere `JwtAuthGuard` y `RolesGuard`.*

| Método | Endpoint | Descripción | Roles Permitidos |
| :--- | :--- | :--- | :--- |
| `POST` | `/recetas` | Crear nueva receta e ingredientes | `ADMINISTRADOR`, `PROFESOR` |
| `POST` | `/recetas/duplicate` | **Duplicar una receta existente** | `ADMINISTRADOR`, `PROFESOR` |
| `GET` | `/recetas` | Listar recetas (paginado + búsqueda) | `ADMIN`, `PROFESOR`, `ALUMNO` |
| `GET` | `/recetas/:id` | Ficha completa (incluye alérgenos) | `ADMIN`, `PROFESOR`, `ALUMNO` |
| `PATCH` | `/recetas/:id` | Actualizar datos o ingredientes | `ADMINISTRADOR`, `PROFESOR` |
| `DELETE` | `/recetas/:id` | Eliminar receta del sistema | `ADMINISTRADOR` |

### 🔍 Búsqueda de Recetas (`GET /recetas`)
Soporta los parámetros estándar de paginación (`page`, `limit`).

| Parámetro | Tipo | Descripción |
| :--- | :--- | :--- |
| `searchTerm` | `string` | Búsqueda parcial por **nombre** o en las **instrucciones** |

### 🥗 Estructura de Ingredientes
Al crear o editar una receta, el array `ingredientes` debe referenciar productos técnicos:
```json
{
  "productoId": "uuid-v7-producto",
  "cantidad": 0.5,
  "unidad": "KG" // KG, L, UD, etc.
}
```
> [!NOTE]
> El detalle de la receta (`GET /recetas/:id`) agrega automáticamente el cálculo de **alérgenos consolidados** basándose en los alérgenos declarados en cada ingrediente (producto tecnológico).

---

## 📍 14. Ubicaciones (`/ubicacion`)
Gestión de almacenes, estantes y zonas de frío. *Requiere `JwtAuthGuard`.*

| Método | Endpoint | Descripción | Roles Permitidos |
| :--- | :--- | :--- | :--- |
| `POST` | `/ubicacion` | Crear nueva zona de almacenaje | Todos (Autenticados) |
| `GET` | `/ubicacion` | Listar todas las ubicaciones activas | Todos (Autenticados) |
| `GET` | `/ubicacion/:id` | Detalle de ubicación específica | Todos (Autenticados) |
| `PATCH` | `/ubicacion/:id` | Actualizar nombre o descripción | Todos (Autenticados) |
| `DELETE` | `/ubicacion/:id` | Borrado lógico (marcar como inactiva) | Todos (Autenticados) |
| `POST` | `/ubicacion/:id/restore` | Recuperar una ubicación borrada | Todos (Autenticados) |

> [!NOTE]
> Las ubicaciones son transversales. Aunque el sistema soporta borrado lógico, no se permite eliminar una ubicación si ésta tiene **Inventario** asociado actualmente.

---

## 📦 15. Gestión de Albaranes (`/albaranes`)
Documentos de entrega de proveedores que vinculan pedidos y recepciones. *Requiere `JwtAuthGuard` y `RolesGuard`.*

| Método | Endpoint | Descripción | Roles Permitidos |
| :--- | :--- | :--- | :--- |
| `POST` | `/albaranes` | Registrar un nuevo albarán | `ADMINISTRADOR`, `PROFESOR` |
| `GET` | `/albaranes` | Listar todos los albaranes registrados | `ADMINISTRADOR`, `PROFESOR` |
| `GET` | `/albaranes/:id` | Detalle completo de un albarán | `ADMINISTRADOR`, `PROFESOR` |
| `PATCH` | `/albaranes/:id` | Actualizar datos de un albarán | `ADMINISTRADOR`, `PROFESOR` |
| `DELETE` | `/albaranes/:id` | Eliminar un albarán del sistema | `ADMINISTRADOR` |

---

## 🗳️ 16. Inventario Directo (`/inventario`)
Gestión directa de ítems en stock. *Requiere `JwtAuthGuard` y `RolesGuard`.*

| Método | Endpoint | Descripción | Roles Permitidos |
| :--- | :--- | :--- | :--- |
| `POST` | `/inventario` | Crear registro de inventario | `ADMINISTRADOR`, `PROFESOR` |
| `GET` | `/inventario` | Listar todos los ítems en inventario | `ADMINISTRADOR`, `PROFESOR` |
| `GET` | `/inventario/:id` | Detalle de ítem en inventario | `ADMINISTRADOR`, `PROFESOR` |
| `PATCH` | `/inventario/:id` | Actualizar ítem en inventario | `ADMINISTRADOR`, `PROFESOR` |
| `DELETE` | `/inventario/:id` | Eliminar ítem del inventario | `ADMINISTRADOR` |

---

## 🔍 Glosario de Campos Técnicos
- **`created_at` / `updated_at`**: Timestamps automáticos (timestamptz).
- **`version`**: Contador para **bloqueo optimista** (previene que un cambio pise a otro).
- **`deleted_at`**: El sistema usa **Borrado Lógico**. DELETE marca la fila como inactiva en lugar de borrarla.
