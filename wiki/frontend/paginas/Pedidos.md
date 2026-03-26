# Página: Pedidos

> **Ubicación:** `src/pages/Pedidos.tsx`

## Propósito

La página de Pedidos gestiona el ciclo completo de compra desde tres perspectivas distintas:

- **Mis Pedidos**: pedidos de negocio del usuario (`PedidoUsuario`).
- **Pedidos**: vista semanal/operativa de pedidos de negocio pendientes.
- **Compras**: lotes administrativos (`PurchaseBatch`) usados para consolidación y seguimiento de compras.

El objetivo es separar claramente el pedido visible para negocio del pedido interno por proveedor y del lote administrativo de compra.

## Componentes Utilizados

- **[PageToolbar](../componentes/PageToolbar.md)**: Encabezado con búsqueda de pedidos, Chip de conteo ("X pedidos registrados") y filtros rápidos. Incluye el selector de modo de vista (Lista/Grid).
- **[DataTable](../componentes/DataTable.md)**: Muestra los pedidos de forma tabular con soporte para visualización responsiva.
- **[StatusChip](../componentes/StatusChip.md)**: Indica el estado actual del pedido (Pendiente, Recibido, Cancelado, etc.).
- **[DynamicFormModal](../componentes/DynamicFormModal.md)**: Formulario avanzado para la gestión de líneas de pedido y selección de proveedores.
- **[ConfirmDialog](../componentes/ConfirmDialog.md)**: Validación para la cancelación de pedidos.
- **`PedidosWeeklyBoard`**: Vista agrupada por semana y usuario para revisar pedidos pendientes antes de consolidarlos.
- **`PurchaseBatchDetailModal`**: Modal reutilizable para detalle de `PurchaseBatch` y `PedidoUsuario`.
- **`BatchPedidoLineasViewer`**: Visor de líneas y pedidos internos, con soporte PDF según el modo.

## Funcionalidades Clave

- **Separación semántica**: `PedidoUsuario` se usa para negocio; `PurchaseBatch` queda reservado a compras consolidadas.
- **Sincronización de Vista**: El modo de vista (Lista/Grid) se sincroniza entre la cabecera y las tablas.
- **Consolidación semanal**: La vista semanal permite seleccionar pedidos y generar una compra consolidada enviando `pedidoUsuarioIds`.
- **Gestión multi-proveedor**: Un pedido de negocio puede descomponerse en varios pedidos internos por proveedor desde backend.
- **Seguimiento de Estado**: Los cambios en pedidos internos repercuten en el estado visible del pedido de negocio.
- **Numeración de negocio**: La lista muestra `numeroGlobal` bajo la columna **N de pedido**.
- **PDF por contexto**: Los pedidos de negocio descargan PDF desde `/pedido-usuarios/:id/pdf`; las compras desde `/purchase-batches/:id/pdf`.

## Flujo funcional

1. El usuario crea o edita un pedido desde el modal.
2. El borrador se persiste y, al finalizar, backend crea un `PedidoUsuario`.
3. Backend separa automáticamente las líneas por proveedor en varios `Pedido` internos.
4. La UI consume ese agregado como una única fila visible.
5. Desde la vista semanal, uno o varios `PedidoUsuario` pueden consolidarse en una compra (`PurchaseBatch`).
6. Recepción e incidencias siguen operando sobre los `Pedido` internos, pero la UI sincroniza el estado del agregado.

## Estructura de Datos (Columnas)

| Columna | ID | Tipo | Descripción |
| :--- | :--- | :--- | :--- |
| N de pedido | `pedidoId` | Texto | Muestra `numeroGlobal` si existe; usa UUID abreviado como fallback. |
| Fecha Pedido | `fechaPedido` | Fecha | Fecha de emisión de la orden. |
| Fecha Entrega | `fechaEntrega` | Fecha | Fecha prevista de llegada (oculto en móvil). |
| Coste Total | `costeTotal` | Moneda | Importe acumulado de la compra. |
| Estado | `estado` | Chip | Estado logístico (Pendiente, Parcial, Recibido, etc.). |
| Creado Por | `usuario` | Texto | Nombre del comprador (oculto en móvil). |

## Estados visibles

- `pendiente`: pedido de negocio recién creado.
- `en_proceso`: al menos uno de sus pedidos internos está en curso, parcial o recibido.
- `entregado`: todos los pedidos internos han terminado en recepción satisfactoria o cancelación compatible.
- `cancelado`: todos los pedidos internos han sido cancelados.

## Contratos frontend relacionados

- `src/services/pedido.service.ts`
- `src/features/pedidos/hooks/usePedidosData.ts`
- `src/features/pedidos/hooks/usePedidoActions.ts`
- `src/features/pedidos/utils/pedidoColumns.tsx`
- `src/features/pedidos/utils/pedidoFormatters.ts`
