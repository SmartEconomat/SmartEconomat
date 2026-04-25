# SmartEconomat — Wiki del Proyecto

Documentación técnica y funcional del proyecto SmartEconomat, reorganizada por áreas para reducir duplicidad y facilitar el mantenimiento.

**Stack principal:** NestJS 11 · React 19 · TypeORM · PostgreSQL · Docker · JWT

## Anotaciones Markdown

Para resaltar contexto dentro de la wiki, usa callouts compatibles con GitHub en lugar de títulos sueltos como `## Nota` o avisos con emoji en línea.

```md
> [!NOTE]
> Aclaración breve o contexto complementario.
```

Tipos recomendados:

- `> [!NOTE]` para contexto adicional o aclaraciones.
- `> [!TIP]` para consejos prácticos o atajos útiles.
- `> [!IMPORTANT]` para restricciones o decisiones que no deben ignorarse.
- `> [!WARNING]` para riesgos operativos relevantes.
- `> [!CAUTION]` para acciones destructivas o irreversibles.

---

## Documentación Backend (Diátaxis)

Este bloque agrupa la documentación completa y detallada del backend NestJS + TypeORM bajo los cuatro cuadrantes Diátaxis.

### Índice principal

| Sección | Documento |
|---|---|
| Overview | [Visión general backend](overview.md) |
| Arquitectura | [Arquitectura backend](architecture/backend.md) |
| Patrones | [Patrones y trade-offs](architecture/patrones-y-tradeoffs.md) |
| Tutorial | [Levantar proyecto desde cero](tutorials/levantar-proyecto-desde-cero.md) |
| Tutorial | [Laboratorio de estados de incidencias](tutorials/laboratorio-estados-incidencias.md) |
| How-to | [Crear entidad y relaciones](how-to/crear-entidad-y-relaciones.md) |
| How-to | [Reproducir estados de incidencia](how-to/reproducir-estados-incidencia.md) |
| How-to | [Generar y aplicar migración](how-to/generar-y-aplicar-migracion.md) |
| How-to | [Añadir módulo/controller/service/DTOs](how-to/anadir-modulo-controller-service-dtos.md) |
| How-to | [Endpoint con validación y errores](how-to/endpoint-con-validacion-y-errores.md) |
| How-to | [Usar transacciones seguras](how-to/usar-transacciones-seguras.md) |
| How-to | [Añadir logging estructurado](how-to/anadir-logging-estructurado.md) |
| How-to | [Configurar producción con Docker](how-to/configurar-produccion-docker.md) |
| How-to | [Implementar soft-delete](how-to/implementar-soft-delete.md) |
| How-to | [Relaciones many-to-many y one-to-many](how-to/relaciones-many-to-many-y-one-to-many.md) |
| Explanation | [Flujo completo de una request](explanation/flujo-completo-request.md) |
| Explanation | [Incidencias: estados y ciclo de vida](explanation/incidencias-estados-y-ciclo-de-vida.md) |
| Explanation | [Elección de patrones y trade-offs](explanation/patrones-eleccion-y-tradeoffs.md) |
| Explanation | [Seguridad, performance y escalabilidad](explanation/seguridad-performance-escalabilidad.md) |
| Reference | [Módulos y responsabilidades](reference/modulos-y-responsabilidades.md) | Documentación de los módulos de dominio principales |
| Reference | [Entidades TypeORM](reference/entidades.md) | Catálogo de entidades y relaciones del backend |
| Reference | [Estados del negocio](reference/estados-del-negocio.md) | Referencia canónica de estados, chips y badges de dominio |
| Reference | [Máquina de estados de incidencias](reference/incidencias-maquina-de-estados.md) | Reglas, prioridades y transiciones reales del módulo de incidencias |
| Reference | [API backend](reference/api/README.md) | Referencia de integración por dominios, con requests, respuestas y entidades relacionadas |
| Reference | [Mapa rápido de endpoints](reference/endpoints.md) | Índice corto de rutas base y saltos a la referencia detallada |
| Reference | [TypeORM, DataSource y seeders](reference/typeorm-y-datasource.md) | Cómo conectar al ORM, configurar la fuente de datos y ejecutar seeders |
| Reference | [Variables de entorno](reference/variables-entorno.md) | Inventario de variables de configuración por entorno |
| Reference | [Pipes, guards, interceptors y filters](reference/pipes-guards-interceptors-globales.md) | Capas transversales y pipeline global de la API |
| Diagramas | [Arquitectura backend (Mermaid)](diagrams/arquitectura-backend.md) |

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
| [Dependencias](getting-started/dependencias.md) | Resumen de dependencias runtime y enlace a la referencia detallada |

## Arquitectura

| Documento | Descripción |
|-----------|-------------|
| [Arquitectura backend](architecture/backend.md) | Capas, patrones y organización del servidor NestJS |
| [Arquitectura frontend](architecture/frontend.md) | Estructura React, estado y composición |
| [Modelo de datos](architecture/data-model.md) | Entidades y relaciones principales |
| [UUID v7](architecture/uuid-v7.md) | Implementación de UUID v7 en BD y aplicación |
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
| [Protección CSRF](security/csrf-protection.md) | Implementación de Double Submit Cookie para seguridad de peticiones |

## Módulos funcionales

| Documento | Descripción |
|-----------|-------------|
| [Alta compleja de producto](modules/producto/alta-compleja-producto-maestro-proveedores.md) | Caso de uso de creación transaccional de producto maestro con alérgenos y proveedores |
| [Producción y raciones](modules/produccion/produccion-y-raciones.md) | Gestión de transformación de ingredientes, raciones producidas vs restantes y costes reales |
| [Módulo de pedidos](modules/pedido/README.md) | Visión funcional del nuevo modelo `PedidoUsuario` + pedidos internos + compras consolidadas |
| [Automatización de pedidos](modules/pedido/automatizacion-fechas-estados.md) | Estados, fechas automáticas y sincronización entre agregados y pedidos internos |
| [Pedidos desde recetas](modules/pedido/pedidos-desde-recetas.md) | Consolidación de ingredientes de múltiples recetas en un pedido único |
| [Edición y selección de líneas](modules/pedido/edicion-y-seleccion-lineas.md) | Selector avanzado de líneas de pedido con soporte multi-proveedor y autocompletado |
| [Recepción](modules/recepcion/README.md) | Visión general del módulo de recepción |
| [Recepción masiva](modules/recepcion/recepcion-masiva.md) | Flujo batch y garantías ACID |
| [Arquitectura UI de recepción](modules/recepcion/arquitectura-ui.md) | Diseño de la interfaz del módulo |
| [Albaranes](modules/albaran/README.md) | Rol documental del albarán dentro del flujo de compras y recepción |
| [Administración](modules/admin/README.md) | Acciones privilegiadas de gobierno sobre usuarios, roles y seguridad |
| [Dashboard](modules/dashboard/README.md) | KPIs agregados y principios de lectura del panel principal |
| [Archivos](modules/archivo/README.md) | Gestión genérica de ficheros y diferencia frente a documentos de negocio |
| [Exportación](modules/export/README.md) | Generación de binarios XLSX y PDF a partir de filtros de dominio |

## Frontend

| Documento | Descripción |
|-----------|-------------|
| [Índice frontend](frontend/README.md) | Punto de entrada a la documentación de UI |
| [UI inventario](frontend/ui-inventario.md) | Arquitectura de la interfaz de inventario |
| [useBreakpoints](frontend/useBreakpoints.md) | Hook responsive centralizado |
| [Hooks de Permisos](frontend/hooks-permisos.md) | Gestión reactiva de autorizaciones |
| [Gestión de Usuarios](frontend/gestion-usuarios.md) | Vista consolidada de administración |

## Referencia y operación

| Documento | Descripción |
|-----------|-------------|
| [API backend](reference/api/README.md) | Referencia de integración por dominios, con requests, respuestas y entidades relacionadas |
| [Mapa rápido de endpoints](reference/endpoints.md) | Índice corto de rutas base y saltos a la referencia detallada |
| [Dependencias frontend y backend](reference/dependencias-frontend-backend.md) | Inventario runtime por librería, uso real y motivo técnico |
| [Troubleshooting](operations/troubleshooting/README.md) | Problemas frecuentes y soluciones |
| [Auditoría backend](audits/backend-unused-endpoints.md) | Auditoría técnica disponible del backend |
| [Auditoría documental backend y API](planning/improvements/auditoria-documentacion-backend-api.md) | Matriz de cobertura actual, huecos y prioridades para cerrar la documentación del backend |
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
