# Reference: Mapa de endpoints del backend

Este documento es un índice rápido. No sustituye a la referencia detallada por dominios; sirve para localizar una ruta base y saltar a la página adecuada.

## Convenciones rápidas

- Base URL: `/api/v1`
- Swagger local: `/docs`
- Sesión recomendada: cookie `access_token` + `GET /usuarios/perfil`
- Envelope habitual: `success`, `message`, `data`, `meta`

## Rutas base por dominio

| Ruta base | Qué agrupa | Documento detallado |
| --- | --- | --- |
| `/auth` | Login, logout, registro y recuperación de contraseña | [api/usuarios-admin-y-seguridad.md](./api/usuarios-admin-y-seguridad.md) |
| `/usuarios` | Perfil, CRUD, roles y permisos por usuario | [api/usuarios-admin-y-seguridad.md](./api/usuarios-admin-y-seguridad.md) |
| `/admin` | Operaciones administrativas privilegiadas | [api/usuarios-admin-y-seguridad.md](./api/usuarios-admin-y-seguridad.md) |
| `/plantillas-roles` | Plantillas reutilizables de permisos | [api/usuarios-admin-y-seguridad.md](./api/usuarios-admin-y-seguridad.md) |
| `/dashboard` | KPIs y estadísticas de panel | [api/usuarios-admin-y-seguridad.md](./api/usuarios-admin-y-seguridad.md) |
| `/productos` | Catálogo de productos | [api/catalogo-e-inventario.md](./api/catalogo-e-inventario.md) |
| `/producto-proveedor` | Relación abastecimiento producto-proveedor | [api/catalogo-e-inventario.md](./api/catalogo-e-inventario.md) |
| `/producto-alergenos` | Asociación producto-alérgeno | [api/catalogo-e-inventario.md](./api/catalogo-e-inventario.md) |
| `/historial-precio` | Histórico de precios | [api/catalogo-e-inventario.md](./api/catalogo-e-inventario.md) |
| `/proveedor` | Proveedores | [api/catalogo-e-inventario.md](./api/catalogo-e-inventario.md) |
| `/inventario` | Stock y ajustes | [api/catalogo-e-inventario.md](./api/catalogo-e-inventario.md) |
| `/alertas` | Alertas de stock y caducidad | [api/catalogo-e-inventario.md](./api/catalogo-e-inventario.md) |
| `/movimientos` | Trazabilidad de stock | [api/catalogo-e-inventario.md](./api/catalogo-e-inventario.md) |
| `/merma` | Mermas y KPIs | [api/catalogo-e-inventario.md](./api/catalogo-e-inventario.md) |
| `/ubicacion` | Ubicaciones físicas o lógicas | [api/catalogo-e-inventario.md](./api/catalogo-e-inventario.md) |
| `/openfoodfacts` | Consulta externa de catálogo | [api/catalogo-e-inventario.md](./api/catalogo-e-inventario.md) |
| `/pedidos` | Pedidos a proveedor | [api/compras-recepciones-e-incidencias.md](./api/compras-recepciones-e-incidencias.md) |
| `/pedido-usuarios` | Pedidos agregados de usuario | [api/compras-recepciones-e-incidencias.md](./api/compras-recepciones-e-incidencias.md) |
| `/purchase-batches` | Lotes de compra | [api/compras-recepciones-e-incidencias.md](./api/compras-recepciones-e-incidencias.md) |
| `/pedido/draft` | Borrador de pedido | [api/compras-recepciones-e-incidencias.md](./api/compras-recepciones-e-incidencias.md) |
| `/recepciones` | Recepciones y reportes PDF | [api/compras-recepciones-e-incidencias.md](./api/compras-recepciones-e-incidencias.md) |
| `/recepcion-productos` | Líneas de recepción | [api/compras-recepciones-e-incidencias.md](./api/compras-recepciones-e-incidencias.md) |
| `/recepcion/draft` | Borrador de recepción | [api/compras-recepciones-e-incidencias.md](./api/compras-recepciones-e-incidencias.md) |
| `/incidencias` | Discrepancias y resolución | [api/compras-recepciones-e-incidencias.md](./api/compras-recepciones-e-incidencias.md) |
| `/incidencias-resueltas` | Cierres de incidencia | [api/compras-recepciones-e-incidencias.md](./api/compras-recepciones-e-incidencias.md) |
| `/albaranes` | Documentación de entrega | [api/compras-recepciones-e-incidencias.md](./api/compras-recepciones-e-incidencias.md) |
| `/distribuciones` | Preparación y confirmación de distribuciones | [api/compras-recepciones-e-incidencias.md](./api/compras-recepciones-e-incidencias.md) |
| `/recetas` | Recetas, escandallos y PDFs | [api/produccion-y-recetas.md](./api/produccion-y-recetas.md) |
| `/produccion` | Lotes productivos | [api/produccion-y-recetas.md](./api/produccion-y-recetas.md) |
| `/preparaciones` | Preparación operativa | [api/produccion-y-recetas.md](./api/produccion-y-recetas.md) |
| `/profesores` | Registro docente, slots y alumnos | [api/modulo-educativo-soporte-y-operaciones.md](./api/modulo-educativo-soporte-y-operaciones.md) |
| `/alumnos` | Alta de alumno y cambio de profesor | [api/modulo-educativo-soporte-y-operaciones.md](./api/modulo-educativo-soporte-y-operaciones.md) |
| `/archivos` | Ficheros genéricos del sistema | [api/modulo-educativo-soporte-y-operaciones.md](./api/modulo-educativo-soporte-y-operaciones.md) |
| `/export` | Exportaciones PDF y XLSX | [api/modulo-educativo-soporte-y-operaciones.md](./api/modulo-educativo-soporte-y-operaciones.md) |
| `/` | Endpoint raíz del backend | [api/modulo-educativo-soporte-y-operaciones.md](./api/modulo-educativo-soporte-y-operaciones.md) |

## Rutas especiales que conviene recordar

| Ruta | Particularidad |
| --- | --- |
| `/proveedor` | Singular heredado |
| `/inventario` | Singular heredado |
| `/merma` | Singular heredado |
| `/ubicacion` | Singular heredado |
| `/pedido/draft` | Recurso anidado de borrador |
| `/recepcion/draft` | Recurso anidado de borrador |

## Siguiente paso recomendado

1. Leer [api/contrato-global.md](./api/contrato-global.md).
2. Saltar al documento de dominio que corresponda.
3. Contrastar la forma de `data` con [entidades.md](./entidades.md) cuando el endpoint devuelva agregados de negocio.
