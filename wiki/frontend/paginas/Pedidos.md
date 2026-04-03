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

- **[PageToolbar](../componentes/PageToolbar.md)**: Encabezado con búsqueda de pedidos, Chip de conteo ("X pedidos registrados") y filtros rápidos. Incluye el selector de modo de vista (Lista/Grid).
- **[DataTable](../componentes/DataTable.md)**: Muestra los pedidos de forma tabular con soporte para visualización responsiva.
- **[StatusChip](../componentes/StatusChip.md)**: Indica el estado actual del pedido (`PENDIENTE_DE_APROBACION`, `POR_RECEPCIONAR`, `PARCIAL`, `RECEPCIONADO`, `INCIDENCIA`, `CANCELADO`).
- **[DynamicFormModal](../componentes/DynamicFormModal.md)**: Formulario avanzado para la gestión de líneas de pedido y selección de proveedores.
- **[ConfirmDialog](../componentes/ConfirmDialog.md)**: Validación para la cancelación de pedidos.
- **`PedidosWeeklyBoard`**: Vista agrupada por semana y usuario para revisar pedidos pendientes antes de consolidarlos.
- **`PurchaseBatchDetailModal`**: Modal reutilizable para detalle de `PurchaseBatch` y `PedidoUsuario`.
- **`BatchPedidoLineasViewer`**: Visor de líneas y pedidos internos, con soporte PDF según el modo.

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
- Utiliza **`MisPedidosStatusTabs`** para filtrar visualmente por estado:
	- ⏳ `pendientes` → `PENDIENTE`
	- 🔄 `en_proceso` → `EN_PROCESO` o `PARCIAL`
	- ✅ `finalizados` → `ENTREGADO` o `CANCELADO`

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
| Estado | `estado` | Chip | Estado logístico (`pendiente_de_aprobacion`, `por_recepcionar`, `parcial`, `recepcionado`, `incidencia`, `cancelado`). |
| Creado Por | `usuario` | Texto | Nombre del comprador (oculto en móvil). |

## Acciones UI por estado

- `pendientes`: aplica filtro de `PENDIENTE_DE_APROBACION`.
- `activos`: aplica filtro de `POR_RECEPCIONAR` y `PARCIAL`.
- `finalizados`: aplica filtro de `RECEPCIONADO` y `CANCELADO`.

## Contratos relacionados

- `src/services/pedido.service.ts`
- `src/features/pedidos/hooks/usePedidosData.ts`
- `src/features/pedidos/hooks/usePedidoActions.ts`
- `src/features/pedidos/utils/pedidoColumns.tsx`
- `src/features/pedidos/utils/pedidoFormatters.ts`

## Nota de integración

La consolidación semanal del frontend sigue enviando `pedidoIds`, pero en realidad la vista selecciona IDs de `PedidoUsuario`. Backend lo tolera porque `PurchaseBatchService` hace fallback a `pedidoIds` si no recibe `pedidoUsuarioIds`. Funciona hoy, pero conviene tenerlo documentado para futuros endurecimientos del contrato.
