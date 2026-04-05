# API de Catálogo e Inventario

Este bloque cubre los recursos usados para dar de alta catálogo, relacionarlo con proveedores, consultar stock, auditar movimientos y operar sobre ubicaciones y mermas.

## Entidades relacionadas

- `Producto`
- `Proveedor`
- `ProductoProveedor`
- `ProductoAlergeno`
- `HistorialPrecio`
- `Inventario`
- `Ubicacion`
- `Movimiento`
- `Merma`

Detalle de campos y relaciones: [../entidades.md](../entidades.md).

## Excepciones de naming heredadas

- `/proveedor` usa singular.
- `/inventario` usa singular.
- `/merma` usa singular.
- `/ubicacion` usa singular.

La documentación respeta esos nombres porque así está publicado hoy el contrato real.

## Productos

Campos clave del agregado `producto`: `nombre`, `contenido`, `pmp`, y opcionales como `unidad`, `tipo`, `codigoBarras`, `fechaCaducidad`, `pathImg`.

| Endpoint | Para qué sirve | Qué enviar | Qué devuelve |
| --- | --- | --- | --- |
| `GET /productos/generar-ean13` | Reservar un código EAN-13 único antes del alta | No lleva body; solo autenticación y permiso | Un código de barras listo para reutilizar en el alta |
| `POST /productos` | Crear el producto maestro y, cuando aplica, su alta compleja completa | `CreateProductoDto` con datos maestros del producto; en alta compleja también relaciones con proveedores y alérgenos | El `Producto` creado o el resultado de la operación transaccional |
| `GET /productos` | Listar catálogo | Query de paginación y filtros del módulo | Página de productos con metadatos de paginación |
| `GET /productos/:id` | Ver detalle operativo de un producto | UUID v7 del producto por path | Un `Producto` |
| `PATCH /productos/:id` | Editar producto existente | UUID v7 + `UpdateProductoDto` parcial | El `Producto` actualizado |
| `DELETE /productos/:id` | Baja lógica del producto | UUID v7 por path | `204 No Content` |
| `GET /productos/:id/historial-precios` | Ver evolución de precios del producto | UUID v7 y, si se desea, `proveedorId` en query | Histórico de precios asociado al producto |
| `GET /productos/:id/pmp` | Consultar PMP actual y su desglose | UUID v7 por path | Objeto con PMP y composición por proveedor |

### Cuándo usar cada ruta de producto

- Usa `POST /productos` cuando el producto todavía no exista en catálogo.
- Usa `GET /productos/:id/historial-precios` si necesitas explicar por qué el PMP actual tiene un valor concreto.
- Usa `GET /productos/:id/pmp` si solo necesitas el coste medio vigente y no todo el histórico.

## Relación producto-proveedor

Campos clave del agregado `producto_proveedor`: `productoId`, `proveedorId`, y opcionales como `precioUnitario`, `mermaEsperada`, `codigoBarras`, `marca` y `pmp`.

| Endpoint | Para qué sirve | Qué enviar | Qué devuelve |
| --- | --- | --- | --- |
| `PATCH /producto-proveedor/:id/precio` | Cambiar precio de compra y registrar histórico | UUID v7 + DTO con el nuevo precio y metadatos de cambio | La relación actualizada o confirmación de histórico generado |
| `PATCH /producto-proveedor/:id/merma` | Ajustar la merma esperada del proveedor | UUID v7 + DTO con porcentaje/valor de merma | `ProductoProveedor` actualizado |
| `GET /producto-proveedor/search` | Alimentar autocompletados o pickers | Query de búsqueda y filtros publicados por el módulo | Lista reducida de relaciones producto-proveedor |
| `GET /producto-proveedor/comparar/:productoId` | Comparar proveedores por coste efectivo | UUID v7 del producto | Comparativa por proveedor, precio y merma esperada |
| `GET /producto-proveedor/:id/historial` | Consultar histórico de precios de una relación concreta | UUID v7 + paginación opcional | Histórico del `ProductoProveedor` |

## Alérgenos de producto

| Endpoint | Para qué sirve | Qué enviar | Qué devuelve |
| --- | --- | --- | --- |
| `POST /producto-alergenos` | Crear una asociación puntual producto-alérgeno | DTO con `productoId` y el alérgeno o lista correspondiente | Asociación creada |
| `GET /producto-alergenos` | Listar asociaciones | Query opcional como `idProducto` | Lista de asociaciones |
| `GET /producto-alergenos/:id` | Obtener alérgenos de un producto | ID del producto | Lista de alérgenos del producto |
| `PATCH /producto-alergenos/:id` | Reemplazar asociaciones existentes | ID del producto + nuevo conjunto de alérgenos | Lista final de asociaciones vigentes |
| `DELETE /producto-alergenos/:idProducto/:alergeno` | Eliminar una asociación concreta | ID del producto + código de alérgeno | `204 No Content` |

## Historial de precios

| Endpoint | Para qué sirve | Qué enviar | Qué devuelve |
| --- | --- | --- | --- |
| `POST /historial-precio` | Registrar un histórico manual o técnico | DTO de histórico con relación producto-proveedor, precio y vigencia | Registro creado |
| `GET /historial-precio` | Listar históricos | Query de listado, incluyendo orden | Página o lista de históricos |
| `GET /historial-precio/:id` | Ver un histórico concreto | UUID v7 por path | Un registro de `HistorialPrecio` |
| `PATCH /historial-precio/:id` | Corregir un histórico | UUID v7 + DTO parcial | Histórico actualizado |
| `DELETE /historial-precio/:id` | Baja lógica del histórico | UUID v7 por path | `204 No Content` |

## Proveedores

Campos clave del agregado `proveedor`: `nombre` y, cuando aplique, `nif`, `contacto`, `telefono`, `email`, `direccion`.

| Endpoint | Para qué sirve | Qué enviar | Qué devuelve |
| --- | --- | --- | --- |
| `POST /proveedor` | Crear proveedor | `CreateProveedorDto` con identidad y contacto | Un `Proveedor` |
| `GET /proveedor` | Listar proveedores | Query de paginación, orden y filtros del módulo | Página de proveedores |
| `GET /proveedor/con-pedidos` | Obtener solo proveedores que ya tienen pedidos vinculados | No lleva body; solo autenticación y permiso | Lista de proveedores con actividad de compra |
| `GET /proveedor/:id` | Ver detalle de proveedor | UUID v7 por path | Un `Proveedor` |
| `PATCH /proveedor/:id` | Editar proveedor | UUID v7 + `UpdateProveedorDto` | `Proveedor` actualizado |
| `DELETE /proveedor/:id` | Eliminar proveedor | UUID v7 por path | `204 No Content` |

## Inventario

Campos clave del agregado `inventario`: `productoProveedorId`, `ubicacionId`, `cantidadActual`, `cantidadMinima`, opcionales `cantidadMaxima`, `fechaCaducidad` y `fechaEntrada`.

| Endpoint | Para qué sirve | Qué enviar | Qué devuelve |
| --- | --- | --- | --- |
| `POST /inventario` | Crear una posición de stock | `CreateInventarioItemDto` con producto-proveedor, ubicación y cantidades base | `Inventario` creado |
| `GET /inventario` | Listar stock | Query de paginación y orden | Página de inventario |
| `GET /inventario/stock` | Consultar stock consolidado o por ubicación | `InventoryQueryDto` en query | Lista consolidada o por ubicación |
| `POST /inventario/ajustes-manuales` | Ajustar stock con trazabilidad | `CreateMovimientoManualDto` con inventario objetivo, tipo de ajuste, cantidad y motivo | `Inventario` actualizado y movimiento auditado |
| `GET /inventario/:id` | Ver una posición concreta de stock | UUID v7 por path | Un `Inventario` |
| `PATCH /inventario/:id` | Editar stock base y metadatos | UUID v7 + `UpdateInventarioDto` | `Inventario` actualizado |
| `DELETE /inventario/:id` | Eliminar lógicamente una posición | UUID v7 por path | `204 No Content` |

### Qué esperar de `GET /inventario/stock`

Este endpoint se usa cuando no necesitas todo el registro de inventario, sino la disponibilidad agregada para toma de decisiones. Suele servir para:

- validar si se puede preparar una compra o producción;
- mostrar stock total por producto;
- explicar distribución por ubicación física.

## Alertas de inventario

| Endpoint | Para qué sirve | Qué enviar | Qué devuelve |
| --- | --- | --- | --- |
| `GET /alertas/caducidad` | Detectar stock próximo a caducar | No lleva body; admite los filtros publicados por el módulo si existieran | Listado de alertas por caducidad |
| `GET /alertas/stock` | Detectar stock bajo mínimos | No lleva body; admite filtros del módulo | Listado de alertas por rotura o mínimo |

## Movimientos

El agregado `movimiento` registra la trazabilidad de entradas, salidas, ajustes, compras y operaciones automáticas.

| Endpoint | Para qué sirve | Qué enviar | Qué devuelve |
| --- | --- | --- | --- |
| `POST /movimientos` | Crear un movimiento manual o técnico | `CreateMovimientoDto` con tipo, cantidad y referencia a entidad afectada | Movimiento creado |
| `GET /movimientos` | Listar movimientos | Query de paginación y orden | Página de movimientos |
| `GET /movimientos/historial` | Filtrar trazabilidad por entidad, usuario, fecha o tipo | Query opcional `entityId`, `userId`, `type`, `startDate`, `endDate`, `sortBy`, `sortOrder` | Página de movimientos filtrados |
| `GET /movimientos/:id` | Ver un movimiento puntual | UUID v7 por path | Un `Movimiento` |
| `PATCH /movimientos/:id` | Corregir un movimiento | UUID v7 + `UpdateMovimientoDto` | Movimiento actualizado |
| `DELETE /movimientos/:id` | Soft delete de un movimiento | UUID v7 por path | `204 No Content` |

## Mermas

Campos clave del agregado `merma`: cantidad perdida, motivo, observaciones e inventario o contexto de producción afectado.

| Endpoint | Para qué sirve | Qué enviar | Qué devuelve |
| --- | --- | --- | --- |
| `POST /merma` | Registrar merma sobre inventario y descontar stock | `CreateMermaDto` con inventario, cantidad, motivo y observaciones | Una `Merma` |
| `POST /merma/produccion/reportar` | Reportar merma nacida durante producción sin reescribir estados históricos | `CreateMermaProduccionDto` con lote, ingrediente y cantidad merma | Una `Merma` enlazada al contexto productivo |
| `GET /merma/kpis` | Obtener KPIs agregados de merma | `MermaKpiQueryDto` en query con filtros temporales | Resumen de KPIs y porcentajes |
| `GET /merma/stats` | Obtener agregación por motivo y producto | No lleva body | Objeto con estadísticas por motivo y por producto |
| `GET /merma` | Listar mermas | Query de paginación y orden | Página de mermas |
| `GET /merma/:id` | Ver una merma puntual | UUID v7 por path | Una `Merma` |

## Ubicaciones

Campos clave del agregado `ubicacion`: nombre, tipo y descripción operativa.

| Endpoint | Para qué sirve | Qué enviar | Qué devuelve |
| --- | --- | --- | --- |
| `POST /ubicacion` | Crear una ubicación física o lógica | `CreateUbicacionDto` | `Ubicacion` creada |
| `GET /ubicacion` | Listar ubicaciones | Query de paginación | Página de ubicaciones |
| `GET /ubicacion/:id` | Ver una ubicación | UUID v7 por path | Una `Ubicacion` |
| `PATCH /ubicacion/:id` | Editar ubicación | UUID v7 + `UpdateUbicacionDto` | `Ubicacion` actualizada |
| `DELETE /ubicacion/:id` | Borrado lógico | UUID v7 por path | Resultado de eliminación |
| `POST /ubicacion/:id/restore` | Restaurar una ubicación eliminada | UUID v7 por path | Ubicación restaurada |

## OpenFoodFacts

Estas rutas no crean datos internos por sí mismas; sirven para enriquecer el catálogo durante alta o revisión.

| Endpoint | Para qué sirve | Qué enviar | Qué devuelve |
| --- | --- | --- | --- |
| `GET /openfoodfacts/producto/:codigoBarras` | Buscar un producto externo por código de barras | Código válido en path | `OffProductResponseDto` o `null` |
| `GET /openfoodfacts/buscar` | Buscar por texto libre | Query `nombre` | Lista de coincidencias externas |

## Reglas prácticas para integrar este bloque

- Usa `producto`, `producto-proveedor` e `inventario` como capas distintas: catálogo, abastecimiento y stock no son el mismo agregado.
- Si el cambio impacta stock físico, normalmente debe quedar trazabilidad en `movimientos` o `merma`.
- Si necesitas explicar costes, revisa `historial-precio` y `pmp` antes de tocar el inventario.