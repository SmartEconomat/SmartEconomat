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
El flujo de entrada al sistema.

| Método | Endpoint | Descripción | Payload |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | Registro de nuevo usuario | `RegisterUserDto` |
| `POST` | `/auth/login` | Login y obtención de Bearer Token | `LoginUserDto` |

**Ejemplo Login:**
- **Request Body**: `{ "email": "admin@example.com", "password": "password123" }`
- **Response Data**: `{ "token": "ey...", "user": { "id": "...", "nombre": "Admin" } }`

---

## 👥 4. Gestión de Usuarios (`/usuarios`)
*Requiere `JwtAuthGuard` y `RolesGuard`.*

### Perfil de Usuario
| Método | Endpoint | Descripción | Roles Permitidos |
| :--- | :--- | :--- | :--- |
| `GET` | `/usuarios/perfil` | Obtener perfil del usuario autenticado | Todos |
| `PATCH` | `/usuarios/perfil` | Actualizar datos del perfil propio | Todos |
| `PATCH` | `/usuarios/perfil/password` | Cambiar contraseña propia | Todos |

### Administración de Usuarios
| Método | Endpoint | Descripción | Roles Permitidos |
| :--- | :--- | :--- | :--- |
| `GET` | `/usuarios` | Listar todos los usuarios | `ADMINISTRADOR` |
| `GET` | `/usuarios/:id` | Detalle completo de un usuario | `ADMINISTRADOR` |
| `PATCH` | `/usuarios/:id` | Actualizar datos de usuario | `ADMINISTRADOR` |
| `PATCH` | `/usuarios/:id/activar` | Activar/Desactivar usuario | `ADMINISTRADOR` |
| `PATCH` | `/usuarios/:id/rol` | Cambiar rol de usuario | `ADMINISTRADOR` |
| `PATCH` | `/usuarios/:id/password` | Resetear contraseña de usuario | `ADMINISTRADOR` |
| `DELETE` | `/usuarios/:id` | Borrado lógico de usuario | `ADMINISTRADOR` |

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

---

## 💰 6. Relación Producto-Proveedor (`/producto-proveedor`)
Gestión de suministros específicos. *Requiere `JwtAuthGuard` y `RolesGuard`.*

| Método | Endpoint | Descripción | Roles Permitidos |
| :--- | :--- | :--- | :--- |
| `GET` | `/producto-proveedor/search` | Buscar relaciones (autocomplete) | `ADMINISTRADOR`, `PROFESOR` |
| `PATCH` | `/producto-proveedor/:id/precio` | Actualizar precio pactado | `ADMINISTRADOR`, `PROFESOR` |
| `GET` | `/producto-proveedor/:id/historial` | Consultar histórico de precios | `ADMINISTRADOR`, `PROFESOR` |

---

## 🚛 7. Proveedores (`/proveedor`)
Entidades comerciales que suministran productos. *Requiere `JwtAuthGuard` y `RolesGuard`.*

| Método | Endpoint | Descripción | Roles Permitidos |
| :--- | :--- | :--- | :--- |
| `POST` | `/proveedor` | Registrar nuevo proveedor | `ADMINISTRADOR`, `PROFESOR` |
| `GET` | `/proveedor` | Listar proveedores activos | `ADMINISTRADOR`, `PROFESOR` |
| `GET` | `/proveedor/:id` | Ficha de contacto y sucursal | `ADMINISTRADOR`, `PROFESOR` |
| `PATCH` | `/proveedor/:id` | Modificar datos comerciales | `ADMINISTRADOR`, `PROFESOR` |
| `DELETE` | `/proveedor/:id` | Borrar proveedor del sistema | `ADMINISTRADOR` |

---

## 📦 8. Pedidos de Compra (`/pedidos`)
Gestión de órdenes pendientes de llegada. *Requiere `JwtAuthGuard` y `RolesGuard`.*

| Método | Endpoint | Descripción | Roles Permitidos |
| :--- | :--- | :--- | :--- |
| `POST` | `/pedidos` | Crear un nuevo pedido | `ADMINISTRADOR`, `PROFESOR` |
| `GET` | `/pedidos` | Listar todos los pedidos | `ADMINISTRADOR`, `PROFESOR` |
| `GET` | `/pedidos/:id` | Detalle completo de un pedido | `ADMINISTRADOR`, `PROFESOR` |
| `PATCH` | `/pedidos/:id` | Actualizar datos del pedido | `ADMINISTRADOR`, `PROFESOR` |
| `PATCH` | `/pedidos/:id/fecha-entrega` | Cambiar previsión de llegada | `ADMINISTRADOR`, `PROFESOR` |
| `PATCH` | `/pedidos/:id/cancelar` | Anular pedido no recibido | `ADMINISTRADOR`, `PROFESOR` |
| `DELETE` | `/pedidos/:id` | Eliminar pedido | `ADMINISTRADOR` |

---

## 📥 9. Recepción de Mercancía (`/recepcion`)
Punto crítico donde se actualiza el stock real. *Requiere `JwtAuthGuard` y `RolesGuard`.*

| Método | Endpoint | Descripción | Roles Permitidos |
| :--- | :--- | :--- | :--- |
| `POST` | `/recepcion` | **Procesar recepción (Stock + Movimientos)** | `ADMINISTRADOR`, `PROFESOR` |
| `GET` | `/recepcion` | Listar histórico de recepciones | `ADMINISTRADOR`, `PROFESOR` |
| `GET` | `/recepcion/:id` | Detalle de una recepción específica | `ADMINISTRADOR`, `PROFESOR` |
| `PATCH` | `/recepcion/:id` | Editar notas o datos de recepción | `ADMINISTRADOR`, `PROFESOR` |
| `DELETE` | `/recepcion/:id` | Anular/Eliminar recepción | `ADMINISTRADOR` |

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

---

## 📊 11. Dashboard y Control (`/dashboard`)
KPIs y estadísticas en tiempo real. *Requiere `JwtAuthGuard` y `RolesGuard`.*

| Método | Endpoint | Descripción | Roles Permitidos |
| :--- | :--- | :--- | :--- |
| `GET` | `/dashboard/stats` | Valor stock, productos bajo mínimo, etc. | `ADMINISTRADOR`, `PROFESOR` |

---

## 🔔 12. Alertas de Inventario (`/alertas`)
Detección proactiva de problemas. *Requiere `JwtAuthGuard` y `RolesGuard`.*

| Método | Endpoint | Descripción | Roles Permitidos |
| :--- | :--- | :--- | :--- |
| `GET` | `/alertas/caducidad` | Productos próximos a expirar | `ADMINISTRADOR`, `PROFESOR` |
| `GET` | `/alertas/stock` | Productos bajo stock de seguridad | `ADMINISTRADOR`, `PROFESOR` |

---

## 🍳 13. Recetas (`/recetas`)
Gestión integrada para cocinados. *Requiere `JwtAuthGuard` y `RolesGuard`.*

| Método | Endpoint | Descripción | Roles Permitidos |
| :--- | :--- | :--- | :--- |
| `POST` | `/recetas` | Crear nueva receta | `ADMINISTRADOR`, `PROFESOR` |
| `GET` | `/recetas` | Listar todas las recetas | `ADMIN`, `PROFESOR`, `ALUMNO` |
| `GET` | `/recetas/:id` | Detalle completo de una receta | `ADMIN`, `PROFESOR`, `ALUMNO` |
| `PATCH` | `/recetas/:id` | Actualizar datos de receta | `ADMINISTRADOR`, `PROFESOR` |
| `DELETE` | `/recetas/:id` | Eliminar receta | `ADMINISTRADOR` |

---

## 📍 14. Ubicaciones (`/ubicacion`)
Gestión de almacenes y estantes. *Requiere `JwtAuthGuard`.*

| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `POST` | `/ubicacion` | Crear nueva ubicación |
| `GET` | `/ubicacion` | Listar todas las ubicaciones |
| `GET` | `/ubicacion/:id` | Detalle de ubicación |
| `PATCH` | `/ubicacion/:id` | Actualizar ubicación |
| `DELETE` | `/ubicacion/:id` | Eliminar ubicación (lógico) |
| `POST` | `/ubicacion/:id/restore` | Restaurar ubicación eliminada |

---

## 📦 15. Gestión de Albaranes (`/albaranes`)
Documentos de entrega de proveedores.

| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `POST` | `/albaranes` | Registrar albarán |
| `GET` | `/albaranes` | Listar albaranes |
| `GET` | `/albaranes/:id` | Detalle de albarán |
| `PATCH` | `/albaranes/:id` | Actualizar albarán |
| `DELETE` | `/albaranes/:id` | Eliminar albarán |

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
