# Reference: Módulos y responsabilidades

## Módulos cargados en AppModule

| Módulo | Responsabilidad principal | Controller(s) | Service(s) principal(es) |
|---|---|---|---|
| SherlockAuthModule | Autenticación y flujo JWT | auth.controller.ts | auth.service.ts |
| UsuarioModule | Gestión de usuarios y perfil | usuario.controller.ts | usuario.service.ts |
| RolesModule | Gestión de roles y asociación usuario-rol | (interno + integración auth) | roles services |
| PermisosModule | Catálogo de permisos por acción | (integrado con auth) | permisos services |
| PlantillasRolesModule | Plantillas reutilizables de roles/permisos | (según módulo) | plantillas services |
| PedidoModule | Pedidos y lotes de compra | pedido.controller.ts, purchase-batch.controller.ts | pedido.service.ts |
| PedidoDraftModule | Borradores de pedido | pedido-draft.controller.ts | pedido-draft.service.ts |
| RecepcionModule | Recepciones y líneas de recepción | recepcion.controller.ts, recepcion-producto.controller.ts | recepcion services |
| RecepcionDraftModule | Borradores de recepción | recepcion-draft.controller.ts | recepcion-draft.service.ts |
| ProductoModule | Maestro de productos y relaciones proveedor/alérgeno/precio | producto.controller.ts, producto-proveedor.controller.ts, producto-alergeno.controller.ts, historial-precio.controller.ts | producto services |
| ProveedorModule | Gestión de proveedores | proveedor.controller.ts | proveedor.service.ts |
| InventarioModule | Stock por ubicación y alertas | inventario.controller.ts, alerta.controller.ts | inventario.service.ts |
| MovimientoModule | Trazabilidad de movimientos de stock | movimiento.controller.ts | movimiento.service.ts |
| MermaModule | Registro de mermas | merma.controller.ts | merma.service.ts |
| RecetaModule | Gestión de recetas y producción | receta.controller.ts, produccion.controller.ts | receta/produccion services |
| PreparacionModule | Preparación operativa | preparacion.controller.ts | preparacion.service.ts |
| AlbaranModule | Albaranes y vínculo con recepción/pedido | albaran.controller.ts | albaran.service.ts |
| IncidenciaModule | Incidencias y resolución | incidencia.controller.ts, incidencia-resuelta.controller.ts | incidencia services |
| ArchivoModule | Subida y consulta de ficheros | archivo.controller.ts | archivo.service.ts |
| ProfesorModule | Dominio de profesorado y slots de alumno | profesor.controller.ts | profesor.service.ts |
| AlumnoModule | Dominio de alumnado | alumno.controller.ts | alumno.service.ts |
| AdminModule | Operaciones administrativas | admin.controller.ts | admin.service.ts |
| DashboardModule | KPIs y agregados | dashboard.controller.ts | dashboard.service.ts |
| ExportModule | Exportaciones (Excel/PDF) | export.controller.ts | export.service.ts |
| UbicacionModule | Gestión de ubicaciones | ubicacion.controller.ts | ubicacion.service.ts |

## Convenciones de módulo
- Carpeta por dominio en `src/modules/<modulo>/`
- Subcarpetas típicas: `controller/`, `service/`, `dto/`, `*.entity/`
- Endpoints bajo prefijo global `/api/v1`
- Seguridad por `@UseGuards(...)` y permisos por `@RequirePermissions(...)`

## Dependencias transversales
- `ConfigModule` global
- `TypeOrmModule.forRoot(typeOrmConfig)`
- `I18nConfigModule`
- `ThrottlerModule` con perfiles `auth`, `write`, `read`
- `CacheModule` global
