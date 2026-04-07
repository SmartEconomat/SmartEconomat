# Hallazgos de Auditoría — SmartEconomat Backend

> Fecha: 23 de marzo de 2026 · Metodología: Análisis estático de código

---

## Leyenda de severidades

| Severidad | Criterio |
|---|---|
| **Critical** | Riesgo de seguridad explotable o pérdida de datos en producción |
| **High** | Degradación severa de seguridad, estabilidad o rendimiento |
| **Medium** | Problema de mantenibilidad, observabilidad o rendimiento moderado |
| **Low** | Mejora de calidad, documentación o buenas prácticas |

---

## Critical

| ID | Archivo | Línea | Descripción | Evidencia | Recomendación |
|---|---|---|---|---|---|
| C-001 | `src/main.ts` | 48 | **CORS con `origin: '*'` + `credentials: true` si `FRONTEND_API_URL` no está definida.** La spec CORS prohíbe `*` con credenciales; en navegadores modernos la petición es rechazada o tratada de forma impredecible. | `origin: process.env.FRONTEND_API_URL \|\| '*'` | Lanzar error al arranque si `FRONTEND_API_URL` está vacío en `NODE_ENV=production`. Usar siempre un origen explícito. |
| C-002 | `src/config/database.config.ts` | 50–51 | **`synchronize: true` automático cuando `NODE_ENV` es `undefined`.** Si el proceso arranca sin la variable de entorno definida, TypeORM ejecuta `ALTER TABLE` automáticamente pudiendo destruir columnas. | `synchronize: process.env.DB_SYNC === 'true' \|\| (NODE_ENV !== 'production' && NODE_ENV !== 'test')` | Requerir `NODE_ENV` explícito al arranque. Valor por defecto debe ser `false`. Usar migraciones siempre en producción. |

---

## High

| ID | Archivo | Línea | Descripción | Evidencia | Recomendación |
|---|---|---|---|---|---|
| H-001 | `src/modules/auth/service/auth.service.ts` | 110–112 | **`console.error` en servicio de producción.** El error de envío de email se registra con `console.error` en lugar del `Logger` de NestJS, por lo que no aparece en el sistema de logging estructurado ni en Sentry. | `console.error('Error sending password reset email:', error)` | Inyectar `private readonly logger = new Logger(AuthService.name)` y sustituir por `this.logger.error(...)`. |
| H-002 | `src/modules/auth/service/auth-permissions.service.ts` | 65–66 | **`console.error` duplicado con `this.logger.error`.** El bloque `catch` llama a ambos, generando doble salida y contaminando el log. | `this.logger.error(...)` seguido de `console.error('AuthPermissionsService Error:', error)` | Eliminar la línea `console.error`. |
| H-003 | `src/modules/receta/service/produccion.service.ts` | 83–85, 141, 156, 170, 183 | **7 instrucciones `console.log('DEBUG: ...')` en servicio de producción.** Estos logs exponen lógica interna sensible (IDs, cantidades de producción) al log del sistema en producción. | `console.log('DEBUG: recetaId', receta.id)` etc. | Eliminar todos los `console.log` de DEBUG o sustituirlos por `this.logger.debug(...)` controlados por el nivel de log. |
| H-004 | `src/modules/usuario/repository/usuario.repository.ts` | 131–137 | **`findAll` carga 5 niveles de relaciones (`roles`, `alumno`, `alumno.slot`, `alumno.profesor`, `alumno.profesor.user`) en cada listado paginado.** En datasets grandes (>500 usuarios) genera múltiples JOINs sincrónicos con impacto medible en latencia. | `relations: ['roles', 'alumno', 'alumno.slot', 'alumno.profesor', 'alumno.profesor.user']` | Separar la query de listado (solo campos mínimos + rol) de la query de detalle. Usar `select` para limitar columnas proyectadas. |
| H-005 | `src/modules/albaran/service/albaran.service.ts` | 119–212 | **`queryRunner` no liberado en el camino happy-path de cancelación prematura.** Si se lanza una excepción antes del bloque `finally`, el queryRunner puede quedar sin `release()`. | Bloque `try/catch` sin `finally { await queryRunner.release() }` | Añadir bloque `finally { await queryRunner.release() }` para garantizar liberación de la conexión en todos los escenarios. Mismo patrón aplicable a `recepcion-stock.service.ts` y `purchase-batch.service.ts`. |

---

## Medium

| ID | Archivo | Línea | Descripción | Evidencia | Recomendación |
|---|---|---|---|---|---|
| M-001 | `src/common/decorators/is-unique.decorator.ts` | 19–21 | **Validación de unicidad fuera de transacción.** `findOne` + `save` no ocurren en la misma transacción, creando ventana de race condition. | `const exists = await repository.findOne({ where: ... })` seguido de `return !exists` | Documentar el comportamiento esperado. La BD resuelve el conflicto mediante UNIQUE constraint + traducción de error 23505 en `GlobalExceptionFilter`, pero bajo carga concurrente alta puede aparecer. |
| M-002 | `src/config/database.config.ts` | 59 | **Credenciales de BD mostradas en log al arranque en entorno de desarrollo.** Aunque se enmascara la contraseña, muestra host, usuario y nombre de BD, facilitando recon en entornos compartidos. | `console.log('Database Config:', { ...dbConfig, password: '*****' })` | Usar nivel `debug` de NestJS Logger y proteger el bloque con condición más restrictiva, o eliminarlo. |
| M-003 | Múltiples seeders | Varios | **`console.log`/`console.warn` masivos en seeders sin uso del Logger de NestJS.** En entornos donde los seeders se lanzan como parte del flujo CI/CD, estos logs no se procesan por el sistema de observabilidad. | Archivos: `producto.seeder.ts`, `seed.ts`, `roles-permisos.seeder.ts`, otros 8 archivos | Documentar que los seeders usan stdout directo intencionalmente (scripts standalone), o migrar a un logger configurable. |
| M-004 | `test/` (varios) | — | **Cobertura ~40–50% en lógica crítica.** Según `wiki/planning/use-cases-test/tests-faltantes.md`, quedan >100 casos de uso sin test, incluyendo guards de auth, operaciones de admin y flujos de recepción masiva. | Archivo de planificación existente: `tests-faltantes.md` | Priorizar tests de guards (`JwtAuthGuard`, `AuthPermissionsGuard`) y operaciones de admin que usan transacciones. |
| M-005 | `src/modules/pedido/service/pedido.service.ts` y `recepcion-stock.service.ts` | Varios | **Mix de patrones de transacción.** Algunos servicios usan `dataSource.transaction(callback)` y otros `createQueryRunner()` manual. Ambos son correctos pero la inconsistencia dificulta el mantenimiento. | Comparar `pedido.service.ts` (queryRunner) vs `producto.service.ts` (callback) | Documentar en ADR (Architecture Decision Record) el patrón preferido para nuevas implementaciones. |
| M-006 | `src/app.module.ts` | — | **Sin endpoint de health check.** No existe ruta `/healthz` ni `/livez` para probes de Kubernetes u orquestadores. El `docker-compose.prod.yml` tiene healthcheck en DB y Redis pero no en el servicio backend. | Ausencia de ruta `@Get('healthz')` en `AppController` | Añadir endpoint `GET /healthz` sin autenticación que retorne `{ status: 'ok', timestamp }`. |
| M-007 | `src/instrument.ts` | 5–7 | **Sentry se inicializa aunque `SENTRY_DSN` sea `undefined`.** El SDK se carga siempre; si el DSN es vacío no envía eventos pero consume recursos de inicialización innecesariamente. | `dsn: process.env.SENTRY_DSN` (puede ser `undefined`) | Inicializar Sentry condicionalmente: `if (process.env.SENTRY_DSN) { Sentry.init(...) }` |
| M-008 | `docker-compose.dev.yml` | 35–37 | **Entorno dev expone variables de host (`HOST_USER`, `HOST_MAC`, `HOST_GIT_EMAIL`) dentro del contenedor.** Esto puede filtrar información del desarrollador si el contenedor es inspeccionado. | `HOST_USER`, `HOST_MAC`, `HOST_GIT_EMAIL` en sección `environment` | Evaluar si es estrictamente necesario. Si se usa solo para el script de log, limitar a ese uso o eliminar. |

---

## Low

| ID | Archivo | Línea | Descripción | Evidencia | Recomendación |
|---|---|---|---|---|---|
| L-001 | `src/config/database.config.ts` | — | **Pool de conexiones no configurado explícitamente.** TypeORM usa 10 conexiones por defecto. Bajo alta carga puede ser insuficiente. | Sin `extra: { max: N }` en `dbConfig` | Añadir `extra: { max: 20, idleTimeoutMillis: 30000 }` y ajustar según carga esperada. |
| L-002 | `backend/Dockerfile.prod` | — | **`git` instalado en imagen de producción** sin aparente necesidad runtime. | `RUN apk add --no-cache git` en stage `production` | Verificar si es realmente necesario en producción. Si solo se usa en build, moverlo al stage `builder`. |
| L-003 | `src/app.module.ts` | 48–55 | **Cache global `CacheModule` con TTL de 300 000 ms (5 min) y máximo 100 entradas.** Si la app tiene picos de usuarios concurrentes con IDs únicos, 100 entradas puede provocar evictions frecuentes. | `ttl: 300000, max: 100` | Revisar si `max: 100` es suficiente para el número máximo de usuarios simultáneos esperados. |
| L-004 | `src/modules/auth/service/auth.service.ts` | 160+ | **JWT payload mínimo (`sub`, `username`, `role`).** No incluye `iat`/`exp` explícitos ni `jti` para revocación de tokens. | `JwtPayload: { sub, username, role }` | Considerar añadir `jti` (JWT ID) para soporte futuro de revocación sin state adicional. |
| L-005 | `src/common/decorators/is-unique.decorator.ts` | 26 | **Mensaje de error expone el nombre de la clase de entidad.** `${entityClass.name} with this ${args.property} already exists` puede revelar nombres internos del modelo de dominio. | `defaultMessage` retorna `entityClass.name` | Usar mensaje genérico: `'El valor ya existe'` o traducir con i18n. |
| L-006 | `src/modules/auth/mail.service.ts` | 11 | **`FRONTEND_API_URL` con fallback a `localhost:5173` en producción.** Si la variable no está definida, los correos de recuperación de contraseña apuntarán a localhost, inutilizables para el receptor. | `process.env.FRONTEND_API_URL \|\| 'http://localhost:5173'` | Validar que `FRONTEND_API_URL` esté definido en producción o lanzar advertencia al inicializar `MailService`. |
