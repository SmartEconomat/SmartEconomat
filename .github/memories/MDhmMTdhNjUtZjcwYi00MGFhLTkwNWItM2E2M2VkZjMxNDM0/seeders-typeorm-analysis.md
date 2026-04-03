# Análisis Exhaustivo: TypeORM usados en Seeders del Backend

## Estructura Global
Se han identificado 6 archivos principales con uso directo de TypeORM (AppDataSource):
- massive.runtime.requests.ts
- massive.runtime.deletables.ts
- massive.runtime.actors.ts
- massive.helpers.identity.ts
- massive.runtime.state-refresh.ts
- seed-context.ts (via ensureBootstrapAdminCredentials)

## Patrones de Acceso TypeORM encontrados

### 1. **ensureRepositoryReady()** - Patrón común
Función helper que solo inicializa AppDataSource si no está listo. Llamada antes de cualquier operación TypeORM.

### 2. **ensureOpenFoodFactsPool** (massive.runtime.requests.ts)
- **Línea**: ~43-130
- **Operaciones**:
  - `proveedorRepo.find({ select: ['id'] })` → obtiene proveedores activos
  - `productoRepo.find({ select: ['codigoBarras'] })` → obtiene códigos de barras existentes
- **Riesgo**: Needed para validar con OpenFoodFacts antes de crear productos
- **Similar HTTP**: GET `/proveedor?limit=50`, GET `/productos?limit=50`

### 3. **ensurePreparacionIngredientsHaveStock** (massive.runtime.requests.ts)
- **Línea**: ~155-311
- **Operaciones**:
  - `preparacionRepo.findOne()` con relations complejas (receta → ingredientes)
  - `inventarioRepo.createQueryBuilder()` con innerJoin y groupBy
  - `ubicacionRepo.createQueryBuilder()` con orderBy
  - `inventarioRepo.save()` para actualizar cantidades
- **Riesgo**: Transacciones implícitas que tocan múltiples tablas relacionadas
- **Similar HTTP**: GET `/preparaciones/:id`, GET `/inventario`, PATCH stock (no existe directamente)

### 4. **ensureDeletableRecepcionResource** (massive.runtime.deletables.ts)
- **Línea**: ~205-219
- **Operaciones**:
  - `recepcionRepo.create()` y `recepcionRepo.save()`
- **Replacement**: POST `/recepciones` ya existe (hay controller)
- **Status**: Podría migrarse completamente a HTTP

### 5. **ensureDeletableProductoAlergenoResource** (massive.runtime.deletables.ts)
- **Línea**: ~231-289
- **Operaciones**:
  - `productoAlergenoRepo.find({ where: { productoId } })`
  - `productoAlergenoRepo.save()`
- **Replacement**: POST/DELETE `/producto-alergenos/:productoId/:alergeno` existe
- **Status**: Podría migrarse a HTTP

### 6. **upsertSeedUserViaRepository** (massive.runtime.actors.ts)
- **Línea**: ~35-75
- **Operaciones**:
  - `roleRepo.findOne()` → busca rol por nombre
  - `userRepo.findOne()` con relations
  - `userRepo.save()` (create o update)
- **Replacement**: POST `/usuarios`, PATCH `/usuarios/:id`, PATCH `/usuarios/:id/admin`
- **Risk**: Manejo de relaciones con roles complejas
- **Status**: Parcialmente migratable

### 7. **ensureUserAdditionalPermission** (massive.runtime.actors.ts)
- **Línea**: ~77-123
- **Operaciones**:
  - `permisoRepo.findOne()` o `.save()` (create)
  - `userRepo.findOne()` con relations permisosAdicionales
  - `userRepo.save()` para actualizar permisos
- **Replacement**: POST `/usuarios/:id/permisos-adicionales/:permisoId` existe
- **Status**: Podría cambiar a HTTP puro

### 8. **ensureSeedRoleIds** (massive.runtime.actors.ts)
- **Línea**: ~125-176
- **Operaciones**:
  - `roleRepo.find()` → lista todos los roles
  - `roleRepo.save()` → crea ROL nuevo si no existe
- **Replacement**: GET `/admin/roles` existe, pero NO hay POST para crear roles (blocker)
- **Status**: BLOCKER - No hay endpoint público para crear roles desde seed

### 9. **activateUserByIdentity** (massive.helpers.identity.ts)
- **Línea**: ~85-126
- **Operaciones**:
  - `AppDataSource.getRepository(Usuario).update()` → actualiza status/activo directo
- **Replacement**: PATCH `/usuarios/:id/activar` o `/usuarios/:id/admin`
- **Status**: Podría migrarse completamente

### 10. **ensureBootstrapAdminCredentials** (seed-context.ts)
- **Línea**: ~332-363
- **Operaciones**:
  - `createQueryBuilder()` con addSelect y where
  - `repo.save()` para crear/actualizar usuario bootstrap
- **Replacement**: POST `/usuarios`, PATCH `/usuarios/:id/admin`
- **Status**: Parcialmente migratable (pero es bootstrap crítico)

### 11. **ensurePasswordActor & ensureResetActor** (massive.runtime.actors.ts)
- **Línea**: ~237-323
- **Operaciones**:
  - `userRepo.update()` → asigna resetPasswordOtp y resetPasswordOtpExpires
- **Replacement**: No hay endpoint HTTP para OTP directo (blocker parcial)
- **Status**: BLOCKER - Necesitaría nuevo endpoint

### 12. **ensureProductoWithSufficientStockForMerma** (massive.runtime.requests.ts)
- **Línea**: ~492-538
- **Operaciones**:
  - `inventarioRepo.createQueryBuilder()` con aggregación (SUM)
  - RawMany query para stock total por producto
- **Replacement**: GET `/inventario` con agregación no existe
- **Status**: BLOCKER - Necesitaría nuevo endpoint con agregaciones

## Endpoints públicos existentes (controla qué se puede sustituir)

✅ POST `/usuarios` - crear usuario
✅ PATCH `/usuarios/:id` - actualizar usuario
✅ PATCH `/usuarios/:id/admin` - actualizar con rol
✅ PATCH `/usuarios/:id/rol` - cambiar rol
✅ PATCH `/usuarios/:id/activar` - cambiar status
✅ DELETE `/usuarios/:id` - borrar usuario
✅ POST `/usuarios/:id/permisos-adicionales/:permisoId` - agregar permiso
✅ DELETE `/usuarios/:id/permisos-adicionales/:permisoId` - quitar permiso
✅ POST `/usuarios/:id/permisos-excluidos/:permisoId` - excluir permiso
✅ DELETE `/usuarios/:id/permisos-excluidos/:permisoId` - quitar exclusión

✅ GET `/admin/roles` - listar roles
✅ GET `/admin/permissions` - listar permisos
❌ POST `/admin/roles` - crear rol (NO EXISTE)
❌ POST `/admin/permissions` - crear permiso (NO EXISTE)

✅ GET `/proveedor` - listar
✅ POST `/proveedor` - crear
✅ GET `/productos` - listar
✅ POST `/productos` - crear
✅ GET `/inventario` - listar (sin agregaciones)
✅ POST `/inventario` - crear
✅ GET `/preparaciones` - listar
✅ POST `/preparaciones` - crear
✅ POST `/producto-alergenos/:productoId/:alergeno` - crear relación
✅ DELETE `/producto-alergenos/:productoId/:alergeno` - borrar relación
✅ POST `/recepciones` - crear
✅ DELETE `/recepciones/:id` - borrar

❌ PATCH `/inventario/:id` - actualizar stock (NO EXISTE endpoint simple)
❌ GET `/inventario/aggregations` - agregarp por producto (NO EXISTE)
❌ POST `/usuarios/:id/reset-otp` - asignar OTP (NO EXISTE)

## Resumen decisiones por helper

### HIGH PRIORITY (Bajo riesgo, sustitución directa)
1. **ensureDeletableRecepcionResource** → POST `/recepciones`
2. **ensureDeletableProductoAlergenoResource** → POST `/producto-alergenos/:id/:alergeno`
3. **activateUserByIdentity** → PATCH `/usuarios/:id/activar` + GET `/usuarios?page=X`

### MEDIUM PRIORITY (Requiere nuevos endpoints)
1. **ensureUserAdditionalPermission** → POST `/usuarios/:id/permisos-adicionales/:permisoId` existente
   - Solo agregar "crear permiso si no existe" vía endpoint (BLOCKER: no hay)
   
2. **upsertSeedUserViaRepository** → POST+PATCH `/usuarios` + PATCH `/usuarios/:id/rol`
   - Risk: manejo de relaciones de roles. Necesita validación de rol existente vía GET `/admin/roles`

3. **ensureSeedRoleIds** → GET `/admin/roles` + POST `/admin/roles` (BLOCKER: no existe)
   - Podría crearse endpoint POST `/admin/roles` para seeding

### LOW PRIORITY / BLOCKERS (Requiere arquitectura nueva o transacciones complejas)
1. **ensureOpenFoodFactsPool** → Validar con GET endpoints, pero consultas complejas
   - Ya usa HTTP internamente, solo usa repo para validaciones

2. **ensurePreparacionIngredientsHaveStock** → BLOCKER
   - Necesita transacción: buscar preparación + ingredientes + inventario + actualizar stock
   - No hay endpoint unificado
   - Opción: crear POST `/preparaciones/:id/ensure-stock-ready`

3. **ensureProductoWithSufficientStockForMerma** → BLOCKER
   - Necesita agregación SQL (SUM, GROUP BY) no disponible en GET
   - Opción: crear GET `/inventario/stock-summary?by=producto`

4. **ensurePasswordActor & ensureResetActor** → BLOCKER
   - Necesitan asignar campos OTP directamente
   - Opción: crear POST `/usuarios/:id/request-password-reset` con HTTP puro

5. **ensureBootstrapAdminCredentials** (seed-context.ts) → Crítico
   - Es la raíz de todo el seeding
   - Necesita upsert con lógica especial (buscar por email o username)
   - Podría requerir endpoint POST `/auth/bootstrap` especial para seeding

## Conclusión
- ~3 funciones fácil de migrar (recepciones, alergenos, activar usuarios)
- ~3 funciones de mediana complejidad (requieren nuevos endpoints simples)
- ~4 funciones bloqueadas por falta de endpoints o transacciones complejas
