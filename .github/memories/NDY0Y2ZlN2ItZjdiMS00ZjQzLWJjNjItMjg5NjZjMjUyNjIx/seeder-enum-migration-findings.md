# Seeder Enum Migration - EstadoPedido Findings

## Current Situation (as of 2026-04-01)

### 1. CLI Runner
- **File**: seed.cli.ts
- **Method**: Uses `ts-node` with tsconfig-paths and dotenv/config
- **Command**: `npm run seed` calls `ts-node -r tsconfig-paths/register -r dotenv/config src/seeders/seed.cli.ts`
- **Multiplier**: Accepts positional argument for multiplier (default 1)
- **Entry point**: Calls `runMassiveSeeder()` from massive.ts

### 2. EstadoPedido Enum Values (NEW - CURRENT)
File: `src/modules/pedido/enums/estado-pedido.enum.ts`
```
PENDIENTE_DE_APROBACION = 'pendiente_de_aprobacion'
POR_RECEPCIONAR = 'por_recepcionar'
RECEPCIONADO = 'recepcionado'
INCIDENCIA = 'incidencia'
CANCELADO = 'cancelado'
PARCIAL = 'parcial'
```

### 3. Pedido Creation Flow
- **File**: massive.helpers.body.orders.ts (lines 127-177)
- **Endpoint**: POST /pedidos
- **Body fields**: proveedorId, observaciones, lineas
- **Note**: NO estado field is sent - estado DEFAULTS in backend controller

### 4. State Collection Bug - THE PROBLEM
**File**: massive.helpers.state-collection.ts (lines 335-350)

```typescript
const estado = entity.estado;
if (typeof estado === 'string' && typeof entity.id === 'string') {
  if (resolvedPath.startsWith('/pedidos') && isPedidoEntity(entity)) {
    if (estado === 'pendiente')  // ❌ BUG: OLD string value 'pendiente'
      pushStateValue(context, 'pedidoPendienteIds', entity.id);
  }
  if (resolvedPath.startsWith('/pedido-usuarios')) {
    if (estado === 'pendiente')  // ❌ BUG: OLD string value 'pendiente'
      pushStateValue(context, 'pedidoUsuarioPendienteIds', entity.id);
  }
  if (resolvedPath.startsWith('/purchase-batches') && isPurchaseBatchEntity(entity)) {
    if (estado === 'pendiente')  // ❌ BUG: OLD string value 'pendiente'
      pushStateValue(context, 'purchaseBatchPendienteIds', entity.id);
  }
  // ...
}
```

**What happens**:
1. POST /pedidos creates pedido with estado = 'pendiente_de_aprobacion' (from enum default)
2. Response collected by collectStateFromResponse()
3. State-collection checks for estado === 'pendiente' (OLD value) - NO MATCH
4. pedidoPendienteIds NEVER populated with pedido IDs

### 5. Recepcion Creation Issue
**File**: massive.helpers.body.orders.ts (lines 271-307)

```typescript
if (resolvedPath === '/recepciones') {
  const pendingPedidoIds = Array.from(
    new Set([
      ...getStateArray(context, 'seedCreatedPedidoPendienteIds'),  // Empty!
      ...getStateArray(context, 'pedidoPendienteIds'),              // ❌ Empty because check failed
    ])
  ).filter(Boolean);
  const selectedPedidoId =
    forcedPedidoId ||
    pendingPedidoIds[iteration % pendingPedidoIds.length] ||
    env.pickRequired('pedidoIds');  // ✅ Falls back to this
```

**Result**: Recepciones pick from ALL pedidoIds instead of only pending ones.

### 6. Approval/Acceptance Workflow
- **Files**: 
  - massive-endpoints.constants.ts: `PATCH /api/v1/pedidos/:id/aceptar`
  - massive.helpers.routing.pick-id.ts (lines 275-282): Routes to seedCreatedPedidoPendienteIds or pedidoPendienteIds
  
**Note**: The aceptar endpoint REQUIRES picking from seedCreatedPedidoPendienteIds or pedidoPendienteIds, but these are never populated with the new estado value.

### 7. Key State Collections
- **pedidoPendienteIds**: Should hold pedidos with estado='pendiente_de_aprobacion', but check uses old string
- **seedCreatedPedidoPendienteIds**: Populated by massive.runtime.requests.ts line 1168 when PRE-CREATING pedidos
- **pedidoReceivableIds**: Also populated (line 165 in state-collection) but not used by recepciones builder

---

## REQUIRED FIXES

1. Update massive.helpers.state-collection.ts line 338: Change `estado === 'pendiente'` to `estado === 'pendiente_de_aprobacion'`
2. Same for pedido-usuarios (line 342)
3. Same for purchase-batches (line 349)
4. Update preparaciones check (line 353-355): Check if there are corresponding enum values
5. Verify recepcion.seeder.ts has correct enum values for RECEPCIONABLE_STATES

---

## Files to Review

1. [seed.cli.ts](file:///home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/seeders/seed.cli.ts)
2. [massive.helpers.state-collection.ts](file:///home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/seeders/massive.helpers.state-collection.ts#L338)
3. [recepcion.seeder.ts](file:///home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/seeders/recepcion.seeder.ts)
4. [massive.helpers.body.orders.ts](file:///home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/seeders/massive.helpers.body.orders.ts#L271)
5. [EstadoPedido enum](file:///home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/pedido/enums/estado-pedido.enum.ts)
