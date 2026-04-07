# Referencia de API Backend

Esta carpeta sustituye la referencia monolítica anterior por una documentación de integración organizada por dominios. El objetivo es que un desarrollador pueda localizar rápido qué endpoint usar, qué debe enviar, por qué existe y qué tipo de respuesta debe esperar.

## Audiencia y alcance

- Audiencia principal: desarrolladores backend, frontend, QA e integradores internos.
- Alcance: contrato HTTP publicado por el backend NestJS bajo `/api/v1`.
- Fuera de alcance: detalles internos de servicios, repositorios y flujos de UI que no cambian el contrato HTTP.

## Fuentes de verdad usadas en esta referencia

1. Controladores NestJS en `backend/smart-economat-backend/src/modules/**/controller`.
2. Envelope global implementado por `TransformInterceptor`.
3. Contrato base expuesto por `main.ts` y los guards globales.
4. Entidades de negocio documentadas en [../entidades.md](../entidades.md).

## Navegación recomendada

| Documento | Qué cubre | Cuándo abrirlo |
| --- | --- | --- |
| [contrato-global.md](./contrato-global.md) | Base URL, autenticación, envelope, errores, paginación y convenciones de integración | Antes de consumir cualquier endpoint |
| [catalogo-e-inventario.md](./catalogo-e-inventario.md) | Productos, proveedores, inventario, movimientos, mermas, ubicaciones, alertas y OpenFoodFacts | Cuando trabajas con catálogo, stock o abastecimiento |
| [compras-recepciones-e-incidencias.md](./compras-recepciones-e-incidencias.md) | Pedidos, lotes de compra, borradores, recepciones, incidencias, albaranes y distribuciones | Para flujos de compra, recepción y resolución operativa |
| [produccion-y-recetas.md](./produccion-y-recetas.md) | Recetas, escandallos, producción y preparaciones | Para cocina, planificación y lotes internos |
| [usuarios-admin-y-seguridad.md](./usuarios-admin-y-seguridad.md) | Auth, usuarios, permisos, administración, plantillas y dashboard | Para acceso, sesión, administración y RBAC |
| [modulo-educativo-soporte-y-operaciones.md](./modulo-educativo-soporte-y-operaciones.md) | Profesores, alumnos, archivos, exportaciones y endpoint raíz | Para dominio educativo, soporte documental y salidas PDF/XLSX |

## Convenciones rápidas que conviene recordar

- Prefijo global: `/api/v1`.
- Swagger local: `/docs`.
- Respuesta estándar: `success`, `message`, `data`, `meta`.
- Sesión recomendada para frontend: cookie `access_token` + `GET /usuarios/perfil`.
- Excepciones de naming heredadas: `/proveedor`, `/inventario`, `/merma` y `/ubicacion` siguen en singular porque así existe hoy el contrato backend.
- Excepciones de routing heredadas: `/pedido/draft` y `/recepcion/draft` son rutas anidadas de borrador, no recursos REST plurales.

## Relación con el resto de la wiki

- Modelo de datos: [../entidades.md](../entidades.md)
- Seguridad funcional: [../../security/login-registro.md](../../security/login-registro.md)
- Auth educativo: [../../security/auth-sistema-educativo.md](../../security/auth-sistema-educativo.md)
- Roles y permisos: [../../security/roles-y-permisos.md](../../security/roles-y-permisos.md)

## Navegación complementaria

- [../api.md](../api.md) ofrece el inventario completo generado desde el backend.
- [../endpoints.md](../endpoints.md) sirve como mapa rápido de rutas y dominios.