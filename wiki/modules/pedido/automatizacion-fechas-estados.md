# Automatización de fechas y estados en pedidos

## Objetivo

Eliminar la discrecionalidad del usuario en la creación de pedidos para que las decisiones sensibles de negocio queden centralizadas en backend.

## Cambios aplicados

### 1. Creación de pedidos

El endpoint `POST /pedidos` acepta únicamente:

- `proveedorId`
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

- `PEDIDO_FECHA_ENTREGA_OFFSET_HOURS`

Si no existe o no es válida, se usa el valor por defecto:

- `48` horas

Regla aplicada:

$$
fechaEntrega = fechaCreacion + offsetHoras
$$

### 3. Máquina de estados

La transición de estados se centraliza en `PedidoService.handleStatusTransition()`.

Triggers soportados:

- `RECEPCION_PARCIAL` → `EN_PROCESO`
- `RECEPCION_TOTAL` → `RECIBIDO`

Estado inicial:

- Todo pedido nuevo nace en `PENDIENTE`

### 4. Recepciones y cambio automático de estado

Cuando una recepción se registra y queda vinculada a uno o varios pedidos:

1. Se recalcula la cantidad acumulada recibida por línea.
2. Si todas las líneas coinciden exactamente con lo pedido, el trigger es `RECEPCION_TOTAL`.
3. En cualquier otro caso, el trigger es `RECEPCION_PARCIAL`.
4. El pedido se actualiza automáticamente desde backend.

## Reglas de cancelación

No se permite cancelar un pedido si la recepción ya ha comenzado.

La regla se evalúa comprobando si el pedido ya tiene relaciones en `recepcionesPedido`.

## Impacto en frontend

Frontend no debe permitir edición manual de:

- `fechaEntrega`
- `estado` del pedido en flujo normal

Frontend sí puede enviar:

- `observaciones`
- `proveedorId`
- `lineas`

## Impacto en testing

Se han actualizado pruebas para cubrir:

- autogeneración de `fechaEntrega`
- rechazo de payloads legacy con `fechaEntrega`
- transición automática `PENDIENTE -> EN_PROCESO -> RECIBIDO`
- bloqueo de cancelación tras inicio de recepción
