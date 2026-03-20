# SmartEconomat — Wiki del Proyecto

Documentación técnica y funcional del proyecto SmartEconomat, reorganizada por áreas para reducir duplicidad y facilitar el mantenimiento.

**Stack principal:** NestJS 11 · React 19 · TypeORM · PostgreSQL · Docker · JWT

---

## Estructura recomendada

| Área | Contenido |
|------|-----------|
| [getting-started/](getting-started/) | Puesta en marcha, requisitos y dependencias |
| [architecture/](architecture/) | Arquitectura backend/frontend, modelo de datos y UUID v7 |
| [development/](development/) | Convenciones, TypeORM, normalización, seeders, testing |
| [security/](security/) | Roles, permisos y autenticación |
| [modules/](modules/) | Documentación específica de módulos de negocio |
| [frontend/](frontend/) | Documentación de UI, páginas, componentes y servicios |
| [reference/](reference/) | API, Postman y referencias operativas |
| [operations/](operations/) | Troubleshooting y documentación operativa |
| [audits/](audits/) | Auditorías backend y frontend |
| [planning/](planning/) | Casos de uso, mejoras propuestas y registro de reuniones |
| [assets/](assets/) | Diagramas, imágenes y recursos auxiliares |
| [archive/](archive/) | Material legado o histórico |

---

## Primeros pasos

| Documento | Descripción |
|-----------|-------------|
| [Inicio rápido](getting-started/inicio-rapido.md) | Cómo clonar, configurar y ejecutar el proyecto |
| [Requisitos técnicos](getting-started/requisitos-tecnicos.md) | Requisitos funcionales y no funcionales |
| [Dependencias](getting-started/dependencias.md) | Dependencias clave y justificación de uso |

## Arquitectura

| Documento | Descripción |
|-----------|-------------|
| [Arquitectura backend](architecture/backend.md) | Capas, patrones y organización del servidor NestJS |
| [Arquitectura frontend](architecture/frontend.md) | Estructura React, estado y composición |
| [Estructura backend](architecture/backend-structure.md) | Mapa de carpetas del backend |
| [Modelo de datos](architecture/data-model.md) | Entidades y relaciones principales |
| [UUID v7](architecture/uuid-v7.md) | Implementación de UUID v7 en BD y aplicación |
| [UI inventario](architecture/ui-inventario.md) | Arquitectura de la interfaz de inventario |
| [Soft Delete](architecture/soft-delete.md) | Sistema de borrado lógico global |

## Desarrollo

| Documento | Descripción |
|-----------|-------------|
| [Convenciones](development/convenciones.md) | Estilo, nombres y prácticas de código |
| [Trabajo en equipo](development/trabajo-en-equipo.md) | Flujo de ramas, commits y coordinación |
| [TypeORM](development/typeorm.md) | Entidades, relaciones, migraciones y repositorios |
| [Normalización de datos](development/normalizacion-datos.md) | Reglas y arquitectura de normalización |
| [Normalización rápida](development/normalizacion-quick-reference.md) | Cheatsheet de normalización |
| [Referencia rápida backend](development/backend-quick-reference.md) | Cheatsheet backend |
| [Seeders](development/seeders.md) | Datos de desarrollo y seeders |
| [Testing](development/testing/README.md) | Sistema de tests y guías de uso |
| [Contratos frontend-backend E2E](development/testing/frontend-backend-contracts-e2e.md) | Suite E2E que valida payloads y filtros corregidos entre frontend y backend |
| [Análisis de rendimiento de tests](development/testing-performance-analysis.md) | Análisis del rendimiento de la infraestructura de testing |

## Seguridad

| Documento | Descripción |
|-----------|-------------|
| [Roles y permisos](security/roles-y-permisos.md) | Jerarquía de accesos y matriz de capacidades |
| [Permisos dinámicos](security/permisos-dinamicos.md) | Sistema RBAC (153 permisos), lógica y hooks |
| [Login y Registro](security/login-registro.md) | Flujos de acceso, validación de CIAL y Slots |
| [Auth sistema educativo](security/auth-sistema-educativo.md) | Vinculación profesor-alumno y ciclo de vida |
| [RBAC detallado](security/rbac.md) | Matriz técnica completa de permisos |

## Módulos funcionales

| Documento | Descripción |
|-----------|-------------|
| [Alta compleja de producto](modules/producto/alta-compleja-producto-maestro-proveedores.md) | Caso de uso de creación transaccional de producto maestro con alérgenos y proveedores |
| [Pedidos desde recetas](modules/pedido/pedidos-desde-recetas.md) | Consolidación de ingredientes de múltiples recetas en un pedido único |
| [Recepción](modules/recepcion/README.md) | Visión general del módulo de recepción |
| [Recepción masiva](modules/recepcion/recepcion-masiva.md) | Flujo batch y garantías ACID |
| [Arquitectura UI de recepción](modules/recepcion/arquitectura-ui.md) | Diseño de la interfaz del módulo |

## Frontend

| Documento | Descripción |
|-----------|-------------|
| [Índice frontend](frontend/README.md) | Punto de entrada a la documentación de UI |
| [Arquitectura UI](frontend/arquitectura.md) | Arquitectura de la interfaz |
| [useBreakpoints](frontend/useBreakpoints.md) | Hook responsive centralizado |
| [Hooks de Permisos](frontend/hooks-permisos.md) | Gestión reactiva de autorizaciones |
| [Gestión de Usuarios](frontend/gestion-usuarios.md) | Vista consolidada de administración |

## Referencia y operación

| Documento | Descripción |
|-----------|-------------|
| [API](reference/api.md) | Referencia de endpoints, DTOs y autenticación |
| [Troubleshooting](operations/troubleshooting/README.md) | Problemas frecuentes y soluciones |
| [Auditoría backend](audits/backend/INDICE_AUDITORIA.md) | Índice de la auditoría técnica del backend |
| [Auditoría frontend](audits/frontend/AUDITORIA_FRONTEND.md) | Auditoría del frontend |
| [Casos de uso](planning/use-cases/use-cases.md) | Casos de uso funcionales |
| [Mejoras propuestas](planning/improvements/) | Propuestas de evolución del producto |

## Recursos

| Recurso | Ubicación |
|---------|-----------|
| Diagrama ER | [assets/resources/diagram-ER.drawio](assets/resources/diagram-ER.drawio) |
| Colección Postman | [reference/postman/SmartEconomat_Postman_Collection.json](reference/postman/SmartEconomat_Postman_Collection.json) |
| Imágenes | [assets/images/](assets/images/) |
| Registro de reuniones | [planning/registro-reuniones.md](planning/registro-reuniones.md) |
| Documentos legacy | [archive/legacy-docx/README.md](archive/legacy-docx/README.md) |
