# API de Compras, Recepciones e Incidencias

Este bloque agrupa los endpoints usados para convertir necesidad de compra en pedido, consolidarla en lotes, recepcionar mercancía, gestionar borradores y resolver discrepancias documentales o de stock.

## Entidades relacionadas

- `PedidoUsuario`
- `PedidoUsuarioLinea`
- `Pedido`
- `PedidoProducto`
- `PurchaseBatch`
- `PedidoDraft`
- `Recepcion`
- `RecepcionPedido`
- `RecepcionProducto`
- `RecepcionDraft`
- `Incidencia`
- `IncidenciaLinea`
- `IncidenciaResuelta`
- `Albaran`

Detalle de datos y relaciones: [../entidades.md](../entidades.md).

## Pedidos a proveedor (`/pedidos`)

Campos clave del agregado `pedido`: `fechaPedido`, `estado`, `costeTotal` y, según flujo, `usuarioId`, `proveedorId`, `batchId`, `pedidoUsuarioId`, `fechaEntrega`, `observaciones`, `motivoCancelacion`, `motivoIncidencia`.

| Endpoint | Para qué sirve | Qué enviar | Qué devuelve |
| --- | --- | --- | --- |
| `POST /pedidos` | Crear un pedido de compra directo | `CreatePedidoDto` con proveedor, fechas, observaciones y líneas | Un `Pedido` |
| `GET /pedidos` | Listar pedidos | Query de paginación, orden y filtros publicados por el módulo | Página de pedidos |
| `POST /pedidos/from-recipes` | Generar pedido desde recetas | `GeneratePedidoFromRecetasDto` con recetas y cantidades/raciones | Un `Pedido` generado desde necesidad culinaria |
| `GET /pedidos/:id` | Ver detalle de pedido | UUID v7 por path | Un `Pedido` |
| `PATCH /pedidos/:id` | Editar pedido | UUID v7 + `UpdatePedidoDto` | `Pedido` actualizado |
| `PATCH /pedidos/:id/fecha-entrega` | Cambiar solo la fecha de entrega | UUID v7 + DTO con `fechaEntrega` | `Pedido` actualizado |
| `PATCH /pedidos/:id/cancelar` | Cancelar pedido con motivo | UUID v7 + `CancelPedidoDto` | `Pedido` cancelado |
| `PATCH /pedidos/:id/aceptar` | Aceptar pedido y avanzar estado | UUID v7 por path | `Pedido` aceptado |
| `PATCH /pedidos/:id/restaurar` | Restaurar pedido cancelado/eliminado lógicamente | UUID v7 por path | `Pedido` restaurado |
| `DELETE /pedidos/:id` | Eliminar pedido | UUID v7 por path | `204 No Content` |

## Pedidos de usuario agregados (`/pedido-usuarios`)

Campos clave de `pedido_usuario`: `numeroGlobal`, `fechaPedido`, `estado`, `costeTotal`, `usuarioId`, `fechaEntrega`, `observaciones` y líneas `pedido_usuario_linea`.

| Endpoint | Para qué sirve | Qué enviar | Qué devuelve |
| --- | --- | --- | --- |
| `POST /pedido-usuarios` | Crear un pedido de usuario completo | `CreatePedidoUsuarioDto` | Un `PedidoUsuario` |
| `POST /pedido-usuarios/from-missing-stock` | Crear pedido agregado desde faltas detectadas en stock | `CreateMissingStockBatchDto` | `PedidoUsuario` construido desde faltantes |
| `POST /pedido-usuarios/from-recipes` | Crear pedido agregado desde recetas | `GeneratePedidoFromRecetasDto` | `PedidoUsuario` generado |
| `GET /pedido-usuarios` | Listar pedidos de usuario | Query `PedidoUsuarioQueryDto` con paginación, orden y filtros | Página de `PedidoUsuario` |
| `GET /pedido-usuarios/:id` | Ver detalle | UUID v7 por path | Un `PedidoUsuario` |
| `PATCH /pedido-usuarios/:id` | Editar agregado o sus líneas | UUID v7 + `UpdatePedidoUsuarioDto` | `PedidoUsuario` actualizado |
| `PATCH /pedido-usuarios/:id/aceptar` | Aceptar el pedido agregado | UUID v7 por path | `PedidoUsuario` aceptado |
| `PATCH /pedido-usuarios/:id/cancelar` | Cancelar con motivo | UUID v7 + `CancelPedidoUsuarioDto` | `PedidoUsuario` cancelado |
| `PATCH /pedido-usuarios/:id/restaurar` | Restaurar pedido cancelado | UUID v7 por path | `PedidoUsuario` restaurado |
| `GET /pedido-usuarios/:id/pdf` | Descargar PDF del agregado | UUID v7 y query opcional `incluirCancelados`, `paginaPorProveedor` | PDF binario |
| `DELETE /pedido-usuarios/:id` | Eliminar agregado | UUID v7 por path | `204 No Content` |

### Cuándo usar `pedido-usuarios` y cuándo `pedidos`

- `pedido-usuarios` modela la necesidad agregada del centro o del usuario solicitante.
- `pedidos` modela la compra concreta ya separada por proveedor o fase de tramitación.

## Lotes de compra (`/purchase-batches`)

El `purchase_batch` agrupa pedidos para tratarlos como una unidad operativa de compra.

| Endpoint | Para qué sirve | Qué enviar | Qué devuelve |
| --- | --- | --- | --- |
| `POST /purchase-batches` | Crear lote de compra | `CreatePurchaseBatchDto` | Lote de compra creado |
| `POST /purchase-batches/from-missing-stock` | Crear lote desde stock faltante | `CreateMissingStockBatchDto` | Lote generado |
| `POST /purchase-batches/from-recipes` | Crear lote desde recetas | `GeneratePedidoFromRecetasDto` | Lote generado |
| `POST /purchase-batches/consolidate` | Consolidar pedidos existentes en un único lote | `ConsolidatePurchaseBatchDto` | Lote consolidado |
| `GET /purchase-batches` | Listar lotes | No suele llevar body; aplica filtros propios del servicio si existieran | Lista de lotes |
| `GET /purchase-batches/:id` | Ver lote | UUID v7 por path | Un lote de compra |
| `PATCH /purchase-batches/:id` | Editar lote | UUID v7 + `UpdatePurchaseBatchDto` | Lote actualizado |
| `PATCH /purchase-batches/:id/tramitar` | Marcar lote como tramitado/procesado | UUID v7 por path | Lote con estado avanzado |
| `PATCH /purchase-batches/:id/aceptar` | Aprobar lote | UUID v7 por path | Lote aceptado |
| `PATCH /purchase-batches/:id/cancelar` | Cancelar lote con motivo | UUID v7 + `CancelPurchaseBatchDto` | Lote cancelado |
| `PATCH /purchase-batches/:id/restaurar` | Restaurar lote cancelado | UUID v7 por path | Lote restaurado |
| `GET /purchase-batches/:id/pdf` | Descargar PDF del lote | UUID v7 y query opcional `incluirCancelados`, `paginaPorProveedor` | PDF binario |

## Borrador de pedido (`/pedido/draft`)

Este recurso anidado existe para persistir el trabajo del usuario mientras compone un pedido complejo.

| Endpoint | Para qué sirve | Qué enviar | Qué devuelve |
| --- | --- | --- | --- |
| `POST /pedido/draft` | Crear o actualizar borrador | `UpsertPedidoDraftDto` con el estado parcial del pedido | `PedidoDraftResponseDto` |
| `GET /pedido/draft` | Recuperar borrador más reciente | No lleva body | Borrador actual o `null` |
| `DELETE /pedido/draft` | Limpiar borrador activo | No lleva body | `204 No Content` |
| `POST /pedido/draft/finalize` | Finalizar el pedido desde el borrador guardado | No lleva body; usa el borrador persistido del usuario | `PedidoUsuario` creado |

## Recepciones (`/recepciones`)

Campos clave de `recepcion`: `fechaRecepcion`, `estado`, `incidencia`, `usuarioId`, `observaciones`.

| Endpoint | Para qué sirve | Qué enviar | Qué devuelve |
| --- | --- | --- | --- |
| `POST /recepciones` | Procesar una recepción completa y sus efectos en stock | `CreateRecepcionDto` con pedido(s), líneas recibidas, estados y observaciones | `RecepcionResultadoDto` |
| `GET /recepciones` | Listar recepciones | Query de paginación y orden | Página de recepciones |
| `GET /recepciones/reporte-pdf` | Descargar reporte PDF de recepciones | Query `RecepcionReportePdfDto` con filtros y opciones de salida | PDF binario |
| `GET /recepciones/:id` | Ver recepción concreta | UUID v7 por path | Una `Recepcion` |
| `PATCH /recepciones/:id` | Editar recepción | UUID v7 + `UpdateRecepcionDto` | `Recepcion` actualizada |
| `DELETE /recepciones/:id` | Eliminar recepción | UUID v7 por path | `204 No Content` |

## Líneas de recepción (`/recepcion-productos`)

Campos clave de `recepcion_producto`: `recepcionId`, `pedidoProductoId`, `cantidadRecibida`, `estadoProducto`, `fechaRecepcion`, `incidenciaId`, `observaciones`.

| Endpoint | Para qué sirve | Qué enviar | Qué devuelve |
| --- | --- | --- | --- |
| `POST /recepcion-productos` | Crear línea de recepción manual o complementaria | `CreateRecepcionProductoDto` | `RecepcionProducto` creado |
| `GET /recepcion-productos` | Listar líneas | Query de paginación y orden | Página de `RecepcionProducto` |
| `GET /recepcion-productos/:id` | Ver línea concreta | UUID v7 por path | Una `RecepcionProducto` |
| `PATCH /recepcion-productos/:id` | Editar línea | UUID v7 + `UpdateRecepcionProductoDto` | `RecepcionProducto` actualizado |
| `DELETE /recepcion-productos/:id` | Eliminar línea | UUID v7 por path | `204 No Content` |

## Borrador de recepción (`/recepcion/draft`)

| Endpoint | Para qué sirve | Qué enviar | Qué devuelve |
| --- | --- | --- | --- |
| `POST /recepcion/draft` | Crear o actualizar borrador de recepción | `UpsertRecepcionDraftDto` | `RecepcionDraftResponseDto` |
| `GET /recepcion/draft` | Recuperar borrador vigente | No lleva body | Borrador actual o `null` |
| `DELETE /recepcion/draft` | Limpiar borrador | No lleva body | `204 No Content` |

## Incidencias (`/incidencias`)

Campos clave de `incidencia`: `recepcionId`, `pedidoId`, `usuarioResolutorId`, `observacionesRecepcion`, `observacionesResolucion`, `fechaResolucion`, además de las líneas afectadas.

| Endpoint | Para qué sirve | Qué enviar | Qué devuelve |
| --- | --- | --- | --- |
| `POST /incidencias` | Crear incidencia manual | `CreateIncidenciaDto` | Una `Incidencia` |
| `GET /incidencias` | Listar incidencias | `IncidenciaQueryDto` en query | Página de incidencias |
| `GET /incidencias/:id` | Ver incidencia | UUID v7 por path | Una `Incidencia` |
| `PATCH /incidencias/:id` | Editar incidencia | UUID v7 + `UpdateIncidenciaDto` | `Incidencia` actualizada |
| `DELETE /incidencias/:id` | Eliminar incidencia | UUID v7 por path | `204 No Content` |
| `POST /incidencias/reportar` | Crear incidencia ya vinculada a una recepción desde el flujo operativo | `ReportIncidenciaDto` | Incidencia reportada |
| `PATCH /incidencias/:id/resolver` | Resolver incidencia existente con el flujo estándar | UUID v7 + `ResolverIncidenciaDto` | `Incidencia` resuelta |
| `POST /incidencias/:id/resolver` | Resolver de forma transaccional cuando la resolución implica más efectos laterales | UUID v7 + `ResolveIncidenciaDto` | `Incidencia` resuelta con operación transaccional |

### Diferencia entre las dos rutas de resolución

- `PATCH /:id/resolver` sirve para la resolución directa del agregado ya existente.
- `POST /:id/resolver` existe cuando la resolución necesita modelarse como acción transaccional explícita.

## Incidencias resueltas (`/incidencias-resueltas`)

| Endpoint | Para qué sirve | Qué enviar | Qué devuelve |
| --- | --- | --- | --- |
| `POST /incidencias-resueltas` | Crear un registro de cierre | DTO de creación del cierre | Registro creado |
| `GET /incidencias-resueltas` | Listar cierres | Query de paginación del módulo | Página o lista de cierres |
| `GET /incidencias-resueltas/:id` | Ver cierre concreto | UUID v7 por path | Un cierre de incidencia |
| `PATCH /incidencias-resueltas/:id` | Corregir cierre | UUID v7 + DTO parcial | Cierre actualizado |
| `DELETE /incidencias-resueltas/:id` | Eliminar cierre | UUID v7 por path | `204 No Content` |

## Albaranes (`/albaranes`)

El albarán es el documento físico o digital que acompaña a la entrega. Puede llevar documento adjunto.

| Endpoint | Para qué sirve | Qué enviar | Qué devuelve |
| --- | --- | --- | --- |
| `POST /albaranes` | Crear albarán | `CreateAlbaranDto` con referencia, fecha y vínculos necesarios | Un `Albaran` |
| `POST /albaranes/upload-documento` | Subir foto o PDF del albarán | `multipart/form-data` con `file`, `numeroReferencia` y opcional `recepcionId`, `observaciones` | Mensaje + `Albaran` actualizado |
| `GET /albaranes/documento/:filename` | Descargar el binario asociado | Nombre de fichero por path | Archivo binario |
| `GET /albaranes` | Listar albaranes | Query de paginación y orden | Página de albaranes |
| `GET /albaranes/:id` | Ver detalle | UUID v7 por path | Un `Albaran` |
| `PATCH /albaranes/:id` | Editar albarán | UUID v7 + `UpdateAlbaranDto` | `Albaran` actualizado |
| `DELETE /albaranes/:id` | Eliminar albarán | UUID v7 por path | `204 No Content` |

## Distribuciones (`/distribuciones`)

Este bloque enlaza inventario y pedidos de usuario cuando el stock se reparte o se confirma operativamente.

| Endpoint | Para qué sirve | Qué enviar | Qué devuelve |
| --- | --- | --- | --- |
| `GET /distribuciones` | Listar distribuciones | Query de paginación | Página de distribuciones |
| `GET /distribuciones/disponibles` | Listar pedidos de usuario distribuibles | Query de paginación | Lista de candidatos a distribución |
| `GET /distribuciones/:id` | Ver distribución | UUID v7 por path | Detalle de distribución |
| `POST /distribuciones` | Preparar distribución | `CreateDistribucionDto` | Distribución preparada |
| `PATCH /distribuciones/:id/confirmar` | Confirmar distribución y mover stock | UUID v7 por path | Distribución confirmada |
| `PATCH /distribuciones/:id/cancelar` | Cancelar distribución no confirmada | UUID v7 + `CancelDistribucionDto` | Distribución cancelada |

## Reglas prácticas para integrar este bloque

- Usa borradores cuando el usuario pueda abandonar o reanudar un flujo complejo.
- Usa transiciones dedicadas (`aceptar`, `cancelar`, `restaurar`, `confirmar`, `tramitar`) en lugar de intentar mutar estados con un `PATCH` genérico.
- Si el flujo afecta stock real, la recepción o la distribución deben ser la fuente funcional de verdad, no un ajuste aislado.