# Estados del negocio

Referencia canónica de los estados, chips y badges que aparecen en los flujos de pedidos, recepciones, incidencias, distribución, preparación y usuarios.

> [!IMPORTANT]
> Los contratos del backend son la fuente de verdad. El frontend debe pintar estos estados tal y como llegan desde la API, sin renombrarlos ni inferir significados distintos.

## Qué cubre este documento

Este documento explica:

- qué significa cada estado dentro de la aplicación;
- qué entidad lo persiste o lo calcula;
- qué estados son operativos y cuáles son internos;
- qué diferencias existen entre estados parecidos que no representan lo mismo.

## Convenciones rápidas

- Los estados de negocio pueden estar en minúsculas con `snake_case` o en `UPPER_SNAKE_CASE`, según el módulo.
- Algunos estados son persistidos en base de datos y otros se calculan en servicios para serialización de respuesta.
- No todos los enums de este documento son chips visibles en UI, pero todos forman parte del contrato funcional.

## Pedidos

### `EstadoPedido`

Estado del pedido interno por proveedor.

| Estado | Significado | Uso típico |
|---|---|---|
| `PENDIENTE_DE_APROBACION` | Pedido creado pero todavía no aceptado por el flujo operativo. | Estado inicial del pedido interno. |
| `POR_RECEPCIONAR` | Pedido aceptado y pendiente de ser recepcionado. | Aparece cuando el pedido ya entró en tramitación. |
| `PARCIAL` | Ya se ha recepcionado una parte, pero el pedido aún no está cerrado. | Se usa cuando la recepción no cubre toda la cantidad esperada. |
| `RECEPCIONADO` | Todo lo esperado ha sido recibido correctamente. | Estado final compatible con cierre normal. |
| `INCIDENCIA` | La recepción detectó discrepancias que requieren resolución. | Flujo con incidencias asociadas. |
| `CANCELADO` | El pedido se cerró sin seguir avanzando en el flujo normal. | Estado terminal. |

### `EstadoPedidoUsuario`

Estado del agregado visible `PedidoUsuario`.

| Estado | Significado |
|---|---|
| `BORRADOR` | El pedido aún está en fase de edición o preparación temporal. |
| `PENDIENTE` | El agregado existe, pero todavía no ha avanzado al flujo operativo completo. |
| `APROBADO` | El agregado fue validado y puede continuar su tramitación. |
| `CONSOLIDADO` | El pedido de usuario ya forma parte de una consolidación de compras. |
| `CANCELADO` | El agregado quedó fuera del flujo operativo. |

> [!NOTE]
> En la UI principal, la vista agregada suele mostrarse con chips derivados del flujo de `EstadoPedido` para mantener consistencia visual entre agregado e internos.

### `EstadoLote` de pedidos

Estado del lote administrativo `PurchaseBatch`.

| Estado | Significado |
|---|---|
| `PENDIENTE` | El lote todavía no ha arrancado su ciclo operativo. |
| `PARCIAL` | Parte de los pedidos asociados ya fue recepcionada o procesada. |
| `COMPLETADO` | Los pedidos del lote ya están cerrados de forma compatible. |
| `INCIDENCIA` | Algún pedido del lote está afectado por incidencias. |
| `CANCELADO` | El lote se cerró sin continuar su flujo normal. |

### `PedidoStatusTrigger`

Disparador técnico que el backend usa para transformar eventos de recepción en estados de pedido.

| Trigger | Resultado |
|---|---|
| `ACEPTAR` | Lleva el pedido a `POR_RECEPCIONAR`. |
| `RECEPCION_PARCIAL` | Lleva el pedido a `PARCIAL`. |
| `RECEPCION_TOTAL` | Lleva el pedido a `RECEPCIONADO`. |
| `INCIDENCIA` | Lleva el pedido a `INCIDENCIA`. |

> [!NOTE]
> Este enum no suele mostrarse como chip en la interfaz. Es un mecanismo interno de transición de estados.

## Recepciones

### `EstadoRecepcion`

Estado de la cabecera de una recepción.

| Estado | Significado |
|---|---|
| `COMPLETADA` | La recepción cerró sin diferencias que requirieran incidencia. |
| `CON_INCIDENCIAS` | Al menos una línea no cuadró con lo esperado y se generó incidencia. |

> [!IMPORTANT]
> La implementación actual del backend expone solo `COMPLETADA` y `CON_INCIDENCIAS`. Algunas páginas antiguas de la documentación todavía mencionan `PARCIAL`; ese valor no forma parte del enum vigente.

### `EstadoProductoRecepcion`

Estado persistido en cada línea de recepción.

| Estado | Significado |
|---|---|
| `PERFECTO` | La línea se recibió correctamente y se puede computar como recibida. |
| `ROTO` | El producto llegó roto o en mal estado. |
| `FALTA_TOTAL` | No llegó ninguna unidad de la línea esperada. |
| `EXCEDE` | Llegó más cantidad de la esperada. |

### `EstadoVisualProducto`

Estado visual que el operador selecciona en el flujo de recepción masiva.

| Estado | Significado |
|---|---|
| `OPTIMO` | Inspección visual correcta. |
| `ROTO` | Daño visible o rotura. |
| `DEFECTUOSO` | Estado visual no óptimo, tratable como producto dañado. |

> [!NOTE]
> El formulario de recepción usa `estadoVisual` como entrada. Si no se informa `estadoProducto`, el backend traduce `ROTO` y `DEFECTUOSO` a `EstadoProductoRecepcion.ROTO`; el resto se resuelve como `PERFECTO`.

## Incidencias

### `EstadoIncidencia`

Estado calculado para la cabecera de incidencia.

| Estado | Significado |
|---|---|
| `NUEVA` | La incidencia acaba de generarse y todavía no se ha trabajado su resolución. |
| `EN_AJUSTE` | La incidencia sigue en revisión o ajuste de datos. |
| `PENDIENTE_VALIDACION` | Las líneas ya están equilibradas, pero todavía falta validación o cierre. |
| `RESUELTA` | La incidencia quedó resuelta. |
| `CANCELADA` | La incidencia se anuló o se dio por cancelada. |
| `INVALIDA` | La incidencia no es válida o no tiene suficiente información para continuar. |

#### Flujo operativo de `EstadoIncidencia` (actual)

| Transición | Tipo | Regla funcional |
|---|---|---|
| `NUEVA -> EN_AJUSTE` | Manual | Ocurre cuando el operador ajusta líneas y alguna línea pasa de `PENDIENTE` a estado de reclamación gestionado (`RECLAMADO`, `REENVIADO`, `ABONADO`) sin cerrar la incidencia. |
| `NUEVA -> PENDIENTE_VALIDACION` | Automática | Ocurre cuando todas las líneas quedan balanceadas pero la incidencia no se marca como cerrada. |
| `EN_AJUSTE -> PENDIENTE_VALIDACION` | Automática | Ocurre cuando tras ajustes todas las líneas quedan balanceadas y aún no se cierra. |
| `NUEVA/EN_AJUSTE/PENDIENTE_VALIDACION -> RESUELTA` | Manual | Cierre explícito desde frontend con `estadoFinal = resuelta` en `PATCH /incidencias/:id/resolver`. |
| `NUEVA/EN_AJUSTE/PENDIENTE_VALIDACION -> CANCELADA` | Manual | Cierre explícito desde frontend con `estadoFinal = cancelada`. |
| `NUEVA/EN_AJUSTE/PENDIENTE_VALIDACION -> INVALIDA` | Manual o defensiva | Cierre explícito con `estadoFinal = invalida` o detección defensiva para registros legacy inválidos sin líneas. |

> [!IMPORTANT]
> No se permite resolver/ajustar incidencias sin líneas de producto. Backend y frontend bloquean ese caso para evitar estados huérfanos.

### `TipoIncidencia`

Clasificación funcional del problema detectado.

| Tipo | Significado |
|---|---|
| `ROTURA` | El producto llegó roto. |
| `CADUCADO` | El producto llegó caducado. |
| `FALTA_PRODUCTO` | Faltó producto respecto a lo esperado. |
| `EXCESO_PRODUCTO` | Llegó más producto del esperado. |
| `OTRO` | Caso no encajable en las categorías anteriores. |

### `TipoResolucion`

Clasificación de la respuesta dada a una incidencia.

| Tipo | Significado |
|---|---|
| `ACEPTADA` | La resolución propuesta se acepta. |
| `RECHAZADA` | La resolución propuesta no se acepta. |
| `PARCIAL` | La resolución cubre solo parte de la discrepancia. |
| `DEVOLUCION` | Se tramita devolución. |
| `ABONO` | Se tramita abono. |
| `CAMBIO` | Se tramita sustitución o cambio. |

### `TipoDiferencia` e `EstadoReclamacion`

Estados y clasificaciones de `IncidenciaLinea`.

| Enum | Valores | Significado |
|---|---|---|
| `TipoDiferencia` | `FALTANTE`, `EXCESO`, `DEFECTUOSO` | Describe la diferencia concreta detectada entre lo pedido y lo recibido. |
| `EstadoReclamacion` | `PENDIENTE`, `RECLAMADO`, `ABONADO`, `REENVIADO` | Describe el seguimiento administrativo de la línea afectada. |

## Distribución

### `EstadoDistribucion`

Estado de la cabecera de distribución.

| Estado | Significado |
|---|---|
| `BORRADOR` | La distribución está creada pero aún no preparada. |
| `PREPARADA` | La distribución ya está lista para confirmarse. |
| `PARCIAL` | Solo una parte se ha entregado o transferido. |
| `ENTREGADA` | La distribución quedó completada. |
| `CANCELADA` | La distribución se anuló antes de cerrarse. |

### `EstadoDistribucionLinea`

Estado de cada línea de distribución.

| Estado | Significado |
|---|---|
| `PENDIENTE` | La línea todavía no se ha ejecutado. |
| `PARCIAL` | La línea se ha servido solo en parte. |
| `ENTREGADA` | La línea quedó completamente entregada. |
| `CANCELADA` | La línea se anuló junto con la distribución o por reversión. |

## Preparación y usuarios

### `PreparacionEstado`

Estado de una preparación de cocina o producción.

| Estado | Significado |
|---|---|
| `PENDIENTE` | Preparación creada, todavía no iniciada. |
| `EN_PROCESO` | Preparación en curso. |
| `COMPLETADA` | Preparación terminada correctamente. |
| `CANCELADA` | Preparación anulada. |

### `UserStatus`

Estado de ciclo de vida de usuario.

| Estado | Significado |
|---|---|
| `INACTIVE` | Cuenta creada o desactivada, pero no operativa. |
| `ACTIVE` | Cuenta habilitada para autenticación normal. |
| `BLOCKED` | Cuenta bloqueada por seguridad o administración. |

## Inconsistencias conocidas

> [!WARNING]
> Existen dos enums distintos llamados `EstadoLote`: uno para pedidos y otro para receta. Este documento solo describe el que está activo en el flujo de compras.

> [!WARNING]
> `EstadoProductoRecepcion` y `EstadoVisualProducto` comparten parte del vocabulario (`ROTO`, `DEFECTUOSO`), pero no representan lo mismo. El primero es persistido; el segundo es una entrada visual del operador.

> [!NOTE]
> La documentación histórica del modelo de datos todavía menciona `EstadoRecepcion.PARCIAL`. La referencia canónica actual para recepción es `COMPLETADA` y `CON_INCIDENCIAS`.

## Documentos relacionados

- [Modelo de datos](../architecture/data-model.md)
- [Arquitectura backend](../architecture/backend.md)
- [Arquitectura frontend](../architecture/frontend.md)
- [Módulo de pedidos](../modules/pedido/README.md)
- [Automatización de pedidos](../modules/pedido/automatizacion-fechas-estados.md)
- [Recepción de productos](../modules/recepcion/README.md)
- [Recepción masiva](../modules/recepcion/recepcion-masiva.md)
- [Módulo de distribución](../modules/distribucion/README.md)
- [API backend](./api.md)
