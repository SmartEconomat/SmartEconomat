# Wiki oficial de SmartEconomat

Esta wiki es la referencia técnica y funcional del proyecto. Cada tema debe tener una única fuente canónica; los documentos legacy o de compatibilidad se conservan solo para no romper rutas históricas y siempre deben redirigir a la versión vigente.

## Acceso rápido

| Tema | Documento canónico | Cuándo usarlo |
| --- | --- | --- |
| Inicio | [getting-started/inicio-rapido.md](getting-started/inicio-rapido.md) | Levantar el entorno local con Docker o de forma nativa |
| Arquitectura | [architecture/index.md](architecture/index.md) | Entender backend, frontend, modelo de datos y decisiones técnicas |
| Seguridad | [security/login-registro.md](security/login-registro.md) | Revisar auth, sesión, registro y cambio de contraseña |
| RBAC | [security/rbac.md](security/rbac.md) | Ver el diseño técnico de roles, permisos y guards |
| API | [reference/api.md](reference/api.md) | Consultar contrato HTTP, paginación y convenciones de integración |
| Backend transversal | [reference/pipes-guards-interceptors-globales.md](reference/pipes-guards-interceptors-globales.md) | Consultar interceptores, helpers, pipes, decorators, filters, transformers y middlewares |
| Frontend | [frontend/README.md](frontend/README.md) | Navegar por páginas, componentes y servicios del cliente |
| Despliegue | [DEPLOYMENT.md](DEPLOYMENT.md) | Preparar y operar producción con Docker Compose |
| Operación | [operations/troubleshooting/README.md](operations/troubleshooting/README.md) | Resolver incidencias frecuentes |

## Mapa de la documentación

| Ruta | Contenido principal |
| --- | --- |
| [getting-started/](getting-started/) | Puesta en marcha, requisitos y dependencias |
| [architecture/](architecture/) | Backend, frontend, modelo de datos, UUID v7 y soft delete |
| [development/](development/) | Convenciones, TypeORM, normalización, seeders y testing |
| [security/](security/) | Login, registro, RBAC, roles y permisos |
| [modules/](modules/) | Documentación funcional por módulo de negocio |
| [frontend/](frontend/) | Arquitectura UI, páginas, componentes y servicios |
| [reference/](reference/) | API, endpoints, variables de entorno y Postman |
| [operations/](operations/) | Troubleshooting y operación de despliegues |
| [audits/](audits/) | Revisiones de arquitectura, seguridad y recomendaciones |
| [planning/](planning/) | Casos de uso, mejoras y material de planificación |
| [assets/](assets/) | Diagramas, imágenes y recursos auxiliares |
| [archive/](archive/) | Documentación histórica y legado |

## Documentos recomendados por área

### Arquitectura

| Documento | Alcance |
| --- | --- |
| [architecture/backend.md](architecture/backend.md) | Capas, módulos y flujo del backend NestJS |
| [architecture/frontend.md](architecture/frontend.md) | Organización del cliente React y su modelo de sesión |
| [architecture/data-model.md](architecture/data-model.md) | Entidades y relaciones del dominio |
| [architecture/patrones-y-tradeoffs.md](architecture/patrones-y-tradeoffs.md) | Decisiones técnicas y compromisos del diseño |
| [architecture/backend-structure.md](architecture/backend-structure.md) | Mapa de carpetas del backend |

### Desarrollo

| Documento | Alcance |
| --- | --- |
| [development/convenciones.md](development/convenciones.md) | Convenciones de nombres, DTOs y estilo |
| [development/typeorm.md](development/typeorm.md) | Entidades, relaciones, migraciones y repositorios |
| [development/seeders.md](development/seeders.md) | Seeders disponibles y su propósito |
| [development/testing/README.md](development/testing/README.md) | Infraestructura y ejecución de tests |
| [development/backend-quick-reference.md](development/backend-quick-reference.md) | Cheatsheet operativo del backend |

### Seguridad

| Documento | Alcance |
| --- | --- |
| [security/login-registro.md](security/login-registro.md) | Flujo de acceso, cookie de sesión y recuperación de contraseña |
| [security/auth-sistema-educativo.md](security/auth-sistema-educativo.md) | Registro, slots y activación del módulo educativo |
| [security/roles-y-permisos.md](security/roles-y-permisos.md) | Vista funcional de capacidades por rol |
| [security/permisos-dinamicos.md](security/permisos-dinamicos.md) | Resolución de permisos en runtime y uso desde frontend |
| [security/rbac.md](security/rbac.md) | Detalle técnico de decorators, guards y fuentes de permisos |

### Referencia y operación

| Documento | Alcance |
| --- | --- |
| [reference/api.md](reference/api.md) | Contrato API canónico y convenciones de integración |
| [reference/endpoints.md](reference/endpoints.md) | Inventario de controladores y rutas principales |
| [reference/pipes-guards-interceptors-globales.md](reference/pipes-guards-interceptors-globales.md) | Referencia de componentes transversales backend |
| [reference/variables-entorno.md](reference/variables-entorno.md) | Variables soportadas en local y producción |
| [operations/troubleshooting/README.md](operations/troubleshooting/README.md) | Errores frecuentes y soluciones verificadas |
| [audits/README.md](audits/README.md) | Índice de auditorías y hallazgos |

## Recursos útiles

| Recurso | Ubicación |
| --- | --- |
| Colección Postman | [reference/postman/SmartEconomat_Postman_Collection.json](reference/postman/SmartEconomat_Postman_Collection.json) |
| Diagrama ER | [assets/resources/diagram-ER.drawio](assets/resources/diagram-ER.drawio) |
| Registro de reuniones | [planning/registro-reuniones.md](planning/registro-reuniones.md) |
| Diagramas Mermaid | [diagrams/arquitectura-backend.md](diagrams/arquitectura-backend.md) |
| Legado documental | [archive/legacy-docx/README.md](archive/legacy-docx/README.md) |

## Documentación legacy y compatibilidad

Los siguientes documentos se conservan para no romper enlaces antiguos, pero no son la fuente activa de mantenimiento:

- [sistema-educativo-auth.md](sistema-educativo-auth.md) redirige a [security/auth-sistema-educativo.md](security/auth-sistema-educativo.md).
- [paquetes_y_dependencias.md](paquetes_y_dependencias.md) redirige a [getting-started/dependencias.md](getting-started/dependencias.md).
- [arquitectura_ui_inventario.md](arquitectura_ui_inventario.md) redirige a [architecture/ui-inventario.md](architecture/ui-inventario.md).
- [errores/](errores/) queda como alias legacy de [operations/troubleshooting/](operations/troubleshooting/).
- [por_corregir/](por_corregir/) conserva notas de backlog históricas y no debe usarse como referencia vigente.

## Criterio editorial

- Cada tema debe tener un documento canónico claramente identificable.
- Los documentos deben describir el comportamiento real del código, no el deseado ni el histórico.
- Las guías operativas deben citar archivos, scripts y rutas existentes en el repositorio actual.
- Cuando un documento quede obsoleto, debe convertirse en redirección corta o moverse a [archive/](archive/).
