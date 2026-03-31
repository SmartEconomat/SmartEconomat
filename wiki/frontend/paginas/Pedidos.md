# Página: Pedidos

> **Ubicación:** `src/pages/Pedidos.tsx`

> **Referencia full-stack:** `wiki/modules/pedido/README.md`

## Propósito

La página centraliza la operativa de pedidos desde tres capas distintas del dominio:

- **Mis Pedidos**: agregado visible para el usuario (`PedidoUsuario`).
- **Pedidos**: vista semanal agrupada para operar sobre pedidos visibles y consolidarlos.
- **Compras**: lotes administrativos (`PurchaseBatch`) listos para recepción o seguimiento.

La pantalla no trabaja solo con una tabla; actúa como orquestador de filtros, borradores, consolidación, detalle y salto a recepción.

## Piezas principales

- **`PedidosPageHeader`**: búsqueda, acciones, conteo y selector de vista.
- **`PedidosTabs`**: tabs `Mis Pedidos`, `Pedidos`, `Compras`.
- **`PedidosTable`**: lista/tablero básico para la pestaña personal.
- **`PedidosWeeklyBoard`**: agrupación por semana y usuario con selección para consolidar.
- **`PurchasesWeeklyBoard`**: agrupación semanal de lotes de compra.
- **`DynamicFormModal`**: alta/edición con líneas `orderLines` y observaciones.
- **`PedidoDetailDrawer`**: detalle del pedido interno con PDF/impresión.
- **`PurchaseBatchDetailModal`**: detalle reutilizable de `PedidoUsuario` o `PurchaseBatch`.
- **`PedidoDraftBanner`** y modales de recuperación: UX de borradores persistidos.

## Hooks y utilidades clave

- **`usePedidosFilters()`**: persiste filtros en URL (`search`, `view`, `tab`, `ownStatus`).
- **`usePedidosData()`**: decide qué endpoint consumir según la pestaña activa.
- **`usePedidoActions()`**: encapsula guardar, cancelar, aprobar, restaurar, consolidar e iniciar recepción.
- **`usePedidoDraft()`**: autoguardado, carga, descarte y `flushSave()`.
- **`buildPedidoPermissions()`**: deriva permisos UI y rol especial para restauración.
- **`mapPedidoUsuarioToPedidoRow()`**: adapta `PedidoUsuario` a una fila reutilizable por la UI.

## Comportamiento por pestaña

### Mis Pedidos

- Carga `PedidoUsuario` del usuario autenticado.
- Si hay varias páginas en backend, `usePedidosData()` las consume y unifica en cliente para mostrar una sola vista.
- Aplica filtro visual local por estado:
	- `pendientes` → `PENDIENTE`
	- `en_proceso` → `EN_PROCESO` o `PARCIAL`
	- `finalizados` → `ENTREGADO` o `CANCELADO`

### Pedidos

- Agrupa por semana ISO y por usuario.
- Muestra selección por usuario/semana para consolidación.
- La selección opera sobre IDs agregados usando `getAggregatedPedidoSourceIds()`.

### Compras

- Muestra `PurchaseBatch` agrupados por semana de creación.
- Desde el detalle se puede descargar/imprimir PDF o lanzar recepción.

## Flujo funcional principal

1. El usuario crea o edita un pedido desde el modal.
2. Si el pedido es nuevo, el borrador se persiste automáticamente.
3. Al finalizar, backend crea un `PedidoUsuario`.
4. Backend separa automáticamente las líneas por proveedor en varios `Pedido` internos.
5. La UI consume ese agregado como una única fila visible.
6. Desde la vista semanal, uno o varios `PedidoUsuario` pueden consolidarse en una compra (`PurchaseBatch`).
7. Desde la pestaña `Compras`, un lote puede enviarse a recepción.
8. Recepción e incidencias siguen operando sobre los `Pedido` internos, pero la UI presenta el estado agregado.

## Gestión de borradores

- Al entrar, la página llama a `loadDraft()`.
- Si existe borrador y el usuario no ha sido avisado todavía, se abre el modal **Recuperar Pedido Pendiente**.
- Si el usuario crea un pedido nuevo teniendo borrador, se muestra una advertencia para evitar sobrescritura silenciosa.
- Al cerrar el modal de alta:
	- si no hay contenido, se cierra sin persistir,
	- si se cierra por backdrop, se hace `flushSave()`,
	- si hay contenido y cierre normal, se pregunta si guardar en borrador o descartar.

## Columnas visibles

| Columna | ID | Tipo | Descripción |
| :--- | :--- | :--- | :--- |
| N de pedido | `pedidoId` | Texto | Muestra `numeroGlobal` si existe; si no, usa formato abreviado. |
| Fecha Pedido | `fechaPedido` | Fecha | Fecha de emisión de la orden. |
| Fecha Entrega | `fechaEntrega` | Fecha | Fecha prevista de llegada (oculto en móvil). |
| Coste Total | `costeTotal` | Moneda | Importe acumulado de la compra. |
| Estado | `estado` | Chip | Estado logístico (Pendiente, Parcial, Recibido, etc.). |
| Creado Por | `usuario` | Texto | Nombre del comprador (oculto en móvil). |

## Acciones UI por estado

- `PENDIENTE`: puede aprobarse, cancelarse, editarse o, según el caso, consolidarse.
- `CANCELADO`: puede restaurarse si el usuario tiene permiso/rol.
- `EN_PROCESO` / `PARCIAL`: se muestran como seguimiento, sin edición de líneas.
- `INCIDENCIA`: el detalle muestra motivo, pero el flujo de resolución se gestiona fuera de esta página.

## Contratos relacionados

- `src/services/pedido.service.ts`
- `src/features/pedidos/hooks/usePedidosData.ts`
- `src/features/pedidos/hooks/usePedidoActions.ts`
- `src/features/pedidos/utils/pedidoColumns.tsx`
- `src/features/pedidos/utils/pedidoFormatters.ts`

## Nota de integración

La consolidación semanal del frontend sigue enviando `pedidoIds`, pero en realidad la vista selecciona IDs de `PedidoUsuario`. Backend lo tolera porque `PurchaseBatchService` hace fallback a `pedidoIds` si no recibe `pedidoUsuarioIds`. Funciona hoy, pero conviene tenerlo documentado para futuros endurecimientos del contrato.
