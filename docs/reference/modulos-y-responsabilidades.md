# Reference: Módulos y responsabilidades

## Módulos backend visibles en `src/modules`

Esta tabla resume las carpetas de módulo observables en `backend/smart-economat-backend/src/modules`, sus controllers HTTP y el documento principal de la wiki al que conviene saltar primero.

| Carpeta de módulo | Responsabilidad principal | Controller(s) visibles | Documento relacionado |
|---|---|---|---|
| `auth` | Login, logout, sesión y recuperación de contraseña | `auth.controller.ts` | `wiki/reference/api/usuarios-admin-y-seguridad.md` |
| `sherlock-auth` | Infraestructura de autenticación y permisos efectivos | Sin controller HTTP propio visible en `src/modules/**/controller` | `wiki/security/permisos-dinamicos.md` |
| `usuario` | CRUD de usuarios, perfil y permisos por usuario | `usuario.controller.ts` | `wiki/reference/api/usuarios-admin-y-seguridad.md` |
| `roles` | Gestión de roles | `roles.controller.ts` | `wiki/reference/api/usuarios-admin-y-seguridad.md` |
| `permisos` | Catálogo de permisos | `permisos.controller.ts` | `wiki/reference/api/usuarios-admin-y-seguridad.md` |
| `plantillas-roles` | Plantillas reutilizables de permisos | `plantillas-roles.controller.ts` | `wiki/reference/api/usuarios-admin-y-seguridad.md` |
| `admin` | Operaciones administrativas privilegiadas | `admin.controller.ts` | `wiki/reference/api/usuarios-admin-y-seguridad.md` |
| `dashboard` | KPIs y agregados de panel | `dashboard.controller.ts` | `wiki/reference/api/usuarios-admin-y-seguridad.md` |
| `producto` | Productos, proveedores asociados, alérgenos e histórico de precios | `producto.controller.ts`, `producto-proveedor.controller.ts`, `producto-alergeno.controller.ts`, `historial-precio.controller.ts` | `wiki/reference/api/catalogo-e-inventario.md` |
| `proveedor` | Gestión de proveedores | `proveedor.controller.ts` | `wiki/reference/api/catalogo-e-inventario.md` |
| `inventario` | Stock, ajustes y alertas | `inventario.controller.ts`, `alerta.controller.ts` | `wiki/reference/api/catalogo-e-inventario.md` |
| `movimiento` | Trazabilidad de movimientos de stock | `movimiento.controller.ts` | `wiki/reference/api/catalogo-e-inventario.md` |
| `merma` | Mermas y métricas asociadas | `merma.controller.ts` | `wiki/reference/api/catalogo-e-inventario.md` |
| `ubicacion` | Ubicaciones físicas o lógicas | `ubicacion.controller.ts` | `wiki/reference/api/catalogo-e-inventario.md` |
| `openfoodfacts` | Consulta externa de catálogo alimentario | `openfoodfacts.controller.ts` | `wiki/reference/api/catalogo-e-inventario.md` |
| `pedido` | Pedidos internos, agregados de usuario y lotes de compra | `pedido.controller.ts`, `pedido-usuario.controller.ts`, `purchase-batch.controller.ts` | `wiki/reference/api/compras-recepciones-e-incidencias.md` |
| `pedido-draft` | Borradores de pedido | `pedido-draft.controller.ts` | `wiki/reference/api/compras-recepciones-e-incidencias.md` |
| `recepcion` | Recepciones y líneas de recepción | `recepcion.controller.ts`, `recepcion-producto.controller.ts` | `wiki/reference/api/compras-recepciones-e-incidencias.md` |
| `recepcion-draft` | Borradores de recepción | `recepcion-draft.controller.ts` | `wiki/reference/api/compras-recepciones-e-incidencias.md` |
| `incidencia` | Incidencias y resolución de discrepancias | `incidencia.controller.ts`, `incidencia-resuelta.controller.ts` | `wiki/reference/api/compras-recepciones-e-incidencias.md` |
| `albaran` | Albaranes y trazabilidad de entrega | `albaran.controller.ts` | `wiki/reference/api/compras-recepciones-e-incidencias.md` |
| `distribucion` | Preparación, confirmación y cancelación de distribuciones | `distribucion.controller.ts` | `wiki/reference/api/compras-recepciones-e-incidencias.md` |
| `receta` | Recetas y producción | `receta.controller.ts`, `produccion.controller.ts` | `wiki/reference/api/produccion-y-recetas.md` |
| `preparacion` | Preparación operativa | `preparacion.controller.ts` | `wiki/reference/api/produccion-y-recetas.md` |
| `profesor` | Profesores, slots y relaciones educativas | `profesor.controller.ts` | `wiki/reference/api/modulo-educativo-soporte-y-operaciones.md` |
| `alumno` | Alumnado y relaciones con profesorado | `alumno.controller.ts` | `wiki/reference/api/modulo-educativo-soporte-y-operaciones.md` |
| `archivo` | Subida y consulta de ficheros | `archivo.controller.ts` | `wiki/reference/api/modulo-educativo-soporte-y-operaciones.md` |
| `export` | Exportaciones PDF y XLSX | `export.controller.ts` | `wiki/reference/api/modulo-educativo-soporte-y-operaciones.md` |

## Convenciones de módulo
- Carpeta por dominio en `src/modules/<modulo>/`
- Subcarpetas habituales: `controller/`, `service/`, `dto/`, `entity/`, `repository/` y `enums/` cuando aplica
- Endpoints bajo prefijo global `/api/v1`
- Seguridad por `@UseGuards(...)` y permisos por `@RequirePermissions(...)`

## Lectura recomendada

1. Empezar por `wiki/reference/api/contrato-global.md` para entender envelope, sesión y paginación.
2. Abrir después el documento de dominio indicado en la tabla anterior.
3. Complementar con `wiki/reference/entidades.md` y `wiki/architecture/backend.md` cuando se necesite contexto interno.

## Dependencias transversales
- `ConfigModule` global
- `TypeOrmModule.forRoot(typeOrmConfig)`
- `I18nConfigModule`
- `ThrottlerModule` con perfiles `auth`, `write`, `read`
- `CacheModule` global

## Documento de seguimiento

El estado de cobertura de la documentación backend/API se audita en `wiki/planning/improvements/auditoria-documentacion-backend-api.md`.
