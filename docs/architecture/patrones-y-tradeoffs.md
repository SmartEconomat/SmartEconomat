# Patrones y Prácticas Usadas (NestJS + TypeORM)

## Repository Pattern con TypeORM
El proyecto usa repositorios inyectados por módulo para aislar la persistencia del flujo HTTP.

### Beneficios
- Desacopla lógica de negocio de SQL explícito.
- Facilita mockeo en tests unitarios.
- Permite evolucionar entidades sin reescribir controladores.

### Trade-off
- Puede ocultar detalles de performance en consultas complejas.
- Solución aplicada: QueryBuilder y transacciones explícitas cuando corresponde.

## Dependency Injection, providers y modules
NestJS organiza cada dominio en módulo con providers y controllers.

### Beneficios
- Composición predecible del sistema.
- Ciclo de vida controlado por framework.
- Reutilización mediante imports/exports.

### Trade-off
- Número alto de módulos incrementa surface area de configuración.
- Solución aplicada: `AppModule` centraliza wiring explícito.

## DTO + ValidationPipe + class-validator/transformer
Se utiliza validación global con `I18nValidationPipe` (`whitelist`, `forbidNonWhitelisted`, `transform`).

### Beneficios
- Sanitización de input en borde.
- Conversión automática de tipos en query/params.
- Mensajes de error internacionalizados.

### Trade-off
- Mayor rigidez al evolucionar payloads.
- Solución aplicada: DTOs específicos por operación (create/update/filter).

## Guards, Interceptors y Exception Filters
- Guards: autenticación JWT, permisos y rate limiting.
- Interceptors: serialización y formato homogéneo de respuesta.
- Exception filter global: normaliza errores de negocio y BD.

### Beneficios
- Seguridad consistente sin repetir lógica en cada endpoint.
- Respuestas de error uniformes para frontend.

### Trade-off
- Diagnóstico más complejo si no se documenta orden de ejecución.
- Solución aplicada: documentación explícita del pipeline request-response.

## ConfigModule + Logger + Observabilidad
- `ConfigModule` global para parámetros de entorno.
- Logger de Nest por servicio.
- Integración con Sentry para capturar excepciones.

### Beneficios
- Configuración centralizada y portable.
- Mayor trazabilidad de incidentes.

## Migraciones, seeders y DataSource
- DataSource en `src/config/database.config.ts`.
- Seeders organizados por módulo en `src/seeders/`.
- Scripts npm para reset de esquema y carga de datos.

### Trade-off
- Existe comando de migraciones, pero la base del flujo de desarrollo depende de sincronización automática.
- Recomendación: consolidar migraciones como source of truth para producción.

## Transacciones y QueryRunner
Coexisten dos patrones:
- `dataSource.transaction(...)` para operaciones agrupadas.
- `QueryRunner` para control granular (commit/rollback manual).

### Beneficios
- Integridad fuerte en flujos multi-entidad.
- Recuperación segura ante errores parciales.

## Estrategia de testing
- Unit tests para lógica aislada.
- E2E tests para validar contratos reales HTTP/DB.
- Setup/teardown global para entornos controlados.

## Checklist de prácticas vigentes
- DTO en endpoints públicos
- Guards en rutas protegidas
- Soft delete en entidades transversales
- Índices y constraints de integridad
- Serialización consistente de salida
- Scripts de seed para reproducibilidad de datos
