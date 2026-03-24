# Informe de Seguridad — SmartEconomat Backend

> Fecha: 23 de marzo de 2026  
> Estándares de referencia: OWASP Top 10 · NestJS Security Best Practices · TypeORM Security Guidelines

---

## Resumen ejecutivo

La superficie de ataque del backend SmartEconomat es **moderada**. El sistema implementa correctamente autenticación basada en JWT, cookies `httpOnly`, RBAC granular y validación estricta de entradas. Los riesgos más relevantes no están en la lógica de autorización sino en **configuración insegura por omisión** (CORS, variables de entorno) y **observabilidad/logging** (uso de `console.*` en producción y ausencia de validaciones de secrets al arranque).

---

## Evaluación OWASP Top 10 (2021)

| Categoría OWASP | Estado | Hallazgos clave |
|---|---|---|
| **A01 — Broken Access Control** | ✅ **Bueno** | `JwtAuthGuard` + `AuthPermissionsGuard` + decoradores `@RequirePermissions` / `@RequireAnyPermission` aplicados consistentemente. Riesgo residual: TTL de cache 300 s para permisos. |
| **A02 — Cryptographic Failures** | ✅ **Bueno** | `bcrypt` para passwords, JWT firmado, cookies `secure` en producción. Mejora recomendada: `jti` en JWT y rotación de `JWT_SECRET`. |
| **A03 — Injection** | ✅ **Bueno** | Uso de TypeORM query builder y `findOne({ where: ... })`, no se detectan concatenaciones de SQL manual. Riesgo residual: parámetros dinámicos en decorador `@IsUnique` pero protegidos por metadata. |
| **A04 — Insecure Design** | ⚠️ **Medio** | Ausencia de rate limiting distribuido y falta de health checks/boot validation. No hay pruebas de amenazas (threat modeling) documentadas. |
| **A05 — Security Misconfiguration** | 🔴 **Crítico** | `CORS` con fallback `origin: '*'`, `credentials: true`; `synchronize: true` si `NODE_ENV` no está definido; Sentry se carga sin DSN. |
| **A06 — Vulnerable and Outdated Components** | ⚠️ **Sin evidencia actual** | Dependencias principales actualizadas; no se ejecutó `npm audit` en esta auditoría. Riesgo residual en transitivas de `jimp`, `pdfmake`, `@jsquash/webp`. |
| **A07 — Identification and Authentication Failures** | ✅ **Bueno** | Login con comparación bcrypt, recuperación de contraseña con token SHA-256 y expiración 15 min, cookies `httpOnly`. Mejora: tracking/revocación de sesiones activas. |
| **A08 — Software and Data Integrity Failures** | ⚠️ **Medio** | Dockerfiles multi-stage correctos, pero sin firma de imágenes ni SBOM. Falta pipeline de integridad de dependencias. |
| **A09 — Security Logging and Monitoring Failures** | ⚠️ **Medio–Alto** | Uso de `console.log`/`console.error` fuera del logger central; Sentry opcional pero no forzado; sin métricas de seguridad expuestas. |
| **A10 — SSRF** | ✅ **Controlado** | El único `fetch` externo significativo es a OpenFoodFacts en `producto.seeder.ts`, limitado a entornos no test y no expuesto por HTTP público. Riesgo bajo. |

---

## Hallazgos detallados de seguridad

### 1. Configuración CORS insegura por omisión

**Severidad:** 🔴 Critical  
**Archivo:** `src/main.ts`  
**Línea:** 48

```ts
app.enableCors({
  origin: process.env.FRONTEND_API_URL || '*',
  credentials: true,
});
```

**Riesgo:**  
- En producción, si `FRONTEND_API_URL` no está definida, el backend arranca con `origin: '*'` y `credentials: true`.
- La spec CORS prohíbe el uso de `*` con credenciales, por lo que las peticiones autenticadas del frontend pueden fallar silenciosamente o quedar en un estado ambiguo según el navegador.

**Recomendación:**  
Lanzar error al arranque si `FRONTEND_API_URL` no está definida en `NODE_ENV=production`.

---

### 2. `synchronize: true` si `NODE_ENV` no está definido

**Severidad:** 🔴 Critical  
**Archivo:** `src/config/database.config.ts`  
**Líneas:** 50–51

```ts
synchronize: process.env.DB_SYNC === 'true' ||
  (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test')
```

**Riesgo:**  
Si el contenedor o proceso arranca sin `NODE_ENV` (error en `.env`, CI o docker-compose), TypeORM activará `synchronize: true` y puede alterar el schema sin aprobación humana.

**Recomendación:**  
Usar `synchronize: process.env.DB_SYNC === 'true'` y documentar `DB_SYNC=true` solo para entornos de desarrollo.

---

### 3. Logging inseguro / no estructurado

**Severidad:** 🟠 High  
**Archivos:**
- `src/modules/auth/service/auth.service.ts:112`
- `src/modules/auth/service/auth-permissions.service.ts:66`
- `src/modules/receta/service/produccion.service.ts:83,84,85,141,156,170,183`

**Riesgo:**  
Uso de `console.error` y `console.log('DEBUG: ...')` en servicios productivos. Esto provoca:
- Doble registro del mismo error.
- Falta de correlación con `requestId` / Sentry.
- Posible fuga de datos sensibles (IDs, cantidades, parámetros de producción) a stdout.

**Recomendación:**  
Sustituir por `this.logger.error` / `this.logger.debug` y controlar la emisión mediante nivel de log y entorno.

---

### 4. Rate limiting no distribuido

**Severidad:** 🟡 Medium  
**Archivo:** `src/app.module.ts`

```ts
ThrottlerModule.forRoot([
  { name: 'auth', ttl: 60000, limit: 100 },
  { name: 'write', ttl: 60000, limit: 200 },
  { name: 'read', ttl: 60000, limit: 1000 },
])
```

**Riesgo:**  
El throttler de NestJS usa almacenamiento en memoria por defecto. En un despliegue con múltiples instancias (Kubernetes, ECS, Docker Swarm) cada pod/instancia aplica su propio rate limit independiente.

**Mitigación actual:**  
`SmartAuthThrottlerGuard` identifica por usuario autenticado / email / IP y añade soft delay progresivo.

**Recomendación:**  
Migrar a `@nestjs/throttler-storage-redis` o equivalente antes de escalar horizontalmente.

---

### 5. Secrets sin validación al arranque

**Severidad:** 🟡 Medium  
**Archivos:**
- `src/main.ts` — `FRONTEND_API_URL`
- `src/instrument.ts` — `SENTRY_DSN`
- `src/modules/auth/mail.service.ts` — `FRONTEND_API_URL`

**Riesgo:**  
Si las variables de entorno críticas no están definidas, la aplicación arranca con fallbacks inseguros o incorrectos (`localhost:5173`, `*`, DSN undefined).

**Recomendación:**  
Añadir validación de entorno centralizada usando `ConfigModule.forRoot({ validate })` con Joi o Zod para requerir:
- `JWT_SECRET`
- `DB_HOST`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`
- `FRONTEND_API_URL` en producción
- `BACKEND_API_URL` en producción
- `SENTRY_DSN` opcional pero validado si se proporciona

---

### 6. Recuperación de contraseña correcta pero con observabilidad mejorable

**Severidad:** 🟢 Low  
**Archivo:** `src/modules/auth/service/auth.service.ts`

**Aspectos positivos:**
- Token generado con `crypto.randomBytes(32)`
- Token hasheado con SHA-256 antes de persistir
- Expiración a 15 minutos
- No devuelve error si el usuario no existe → evita user enumeration

**Mejoras posibles:**
- Añadir métricas de seguridad: número de solicitudes de reset por IP / usuario
- Incluir limitador específico en la ruta `forgot-password`

---

## Controles de seguridad presentes

### Controles implementados correctamente

- **JWT + cookies `httpOnly`**
  - `cookie.interceptor.ts` marca `secure: process.env.NODE_ENV === 'production'`
- **RBAC dinámico + cache Redis**
  - `AuthPermissionsService` centraliza permisos efectivos con invalidación de cache
- **Validación de inputs**
  - `I18nValidationPipe` global: `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`
- **Error handling global**
  - `GlobalExceptionFilter` traduce errores de BD y añade `x-request-id`
- **Trust proxy**
  - `expressApp.set('trust proxy', 1)` correcto para despliegue tras reverse proxy
- **Entidades con índices**
  - `@Index` presente en la mayoría de FKs y campos consultados con frecuencia

### Controles ausentes o incompletos

- **Helmet** o headers de seguridad HTTP explícitos
  - No se detecta `app.use(helmet())`
- **CSRF protection**
  - La app usa cookies JWT; no se detecta un middleware CSRF explícito. Si el frontend usa solo `Authorization: Bearer`, el riesgo es menor. Si depende de cookie de sesión implícita, conviene evaluar CSRF.
- **Validación centralizada de env**
  - No hay `validate()` en `ConfigModule`
- **Health check**
  - No existe `/healthz`

---

## Checklist de hardening recomendado

### Nivel 1 — Bloqueantes para producción

- [ ] Forzar `FRONTEND_API_URL` explícita en producción
- [ ] Eliminar fallback `origin: '*'`
- [ ] Eliminar `synchronize` implícito por ausencia de `NODE_ENV`
- [ ] Sustituir `console.*` por `Logger`
- [ ] Añadir `/healthz`

### Nivel 2 — Muy recomendado

- [ ] Añadir validación de entorno con Joi / Zod
- [ ] Migrar throttler a Redis-backed storage
- [ ] Añadir `helmet()` en `main.ts`
- [ ] Revisar necesidad de CSRF si el frontend depende exclusivamente de cookie JWT
- [ ] Asegurar inicialización condicional de Sentry

### Nivel 3 — Mejora continua

- [ ] Ejecutar `npm audit` en CI
- [ ] Generar SBOM (Software Bill of Materials)
- [ ] Añadir `jti` a los JWT para revocación futura
- [ ] Crear threat model sencillo del flujo de login y permisos

---

## Conclusión

La seguridad del backend está por encima de la media para un proyecto NestJS de tamaño medio: auth robusta, validación global, cache de permisos y transacciones bien implementadas. Sin embargo, los problemas de **configuración insegura por omisión** (CORS y TypeORM synchronize), más la **falta de validación centralizada de variables críticas**, son lo bastante importantes como para bajar la nota global de seguridad.

**Puntuación de seguridad estimada:** **75 / 100**
