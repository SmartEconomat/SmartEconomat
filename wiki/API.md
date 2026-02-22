# Documentación Maestra de la API - SmartEconomat

Esta es la documentación **técnica y detallada** de la API. Diseñada para ser la fuente de verdad tanto hoy como dentro de 5 años.

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

| Método | Endpoint | Descripción | Roles Permitidos |
| :--- | :--- | :--- | :--- |
| `POST` | `/usuarios` | Crear usuario manualmente | `ADMINISTRADOR` |
| `GET` | `/usuarios` | Listar todos los usuarios | `ADMINISTRADOR` |
| `GET` | `/usuarios/:id` | Detalle completo de un usuario | `ADMINISTRADOR`, `PROFESOR` |
| `PATCH` | `/usuarios/:id` | Actualizar datos o roles | `ADMINISTRADOR` |
| `DELETE` | `/usuarios/:id` | Borrado lógico de usuario | `ADMINISTRADOR` |

---

## 🛒 5. Catálogo de Productos (`/productos`)
Relación técnica de los productos base.

| Método | Endpoint | Descripción | Lógica de IDs |
| :--- | :--- | :--- | :--- |
| `POST` | `/productos` | Crear nuevo producto | Genera `productoId` |
| `GET` | `/productos` | Listar con proveedores y precios | - |
| `GET` | `/productos/:id` | Ficha técnica y proveedores | ID del producto base |
| `PATCH` | `/productos/:id` | Editar ficha técnica | ID del producto base |
| `DELETE` | `/productos/:id` | Borrado lógico del producto | ID del producto base |

---

## 💰 6. Relación Producto-Proveedor (`/producto-proveedor`)
Gestión de suministros específicos.

| Método | Endpoint | Descripción | Notas |
| :--- | :--- | :--- | :--- |
| `PATCH` | `/producto-proveedor/:id/precio` | Actualizar precio pactado | Registra automático el histórico |
| `GET` | `/producto-proveedor/:id/historial` | Consultar histórico de precios | `:id` es el ID de la relación |

---

## 🚛 7. Proveedores (`/proveedor`)
Entidades comerciales que suministran productos.

| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `POST` | `/proveedor` | Registrar nuevo proveedor |
| `GET` | `/proveedor` | Listar proveedores activos |
| `GET` | `/proveedor/:id` | Ficha de contacto y sucursal |
| `PATCH` | `/proveedor/:id` | Modificar datos comerciales |
| `DELETE` | `/proveedor/:id` | Borrar proveedor del sistema |

---

## 📦 8. Pedidos de Compra (`/pedidos`)
Gestión de órdenes pendientes de llegada.

| Método | Endpoint | Descripción | Payload |
| :--- | :--- | :--- | :--- |
| `PATCH` | `/pedidos/:id/fecha-entrega` | Cambiar previsión de llegada | `UpdatePedidoDto` |
| `PATCH` | `/pedidos/:id/cancelar` | Anular pedido no recibido | `CancelPedidoDto` |

---

## 📥 9. Recepción de Mercancía (`/recepcion` y `/recepcion-stock`)
Punto crítico donde se actualiza el stock real.

| Método | Endpoint | Descripción | Flujo |
| :--- | :--- | :--- | :--- |
| `POST` | `/recepcion-stock` | **Procesar entrada de stock** | Suma stock + Crea Movimiento |
| `POST` | `/recepcion` | Registro manual de recepción | Crea cabecera y líneas |
| `GET` | `/recepcion` | Listar histórico de recepciones | - |
| `GET` | `/recepcion/:id` | Detalle líneas recibidas | - |
| `PATCH` | `/recepcion/:id` | Editar notas de recepción | - |
| `DELETE` | `/recepcion/:id` | Anular recepción | - |

---

## 🔄 10. Movimientos de Inventario (`/movimientos`)
Auditoría total de lo que entra y sale.

| Método | Endpoint | Descripción | Params Clave |
| :--- | :--- | :--- | :--- |
| `POST` | `/movimientos` | Crear ajuste, entrada o salida | `CreateMovimientoDto` |
| `GET` | `/movimientos` | Listado general auditable | - |
| `GET` | `/movimientos/historial` | Consulta filtrada avanzada | Query: `entityId` (ProductoProveedor) |
| `GET` | `/movimientos/:id` | Detalle de transacción única | - |
| `PATCH` | `/movimientos/:id` | Editar descripción/motivo | - |
| `DELETE` | `/movimientos/:id` | Eliminar traza (Solo ADMIN) | - |

---

## 📊 11. Dashboard y Control (`/dashboard`)
KPIs y estadísticas en tiempo real.

| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `GET` | `/dashboard/stats` | Valor stock, productos bajo mínimo, etc. |

---

## 🔔 12. Alertas de Inventario (`/Alertas`)
Detección proactiva de problemas.

| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `GET` | `/Alertas/caducidad` | Productos próximos a expirar |
| `GET` | `/Alertas/stock` | Productos bajo stock de seguridad |

---

## 🔍 Glosario de Campos Técnicos
- **`created_at` / `updated_at`**: Timestamps automáticos (timestamptz).
- **`version`**: Contador para **bloqueo optimista** (previene que un cambio pise a otro).
- **`deleted_at`**: El sistema usa **Borrado Lógico**. DELETE marca la fila como inactiva en lugar de borrarla.
