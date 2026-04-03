# Análisis: massive.runtime.ts - Plan de Refactor

**Tamaño actual:** ~2090 líneas
**Objetivo:** ≤800 líneas por archivo  
**Total de funciones:** 27

## Funciones identificadas por categoría:

### INICIALIZACIÓN (45-52 líneas)
- `ensureRepositoryReady()` - L48-52

### PRECONDICIONES/PREPARACIÓN (520 líneas)
- `ensurePreparacionIngredientsHaveStock()` - L54-225 (~170 líneas)
- `ensurePendingPreparacionForCancel()` - L227-295 (~69 líneas)
- `ensureDeletableProfesorAdminSlot()` - L296-302 (wrapper ~7 líneas)
- `ensureDeletableProveedor()` - L304-310 (wrapper ~7 líneas)
- `ensureDeletableInventario()` - L312-314 (wrapper ~3 líneas)
- `ensureDeletableRecepcion()` - L316-318 (wrapper ~3 líneas)
- `ensurePendingPedidoUsuarioForUpdate()` - L320-369 (~50 líneas)
- `ensurePendingPurchaseBatchForUpdate()` - L370-427 (~58 líneas)
- `createPendingPedidoUsuarioForConsolidate()` - L428-470 (~43 líneas)
- `ensureIncidenciaForResolver()` - L471-534 (~64 líneas)

### REPOSITORIO/USUARIOS (180 líneas)
- `getRoleEntity()` - L535-540 (~6 líneas)
- `upsertSeedUserViaRepository()` - L542-584 (~43 líneas)
- `ensureUserAdditionalPermission()` - L585-630 (~46 líneas)
- `ensureSeedRoleIds()` - L633-697 (~65 líneas)

### CALENTAMIENTO DE ESTADO (70 líneas)
- `warmAdminState()` - L698-707 (~10 líneas)
- `warmCollections()` - L709-747 (~39 líneas)

### ACTORES (500 líneas)
- `ensurePasswordActor()` - L748-782 (~35 líneas)
- `ensureResetActor()` - L783-824 (~42 líneas)
- `resolveCountInRange()` - L825-843 (~19 líneas)
- `ensureRoleActors()` - L844-1152 (~309 líneas) **GIGANTE**
- `ensureAdminRouteActors()` - L1153-1210 (~58 líneas)

### UTILIDADES ADMIN (110 líneas)
- `adminRouteActorByIteration()` - L1211-1217 (~7 líneas)
- `expectedStatusForAdminRouteRequest()` - L1219-1227 (~9 líneas)
- `executeAdminFocusEndpointRequest()` - L1229-1328 (~100 líneas)

### EJECUCIÓN DE REQUESTS (760 líneas)
- `refreshStateAfterOperation()` - L1329-1768 (~440 líneas) **GIGANTE**
- `executeEndpointRequest()` - L1769-2090 (~322 líneas)

## Dependencias actuales:
- Todos importan de: `seed-context.ts`, `massive.config.ts`, `massive.types.ts`, `massive.helpers.ts`, `massive.runtime.deletables.ts`
- Todos acceden a: `AppDataSource`, directamente TypeORM entities
