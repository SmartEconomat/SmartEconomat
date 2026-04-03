# Massive Seeder System Architecture

## Overview
The massive seeder is a comprehensive HTTP-based stress testing and data generation system that orchestrates thousands of API requests across all backend endpoints to ensure complete system coverage and stability.

---

## 1. **Core Flow (massive.ts)**

### Main Orchestrator Loop
1. **Context Creation**: Creates SeedContext with concurrency limits
2. **Actor Preparation**: Ensures role-based actors (superadmin, admin, profesor, alumno)
3. **Endpoint Discovery**: Discovers all endpoints from controllers + constants
4. **Endpoint Iteration**: Iterates through each endpoint (sorted by domain/method/action)
5. **Batch Execution**: Executes requests in controlled batches until target success count
6. **Coverage Validation**: Ensures enum coverage complete + min products captured

### Configuration
- `SEED_MULTIPLIER`: Scales all request counts (default 1)
- `MIN_SUCCESS_PER_ENDPOINT`: Min successful requests per endpoint (base: 10)
- `MAX_SUCCESS_PER_ENDPOINT`: Max successful requests per endpoint (base: 30)
- `SPECIAL_TARGETS`: Override map for specific endpoints
- `MAX_ATTEMPTS_PER_ENDPOINT`: Max retries per endpoint (base: 150)
- `SOFT_MAX_TOTAL_DURATION_MS`: Warning threshold (1.2s per multiplier)
- `HARD_MAX_TOTAL_DURATION_MS`: Fail threshold (3.6s per multiplier)

---

## 2. **SeedContext (seed-context.ts)**

### Authentication & Sessions
- `token`: Active access token for requests
- `sessions`: Map of session tokens by key (e.g., 'superadmin:0', 'profesor:1')
- `login()`: Initial authentication via candidates list
- `loginWithCredentials()`: Login with specific email/password
- `setSessionToken(key, token)`: Store token for future use
- `getSessionToken(key)`: Retrieve stored token

### HTTP Execution
- `requestJson<T>(path, options)`: Core HTTP request method
- `postMultipart<T>(path, form)`: Multipart form uploads (files)
- Concurrency control: Queue system with `maxConcurrency` slots
- Retry logic: Up to `maxRetries` with exponential backoff
- Timeout: Configurable `requestTimeoutMs` (default 60s)

### State Management (key-value store)
- `set(key, value)`: Store arbitrary state
- `getState<T>(key)`: Retrieve typed state
- `appendToStateArray<T>(key, value)`: Push to state array
- State stores IDs, pairs, tokens, and test artifacts

---

## 3. **Actor/Authentication System (massive.runtime.actors.ts)**

### Actor Types & Creation

**Fixed Seed Actors** (always created, protected from deletion):
1. **Superadmin** (superadmin@smarteconomat.com)
   - Can grant roles via `/admin/users/:id/role`
   - Can create other actors via repository operations

2. **Admin** (admin@smarteconomat.com)
   - Can manage entities (CRUD)
   - Secondary admin actor for admin routes

3. **Profesor** (profesor@smarteconomat.com)
   - Can manage alumnos and slots
   - Created with extra permissions: gestionar_slots, ver_alumnos, gestionar_alumnos
   - Gets an AlumnoSlot (classroom assignment)

4. **Alumno** (alumno@smarteconomat.com)
   - Student role
   - Assigned to profesor's slot
   - Has extra permission: cambiar_profesor

### Dynamic Actors (created as extras)
- Extra admins: `SEED_ADMIN_COUNT` (2-3, env-configurable)
- Extra profesores: `SEED_PROFESOR_COUNT` (3-5)
- Extra alumnos: `SEED_ALUMNO_COUNT` (10-30, at least 2 per profesor)
- Admin route targets: `SEED_ADMIN_TARGET_USER_COUNT` (10-20, for /admin routes)

### Token Management
- Tokens stored in context with session keys:
  - `seedTokenSuperAdmin`, `seedTokenAdmin`, `seedTokenProfesor`, `seedTokenAlumno`
  - Session-scoped tokens: `superadmin:0`, `admin:0`, `profesor:0`, `profesor:1`, etc.
  - Special tokens: `seedTokenPasswordActor`, `seedTokenResetActor`

### Repository-Based Creation
- `upsertSeedUserViaRepository()`: Create/update users directly in DB
- `upsertSeedProfesorViaRepository()`: Create profesor entity + user
- `upsertAlumnoSlotViaRepository()`: Create class slot assignment
- `upsertSeedAlumnoViaRepository()`: Create alumno + assign to profesor

### Warmup Functions
- `warmAdminState()`: GET `/admin/roles` + `/admin/permissions`
- `warmCollections()`: GET 23 paginated collection endpoints to populate state
- Collected state includes IDs for reuse in subsequent requests

---

## 4. **Request Execution (massive.runtime.requests.ts)**

### Pre-Request State Preparation
- **DELETE /preparaciones/:id/cancelar**: Ensure pending preparacion exists
- **PATCH /pedido-usuarios/:id**: Ensure pending pedido-usuario exists
- **PATCH /pedidos/:id**: Ensure pending pedido exists
- **PATCH /purchase-batches/:id**: Ensure pending batch exists
- **POST /incidencias/:id/resolver**: Ensure pending incidencia exists
- **DELETE endpoints**: Ensure deletable resource exists beforehand
- **POST /productos**: Initialize OpenFoodFacts pool
- **PATCH /produccion/lote/:id/consumir**: Ensure lote has sufficient porciones
- **POST /produccion/ejecutar**: Ensure receta stock is sufficient
- **POST /merma**: Ensure producto has sufficient stock

### Request Path Resolution
- Path params resolved: `/pedidos/:id` → `/pedidos/actual-uuid`
- Paginated paths get `?limit=50&page=N` appended
- Path param extraction: iterate state arrays by index modulo length

### Token Selection (chooseTokenForPath)
- Public paths (auth, register, slots): `auth: false`
- Admin paths: Use admin/superadmin token alternately
- Profesor paths: Use profesor token
- Alumno paths: Use alumno token by round-robin
- Default: Active token

### Admin Focus Endpoints
Special handling for `/admin/profesores` and `/admin/users/:id/role`:
- Alternates between superadmin/admin actor by iteration
- Expected status: 200 for GET, 200-201 for POST
- Actors tracked separately in `seedAdminUserRoleIdByUserId`

### Response Collection (collectStateFromResponse)
Extracts entity IDs from responses and pushes to state arrays:
- `id` field extracted as resource ID
- Nested relational IDs collected (e.g., proveedor IDs from producto)
- State IDs aggregated by path normalized (e.g., '/productos')

---

## 5. **State Management (massive.state.ts + massive.helpers.state-collection.ts)**

### State Arrays
```
typedef StateArray = string[]  // Each value is unique
```

#### Common State Arrays
- `usuarioIds`, `seedProtectedUserIds`: User IDs
- `profesorIds`, `profesorSlotIds`: Profesor + classroom assignments
- `alumnoIds`, `seedAlumnoTokens`: Alumno actors + their tokens
- `productoIds`, `seedCreatedProductoIds`: Products
- `proveedorIds`: Suppliers
- `inventarioIds`: Inventory entries
- `pedidoIds`, `pedidoPendienteIds`, `pedidoReceivableIds`: Orders (states)
- `pedido-usuarioIds`, `recepcionIds`: User orders, receptions
- `recetaIds`, `preparacionIds`, `produccionLoteIds`: Recipes, prep, production
- `incidenciaIds`: Issues/incidents
- Pair arrays: `pedidoUsuarioToPedidoPairs` (connect collections)

#### State Operations
- `pushStateValue(context, key, value)`: Append if unique
- `removeStateValue(context, key, value)`: Remove from array
- `consumeStateValue(context, key)`: Pop first item (FIFO)
- `pickStateValue(context, key, iteration)`: Select by `iteration % length`
- `getStateArray(context, key)`: Get all values

### Post-Operation State Refresh (refreshStateAfterOperation)
When a request succeeds, state is updated:
- **POST /productos**: Add product ID + alergeno pairs
- **POST /pedidos**: Add pedido-pendiente ID
- **DELETE /pedidos/:id**: Remove from all related arrays + pairs
- **PATCH /admin/users/:id/role**: Update role/permission mappings
- **State transitions**: Move IDs between "pending" → "receivable" states

---

## 6. **Endpoint Discovery (discoverEndpointsFromConstants)**

### Discovery Sources (in priority order)
1. `MASSIVE_ENDPOINT_DEFINITIONS` (massive-endpoints.constants.ts): Curated endpoints
2. `MASSIVE_ENDPOINT_DEFINITIONS_ADDITIONAL` (massive-endpoints.additional.ts): Extra endpoints
3. Controller scanning: Walk `/modules` dirs, find @Controller decorators + @Get/@Post/@Patch/@Put/@Delete methods

### Endpoint Deduplication
- Keyed by `${method} ${path}`
- Controller discovery adds to base + additional
- Duplicates removed (constants win)

### Sorting Strategy
1. DELETE methods last (safe for cleanup)
2. By domain rank (DOMAIN_ORDER: /admin → /movimientos)
3. By HTTP method priority: POST (1) → GET (2) → PATCH (3) → PUT (4) → DELETE (5)
4. By action rank (e.g., /iniciar before /finalizar before /cancelar)
5. By path alphabetically

### Filtering Options
- `SEED_MOVIMIENTOS_GET_ONLY`: Filter /movimientos to GET only
- `SEED_ONLY_DOMAIN`: Filter to specific domain(s) (e.g., 'productos,pedidos')

---

## 7. **Body Building (buildBody)**

### Dynamic Payload Generation
- Uses helper functions per domain:
  - `buildAuthUsersBody()`: Login, register, change-password
  - `buildCatalogBody()`: Productos, proveedores
  - `buildOrdersBody()`: Pedidos, purchase-batches
  - `buildInventoryBody()`: Inventario, movimientos
- Generates realistic data (names, quantities, enums)
- Reuses state IDs (e.g., productoId from `productoIds` array)

### Enum Tracking (EnumCoverage)
- `createEnumCoverage()`: Initialize tracking map
- `markEnum(coverage, enumName, value)`: Record usage
- `ensureEnumCoverageComplete(coverage)`: Verify all enums covered
- Validates all UnidadMedida, TipoProducto, Alergeno, etc. values used

---

## 8. **Key Design Patterns**

### Repository Access
- Direct TypeORM access for seeding bootstrap (actors, roles, permissions)
- HTTP API for all functional testing (actual business logic)
- Hybrid approach: Database for setup, HTTP for coverage

### Concurrency Control
- Slot-based queue: max `maxConcurrency` in-flight requests
- FIFO queue waits for slots
- Per-endpoint batch limits (special endpoints get `limit=1`)

### Retry Strategy
- Exponential backoff: `backoffMs = min(baseMs * 2^attempt, maxMs)`
- HTTP 429/5xx: Retriable
- HTTP 4xx (status < 500): Non-retriable, immediate fail
- Max retries per request: `maxRetries` (default 2)

### Fail-Fast Mode
- If ANY endpoint fails → entire seeding aborts
- No partial success
- Ensures clean, complete seed state or rollback

### State Tracking
- Pair encoding: `"${id1}|${id2}"` for relationships
- Triple encoding: `"${cial}|${aula}|${numeroClase}"` for profesor slots
- Allows reconstruction of graph relationships post-request

---

## 9. **Special Handling**

### Multipart Uploads
- `/albaranes/upload-documento`: PDF document
- `/archivos/upload`: Generic file upload
- Uses context.postMultipart<T>() with FormData

### Soft Deletes
- Deletable entities exist in a "prepared" state
- Logic ensures resource is deletable before attempting DELETE
- Pairs/IDs removed from state when deleted

### Draft Orders
- `/pedido/draft`: Temporary user order draft
- `/pedido/draft/finalize`: Converts draft → pedido-usuario
- System tests draft-to-confirmation flow

### Purchase Batches
- Auto-created from missing stock: `/purchase-batches/from-missing-stock`
- Can be consolidated: `/purchase-batches/consolidate`
- Tracks estado transitions: PENDIENTE → ACEPTADO → RECIBIDO

### Production Flow
- `/recetas` (recipes) → `/preparaciones` (prep tasks) → `/produccion/ejecutar` (create lote)
- `/produccion/lote/:id/consumir`: Consume portions
- State ensures ingredients have sufficient stock via repository updates

---

## 10. **Config & Constants (massive.config.ts)**

### Scaling
```typescript
BASE_MIN_REQUESTS = 10
BASE_MAX_REQUESTS = 30
SEED_MULTIPLIER = 1  // × all counts

MIN_SUCCESS_PER_ENDPOINT = 10 × multiplier
MAX_SUCCESS_PER_ENDPOINT = 30 × multiplier
DEFAULT_TARGET = MIN (unless overridden)
MIN_REQUIRED_PRODUCT_IDS = 30 × multiplier
```

### Endpoint-Specific Targets (SPECIAL_TARGETS)
- Products: 30 POST requests
- Pedidos/Orders: 20 POST requests each
- Incidencias: 30 POST requests
- Deletes: 2-5 per endpoint
- Admin routes: Use `ADMIN_ROUTE_TARGET_PER_ENDPOINT`

### Enums
- UnidadMedida: KG, G, L, ML, UNIDAD, PAQ
- TipoProducto: verdura, fruta, carne, pescado, etc. (16 types)
- Alergenos: GLUTEN, CRUSTACEOS, HUEVOS, etc. (14 allergens)
- Roles: SUPER_ADMIN, ADMIN, PROFESOR, ALUMNO
- Estado enums: PENDIENTE, ACEPTADO, RECIBIDO, CANCELADO
- Movimiento types: entrada, salida, ajuste, pedido, merma, etc.

---

## Summary Table

| Component | File | Role |
|-----------|------|------|
| **Orchestrator** | massive.ts | Main loop, endpoint iteration, coverage validation |
| **Context** | seed-context.ts | HTTP client, auth, concurrency, state storage |
| **Actors** | massive.runtime.actors.ts | User creation, role/permission, token management |
| **Requests** | massive.runtime.requests.ts | Pre-checks, path resolution, response collection (2200+ lines) |
| **State** | massive.state.ts | Array/pair operations |
| **Types** | massive.types.ts | TypeScript interfaces (minimal) |
| **Config** | massive.config.ts | Env vars, limits, enum lists |
| **Refresh** | massive.runtime.state-refresh.ts | POST-request state updates (transitions, cleanup) |
| **Helpers** | massive.helpers*.ts | Body building, routing, identity, collection |
