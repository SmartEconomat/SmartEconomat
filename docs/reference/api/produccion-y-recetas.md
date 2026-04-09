# API de Producción y Recetas

Este bloque documenta los endpoints usados para definir recetas, estimar costes, ejecutar producción, consumir lotes y gestionar preparaciones operativas.

## Entidades relacionadas

- `Receta`
- `RecetaIngrediente`
- `ProduccionLote`
- `Preparacion`

Para la estructura del modelo: [../entidades.md](../entidades.md).

## Recetas (`/recetas`)

Campos clave del agregado `receta`: `nombre`, `instrucciones`, `tiempoEstimadoMinutos`, `dificultad`, y opcionales como `rendimiento`, `unidadResultado`, `diasCaducidad`, `costeUnitarioEstimado`, `raciones`, `tamanioRacion`, `pathImg`.

| Endpoint | Para qué sirve | Qué enviar | Qué devuelve |
| --- | --- | --- | --- |
| `POST /recetas` | Crear receta | `CreateRecetaDto` con datos maestros e ingredientes | Una `Receta` |
| `POST /recetas/duplicate` | Duplicar receta existente | `DuplicateRecetaDto` con la receta origen y ajustes opcionales | Una nueva `Receta` |
| `GET /recetas` | Listar recetas | Query de paginación y orden | Página de recetas |
| `GET /recetas/:id` | Ver receta básica | UUID v7 por path | Una `Receta` |
| `GET /recetas/:id/detalle` | Ver receta enriquecida con ingredientes, costes y relaciones | UUID v7 por path | `DetalleRecetaDto` |
| `GET /recetas/:id/escandallo` | Calcular coste o escandallo | UUID v7 por path | `RecetaCostResponseDto` |
| `POST /recetas/:id/cocinar` | Ejecutar consumo directo de una receta sin pasar por lote manual | UUID v7 + `CocinarRecetaDto` | Confirmación funcional |
| `POST /recetas/calculate-preview` | Simular coste antes de guardar | `RecetaPreviewCostDto` | `RecetaCostResponseDto` sin persistencia |
| `GET /recetas/export/pdf` | Exportar varias recetas a PDF | Query `ids` y opcional `includeImage` | PDF binario |
| `GET /recetas/:id/pdf` | Exportar una receta a PDF | UUID v7 y opcional `includeImage` | PDF binario |
| `POST /recetas/:id/recalcular-costes` | Recalcular y guardar coste estimado | UUID v7 por path | `Receta` con coste actualizado |
| `PATCH /recetas/:id` | Editar receta | UUID v7 + `UpdateRecetaDto` | `Receta` actualizada |
| `DELETE /recetas/:id` | Eliminar receta | UUID v7 por path | `204 No Content` |

### Cuándo usar cada ruta de receta

- Usa `calculate-preview` cuando el frontend necesite mostrar coste antes de guardar.
- Usa `:id/escandallo` cuando la receta ya existe y necesitas el coste consolidado real.
- Usa `duplicate` cuando el objetivo sea partir de una receta previa manteniendo su estructura.

## Producción (`/produccion`)

Campos clave del agregado `produccion_lote`: `recetaId`, `cantidadProducida`, `fechaProduccion`, `costeTotalReal`, `porcionesProducidas`, `porcionesRestantes`, `estado`, y opcionales como `usuarioId`, `preparacionId`, `fechaCaducidad`.

| Endpoint | Para qué sirve | Qué enviar | Qué devuelve |
| --- | --- | --- | --- |
| `POST /produccion/ejecutar` | Ejecutar una producción y generar lote | `EjecutarProduccionDto` con receta, cantidad/raciones y datos operativos | Un `ProduccionLote` |
| `POST /produccion/validar` | Comprobar si hay stock suficiente antes de producir | `ValidarProduccionDto` | Resultado de validación por receta o conjunto |
| `GET /produccion` | Listar lotes producidos | Query de paginación y orden | Página de lotes |
| `PATCH /produccion/lote/:id/consumir` | Consumir porciones o cantidad de un lote | UUID v7 + `ConsumirProduccionDto` | `ProduccionLote` actualizado |
| `GET /produccion/:id` | Ver lote concreto | UUID v7 por path | Un `ProduccionLote` |

### Qué enviar en producción

- En `ejecutar`, el body debe describir qué receta se produce y en qué cantidad.
- En `validar`, el body sirve para simular la producción sin descontar stock.
- En `consumir`, el body indica cuántas porciones o cantidad del lote se consumen.

## Preparaciones (`/preparaciones`)

Campos clave del agregado `preparacion`: `recetaId`, `cantidadAProducir`, `estado`, y opcionales como `usuarioId`, `ubicacionDestinoId`, `fechaProgramada`, `fechaInicio`, `fechaFinalizacion`, `observaciones`.

| Endpoint | Para qué sirve | Qué enviar | Qué devuelve |
| --- | --- | --- | --- |
| `POST /preparaciones` | Crear preparación operativa | `CreatePreparacionDto` | Preparación creada |
| `GET /preparaciones` | Listar preparaciones | Query de paginación | Página o lista de preparaciones |
| `GET /preparaciones/:id` | Ver una preparación | UUID v7 por path | Una preparación |
| `PATCH /preparaciones/:id/iniciar` | Marcar inicio de preparación | UUID v7 por path | Preparación en curso |
| `PATCH /preparaciones/:id/finalizar` | Cerrar preparación y opcionalmente mover resultado a ubicación destino | UUID v7 y body opcional con `ubicacionDestinoId` | Preparación finalizada |
| `PATCH /preparaciones/:id/cancelar` | Cancelar preparación | UUID v7 por path | Preparación cancelada |
| `DELETE /preparaciones/:id` | Eliminar preparación | UUID v7 por path | Resultado de eliminación |

## Relación con mermas y stock

- La merma nacida durante producción se registra desde `POST /merma/produccion/reportar`, documentado en [catalogo-e-inventario.md](./catalogo-e-inventario.md).
- La producción descuenta ingredientes y genera stock transformado; por eso conviene revisar también inventario y movimientos cuando se depuren incidencias de cocina.

## Reglas prácticas para integrar este bloque

- Usa `validar` antes de `ejecutar` cuando el usuario necesite feedback preventivo.
- Usa `preparaciones` para flujos operativos con estado humano y `produccion` para el registro de lotes resultantes.
- No deduzcas costes en cliente: usa `calculate-preview`, `escandallo` o `recalcular-costes`.