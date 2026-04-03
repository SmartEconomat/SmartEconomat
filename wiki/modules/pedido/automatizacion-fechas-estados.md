# Automatización de fechas y estados en pedidos

## Objetivo

Eliminar la discrecionalidad del usuario en la creación de pedidos para que las decisiones sensibles de negocio queden centralizadas en backend.

## Cambios aplicados

### 0. Separación de agregados

El flujo ya no parte de `PurchaseBatch` como pedido visible. Ahora existen tres niveles:

- `PedidoUsuario`: agregado visible para negocio.
- `Pedido`: pedido interno por proveedor.
- `PurchaseBatch`: lote de compra consolidado.

### 1. Creación de pedidos

El endpoint `POST /pedido-usuarios` acepta únicamente:

- `lineas`
- `observaciones` (opcional, máximo 500 caracteres)

Quedan fuera del contrato de creación:

- `fechaEntrega`
- `motivoCancelacion`
- `estado`
- `costeTotal`
- cualquier otro campo legacy no declarado en el DTO

Con `ValidationPipe` en modo `whitelist + forbidNonWhitelisted`, cualquier campo adicional provoca `400 Bad Request`.

### 2. Fecha de entrega calculada

`fechaEntrega` ya no se edita manualmente en el flujo normal.

La fecha se calcula automáticamente en backend usando el offset configurado por la variable:

- `PEDIDO_FECHA_ENTREGA_HOURS`

Si no existe o no es válida, se usa el valor por defecto:

- `48` horas

Regla aplicada:

$$
fechaEntrega = fechaCreacion + offsetHoras
$$

### 3. Máquina de estados interna

La transición de estados se centraliza en `PedidoService.handleStatusTransition()`.

Triggers soportados:

- `RECEPCION_PARCIAL` → `PARCIAL`
- `RECEPCION_TOTAL` → `RECEPCIONADO`

Estado inicial del pedido interno:

- Todo pedido nuevo nace en `PENDIENTE_DE_APROBACION`

### 4. Estados del agregado `PedidoUsuario`

El backend recalcula el estado visible del agregado en función de sus pedidos internos:

- `pendiente_de_aprobacion`: todos los pedidos internos siguen pendientes.
- `por_recepcionar`: existe actividad en curso (`por_recepcionar`, `parcial`, `recepcionado`, `incidencia`).
- `recepcionado`: todos los pedidos internos han finalizado de forma compatible (`recepcionado` o `cancelado`).
- `cancelado`: todos los pedidos internos han sido cancelados.

### 5. Recepciones y cambio automático de estado

Cuando una recepción se registra y queda vinculada a uno o varios pedidos:

1. Se recalcula la cantidad acumulada recibida por línea.
2. Si todas las líneas coinciden exactamente con lo pedido, el trigger es `RECEPCION_TOTAL`.
3. En cualquier otro caso, el trigger es `RECEPCION_PARCIAL`.
4. El pedido interno se actualiza automáticamente desde backend.
5. Si el `Pedido` pertenece a un `PedidoUsuario`, también se recalcula el estado del agregado.
6. Si el `Pedido` pertenece a un `PurchaseBatch`, también se sincroniza el estado del lote de compra.

## Reglas de cancelación

No se permite cancelar ni editar un pedido si la recepción ya ha comenzado.

La regla se evalúa comprobando si el pedido ya tiene relaciones en `recepcionesPedido`.

En agregados (`PedidoUsuario` y `PurchaseBatch`) la validación baja a sus pedidos internos y líneas, comprobando además recepciones e incidencias vinculadas cuando aplica.

## Impacto en frontend

Frontend no debe permitir edición manual de:

- `fechaEntrega`
- `estado` del pedido en flujo normal
- `costeTotal`
- `numeroGlobal`

Frontend sí puede enviar:

- `observaciones`
- `lineas`

Además:

- “Mis pedidos” y la vista semanal deben consumir `PedidoUsuario`.
- “Compras” debe consumir `PurchaseBatch`.
- La consolidación semanal debe enviar `pedidoUsuarioIds`.

## Impacto en testing

Se han actualizado pruebas para cubrir:

- autogeneración de `fechaEntrega`
- rechazo de payloads legacy con `fechaEntrega`
- sincronización `Pedido` → `PedidoUsuario`
- transición automática `PENDIENTE_DE_APROBACION -> POR_RECEPCIONAR -> RECEPCIONADO` en pedidos internos
- bloqueo de cancelación tras inicio de recepción
