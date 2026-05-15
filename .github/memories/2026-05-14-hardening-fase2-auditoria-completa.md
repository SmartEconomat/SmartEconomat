# 2026-05-14 — Hardening fase 2: remediación completa de auditorías backend

## Cambios aplicados

### Seguridad / Feature flags
- **AUTH-001**: `AuthService.register()` protegido con `ALLOW_PUBLIC_REGISTER` env var.
  Lanza `ForbiddenException` si no es `"true"`. Requiere `ConfigService` inyectado.
- **PROF-001**: Mismo patrón en `ProfesorService.register()`.

### Validación de archivos
- **ALBARAN-002**: `AlbaranService.uploadDocumento()` valida MIME (whitelist: image/jpeg,
  image/png, image/webp, image/gif, application/pdf) y tamaño máximo 10 MB antes de
  llamar a `compressImageFile`.

### Contratos y tipado
- **AuthenticatedUser interface**: `src/common/interfaces/authenticated-user.interface.ts`
  — shape oficial de `req.user` inyectado por `JwtStrategy.validate()`.
- **DASHBOARD-001**: `DashboardStatsDto` añade `generatedAt: Date`. El servicio lo
  popula con `new Date()` al final de `getStats()`. `movimientosRecientes: any[]` → `Partial<Movimiento>[]`.
- **PEDIDO-DRAFT-002**: `UpsertPedidoDraftDto.payload` limitado a 64 KB mediante
  `@Transform` que lanza `BadRequestException` si el JSON supera el umbral.
- **USUARIO-001**: `PerfilResponseDto` nuevo DTO en `usuario/dto/`. `getPerfil()` del
  controller excluye explícitamente `password`, `resetPasswordOtp`, `resetPasswordOtpExpires`,
  `deletedAt`, `deletedBy` antes de retornar.

### Rate limiting
- **ALUMNO-001**: `@Throttle` añadido en los 5 endpoints `@Public()` del `AlumnoController`:
  - `register`: `{ auth: { limit: 5, ttl: 60000 } }`
  - catálogos (aulas/clases/profesores/slots): `{ read: { limit: 30-60, ttl: 60000 } }`
- **PRODUCTO-001**: `@Throttle({ read: { limit: 5, ttl: 60000 } })` en `generarEan13`.

### Auditoría RBAC
- **ROLES-002**: `Logger` añadido a `RolesService`. `assignRoleToUser` y `assignPermissions`
  emiten logs estructurados `[RBAC] ...` con actor, rol, usuario y cambio.

### Documentación de seguridad
- **SHERLOCK-AUTH-001**: Constante `ELEVATED_ROLE_BYPASS_ENABLED` y bloque de comentario
  explicativo en `permissions.guard.ts` documentan el bypass intencional para ADMIN/SUPER_ADMIN.
- **PERMISOS-001**: Comentario explícito en `permisos.controller.ts` advierte que `grouped`
  DEBE estar antes de `:id` en el orden de declaración de rutas.
- **INCIDENCIA-001**: `@ApiOperation` ampliado en `PATCH /:id/resolver` y `POST /:id/resolver`
  para distinguir `ResolverIncidenciaDto` (progresivo) de `ResolveIncidenciaDto` (administrativo).

### Permisos RBAC
- **PROF-002**: `adminCreateSlot` en `ProfesorController` usa
  `PERMISSIONS.profesor.gestionar_slots` en lugar de `PERMISSIONS.usuarios.listar`.

### i18n
- Añadidas claves a `es/translation.json` y `en/translation.json`:
  - `PUBLIC_REGISTER_DISABLED`
  - `UNSUPPORTED_FILE_TYPE`
  - `FILE_TOO_LARGE`

## Tests añadidos (fase 2)
- `test/modules/auth/auth-feature-flag.spec.ts` (3 tests)
- `test/modules/profesor/profesor-feature-flag.spec.ts` (3 tests)
- `test/modules/albaran/albaran-mime-validation.spec.ts` (6 tests)
- `test/modules/dashboard/dashboard-generated-at.spec.ts` (1 test)
- `test/modules/pedido-draft/pedido-draft-payload-limit.spec.ts` (4 tests)
- `test/modules/usuario/usuario-perfil-dto.spec.ts` (5 tests)
- `test/modules/roles/roles-audit-log.spec.ts` (3 tests)
- `test/modules/permisos/permisos.controller.spec.ts` (3 tests)

## Hallazgos ya resueltos en código (no requerían cambio)
- OPENFOODFACTS-001: ya tenía `AbortSignal.timeout()` y rate-limiter propio
- RECETA-001: ya validaba `idArray.length > MAX_RECIPES_PDF_EXPORT` en controller
- DISTRIBUCION-001: `isSherlockElevatedRole(undefined) → false` (seguro por defecto)
- MERMA-001: ambas rutas comparten `registerMerma` privado (lógica unificada)

## Variable de entorno requerida
`ALLOW_PUBLIC_REGISTER=true` — añadir al `.env` de desarrollo/pruebas para mantener
compatibilidad con el flujo de registro de alumnos y profesores.
