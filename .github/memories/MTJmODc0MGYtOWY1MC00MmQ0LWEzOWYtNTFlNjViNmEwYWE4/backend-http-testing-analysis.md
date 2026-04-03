# Análisis HTTP Testing - Backend Smart Economat

## Hallazgos Principales

### 1. RIESGO CRÍTICO: Seeders con Tolerancia a Errores No-2xx

**Archivo**: `/src/seeders/http-seed.catalog.ts` (línea 65-92)

Función `safe()` que SILENCIA errores HTTP sin fallar:

```typescript
async function safe<T>(label: string, fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch (error) {
    // ⚠️ SILENCIA ERRORES:
    if (message.includes('403')) return null;  // Forbidden
    if (message.includes('404')) return null;  // Not found
    if (message.includes('401')) return null;  // Unauthorized
    if (message.includes('429')) return null;  // Rate limited
    if (message.includes('409')) return null;  // Conflict
    // + duplicados, already-exists, etc.
    throw error;
  }
}
```

Usado en ~50+ peticiones POST/GET/PATCH/DELETE sin validación.

### 2. Seeders con HTTP Request/Response Tracking

**Archivos**: 
- `/src/seeders/massive.ts` (línea 378)
- `/src/seeders/massive.runtime.ts` (línea 595-760)

Sistema de estado:
- Valida `statusCode >= 200 && statusCode < 300` correctamente
- Usa `countAsSuccess` como flag explícito
- Pero algunos caminos aceptan rangos amplios con `expectedStatusCodes`

### 3. Tests E2E - Assertions de Status Code

**Patrón correcto** (mayoría):
```typescript
.expect(201)   // Assertions explícitas
.expect(200)
.expect(204)
.expect(404)
expect(response.status).toBe(409)
```

**Riesgo detectado**: Peticiones sin assertions:
- Línea incidencias.e2e-spec.ts:60-108 - POST/GET sin .expect()
- Algunos requests iniciales para setup

### 4. Fixture/Auth Dependencies (Orden de Ejecución)

- beforeAll() setup con login cadena (admin → profesor → alumno)
- Seeders dependen de orden: usuarios → profesores → alumnos → inventario
- Si auth falla (400/401), cascada de fallos

### 5. Retry Logic

- SeedContext tiene `retry` handling (seed-context.ts:689)
- parseRetryAfterMs() para 429
- Pero retry aún marca success si 2xx OR en expectedStatusCodes[]

## Patrones Existentes para Exigir 2xx

✅ **Bien hecho**:
```typescript
// massive.runtime.ts: línea 677-683
if (statusCode >= 200 && statusCode < 300) {
  collectStateFromResponse(...);
  countAsSuccess: true;
}

// test-helpers.ts
expectStandardResponse(response, 200)
expectErrorResponse(response, 400)
```

❌ **Riesgo**:
- safe() en seeders
- Peticiones sin .expect() en E2E

## Dependencias/Riesgos

1. **Auth tokens mueren → cascada**: Tests con beforeAll cadena
2. **Orden seeder**: Inventario requiere Usuarios, Profesores, Productos
3. **Fixtures compartidas**: Misma BD para todos tests
4. **Rate limiting**: 429 es silenciado por safe()
5. **Conflictos duplicados**: 409 es tolerado, pero podría ocultar lógica errónea

## EXPLORACIÓN COMPLETA - 30 MARZO 2026

### Patrones Base Identificados

**PATRÓN 1: Función `safe()` - Tolerancia silenciosa (http-seed.catalog.ts:65-92)**
- Silencia: 403, 404, 401, 429, 409
- También silencia: "duplica", "duplicate", "already exists", "already registered", "ya está registrado", "duplicate_entry"
- Retorna `null` sin fallar, loguea advertencia
- Usado en +50 peticiones GET/POST/PATCH/DELETE en una sola sesión

**PATRÓN 2: Try-catch selectivo (http-seed.catalog.ts:176-180, 205-209)**
- Usuarios: captura 409 (ya existe) y continúa, otros errores se propagan
- Profesores (createAdmin): captura 409 y continúa

**PATRÓN 3: Estricto con expectedStatusCodes (massive.runtime.ts:595-730)**
- Función `expectedStatusForAdminRouteRequest()` define qué códigos se consideran válidos
- POST → [200, 201], GET → [200]
- Si statusCode NO está en expectedStatusCodes → fallo inmediato
- Solo countAsSuccess si statusCode 2xx-3xx

**PATRÓN 4: Base de retry en seed-context.ts:650-680**
- Lanza HttpSeedRequestError si !res.ok
- Retrying automático solo para 429 y 5xx
- 4xx (400, 401, 403, 404) propagan error tras maxRetries

### Mapeo Completo de Tolerancia por Tarea

Todas estas tareas están en `http-seed.catalog.ts` y usan `safe()`:
1. `rolesPermisosTask()` - GET /admin/roles, /admin/permissions
2. `usuariosTask()` - POST usuariosx2, GET, PATCH, DELETE (línea 171-232)
3. `profesorAlumnoTask()` - GET aulas/clases/profesores, PATCH, DELETE (línea 293-327)
4. `proveedorTask()` - GET, POST, GET, DELETE (línea 347-384)
5. `productoTask()` - GET, POST batch, GET, DELETE (línea 397-511)
6. `ubicacionTask()` - POST, GET, DELETE (línea 530-551)
7. `inventarioTask()` - POST, GET, ajustes (línea 568-625)
8. `pedidoTask()` - GET, POST, PATCH (línea 658-753)
9. `recepcionTask()` - GET, POST, PATCH, DELETE (línea 840-915)
10. `albaranTask()` - GET, POST, DELETE (línea 928-941)
11. `historialPrecioTask()` - GET, DELETE (línea 944-953)
12. `incidenciaTask()` - GET, POST, PATCH, DELETE (línea 956-1026)
13. `recetaTask()` - GET, POST (línea 1029-1064)
14. `mermaTask()` - GET (línea 1067-1075)
15. `preparacionTaskEnhanced()` - GET, PATCH, DELETE, POST (línea 1078-1101)
16. `produccionTask()` - GET, PATCH (línea 1104-1119)
17. `movimientosTask()` - GET, DELETE (línea 1122-1134)
18. `archivosTask()` - GET, POST, DELETE (línea 1137-1150)
19. `exportTask()` - GET ×17 endpoints (línea 1153-1172)
20. `authTask()` - GET, POST, PATCH (línea 1175-1190)
21. `baseTask()` - GET / (línea 1193-1195)
22. `alertasTask()` - GET (línea 1198-1201)

### Peticiones en massive.runtime.ts (Estrictas)

- `warmAdminState()` - GET /admin/roles, /admin/permissions → puede fallar si 401/403
- `warmCollections()` - GET ×23 endpoints → falla inmediata si 401/403
- `ensureRoleActors()` - POST usuarios → puede fallar
- `executeAdminFocusEndpointRequest()` - todos métodos → fail-fast si !expectedStatusCodes

### Ciclo de Dependencias Críticas

1. Login con admin → token seedTokenAdmin (seed-context.ts:273-293)
2. warmAdminState() con admin token (massive.runtime.ts:144-149)
3. warmCollections() con admin token (massive.runtime.ts:152-196)
4. Si 401/403 en paso 2 → cascada fallida en paso 3

### RIESGOS de Convertir Todo a Fail-Fast 2xx

**Riesgo Alto: Tolerancia intencional por estado compartido**
- Si Producto-Proveedor no existe → 404 es esperado
- Si Ubicación es duplicada → 409 es intención del seeder
- safe() retorna null, código continúa con lógica existencial

**Riesgo Medio: Orden de ejecución en TASKS**
- TASKS ejecutan en orden: roles-permisos → usuario → proveedor → producto → inventario
- Si producto falla, inventario intentará GET /productoProveedorId y obtendrá lista vacía
- safe() permite skip elegante, fail-fast lanzaría error cascada

**Riesgo Bajo: Admin routes ⚠️**
- massive.runtime.ts YA está estricto, no afecta cambios aquí

## Recomendaciones (Sin Implementar)

Ver informe detallado por archivo.
