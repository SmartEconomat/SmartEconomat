# Referencia: Máquina de estados de incidencias

Documento técnico de referencia para desarrollo, QA y operación.

## Estados globales de incidencia

Enum canónico (`EstadoIncidencia`):

- `nueva`
- `en_ajuste`
- `pendiente_validacion`
- `resuelta`
- `cancelada`
- `invalida`

## Estados de reclamación por línea

Enum canónico (`EstadoReclamacion`):

- `PENDIENTE`
- `RECLAMADO`
- `ABONADO`
- `REENVIADO`

## Campos que gobiernan el estado global

- `fechaResolucion`
- `observacionesResolucion`
- `lineas[]`
- `lineas[].cantidadEsperada`
- `lineas[].cantidadRecibida`
- `lineas[].estadoReclamacion`

## Prioridad de resolución del estado global

Orden exacto de evaluación:

1. Si `observacionesResolucion` contiene token de cancelación, estado `cancelada`.
2. Si `observacionesResolucion` contiene token de invalidez, estado `invalida`.
3. Si la incidencia está resuelta (`fechaResolucion != null`), estado `resuelta`.
4. Si no hay líneas, estado `invalida`.
5. Si todas las líneas están balanceadas, estado `pendiente_validacion`.
6. Si ninguna línea fue gestionada manualmente, estado `nueva`.
7. En cualquier otro caso, estado `en_ajuste`.

## Definición de línea balanceada

Una línea se considera balanceada cuando:

`abs(cantidadRecibida - cantidadEsperada) < 0.0005`

Ese umbral evita falsos desajustes por decimales.

## Cálculo automático de estado de reclamación de línea

Cuando se ajusta cantidad sin enviar `estadoReclamacion` explícito:

1. Si la línea queda balanceada: `ABONADO`.
2. Si sigue con `cantidadRecibida > 0`: `RECLAMADO`.
3. Si no, `PENDIENTE`.

## Endpoints que pueden afectar el estado

- `POST /api/v1/incidencias`
  - Crea incidencia y líneas.
  - Estado derivado típico: `nueva`.

- `POST /api/v1/incidencias/reportar`
  - Crea incidencia desde recepción existente.
  - Solo si existen discrepancias calculadas.

- `PATCH /api/v1/incidencias/:id/resolver`
  - Ajusta líneas y/o cierra incidencia.
  - Permite estados terminales `resuelta`, `cancelada`, `invalida` mediante `estadoFinal`.

- `POST /api/v1/incidencias/:id/resolver`
  - Resolución transaccional con `accion`.
  - Marca incidencia como resuelta y registra `incidencia_resuelta`.

## Reglas de cierre con `PATCH /:id/resolver`

Una incidencia se marca resuelta si se cumple al menos una condición:

1. `marcarComoResuelta = true`.
2. No se envían ajustes de línea.
3. Todas las líneas quedan balanceadas.
4. `estadoFinal` es terminal (`resuelta`, `cancelada`, `invalida`).

## Marcadores textuales de estados terminales

`cancelada`:

- `[cancelada]`
- `#cancelada`
- cualquier texto con `cancelad`

`invalida`:

- `[invalida]`
- `[inválida]`
- `#invalida`
- `#inválida`
- cualquier texto con `inválid` o `invalid`

## Tabla de transiciones prácticas

| Estado actual | Trigger | Precondición principal | Estado resultante |
| --- | --- | --- | --- |
| `nueva` | `PATCH /:id/resolver` con `estadoReclamacion` manual | Incidencia no resuelta | `en_ajuste` |
| `nueva` | `PATCH /:id/resolver` balanceando todas las líneas | Incidencia no resuelta | `pendiente_validacion` |
| `nueva` | `PATCH /:id/resolver` con `marcarComoResuelta: true` | Usuario resolutor disponible | `resuelta` |
| `en_ajuste` | Ajustes que balancean todas las líneas sin marcador terminal | No resuelta | `pendiente_validacion` |
| `pendiente_validacion` | Cierre explícito sin tags terminales | Usuario resolutor disponible | `resuelta` |
| Cualquiera | Cierre con `estadoFinal: cancelada` | Usuario resolutor disponible | `cancelada` |
| Cualquiera | Cierre con `estadoFinal: invalida` | Usuario resolutor disponible | `invalida` |
| Cualquiera no resuelta | `POST /:id/resolver` transaccional | DTO válido (`accion`) | `resuelta` |

## Restricciones y validaciones relevantes

- No se puede resolver una incidencia ya resuelta.
- No se puede resolver una incidencia sin líneas.
- Cada ajuste de línea debe identificar línea por `id` o `pedidoProductoId`.
- No se puede enviar `cantidadRecibida` y `ajusteCantidad` en la misma línea.
- No se puede ajustar cantidades en líneas ya balanceadas.

## Efectos colaterales

- Al resolver incidencia con `pedidoId`, backend sincroniza estado del pedido asociado.
- En resolución transaccional con `accion = devolucion`, se registra movimiento de tipo `SALIDA_AJUSTE`.
