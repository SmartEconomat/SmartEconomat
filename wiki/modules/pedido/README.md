# Módulo de Pedidos

## Objetivo

El sistema de pedidos de SmartEconomat separa tres conceptos de negocio que comparten pantalla pero no representan la misma entidad:

- `PedidoUsuario`: agregado visible para negocio y para el usuario que solicita la compra.
- `Pedido`: pedido interno por proveedor sobre el que realmente operan recepción, incidencias y movimientos.
- `PurchaseBatch`: lote administrativo que agrupa varios `PedidoUsuario` ya aprobados para tramitar una compra semanal o consolidada.

Esta separación permite:

- crear un pedido único desde la UI aunque intervengan varios proveedores,
- mantener trazabilidad operativa por proveedor,
- consolidar compras semanales sin perder el origen,
- recepcionar sobre pedidos internos sin romper la vista agregada de negocio.

---

## Modelo funcional

### 1. `PedidoUsuario`

Representa el pedido “visible” en la pestaña **Mis Pedidos** y en la vista semanal.

- Se crea desde `POST /pedido-usuarios`.
- Guarda sus propias `lineas` agregadas.
- Se descompone automáticamente en varios `Pedido` internos según el proveedor de cada línea.
- Su estado se recalcula en función del estado de esos pedidos internos.

### 2. `Pedido`

Es la unidad operativa real por proveedor.

- Cada `Pedido` pertenece a un proveedor concreto.
- Puede estar vinculado a un `pedidoUsuarioId` o a un `batchId`.
- Es la entidad que cambia de estado por aceptación, recepción, incidencia o cancelación.
- Es también la entidad que se usa para movimientos, recepciones e incidencias.

### 3. `PurchaseBatch`

Es un lote de compra administrativa.

- Agrupa pedidos internos ya seleccionados para tramitación conjunta.
- Se expone en la pestaña **Compras**.
- Puede iniciarse directamente en recepción.
- Su estado se sincroniza automáticamente a partir de los `Pedido` hijos.

---

## Flujo end-to-end

### Crear pedido desde la UI

1. El usuario abre `frontend/.../src/pages/Pedidos.tsx`.
2. La UI compone un formulario con líneas multi-proveedor.
3. El borrador se persiste con `usePedidoDraft()`.
4. Al guardar, el frontend llama a `createPedidoUsuario()`.
5. Backend crea un `PedidoUsuario` y genera uno o varios `Pedido` internos usando `buildPedidoAggregate()`.
6. La UI vuelve a listar ese agregado como una única fila visible.

### Aprobar pedido visible

1. La UI aprueba un `PedidoUsuario` vía `PATCH /pedido-usuarios/:id/aceptar`.
2. Backend cambia todos los `Pedido` hijos a `EN_PROCESO`.
3. `PedidoUsuarioService.syncPedidoUsuarioStatus()` recalcula el estado agregado.

### Consolidación semanal

1. La vista semanal selecciona filas agregadas de `PedidoUsuario`.
2. Front llama a `POST /purchase-batches/consolidate`.
3. Backend crea un `PurchaseBatch` y asigna los `Pedido` hijos al lote.
4. Los `PedidoUsuario` consolidados pasan a `EN_PROCESO`.

### Recepción

1. Desde la pestaña **Compras**, la UI lanza recepción sobre un `PurchaseBatch`.
2. Se genera un borrador de recepción con `mapPurchaseBatchToRecepcionDraft()`.
3. La pantalla `Recepcion.tsx` procesa líneas reales de `Pedido`.
4. Los estados de `Pedido`, `PedidoUsuario` y `PurchaseBatch` se sincronizan aguas arriba.

---

## Backend

### Endpoints principales

#### `pedidos`

| Método | Ruta | Uso |
|---|---|---|
| `POST` | `/pedidos` | Crear pedido interno directo |
| `GET` | `/pedidos` | Listar pedidos internos paginados |
| `POST` | `/pedidos/from-recipes` | Crear pedido interno desde recetas |
| `GET` | `/pedidos/:id` | Ver detalle de pedido interno |
| `PATCH` | `/pedidos/:id` | Editar pedido interno |
| `PATCH` | `/pedidos/:id/cancelar` | Cancelar pedido interno |
| `PATCH` | `/pedidos/:id/aceptar` | Pasar a `EN_PROCESO` |
| `PATCH` | `/pedidos/:id/restaurar` | Restaurar desde `CANCELADO` |
| `DELETE` | `/pedidos/:id` | Borrado lógico si sigue en estado editable |

#### `pedido-usuarios`

| Método | Ruta | Uso |
|---|---|---|
| `POST` | `/pedido-usuarios` | Crear pedido visible de negocio |
| `GET` | `/pedido-usuarios` | Listar agregados paginados |
| `GET` | `/pedido-usuarios/:id` | Ver agregado completo |
| `PATCH` | `/pedido-usuarios/:id` | Editar agregado pendiente |
| `PATCH` | `/pedido-usuarios/:id/aceptar` | Aprobar agregado |
| `PATCH` | `/pedido-usuarios/:id/cancelar` | Cancelar agregado |
| `PATCH` | `/pedido-usuarios/:id/restaurar` | Restaurar agregado |
| `GET` | `/pedido-usuarios/:id/pdf` | PDF del pedido visible |

#### `purchase-batches`

| Método | Ruta | Uso |
|---|---|---|
| `POST` | `/purchase-batches` | Crear lote directo multi-proveedor |
| `POST` | `/purchase-batches/from-missing-stock` | Crear lote desde faltantes de producción |
| `POST` | `/purchase-batches/from-recipes` | Crear lote desde recetas |
| `GET` | `/purchase-batches` | Listar lotes |
| `POST` | `/purchase-batches/consolidate` | Consolidar pedidos visibles en lote |
| `GET` | `/purchase-batches/:id` | Detalle de lote |
| `PATCH` | `/purchase-batches/:id` | Editar lote pendiente |
| `PATCH` | `/purchase-batches/:id/aceptar` | Aprobar lote |
| `PATCH` | `/purchase-batches/:id/cancelar` | Cancelar lote |
| `PATCH` | `/purchase-batches/:id/restaurar` | Restaurar líneas canceladas |
| `GET` | `/purchase-batches/:id/pdf` | PDF del lote |

### Servicios clave

- `PedidoService`: CRUD y transiciones de `Pedido`.
- `PedidoUsuarioService`: creación del agregado visible, edición controlada y sincronización de estado.
- `PurchaseBatchService`: creación de lotes, consolidación y sincronización de estado del lote.
- `PedidoDraftService`: persistencia de borradores antes de finalizar el pedido visible.
- `RecetaToPedidoService`: genera pedidos o lotes a partir de recetas.

### Reglas de negocio relevantes

#### Reglas de edición

- Un `Pedido` solo se elimina si está en `PENDIENTE` o `CANCELADO`.
- Un `Pedido` solo se cancela si sigue en `PENDIENTE` y sin recepciones.
- Un `PedidoUsuario` solo se edita si está en `PENDIENTE` y todos sus `Pedido` hijos siguen pendientes.
- Un `PurchaseBatch` solo se edita si todos sus `Pedido` hijos siguen pendientes.
- Las líneas con referencias en `RecepcionProducto` o `IncidenciaLinea` no pueden borrarse.

#### Reglas de agregación por proveedor

- La UI puede enviar líneas de distintos proveedores en una sola acción.
- Backend agrupa las líneas por `proveedorId` y genera un `Pedido` interno por proveedor.
- `PedidoUsuario.costeTotal` se calcula como suma de todas las líneas agregadas.

#### Reglas de estado agregado

`PedidoUsuarioService.calculateAggregateStatus()` aplica estas reglas:

- sin hijos → `PENDIENTE`
- todos cancelados → `CANCELADO`
- todos en `RECIBIDO` o `CANCELADO` → `ENTREGADO`
- si alguno está en `EN_PROCESO`, `PARCIAL`, `RECIBIDO` o `INCIDENCIA` → `EN_PROCESO`
- en cualquier otro caso → `PENDIENTE`

`PurchaseBatchService.syncBatchStatus()` delega en `PurchaseBatch.calcularEstadoLote(...)` para recalcular el estado del lote desde los pedidos internos.

---

## Frontend

### Orquestación principal

La pantalla principal vive en `frontend/smart-economat-frontend/src/pages/Pedidos.tsx`.

Responsabilidades:

- controlar pestañas, búsqueda y modo de vista,
- cargar datos según contexto,
- gestionar modales de detalle, aprobación, cancelación y restauración,
- manejar borradores de alta,
- lanzar consolidación semanal y salto a recepción.

### Pestañas

`PedidosTabs.tsx` define tres vistas:

- **Mis Pedidos** (`tabIndex = 0`): lista del `PedidoUsuario` del usuario actual.
- **Pedidos** (`tabIndex = 1`): agrupación semanal de pedidos visibles para operación.
- **Compras** (`tabIndex = 2`): lotes `PurchaseBatch`.

### Hooks clave

- `usePedidosFilters()`: persiste filtros en query params (`search`, `view`, `tab`, `ownStatus`).
- `usePedidosData()`: cambia entre `fetchPedidoUsuarios()` y `fetchPurchaseBatches()` según la pestaña.
- `usePedidoActions()`: encapsula alta, edición, cancelación, aprobación, restauración y consolidación.
- `usePedidoDraft()`: autoguardado con debounce, flush explícito y carga del último borrador.

### Mapping frontend ↔ backend

La tabla principal no renderiza `Pedido` crudo en “Mis Pedidos”; consume `PedidoUsuario` transformado por `mapPedidoUsuarioToPedidoRow()`:

- `aggregateType = 'pedido_usuario'`
- `proveedor.nombre` se sintetiza como resumen de proveedores
- `pedidoProductos` se aplana desde los pedidos internos

Esto permite reutilizar columnas, tarjetas y acciones con una sola interfaz visual.

### Permisos UI

`buildPedidoPermissions()` deriva:

- `canCreate`
- `canEdit`
- `canDelete`
- `canCancel`
- `canApprove`
- `canRestore`

`canRestore` se habilita también por rol (`ADMINISTRADOR`, `SUPER_ADMIN`, `PROFESOR`) aunque no llegue explícitamente como permiso fino.

### Borradores

`usePedidoDraft()`:

- carga el último borrador al entrar,
- autoguarda tras 1 segundo de inactividad,
- evita sobrescribir si el payload no cambió,
- resuelve conflictos usando `version` del borrador,
- permite `flushSave()` al cerrar por backdrop.

---

## Integración con recepción

La relación entre pedidos y recepción es intencionalmente asimétrica:

- la solicitud visible se hace sobre `PedidoUsuario`,
- la tramitación administrativa se hace sobre `PurchaseBatch`,
- la recepción real se hace sobre `Pedido` y sus líneas.

El frontend convierte un lote a borrador de recepción mediante `mapPurchaseBatchToRecepcionDraft()` y navega a `/recepcion`.

La pantalla `Recepcion.tsx`:

- sigue permitiendo búsqueda/escaneo,
- consume `fetchPedidos()` para ciertos flujos de selección,
- puede usar cámara (`BarcodeScanner`) y báscula (`Web Serial`) en pasos de escaneo y revisión.

---

## Matices de contrato a tener en cuenta

### Consolidación semanal

Actualmente el frontend llama a `consolidatePurchaseBatch({ pedidoIds })`, pero en la vista semanal esos IDs representan `PedidoUsuario` agregados.

Backend lo soporta porque `PurchaseBatchService.consolidateExistingOrders()` usa:

```ts
const uniquePedidoUsuarioIds = Array.from(
  new Set(dto.pedidoUsuarioIds || dto.pedidoIds || [])
);
```

Es decir: hoy existe compatibilidad por fallback, pero a nivel semántico sería más claro converger en `pedidoUsuarioIds` cuando se quiera endurecer el contrato.

### Estados visibles del frontend

El frontend usa `EstadoPedido` también para pintar `PedidoUsuario` agregados. Eso simplifica la UI, pero hay una diferencia conceptual real con `EstadoPedidoUsuario` del backend.

### PDF por contexto

- `Pedido` → `/pedidos/:id/pdf`
- `PedidoUsuario` → `/pedido-usuarios/:id/pdf`
- `PurchaseBatch` → `/purchase-batches/:id/pdf`

Los modales de detalle ya seleccionan el endpoint correcto según el modo.

---

## Ficheros clave

### Backend

- `backend/smart-economat-backend/src/modules/pedido/controller/pedido.controller.ts`
- `backend/smart-economat-backend/src/modules/pedido/controller/pedido-usuario.controller.ts`
- `backend/smart-economat-backend/src/modules/pedido/controller/purchase-batch.controller.ts`
- `backend/smart-economat-backend/src/modules/pedido/service/pedido.service.ts`
- `backend/smart-economat-backend/src/modules/pedido/service/pedido-usuario.service.ts`
- `backend/smart-economat-backend/src/modules/pedido/service/purchase-batch.service.ts`

### Frontend

- `frontend/smart-economat-frontend/src/pages/Pedidos.tsx`
- `frontend/smart-economat-frontend/src/services/pedido.service.ts`
- `frontend/smart-economat-frontend/src/features/pedidos/hooks/usePedidosData.ts`
- `frontend/smart-economat-frontend/src/features/pedidos/hooks/usePedidoActions.ts`
- `frontend/smart-economat-frontend/src/features/pedidos/utils/pedidoOwnOrders.ts`
- `frontend/smart-economat-frontend/src/features/pedidos/components/PedidosWeeklyBoard.tsx`

---

## Documentos relacionados

- `wiki/frontend/paginas/Pedidos.md`
- `wiki/modules/pedido/pedidos-desde-recetas.md`
- `wiki/modules/recepcion/recepcion-masiva.md`

## Notas

Incluye prácticas recomendadas y ejemplos de integración con Recepción y Compras para evitar inconsistencias entre agregados visibles, pedidos internos y lotes de compra.

## Resumen operativo

### `PedidoUsuario`
- Se crea desde borradores y desde la UI principal de pedidos.
- Tiene `numeroGlobal` como numeración de negocio.
- Puede contener múltiples proveedores sin que el usuario vea varias filas separadas.

### `Pedido`
- Se genera automáticamente al persistir un `PedidoUsuario`.
- Mantiene la trazabilidad real con recepciones, incidencias, PDF de recepción y movimientos.

### `PurchaseBatch`
- Solo se usa cuando negocio o administración consolida varios `PedidoUsuario` en una compra semanal.
- No sustituye al pedido de negocio ni aparece como entidad principal en “Mis pedidos”.
