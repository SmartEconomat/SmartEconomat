# Plan de Recomendaciones — SmartEconomat Backend

> Fecha: 23 de marzo de 2026  
> Basado en los hallazgos de [findings.md](./findings.md)

---

## Metodología de priorización

Cada recomendación se clasifica según:

- **Prioridad:** Inmediata / Sprint 1 / Sprint 2 / Backlog
- **Esfuerzo:** Bajo (<2 h) / Medio (2–8 h) / Alto (>8 h)
- **Impacto:** Seguridad · Estabilidad · Rendimiento · Mantenibilidad

---

## Inmediatas (antes del próximo despliegue a producción)

### R-01 — Endurecer configuración CORS  

**ID Finding:** C-001 · **Esfuerzo:** Bajo · **Impacto:** Seguridad

**Problema:**  
`origin: process.env.FRONTEND_API_URL || '*'` en `src/main.ts:48` permite que el servidor arranque con `origin: '*'` si la variable de entorno no está definida. La combinación `credentials: true` + `origin: '*'` es rechazada por los navegadores modernos y supone un fallo silencioso de seguridad.

**Pasos concretos:**
1. En `src/main.ts`, antes de `enableCors`, validar que `FRONTEND_API_URL` está definida cuando `NODE_ENV === 'production'`:
   ```ts
   // Validación al arranque (no silenciosa)
   if (process.env.NODE_ENV === 'production' && !process.env.FRONTEND_API_URL) {
     throw new Error('FRONTEND_API_URL is required in production');
   }
   app.enableCors({
     origin: process.env.FRONTEND_API_URL || 'http://localhost:5173',
     credentials: true,
   });
   ```
2. Verificar que `.env.prod` y los pipelines de CI siempre tienen `FRONTEND_API_URL` definida.
3. Añadir `FRONTEND_API_URL` como variable requerida al checklist de despliegue.

---

### R-02 — Proteger `synchronize: true` automático  

**ID Finding:** C-002 · **Esfuerzo:** Bajo · **Impacto:** Seguridad / Estabilidad de datos

**Problema:**  
En `src/config/database.config.ts:50–51`, si `NODE_ENV` está indefinido (contenedor sin `.env` correcto), TypeORM activa `synchronize: true` y puede alterar el schema automáticamente en entornos no previstos.

**Pasos concretos:**
1. Cambiar el valor por defecto para que sea `false` explícitamente:
   ```ts
   synchronize: process.env.DB_SYNC === 'true',
   // Eliminar: || (NODE_ENV !== 'production' && NODE_ENV !== 'test')
   ```
2. Actualizar `.env.dev` y `.env.example` con `DB_SYNC=true` para desarrollo local.
3. Añadir al README del backend una nota: "Para desarrollo local, asegúrate de tener `DB_SYNC=true` o ejecutar `npm run migration:run`".

---

### R-03 — Añadir endpoint de health check  

**ID Finding:** M-006 · **Esfuerzo:** Bajo · **Impacto:** Estabilidad / Operaciones

**Problema:**  
No existe un endpoint `GET /healthz` para probes de Kubernetes, Docker healthcheck del backend o monitorización externa.

**Pasos concretos:**
1. En `src/app.controller.ts`, añadir:
   ```ts
   @Get('healthz')
   @Public()   // decorador ya existente en el proyecto
   healthz() {
     return { status: 'ok', timestamp: new Date().toISOString() };
   }
   ```
2. En `docker-compose.prod.yml`, añadir el healthcheck del servicio backend:
   ```yaml
   healthcheck:
     test: ['CMD-SHELL', 'wget -qO- http://localhost:3000/api/v1/healthz || exit 1']
     interval: 30s
     timeout: 10s
     retries: 3
   ```
3. Documentar el endpoint en Swagger (ya configurado en el proyecto).

---

## Sprint 1 (primera semana)

### R-04 — Limpiar `console.*` en servicios de producción  

**ID Findings:** H-001, H-002, H-003 · **Esfuerzo:** Bajo–Medio · **Impacto:** Observabilidad / Seguridad

**Problema:**  
`AuthService`, `AuthPermissionsService` y `ProduccionService` contienen `console.error` y `console.log('DEBUG: ...')` que se mezclan con el logger estructurado de NestJS y no llegan a Sentry.

**Pasos concretos:**
1. En `AuthService`: inyectar `private readonly logger = new Logger(AuthService.name)` y sustituir `console.error` por `this.logger.error`.
2. En `AuthPermissionsService`: eliminar la línea `console.error('AuthPermissionsService Error:', error)` (el `this.logger.error` inmediatamente superior ya hace el mismo trabajo).
3. En `ProduccionService` (`src/modules/receta/service/produccion.service.ts`): eliminar o reemplazar los 7 `console.log('DEBUG: ...')` por `this.logger.debug(...)` para que sean controlables por nivel de log.
4. Ejecutar `npm run lint --fix` para detectar otros `console.*` olvidados (la config ESLint puede tener la regla `no-console`).

---

### R-05 — Garantizar liberación del `queryRunner` en todos los escenarios  

**ID Finding:** H-005 · **Esfuerzo:** Medio · **Impacto:** Estabilidad (connection pool)

**Problema:**  
`albaran.service.ts`, `recepcion-stock.service.ts` y `purchase-batch.service.ts` crean un `queryRunner` manualmente y tienen bloques `try/catch`, pero sin `finally { await queryRunner.release() }`. Un error no capturado puede dejar conexiones abiertas hasta agotar el pool.

**Pasos concretos:**  
Para cada servicio afectado, asegurarse de que el patrón es:
```ts
const queryRunner = this.dataSource.createQueryRunner();
await queryRunner.connect();
await queryRunner.startTransaction();
try {
  // lógica...
  await queryRunner.commitTransaction();
} catch (err) {
  await queryRunner.rollbackTransaction();
  throw err;
} finally {
  await queryRunner.release(); // ← SIEMPRE
}
```
Los archivos a revisar:
- `src/modules/albaran/service/albaran.service.ts` — líneas ~119–215
- `src/modules/recepcion/service/recepcion-stock.service.ts` — líneas ~120–390 y ~450–870
- `src/modules/pedido/service/purchase-batch.service.ts` — líneas ~38–125

---

### R-06 — Separar query de listado de usuarios vs. detalle  

**ID Finding:** H-004 · **Esfuerzo:** Medio · **Impacto:** Rendimiento

**Problema:**  
`UsuarioRepository.findAll()` carga 5 niveles de relaciones en cada página de resultados, independientemente de si el cliente necesita esa información.

**Pasos concretos:**
1. Crear un método `findAllBase(query)` que solo cargue `relations: ['roles']` y seleccione columnas base.
2. Mantener `findById(id)` con las relaciones completas para la vista de detalle.
3. En `usuario.controller.ts`, usar `findAllBase` para `GET /usuarios` y `findById` para `GET /usuarios/:id`.
4. Medir la diferencia de latencia con el seeder masivo (`npm run seed:massive`).

---

## Sprint 2

### R-07 — Incrementar cobertura de tests en módulos críticos  

**ID Finding:** M-004 · **Esfuerzo:** Alto · **Impacto:** Mantenibilidad / Seguridad

**Problema:**  
Según `wiki/planning/use-cases-test/tests-faltantes.md`, quedan sin tests >100 casos de uso críticos: guards de auth, operaciones de admin, recepción masiva.

**Pasos concretos (por orden de prioridad):**
1. **Guards (seguridad):** Escribir tests unitarios para `JwtAuthGuard.canActivate()` (token válido, expirado, sin token) y `AuthPermissionsGuard` (permiso concedido, denegado, usuario inactivo). Archivos: `src/modules/auth/guards/` y `src/modules/sherlock-auth/guards/`.
2. **Admin atomicidad:** Testear `AdminService` con scenarions de fallo parcial en la transacción usuario+profesor.
3. **Recepción masiva:** Cubrir el flujo `procesarRecepcionMasiva` en `recepcion-stock.service.ts` con al menos: recepción correcta, recepción con incidencias, rollback por error de stock.
4. Actualizar `wiki/planning/use-cases-test/tests-faltantes.md` marcando los casos cubiertos.

---

### R-08 — Configurar `SENTRY_DSN` con inicialización condicional  

**ID Finding:** M-007 · **Esfuerzo:** Bajo · **Impacto:** Rendimiento / Mantenibilidad

**Problema:**  
`src/instrument.ts` siempre inicializa Sentry aunque `SENTRY_DSN` sea `undefined`. Esto genera carga innecesaria y posibles warnings en entornos de test/dev.

**Pasos concretos:**
1. En `src/instrument.ts`, envolver la inicialización:
   ```ts
   if (process.env.SENTRY_DSN) {
     Sentry.init({ dsn: process.env.SENTRY_DSN, ... });
   }
   ```
2. Añadir log informativo cuando Sentry no está configurado (útil para debugging):
   ```ts
   else {
     console.warn('[Sentry] SENTRY_DSN not defined — monitoring disabled');
   }
   ```

---

### R-09 — Documentar ADR sobre patrón de transacciones  

**ID Finding:** M-005 · **Esfuerzo:** Bajo · **Impacto:** Mantenibilidad

**Problema:**  
El codebase usa dos patrones de transaccion. Ambos son correctos; la inconsistencia aumenta la curva de aprendizaje para nuevos contribuidores.

**Pasos concretos:**
1. Crear `wiki/development/adr-transacciones.md` indicando cuándo usar `dataSource.transaction(callback)` (recomendado para flujos simples) y cuándo `createQueryRunner()` (necesario cuando se requiere control fino de savepoints o múltiples commits).
2. Añadir un enlace en el README del backend.

---

## Backlog

### R-10 — Revisar variables de host en docker-compose.dev  

**ID Finding:** M-008 · **Esfuerzo:** Bajo · **Impacto:** Seguridad (información del desarrollador)

Evaluar si `HOST_USER`, `HOST_MAC`, `HOST_GIT_EMAIL` son necesarias en el contenedor. Si solo se usan en el script de bienvenida (`log-user-info.ts`), limitar su alcance a ese script y no exponerlas como variables de entorno persistentes del contenedor.

---

### R-11 — Configurar pool de conexiones PostgreSQL explícitamente  

**ID Finding:** L-001 · **Esfuerzo:** Bajo · **Impacto:** Rendimiento bajo carga

Añadir en `src/config/database.config.ts`:
```ts
extra: {
  max: 20,
  min: 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
},
```
Ajustar `max` según el número esperado de peticiones concurrentes y el `max_connections` del servidor PostgreSQL.

---

### R-12 — Ejecutar `npm audit` y actualizar transitivas con CVE  

**ID Finding:** Dependencias · **Esfuerzo:** Bajo · **Impacto:** Seguridad

```bash
cd backend/smart-economat-backend
npm audit
npm audit fix  # solo para actualizaciones de parche seguras
```
Revisar manualmente las dependencias de `jimp`, `@jsquash/webp` y `pdfmake` que tienen potencialmente muchas transitivas. Actualizar el lock file y documentar los cambios.

---

### R-13 — Añadir `jti` al payload JWT para revocación futura  

**ID Finding:** L-004 · **Esfuerzo:** Medio · **Impacto:** Seguridad (preparación)

El sistema actual no soporta revocación de tokens individuales (ej. logout forzado desde otro dispositivo). Para prepararlo:
1. Añadir `jti: randomUUID()` al `JwtPayload`.
2. No requiere Redis ahora, pero deja el campo listo para una lista de revocación futura.

---

### R-14 — Mover `git` del stage `production` al stage `builder` en Dockerfile.prod  

**ID Finding:** L-002 · **Esfuerzo:** Bajo · **Impacto:** Seguridad (reducción de superficie de ataque)

Verificar si `git` es necesario en runtime. Si solo se usa durante el build o el script de log, moverlo al stage `builder`:
```dockerfile
FROM node:22.2.0-alpine AS builder
RUN apk add --no-cache git ...
```
La imagen de producción final debería tener la menor superficie de ataque posible.
