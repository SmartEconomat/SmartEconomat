# Documentación maestra de la API - SmartEconomat

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

- **Base URL**: `http://localhost:3000/api/v1`
- **Headers Obligatorios**:
  - `Content-Type: application/json`
  - `Authorization: Bearer <JWT_TOKEN>` (Para rutas protegidas)

> [!IMPORTANT]
>
> - La raíz pública de verificación sigue disponible en `http://localhost:3000/`.
> - La API real usa el prefijo global `api/v1` configurado en NestJS.

### Formatos de Respuesta

La mayoría de endpoints CRUD devuelven entidades o respuestas paginadas. Algunos módulos añaden envoltorios específicos (`auth`, `archivos`) y los endpoints de exportación devuelven binarios.

Ejemplo frecuente de respuesta paginada:

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

| Método | Endpoint                | Descripción                                  | Payload                 |
| :----- | :---------------------- | :------------------------------------------- | :---------------------- |
| `POST` | `/auth/register`        | Registro de nuevo usuario (Nivel: INVITADO)  | `RegisterUserDto`       |
| `POST` | `/auth/login`           | Login y obtención de Bearer Token            | `LoginUserDto`          |
| `POST` | `/auth/forgot-password` | Solicitar recuperación de contraseña         | `{ "email": "string" }` |
| `POST` | `/auth/reset-password`  | Cambiar contraseña con token de recuperación | `ResetPasswordDto`      |
| `POST` | `/auth/change-password` | Cambiar contraseña estando logueado          | `ChangePasswordDto`     |

> [!IMPORTANT]
>
> - `register`, `login`, `forgot-password` y `reset-password` son públicos.
> - Al registrarse, el usuario queda inicialmente con el rol operativo que le asigne el backend y debe ser activado por un administrador.
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

Gestión de cuentas, perfiles y permisos. _Requiere `JwtAuthGuard`, `RolesGuard` y `PermisosGuard`._

### Perfil de Usuario (Auto-gestión)

| Método  | Endpoint                    | Descripción                            | Roles Permitidos |
| :------ | :-------------------------- | :------------------------------------- | :--------------- |
| `GET`   | `/usuarios/perfil`          | Obtener datos del usuario logueado     | Todos            |
| `PATCH` | `/usuarios/perfil`          | Actualizar nombre o email propio       | Todos            |
| `PATCH` | `/usuarios/perfil/password` | Cambiar contraseña (validando antigua) | Todos            |

### Administración de Personal

| Método   | Endpoint                                        | Descripción                                        | Roles Permitidos |
| :------- | :---------------------------------------------- | :------------------------------------------------- | :--------------- |
| `POST`   | `/usuarios`                                     | Crear usuario completo                             | `ADMIN`          |
| `POST`   | `/usuarios/admin`                               | Alta administrativa extendida                      | `ADMIN`          |
| `GET`    | `/usuarios`                                     | Listar todos los usuarios (paginado)               | `ADMINISTRADOR`  |
| `GET`    | `/usuarios/:id`                                 | Detalle, pedidos y movimientos asociados           | `ADMINISTRADOR`  |
| `PATCH`  | `/usuarios/:id`                                 | Editar cualquier campo del usuario                 | `ADMINISTRADOR`  |
| `PATCH`  | `/usuarios/:id/admin`                           | Actualización administrativa                       | `ADMIN`          |
| `PATCH`  | `/usuarios/:id/activar`                         | Cambiar `status` (`ACTIVE`, `INACTIVE`, `BLOCKED`) | `ADMIN`          |
| `PATCH`  | `/usuarios/:id/rol`                             | Cambiar rol (`ADMIN`, `PROFESOR`, `ALUMNO`)        | `ADMIN`          |
| `PATCH`  | `/usuarios/:id/password`                        | Reset forzoso de contraseña                        | `ADMINISTRADOR`  |
| `POST`   | `/usuarios/:id/permisos-adicionales/:permisoId` | Añadir permiso extra a un usuario                  | `ADMINISTRADOR`  |
| `DELETE` | `/usuarios/:id/permisos-adicionales/:permisoId` | Quitar permiso extra                               | `ADMINISTRADOR`  |
| `POST`   | `/usuarios/:id/permisos-excluidos/:permisoId`   | Vetar un permiso específico a un usuario           | `ADMINISTRADOR`  |
| `DELETE` | `/usuarios/:id/permisos-excluidos/:permisoId`   | Quitar veto de permiso                             | `ADMINISTRADOR`  |
| `DELETE` | `/usuarios/:id`                                 | Borrado físico del registro                        | `ADMINISTRADOR`  |

> [!IMPORTANT]
>
> - La activación usa el DTO `UpdateUsuarioStatusDto` con el campo `status`; no usa `activo` booleano.
> - El cambio de rol usa el enum real `ADMIN`, `PROFESOR`, `ALUMNO`.

---

## 🛒 5. Catálogo de Productos (`/productos`)

Relación técnica de los productos base. _Requiere `JwtAuthGuard` y `RolesGuard`._

| Método   | Endpoint                   | Descripción                    | Roles Permitidos              |
| :------- | :------------------------- | :----------------------------- | :---------------------------- |
| `GET`    | `/productos/generar-ean13` | Generar un código EAN-13 único | `ADMINISTRADOR`, `PROFESOR`   |
| `POST`   | `/productos`               | Crear nuevo producto           | `ADMINISTRADOR`, `PROFESOR`   |
| `GET`    | `/productos`               | Listar todos los productos     | `ADMIN`, `PROFESOR`, `ALUMNO` |
| `GET`    | `/productos/:id`           | Ficha técnica y proveedores    | `ADMIN`, `PROFESOR`, `ALUMNO` |
| `PATCH`  | `/productos/:id`           | Editar ficha técnica           | `ADMINISTRADOR`, `PROFESOR`   |
| `DELETE` | `/productos/:id`           | Borrado lógico del producto    | `ADMINISTRADOR`               |

### 🔍 Filtrado y Paginación (`GET /productos`)

Este endpoint soporta búsqueda avanzada y paginación mediante **Query Parameters**.

**Parámetros de consulta disponibles:**
| Parámetro | Tipo | Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `page` | `number` | No | Página a consultar (Default: 1) |
| `limit` | `number` | No | Elementos por página (Max: 50, Default: 20) |
| `searchTerm` | `string` | No | Búsqueda parcial por nombre del producto |
| `codigoBarras` | `string` | No | Búsqueda exacta por código de barras |
| `categorias` | `string` | No | Filtro de categorías (ej: `verdura,bebida,fruta`) |
| `alergenos` | `string` | No | Lista de alérgenos (ej: `GLUTEN,SOJA,LACTEOS`) |
| `marcas` | `string` | No | Filtrar por marcas específicas (ej: `Nestle,Bio`) |
| `minStock` | `boolean`| No | Si es `true`, solo devuelve productos con stock disponible |
| `sortBy` | `string` | No | `nombre`, `codigoBarras`, `tipo`, `marca`, `createdAt`, `updatedAt` |
| `order` | `string` | No | `ASC` o `DESC` |

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
> **Alta Compleja de Producto**: Al crear un producto mediante `POST /productos`, el sistema permite una operación transaccional que incluye:
>
> 1. **Ficha Base**: Nombre, marca, unidad (`UnidadMedida`).
> 2. **Alérgenos**: Array de `Alergeno` (Enum: `GLUTEN, LACTEOS, etc`).
> 3. **Proveedores**: Array de `AddProveedorToProductoDto` (Incluye `proveedorId`, `precioUnitario`, `marcaEspecifica`, `codigoBarras`).
>    Todo el proceso se ejecuta bajo una transacción de base de datos para garantizar la integridad de los datos.

#### DTOs relevantes para alta compleja

**`CreateProductoDto`**

| Campo          | Tipo                          | Obligatorio | Observaciones                                    |
| :------------- | :---------------------------- | :---------: | :----------------------------------------------- |
| `nombre`       | `string`                      |     Sí      | Nombre del producto maestro                      |
| `marca`        | `string`                      |     No      | Marca genérica                                   |
| `unidad`       | `UnidadMedida`                |     Sí      | Enum compartido                                  |
| `contenido`    | `number`                      |     Sí      | Valor mayor o igual a 0                          |
| `tipo`         | `TipoProducto`                |     No      | Categoría del producto                           |
| `codigoBarras` | `string`                      |     No      | EAN-13 único; si falta se genera automáticamente |
| `alergenos`    | `Alergeno[]`                  |     No      | Lista de alérgenos del producto                  |
| `proveedores`  | `AddProveedorToProductoDto[]` |     No      | Relaciones comerciales a crear o sincronizar     |

**`AddProveedorToProductoDto`**

| Campo             | Tipo      | Obligatorio | Observaciones                             |
| :---------------- | :-------- | :---------: | :---------------------------------------- |
| `proveedorId`     | `UUID v7` |     Sí      | Debe existir en el maestro de proveedores |
| `precioUnitario`  | `number`  |    Sí\*     | Obligatorio en alta compleja              |
| `marcaEspecifica` | `string`  |     No      | Marca específica del proveedor            |
| `codigoBarras`    | `string`  |     No      | EAN-13 específico del proveedor           |

> [!NOTE]
> La actualización de precio de un `ProductoProveedor` usa el campo `nuevoPrecio`.

#### Errores esperados en alta compleja

| Código | Caso                                                                      |
| :----- | :------------------------------------------------------------------------ |
| `400`  | DTO inválido, EAN-13 inválido o precio unitario ausente                   |
| `404`  | Proveedor inexistente                                                     |
| `409`  | Código de barras duplicado, alérgenos duplicados o proveedores duplicados |

> [!NOTE]
> El sistema también soporta el flujo conectado mediante `PATCH /productos/:id` para completar después los `alergenos` y `proveedores` del producto maestro.

> [!TIP]
> Referencia ampliada en [Alta compleja de producto](../modules/producto/alta-compleja-producto-maestro-proveedores.md).

---

## 💰 6. Relación Producto-Proveedor (`/producto-proveedor`)

Gestión de suministros específicos. _Requiere `JwtAuthGuard` y `RolesGuard`._

| Método  | Endpoint                            | Descripción                      | Roles Permitidos            |
| :------ | :---------------------------------- | :------------------------------- | :-------------------------- |
| `GET`   | `/producto-proveedor/search`        | Buscar relaciones (autocomplete) | `ADMINISTRADOR`, `PROFESOR` |
| `PATCH` | `/producto-proveedor/:id/precio`    | Actualizar precio pactado        | `ADMINISTRADOR`, `PROFESOR` |
| `GET`   | `/producto-proveedor/:id/historial` | Consultar histórico de precios   | `ADMINISTRADOR`, `PROFESOR` |

### 🔎 Autocompletado de Suministros (`GET /search`)

Diseñado para selectores dinámicos en formularios de pedidos o inventario.

| Parámetro | Tipo     | Descripción                                     |
| :-------- | :------- | :---------------------------------------------- |
| `q`       | `string` | Término de búsqueda (busca en producto y marca) |
| `limit`   | `number` | Máximo de sugerencias sugeridas (Máx: 50)       |
| `offset`  | `number` | Salto de registros para scroll infinito         |

---

## 🚛 7. Proveedores (`/proveedor`)

Entidades comerciales que suministran productos. _Requiere `JwtAuthGuard` y `RolesGuard`._

| Método   | Endpoint         | Descripción                                   | Roles Permitidos            |
| :------- | :--------------- | :-------------------------------------------- | :-------------------------- |
| `POST`   | `/proveedor`     | Registrar nuevo proveedor                     | `ADMINISTRADOR`, `PROFESOR` |
| `GET`    | `/proveedor`     | Listar auxiliares (paginado + búsqueda)       | `ADMINISTRADOR`, `PROFESOR` |
| `GET`    | `/proveedor/:id` | Ficha de contacto y sucursal                  | `ADMINISTRADOR`, `PROFESOR` |
| `PATCH`  | `/proveedor/:id` | Modificar datos comerciales                   | `ADMINISTRADOR`, `PROFESOR` |
| `DELETE` | `/proveedor/:id` | Borrar proveedor (Solo si no tiene productos) | `ADMINISTRADOR`             |

### 🔍 Búsqueda de Proveedores (`GET /proveedor`)

Permite localizar proveedores mediante filtros en la URL.

| Parámetro    | Tipo     | Descripción                                                        |
| :----------- | :------- | :----------------------------------------------------------------- |
| `page`       | `number` | Página a consultar (Default: 1)                                    |
| `limit`      | `number` | Elementos por página (Máx: 100, Default: 20)                       |
| `searchTerm` | `string` | Búsqueda parcial por **nombre**, **NIF**, **contacto** o **email** |

**Estructura de respuesta:** Sigue el estándar `PaginatedResponseDto` detallado en la sección de Productos.

---

## 📦 8. Pedidos de Compra (`/pedidos`)

Gestión de órdenes y seguimiento de suministros. _Requiere `JwtAuthGuard` y `RolesGuard`._

| Método   | Endpoint                     | Descripción                                     | Roles Permitidos            |
| :------- | :--------------------------- | :---------------------------------------------- | :-------------------------- |
| `POST`   | `/pedidos`                   | Crear un nuevo pedido                           | `ADMINISTRADOR`, `PROFESOR` |
| `POST`   | `/pedidos/from-recipes`      | Generar un pedido único desde múltiples recetas | `ADMINISTRADOR`, `PROFESOR` |
| `GET`    | `/pedidos`                   | Listar todos los pedidos (paginado)             | `ADMINISTRADOR`, `PROFESOR` |
| `GET`    | `/pedidos/:id`               | Detalle completo (incluye líneas y recepciones) | `ADMINISTRADOR`, `PROFESOR` |
| `PATCH`  | `/pedidos/:id`               | Actualizar datos o productos del pedido         | `ADMINISTRADOR`, `PROFESOR` |
| `PATCH`  | `/pedidos/:id/fecha-entrega` | Cambiar previsión de llegada                    | `ADMINISTRADOR`, `PROFESOR` |
| `PATCH`  | `/pedidos/:id/cancelar`      | Anular pedido (con motivo)                      | `ADMINISTRADOR`, `PROFESOR` |
| `DELETE` | `/pedidos/:id`               | Eliminar pedido (Solo PENDIENTE/CANCELADO)      | `ADMINISTRADOR`             |

### 🚦 Estados del Pedido

El flujo de una orden se rige por los siguientes estados:

1.  **`PENDIENTE`**: Recién creado, esperando envío o validación.
2.  **`EN_PROCESO`**: Orden enviada al proveedor, esperando recepción.
3.  **`RECIBIDO`**: Mercancía recibida al 100% satisfactoriamente.
4.  **`PARCIAL`**: Mercancía recibida parcialmente (esperando el resto).
5.  **`INCIDENCIA`**: Recibido con discrepancias (faltas/roturas) por resolver.
6.  **`CANCELADO`**: Orden anulada (no genera stock).

> [!TIP]
> Al crear un pedido (`POST /pedidos`), el backend espera la colección `lineas`. Cada línea incluye `productoProveedorId` y `cantidad`. El precio no forma parte del DTO de creación actual.

### 🧾 Generación desde recetas (`POST /pedidos/from-recipes`)

Este endpoint permite seleccionar $N$ recetas y generar un único pedido consolidado.

#### Payload

| Campo | Tipo | Obligatorio | Descripción |
| :---- | :--- | :---------: | :---------- |
| `recetaIds` | `UUID v7[]` | Sí | Lista de recetas a consolidar |
| `observaciones` | `string` | No | Texto libre para trazabilidad del origen |

**Ejemplo de request:**

```json
{
  "recetaIds": [
    "01959e4b-0d6d-7f25-a2f0-1e4b6c8e0101",
    "01959e4b-0d6d-7f25-a2f0-1e4b6c8e0102"
  ],
  "observaciones": "Pedido generado para producción semanal"
}
```

#### Reglas funcionales

1. Se cargan todas las recetas solicitadas.
2. Se recorren sus ingredientes y se consolidan por `productoId` usando un `Map`.
3. Si el mismo producto aparece varias veces, sus cantidades se suman.
4. Si existe `mermaAplicada`, se incorpora al cálculo de la cantidad efectiva.
5. Todos los productos deben estar disponibles y tener proveedor asignado con precio vigente.
6. Debe existir un proveedor común para todos los ingredientes consolidados.
7. Si hay varios proveedores comunes, se selecciona el de menor coste total estimado.
8. El pedido creado queda vinculado al usuario autenticado vía JWT.

#### Respuestas esperadas

| Código | Caso |
| :----- | :--- |
| `201` | Pedido creado correctamente |
| `400` | Productos inactivos, unidades incompatibles o sin proveedor común |
| `404` | Alguna receta no existe |

#### Ejemplo de respuesta `201 Created`

```json
{
  "success": true,
  "message": "Operación exitosa",
  "data": {
    "id": "01959e4b-5f9a-7db1-94d6-6f3d0d3f0001",
    "proveedorId": "01959e4b-5f9a-7db1-94d6-6f3d0d3f0100",
    "usuarioId": "01959e4b-5f9a-7db1-94d6-6f3d0d3f0200",
    "estado": "PENDIENTE",
    "costeTotal": 12,
    "fechaPedido": "2026-03-14T18:00:00.000Z",
    "fechaEntrega": "2026-03-14T18:00:00.000Z",
    "pedidoProductos": [
      {
        "id": "01959e4b-5f9a-7db1-94d6-6f3d0d3f0300",
        "cantidad": 3,
        "precioUnitario": 4,
        "productoProveedor": {
          "id": "01959e4b-5f9a-7db1-94d6-6f3d0d3f0400",
          "productoId": "01959e4b-5f9a-7db1-94d6-6f3d0d3f0500",
          "proveedorId": "01959e4b-5f9a-7db1-94d6-6f3d0d3f0100"
        }
      }
    ]
  },
  "meta": {
    "app": "SmartEconomat",
    "version": "1.0.0",
    "timestamp": "2026-03-14T18:00:00.000Z",
    "environment": "development",
    "requestId": "01959e4b-5f9a-7db1-94d6-6f3d0d3f9999"
  }
}
```

#### Ejemplo de respuesta `400 Bad Request`

```json
{
  "success": false,
  "message": "No existe un proveedor común activo para todos los ingredientes de las recetas seleccionadas.",
  "data": null,
  "meta": {
    "app": "SmartEconomat",
    "version": "1.0.0",
    "timestamp": "2026-03-14T18:01:00.000Z",
    "environment": "development",
    "requestId": "01959e4b-5f9a-7db1-94d6-6f3d0d3f9998"
  }
}
```

#### Ejemplo de respuesta `404 Not Found`

```json
{
  "success": false,
  "message": "No se encontraron las recetas: 0191c30c-1e55-7000-8000-000000000000",
  "data": null,
  "meta": {
    "app": "SmartEconomat",
    "version": "1.0.0",
    "timestamp": "2026-03-14T18:02:00.000Z",
    "environment": "development",
    "requestId": "01959e4b-5f9a-7db1-94d6-6f3d0d3f9997"
  }
}
```

#### Ejemplo funcional de consolidación

- Receta A: `Harina = 2kg`
- Receta B: `Harina = 1kg`
- Pedido resultante: una línea con `Harina = 3kg`

> [!NOTE]
> El origen del pedido se registra en logs del backend con `pedido.id`, `recetaIds`, `userId`, `proveedorId` y `observaciones` si existen.

> [!TIP]
> Referencia ampliada en [Pedidos desde recetas](../modules/pedido/pedidos-desde-recetas.md).

---

## 📥 9. Recepción de Mercancía (`/recepcion`)

Punto crítico donde se actualiza el stock real y se cierran pedidos. _Requiere `JwtAuthGuard` y `RolesGuard`._

| Método   | Endpoint         | Descripción                                            | Roles Permitidos            |
| :------- | :--------------- | :----------------------------------------------------- | :-------------------------- |
| `POST`   | `/recepcion`     | **Procesar recepción (Stock + Movimientos + Pedidos)** | `ADMINISTRADOR`, `PROFESOR` |
| `GET`    | `/recepcion`     | Listar histórico de recepciones (paginado)             | `ADMINISTRADOR`, `PROFESOR` |
| `GET`    | `/recepcion/:id` | Detalle (incluye productos, pedidos y albaranes)       | `ADMINISTRADOR`, `PROFESOR` |
| `PATCH`  | `/recepcion/:id` | Editar notas o datos de cabecera                       | `ADMINISTRADOR`, `PROFESOR` |
| `DELETE` | `/recepcion/:id` | Anular recepción (Revierte stock si es posible)        | `ADMINISTRADOR`             |

### 🚀 Capacidades del Proceso (`POST /recepcion`)

Este endpoint es un **Proceso Maestro** que realiza múltiples acciones atómicas:

1.  **Multi-Pedido**: Puede recepcionar varios pedidos de un mismo proveedor en una sola firma.
2.  **Alta Directa**: Permite crear productos nuevos que no estaban en el catálogo original directamente desde el formulario de recepción.
3.  **Trazabilidad**: Genera automáticamente **Movimientos de Inventario** y crea **Lotes** (FEFO).
4.  **Gestión de Incidencias**: Si hay discrepancias, genera registros en el módulo de incidencias.

### 🚦 Estados de la Recepción

- **`COMPLETADA`**: Todo lo recibido coincide exactamente con lo pedido.
- **`PARCIAL`**: Se ha recibido menos cantidad de la esperada en alguna línea.
- **`CON_INCIDENCIAS`**: Se han detectado discrepancias graves (roturas, excesos o faltas totales).

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

Auditoría total de lo que entra y sale. _Requiere `JwtAuthGuard` y `RolesGuard`._

| Método   | Endpoint                 | Descripción                               | Roles Permitidos              |
| :------- | :----------------------- | :---------------------------------------- | :---------------------------- |
| `POST`   | `/movimientos`           | Crear ajuste, entrada o salida            | `ADMINISTRADOR`, `PROFESOR`   |
| `GET`    | `/movimientos`           | Listado general auditable                 | `ADMIN`, `PROFESOR`, `ALUMNO` |
| `GET`    | `/movimientos/historial` | Consulta filtrada avanzada (Trazabilidad) | `ADMINISTRADOR`, `PROFESOR`   |
| `GET`    | `/movimientos/:id`       | Detalle de transacción única              | `ADMIN`, `PROFESOR`, `ALUMNO` |
| `PATCH`  | `/movimientos/:id`       | Editar descripción/motivo                 | `ADMINISTRADOR`               |
| `DELETE` | `/movimientos/:id`       | Eliminar traza (Borrado lógico)           | `ADMINISTRADOR`               |

### 🔍 Trazabilidad y Filtros (`GET /movimientos/historial`)

Permite reconstruir la historia de un producto o la actividad de un usuario.

| Parámetro   | Tipo     | Requerido | Descripción                                                                                                                                    |
| :---------- | :------- | :-------- | :--------------------------------------------------------------------------------------------------------------------------------------------- |
| `entityId`  | `UUID`   | No\*      | UUID del ProductoProveedor para filtrar stock específico                                                                                       |
| `userId`    | `UUID`   | No\*      | UUID del Usuario para auditar acciones                                                                                                         |
| `type`      | `string` | No        | `entrada`, `salida`, `ajuste`, `pedido`, `entrada_compra`, `salida_elaboracion`, `produccion_consumo`, `produccion_resultado`, `salida_ajuste` |
| `startDate` | `string` | No        | Fecha inicio (ISO 8601)                                                                                                                        |
| `endDate`   | `string` | No        | Fecha fin (ISO 8601)                                                                                                                           |
| `sortBy`    | `string` | No        | `createdAt` o `cantidad`                                                                                                                       |
| `sortOrder` | `string` | No        | `ASC` o `DESC`                                                                                                                                 |

_\*Debe proporcionarse al menos `entityId` o `userId` para que la consulta sea válida._

---

## 📊 11. Dashboard y Control (`/dashboard`)

KPIs y estadísticas consolidadas en tiempo real. _Requiere `JwtAuthGuard` y `RolesGuard`._

| Método | Endpoint           | Descripción                                    | Roles Permitidos            |
| :----- | :----------------- | :--------------------------------------------- | :-------------------------- |
| `GET`  | `/dashboard/stats` | Obtener KPIs generales y estadísticas actuales | `ADMINISTRADOR`, `PROFESOR` |

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

Detección proactiva de problemas. _Requiere `JwtAuthGuard` y `RolesGuard`._

| Método | Endpoint             | Descripción                       | Roles Permitidos            |
| :----- | :------------------- | :-------------------------------- | :-------------------------- |
| `GET`  | `/alertas/caducidad` | Productos próximos a expirar      | `ADMINISTRADOR`, `PROFESOR` |
| `GET`  | `/alertas/stock`     | Productos bajo stock de seguridad | `ADMINISTRADOR`, `PROFESOR` |

---

## 🍳 13. Recetas (`/recetas`)

Gestión integrada de fórmulas culinarias y sus ingredientes. _Requiere `JwtAuthGuard` y `RolesGuard`._

| Método   | Endpoint                         | Descripción                              | Roles Permitidos              |
| :------- | :------------------------------- | :--------------------------------------- | :---------------------------- |
| `POST`   | `/recetas`                       | Crear nueva receta e ingredientes        | `ADMINISTRADOR`, `PROFESOR`   |
| `POST`   | `/recetas/duplicate`             | **Duplicar una receta existente**        | `ADMINISTRADOR`, `PROFESOR`   |
| `GET`    | `/recetas`                       | Listar recetas (paginado + búsqueda)     | `ADMIN`, `PROFESOR`, `ALUMNO` |
| `GET`    | `/recetas/:id`                   | Ficha completa (incluye alérgenos)       | `ADMIN`, `PROFESOR`, `ALUMNO` |
| `GET`    | `/recetas/:id/detalle`           | Ver estructura de ingredientes detallada | `ADMIN`, `PROFESOR`, `ALUMNO` |
| `GET`    | `/recetas/:id/escandallo`        | Calcular coste total e ingredientes      | `ADMIN`, `PROFESOR`, `ALUMNO` |
| `POST`   | `/recetas/:id/cocinar`           | Registrar consumo de stock por cocinado  | `ADMINISTRADOR`, `PROFESOR`   |
| `POST`   | `/recetas/:id/recalcular-costes` | Forzar actualización de costes en BD     | `ADMINISTRADOR`, `PROFESOR`   |
| `PATCH`  | `/recetas/:id`                   | Actualizar datos o ingredientes          | `ADMINISTRADOR`, `PROFESOR`   |
| `DELETE` | `/recetas/:id`                   | Eliminar receta del sistema              | `ADMINISTRADOR`               |

---

## 🏭 14. Producción y Lotes (`/produccion`)

Gestión de resultados de cocinado y trazabilidad por lotes.

| Método | Endpoint               | Descripción                             | Roles Permitidos            |
| :----- | :--------------------- | :-------------------------------------- | :-------------------------- |
| `POST` | `/produccion/ejecutar` | Ejecutar receta y generar lote de stock | `ADMINISTRADOR`, `PROFESOR` |
| `GET`  | `/produccion`          | Listar histórico de producciones        | `ADMINISTRADOR`, `PROFESOR` |
| `GET`  | `/produccion/:id`      | Detalle técnico de un lote producido    | `ADMINISTRADOR`, `PROFESOR` |

**Payload real de `POST /produccion/ejecutar`:**

```json
{
  "recetaId": "uuid-v7-receta",
  "cantidadProducida": 12,
  "fechaCaducidadManual": "2026-03-20",
  "ubicacionDestinoId": "uuid-v7-ubicacion"
}
```

### 🔍 Búsqueda de Recetas (`GET /recetas`)

Soporta los parámetros estándar de paginación (`page`, `limit`).

| Parámetro    | Tipo     | Descripción                                                |
| :----------- | :------- | :--------------------------------------------------------- |
| `searchTerm` | `string` | Búsqueda parcial por **nombre** o en las **instrucciones** |

### 🥗 Estructura de Ingredientes

Al crear o editar una receta, el array `ingredientes` debe referenciar productos técnicos:

```json
{
  "productoId": "uuid-v7-producto",
  "cantidad": 0.5,
  "unidad": "kg",
  "mermaAplicada": 10
}
```

> [!NOTE]
> El detalle de la receta (`GET /recetas/:id`) agrega automáticamente el cálculo de **alérgenos consolidados** basándose en los alérgenos declarados en cada ingrediente (producto tecnológico).
>
> Para `POST /recetas/:id/cocinar`, el DTO actual usa `{ "cantidad": 1 }`.

---

## 📍 14. Ubicaciones (`/ubicacion`)

Gestión de almacenes, estantes y zonas de frío. _Requiere `JwtAuthGuard`._

| Método   | Endpoint                 | Descripción                           | Roles Permitidos     |
| :------- | :----------------------- | :------------------------------------ | :------------------- |
| `POST`   | `/ubicacion`             | Crear nueva zona de almacenaje        | Todos (Autenticados) |
| `GET`    | `/ubicacion`             | Listar todas las ubicaciones activas  | Todos (Autenticados) |
| `GET`    | `/ubicacion/:id`         | Detalle de ubicación específica       | Todos (Autenticados) |
| `PATCH`  | `/ubicacion/:id`         | Actualizar nombre o descripción       | Todos (Autenticados) |
| `DELETE` | `/ubicacion/:id`         | Borrado lógico (marcar como inactiva) | Todos (Autenticados) |
| `POST`   | `/ubicacion/:id/restore` | Recuperar una ubicación borrada       | Todos (Autenticados) |

> [!NOTE]
> Las ubicaciones son transversales. Aunque el sistema soporta borrado lógico, no se permite eliminar una ubicación si ésta tiene **Inventario** asociado actualmente.

---

## 📦 15. Gestión de Albaranes (`/albaranes`)

Documentos de entrega de proveedores que vinculan pedidos y recepciones. _Requiere `JwtAuthGuard` y `RolesGuard`._

| Método   | Endpoint         | Descripción                            | Roles Permitidos            |
| :------- | :--------------- | :------------------------------------- | :-------------------------- |
| `POST`   | `/albaranes`     | Registrar un nuevo albarán             | `ADMINISTRADOR`, `PROFESOR` |
| `GET`    | `/albaranes`     | Listar todos los albaranes registrados | `ADMINISTRADOR`, `PROFESOR` |
| `GET`    | `/albaranes/:id` | Detalle completo de un albarán         | `ADMINISTRADOR`, `PROFESOR` |
| `PATCH`  | `/albaranes/:id` | Actualizar datos de un albarán         | `ADMINISTRADOR`, `PROFESOR` |
| `DELETE` | `/albaranes/:id` | Eliminar un albarán del sistema        | `ADMINISTRADOR`             |

---

## 🗳️ 16. Inventario Directo (`/inventario`)

Gestión directa de ítems en stock. _Requiere `JwtAuthGuard` y `PermisosGuard`._

| Método   | Endpoint            | Descripción                                   | Roles Permitidos            |
| :------- | :------------------ | :-------------------------------------------- | :-------------------------- |
| `POST`   | `/inventario`       | Crear registro de inventario                  | `ADMINISTRADOR`, `PROFESOR` |
| `GET`    | `/inventario`       | Listar todos los ítems en inventario          | `ADMINISTRADOR`, `PROFESOR` |
| `GET`    | `/inventario/stock` | Consulta de stock consolidado o por ubicación | `ADMINISTRADOR`, `PROFESOR` |
| `POST`   | `/inventario/ajustes-manuales` | Registrar ajuste manual de stock con auditoría | `ADMINISTRADOR`, `PROFESOR` |
| `GET`    | `/inventario/:id`   | Detalle de ítem en inventario                 | `ADMINISTRADOR`, `PROFESOR` |
| `PATCH`  | `/inventario/:id`   | Actualizar ítem en inventario                 | `ADMINISTRADOR`, `PROFESOR` |
| `DELETE` | `/inventario/:id`   | Eliminar ítem del inventario                  | `ADMINISTRADOR`             |

**Filtros reales de `GET /inventario/stock`:** `productoId`, `ubicacionId`, `onlyLowStock`, `consolidado`.

### Ajustes manuales auditados

Permite registrar correcciones operativas de stock sin perder trazabilidad.

**DTO real de `POST /inventario/ajustes-manuales`:**

```json
{
  "inventarioId": "01954a87-0778-74d4-bb32-55b12044579f",
  "tipo": "salida_ajuste",
  "ajuste": -3,
  "motivo": "Rotura interna",
  "observaciones": "Envase dañado en almacén"
}
```

**Enums permitidos para `tipo`:** `entrada`, `ajuste`, `salida_ajuste`.

**Reglas reales del backend:**

- `ajuste !== 0`
- `tipo = entrada` requiere ajuste positivo
- `tipo = salida_ajuste` requiere ajuste negativo
- el stock final no puede quedar por debajo de `0`
- se actualiza `Inventario` y se inserta `Movimiento` en la misma transacción
- el movimiento registra el usuario autenticado y una descripción auditada

**Errores esperados:**

| Código | Caso |
| :----- | :--- |
| `400` | Payload inválido, ajuste `0` o signo inconsistente |
| `404` | Inventario inexistente |
| `409` | El ajuste dejaría el stock en negativo |

> [!TIP]
> La referencia funcional y técnica ampliada está en [wiki/modules/inventario/ajustes-manuales-auditoria.md](../modules/inventario/ajustes-manuales-auditoria.md).

---

## 🎓 17. Sistema Educativo (`/admin`, `/alumnos`, `/profesores`)

Módulos específicos para la gestión del flujo educativo (Profesores -> Alumnos).

### Gestión de Profesores (Admin)

| Método  | Endpoint                       | Descripción                 | Roles Permitidos |
| :------ | :----------------------------- | :-------------------------- | :--------------- |
| `POST`  | `/admin/profesores`            | Alta de nuevo profesor      | `ADMINISTRADOR`  |
| `PATCH` | `/admin/users/:id/activate`    | Activar cuenta de usuario   | `ADMINISTRADOR`  |
| `POST`  | `/admin/users/:id/force-reset` | Reset de contraseña forzado | `ADMINISTRADOR`  |

### Panel del Profesor (`/profesores`)

| Método  | Endpoint                              | Descripción                      | Roles Permitidos |
| :------ | :------------------------------------ | :------------------------------- | :--------------- |
| `POST`  | `/profesores/register`                | Registro público de profesor     | Público          |
| `POST`  | `/profesores/slots`                   | Crear slots para invitar alumnos | `PROFESOR`       |
| `GET`   | `/profesores/alumnos`                 | Listar alumnos vinculados        | `PROFESOR`       |
| `PATCH` | `/profesores/alumnos/:id/activate`    | Activar cuenta de alumno         | `PROFESOR`       |
| `POST`  | `/profesores/alumnos/:id/force-reset` | Reset password de alumno         | `PROFESOR`       |

**DTO real para crear slot:**

```json
{
  "aula": "2A",
  "numeroClase": 12
}
```

### Panel del Alumno (`/alumnos`)

| Método  | Endpoint                   | Descripción                             | Roles Permitidos |
| :------ | :------------------------- | :-------------------------------------- | :--------------- |
| `POST`  | `/alumnos/register`        | Registro de alumno mediante código slot | Público          |
| `PATCH` | `/alumnos/change-profesor` | Cambiar de tutor/profesor               | `ALUMNO`         |

**DTO real de registro de alumno:**

```json
{
  "username": "alumno.demo",
  "password": "Password123!",
  "aula": "2A",
  "numeroClase": 12,
  "cialProfesor": "CIAL-0001"
}
```

---

## 🛠️ 18. Módulos Internos / CRUDs Específicos

### Alérgenos de Producto (`/producto-alergenos`)

Permite gestionar la matriz de alérgenos de forma independiente.

- `GET`, `POST`, `PATCH`, `DELETE` sobre `/producto-alergenos`.

### Incidencias Resueltas (`/incidencias-resueltas`)

Histórico de incidencias que ya han sido procesadas.

- `GET`, `POST`, `PATCH`, `DELETE` sobre `/incidencias-resueltas`.

### Gestión Técnica de Recepciones (`/recepcion-productos`)

Control de líneas individuales de recepción.

- `GET`, `POST`, `PATCH`, `DELETE` sobre `/recepcion-productos`.

### Archivos (`/archivos`)

Gestión de ficheros subidos al sistema.

- `POST /archivos/upload`
- `GET /archivos`
- `GET /archivos/:id`
- `GET /archivos/content/:filename`
- `DELETE /archivos/:id`

### Incidencias (`/incidencias`)

CRUD completo y resolución operativa de incidencias.

- `GET`, `POST`, `PATCH`, `DELETE` sobre `/incidencias`
- `PATCH /incidencias/:id/resolver`
- `POST /incidencias/reportar`
- `POST /incidencias/:id/resolver`

### Exportación (`/export`)

Exportaciones binarias disponibles actualmente:

- Excel: `productos`, `pedidos`, `proveedores`, `albaranes`, `incidencias`, `inventario`, `movimientos`, `recepciones`, `recetas`, `ubicaciones`, `usuarios`
- PDF: `productos`, `proveedores`, `inventario`, `pedidos`, `albaranes`, `recetas`

---

## 🔍 Glosario de Campos Técnicos

- **`created_at` / `updated_at`**: Timestamps automáticos (timestamptz).
- **`version`**: Contador para **bloqueo optimista** (previene que un cambio pise a otro).
- **`deleted_at`**: El sistema usa **Borrado Lógico**. DELETE marca la fila como inactiva en lugar de borrarla.
