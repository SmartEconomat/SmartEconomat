# Reference: Entidades TypeORM

## Convención base compartida
Todas las entidades de dominio extienden `BaseEntity` (`src/common/entities/base.entity.ts`), que aporta:
- `id` UUID v7 (`@PrimaryColumn` con `uuid_generate_v7()`)
- `createdAt`, `updatedAt`
- `deletedAt` (soft-delete)
- `deletedBy`
- `version` (`@VersionColumn`)

## Entidades por dominio

### Acceso, usuarios y permisos
| Entidad (tabla) | Campos principales | Relaciones | Decoradores/índices relevantes |
|---|---|---|---|
| `Usuario` (`usuario`) | `nombre`, `username`, `password`, `email`, `rol`, `status`, `mustChangePassword`, `activo`, reset-password fields | `OneToMany` con pedidos/recepciones/movimientos/archivos, `OneToOne` profesor/alumno, `ManyToMany` roles/permisos adicionales/excluidos | `@Index(['username'])`, `@Index(['email'])`, `@BeforeInsert/@BeforeUpdate` hash bcrypt |
| `Rol` (`rol`) | identidad y metadatos de rol | `ManyToMany` permisos, usuarios | entidad de RBAC |
| `Permiso` (`permiso`) | código permiso, nombre y módulo/acción | `ManyToMany` roles y usuarios | clave para `@RequirePermissions` |
| `UsuarioRol` (`usuario_rol`) | `usuario_id`, `rol_id` | puente usuario-rol | tabla de asociación explícita |
| `RolPermiso` (`rol_permiso`) | `rol_id`, `permiso_id` | puente rol-permiso | tabla de asociación explícita |
| `PlantillaRol` (`plantilla_rol`) | nombre y metadatos de plantilla | relación con permisos por tabla puente | reutilización de conjuntos de permisos |
| `PlantillaRolPermiso` (`plantilla_rol_permiso`) | `plantilla_rol_id`, `permiso_id` | puente | composición de plantillas |

### Catálogo y compras
| Entidad (tabla) | Campos principales | Relaciones | Decoradores/índices relevantes |
|---|---|---|---|
| `Producto` (`producto`) | identidad del producto, tipo, marca, código de barras y metadatos | `OneToMany` producto-proveedor, alérgenos, histórico | índices por búsqueda frecuentes |
| `ProductoProveedor` (`producto_proveedor`) | enlace producto-proveedor, precio, datos comerciales | `ManyToOne` producto/proveedor, `OneToMany` inventario/movimientos/historial | tabla pivote de abastecimiento |
| `ProductoAlergeno` (`producto_alergeno`) | alérgeno asociado a producto | `ManyToOne` producto | catálogos sanitarios |
| `HistorialPrecio` (`historial_precio`) | precio y vigencia histórica | `ManyToOne` producto-proveedor | soporte de trazabilidad de coste |
| `Proveedor` (`proveedor`) | nombre, contacto, CIF y datos contractuales | `OneToMany` pedidos y producto-proveedor | catálogo de proveedores |
| `Pedido` (`pedido`) | `usuarioId`, `proveedorId`, `batchId`, fechas, `costeTotal`, `estado`, observaciones y motivos | `ManyToOne` usuario/proveedor/batch, `OneToMany` pedido-producto y recepcion-pedido | `@Check(coste_total >= 0)`, índices por estado/fechas/FK |
| `PedidoProducto` (`pedido_producto`) | detalle de línea de pedido (cantidad/precio) | `ManyToOne` pedido y producto-proveedor | granularidad de compra |
| `PurchaseBatch` (`purchase_batch`) | datos de lote de compra | `OneToMany` pedidos | agrupación operativa |
| `PedidoDraft` (`pedido_draft`) | borrador serializado, expiración y usuario | `ManyToOne` usuario | edición incremental de pedidos |

### Recepción, inventario y movimientos
| Entidad (tabla) | Campos principales | Relaciones | Decoradores/índices relevantes |
|---|---|---|---|
| `Recepcion` (`recepcion`) | fecha, estado, observaciones, usuario | `ManyToOne` usuario, `OneToMany` recepcion-pedido/recepcion-producto | recepción operativa |
| `RecepcionPedido` (`recepcion_pedido`) | vínculo recepción-pedido | `ManyToOne` recepción y pedido | soporte entregas parciales |
| `RecepcionProducto` (`recepcion_producto`) | línea recepcionada con cantidades/estado | `ManyToOne` recepción y producto-proveedor | control de diferencias |
| `RecepcionDraft` (`recepcion_draft`) | borrador, expiración, usuario | `ManyToOne` usuario | flujo temporal de recepción |
| `Inventario` (`inventario`) | stock actual/min/max, fecha caducidad, ubicación | `ManyToOne` producto-proveedor y ubicación | `@Check` de no negativos y consistencia min/max |
| `Movimiento` (`movimiento`) | tipo, cantidad, referencia entidad, usuario | `ManyToOne` inventario/usuario/producto-proveedor | trazabilidad total de cambios |
| `Merma` (`merma`) | cantidad perdida, motivo, observaciones | `ManyToOne` inventario | auditoría de desperdicio |
| `Ubicacion` (`ubicacion`) | nombre, tipo, descripción | `OneToMany` inventario | segmentación física del almacén |
| `Albaran` (`albaran`) | datos de documento de entrega | relación con recepción-pedido vía tabla puente | soporte documental |
| `AlbaranPedidoRecepcion` (`albaran_pedido_recepcion`) | enlace albarán-recepción-pedido | `ManyToOne` en ambos lados | unión logística |

### Producción, incidencias y soporte
| Entidad (tabla) | Campos principales | Relaciones | Decoradores/índices relevantes |
|---|---|---|---|
| `Receta` (`receta`) | nombre, porciones, tiempo, procedimiento | relación con ingredientes y lotes | base de planificación |
| `RecetaIngrediente` (`receta_ingrediente`) | ingrediente y cantidad por receta | `ManyToOne` receta/producto-proveedor | escandallo |
| `ProduccionLote` (`produccion_lote`) | ejecución de producción por lote | relación con receta y consumo | control de fabricación interna |
| `Preparacion` (`preparacion`) | estado de preparación operativa | vínculos de operación | flujo previo a entrega/uso |
| `Incidencia` (`incidencia`) | tipo, estado, descripción | relación con usuario resolutor y líneas | gestión de no conformidades |
| `IncidenciaLinea` (`incidencia_linea`) | detalle por línea afectada | `ManyToOne` incidencia y entidades de negocio | granularidad de resolución |
| `IncidenciaResuelta` (`incidencia_resuelta`) | cierre formal de incidencia | vínculo con incidencia original | trazabilidad de resolución |
| `Archivo` (`archivo`) | nombre, mime, ruta, tamaño, vínculo a entidad | `ManyToOne` usuario + referencia polimórfica | gestión documental |
| `Profesor` (`profesor`) | metadatos de profesor | `OneToOne` usuario | dominio educativo |
| `Alumno` (`alumno`) | metadatos de alumno | `OneToOne` usuario, `OneToMany` slots | dominio educativo |
| `AlumnoSlot` (`alumno_slot`) | slots/asignaciones de alumno | `ManyToOne` alumno | asignación operativa |

## Comentarios de implementación
- Se usan enums de dominio para estados/tipos críticos.
- Se aplican índices en columnas de consulta frecuente.
- Hay checks de integridad para cantidades y costes no negativos.
- El soft-delete y versionado optimista están centralizados en `BaseEntity`.

## Diagramas recomendados
- Arquitectura general: [overview](../overview.md)
- Flujo request-response: [flujo-completo-request](../explanation/flujo-completo-request.md)
