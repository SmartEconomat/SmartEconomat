# 2026-05-14 — Pre-release production hardening gate (remediación auditorías backend)

## Proceso ejecutado
Auditoría técnica completa de todos los módulos backend (`docs/audits/backend/`).
Solo se aplicaron cambios donde hay bug real, riesgo de seguridad, inconsistencia de API,
problema de tipado crítico o estado inválido. Sin cambios cosméticos.

## Correcciones aplicadas (12 hallazgos)

### Bugs de seguridad/auditoría (inmediatas)
- **PREPARACION-001** — `preparacion.controller.ts`: bug de lectura de rol JWT.
  `req.user?.rol?.nombre` (siempre `undefined`) → `req.user?.rol` (string correcto).
  Efecto: los admins ya pueden ver preparaciones soft-deleted.
- **MOVIMIENTO-001** — `movimiento.controller.ts`: POST /movimientos ahora fuerza
  `dto.usuario = req.user.id` desde el token. Ya no es posible suplantar el actor de auditoría.
- **RECEPCION-001** — `recepcion.controller.ts`: `dto.usuarioId = dto.usuarioId || userId`
  → `dto.usuarioId = userId`. Suplantación de operador en recepción eliminada.

### Tipado / contratos
- **AUTH-002** — `auth.service.ts`: `any[]` → `FindOptionsWhere<Usuario>[]` en `register`.
- **ARCHIVO-001** — `archivo.controller.ts`: `Promise<any>` → `Promise<{ message: string; data: FileResponseDto }>`.
  Importada entidad `Archivo` para tipar `mapToResponseDto`.
- **MOVIMIENTO-002** — `movimiento.service.ts` + `create-movimiento.dto.ts`:
  `before/after?: any` y `datosAntes/datosDespues?: any` → `Record<string, unknown>`.

### Arquitectura / consistencia
- **PLANTILLAS-ROLES-001** — `plantillas-roles.controller.ts`: eliminado `type PlantillasRolesCrudContract`
  y los dos casts `as unknown as`. Los métodos `duplicateTemplate` y `setTemplateActivo` son
  públicos en el servicio y se llaman directamente.
- **ALUMNO-002** — `alumno.controller.ts`: `@UseGuards(JwtAuthGuard, PermisosGuard)` movido
  a nivel de clase. Eliminado guard redundante en `changeProfesor`.
- **ROLES-001** — `roles.controller.ts`: import de `GetUser` unificado a la ruta canónica
  `../../auth/decorators/get-user.decorator` (en lugar de `sherlock-auth`).
- **PROVEEDOR-001** — `proveedor.controller.ts`: todos los `ParseUUIDPipe` → `ParseUUIDv7Pipe`
  (consistente con el resto de módulos).
- **ADMIN-002** — `admin.service.ts`: `getRoles/getPermissions` con repos opcionales ahora lanzan
  `InternalServerErrorException` en vez de retornar `[]` silenciosamente.

## Tests añadidos (3 nuevos archivos, 1 actualizado)
- `test/modules/preparacion/preparacion.controller.spec.ts` (7 tests)
- `test/modules/movimiento/movimiento.controller.spec.ts` (3 tests)
- `test/modules/recepcion/recepcion.controller.spec.ts` (3 tests)
- `test/modules/admin/admin.service.spec.ts` — añadidos 3 tests para `ADMIN-002`

## Validación
- Los 4 suites de nuevos tests: 23 tests ✅
- Suite unitario completo: en ejecución en background

## Riesgos no atacados (fuera del alcance de corrección mínima)
- SHERLOCK-AUTH-001: bypass de permisos para roles elevados → intencional por diseño (necesita decisión de arquitectura).
- PEDIDO-001: idempotencia en POST /pedidos → requiere cambio de contrato API (Idempotency-Key header).
- RECEPCION-002: modularización de RecepcionStockService → refactor mayor.
- MOVIMIENTO-001 (HTTP endpoint): Se eliminó la suplantación, pero el campo `usuario` en el DTO
  sigue siendo opcional para uso interno (helper `log` del servicio). Documentado como intencional.
