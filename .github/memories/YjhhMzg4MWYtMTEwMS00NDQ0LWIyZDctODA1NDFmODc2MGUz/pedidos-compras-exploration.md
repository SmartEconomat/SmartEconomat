# Exploración Frontend Pedidos/Compras - Reporte Completo

## Resumen Ejecutivo

El frontend de SmartEconomat mezcla **PedidoUsuario**, **Pedido** y **PurchaseBatch** en múltiples capas:
- **Tipos**: importados en 40+ archivos
- **Componentes**: reutilizan ambas entidades con `Union` types
- **Servicios API**: llamadas separadas pero sin segregación de responsabilidades del cliente
- **Datos de UI**: síntesis artificial de `Pedido` como agregado batch via `consolidateOwnPedidos()`
- **Tabs UI**: mezclan entidades en representación visual (tab 0-1: PedidoUsuario, tab 2: PurchaseBatch, pero con overlap)

## 1. FLUJO ACTUAL DE DATOS UI

### Arquitectura de Componentes

```
Pedidos.tsx (página principal)
  ├─ PedidosTabs (0=Mis Pedidos, 1=Todos, 2=Compras)
  ├─ usePedidosData (hook cargador)
  │  ├─ Tab 0-1: fetchPedidoUsuarios() → mapPedidoUsuarioToPedidoRow()
  │  └─ Tab 2: fetchPurchaseBatches()
  ├─ usePedidoActions (hook gestión)
  │  ├─ savePedido()
  │  ├─ approvePedidoById() / approvePurchaseBatchById()
  │  ├─ cancelPedidoById() / cancelPurchaseBatchById()
  │  ├─ consolidatePedidosByIds()
  │  └─ fetchBatchDetail(aggregateType?: 'pedido_usuario')
  ├─ PedidosWeeklyBoard (componente render tab 0)
  │  ├─ consolidateOwnPedidos() → crea agregados sintéticos
  │  └─ isAggregatedBatchPedido() para detectar tipo
  ├─ PedidosTable (componente render tabs 0-1)
  ├─ PurchasesWeeklyBoard (componente render tab 2)
  ├─ PedidoDetailDrawer
  ├─ PurchaseBatchDetailModal
  └─ DynamicFormModal (edit)
```

### Tab Mapping

| Tab | Label | Fuente API | Tipo Esperado | Realidad |
|-----|-------|-----------|---------------|----------|
| 0 | Mis Pedidos | `/pedido-usuarios?usuarioId={id}` | PedidoUsuario[] | Pedido[] (mapeado) |
| 1 | Todos Pedidos | `/pedido-usuarios` | PedidoUsuario[] | Pedido[] (mapeado) |
| 2 | Compras | `/purchase-batches` | PurchaseBatch[] | PurchaseBatch[] |

### Mezcla de Entidades en Tipos

```typescript
// Pedido (síntesis/agregado)
Pedido {
  pedidoUsuarioId?: string;
  pedidoUsuario?: PedidoVisibleRef;
  aggregateType?: 'pedido_usuario';  // Marcador sintético
  batchId?: string;
  batch?: PurchaseBatch;
  pedidos?: Pedido[];  // Hijos internos del batch
}

// PedidoUsuario (user-facing)
PedidoUsuario extends Pedido {
  numeroGlobal: string;  // Secuencial único
  lineas?: PedidoUsuarioLinea[];  // Líneas específicas
  pedidos?: Pedido[];  // Internos (backend)
}

// PurchaseBatch (backend aggregator)
PurchaseBatch {
  estado: EstadoLote;
  pedidos?: Pedido[];  // Array interno
  observaciones?: string;
}
```

### Síntesis de Datos en UI

`consolidateOwnPedidos()` en `pedidoOwnOrders.ts` agrupa Pedidos por `batchId`:
```typescript
// Entrada: array de Pedido[]
// Salida: mezcla de agregados sintéticos + pedidos standalone

aggregated = grouped.get(batchId).map(batchPedidos => ({
  ...firstPedido,
  id: batchId,  // Usa ID del batch como ID principal
  batch: { ...canonicalBatch, pedidos: batchPedidos },
  proveedor: { nombre: "Summary de múltiples proveedores" }
}))
```

---

## 2. PUNTOS DE MEZCLA (DONDE SE LIAMOS)

### 2.1 TIPOS DE DATOS

**Archivos con Union Types problemáticos:**

```
BatchPedidoLineasViewer.tsx
  batch: PurchaseBatch | PedidoUsuario  [LINE 57]
  mode?: 'batch' | 'pedido'
  
DynamicFormModal.tsx
  batch={formData[name] as PurchaseBatch | PedidoUsuario}  [LINE 485]

PurchaseBatchDetailModal.tsx
  batch: PurchaseBatch | PedidoUsuario | null  [PROP]
  mode?: 'batch' | 'pedido'  [PROP]

Pedidos.tsx
  itemToViewBatch: PurchaseBatch | PedidoUsuario  [STATE]
  
usePedidoActions.ts
  fetchBatchDetail(..., aggregateType?: 'pedido_usuario')
  → Promise<PurchaseBatch | PedidoUsuario>
```

### 2.2 COMPONENTES COMPARTIDOS

`BatchPedidoLineasViewer`: acepta ambas, usa `mode` para discriminar:
```typescript
if (mode === 'pedido') {
  await downloadPedidoUsuarioPdf(batch.id)
} else {
  await downloadPurchaseBatchPdf(batch.id)
}
```

Mismo patrón en:
- `PurchaseBatchDetailModal` (PDF download/print)
- `DynamicFormModal` (render batch preview)

### 2.3 SERVICIOS API (DUPLICACIÓN)

Tanto Pedido como PatchBatch tienen métodos paralelos:

```typescript
// Pedido
createPedido(payload) → POST /pedidos
updatePedido(id, payload) → PATCH /pedidos/{id}
aceptarPedido(id) → PATCH /pedidos/{id}/aceptar
cancelPedido(id, payload) → PATCH /pedidos/{id}/cancelar
download/PedidoPdf(id)

// PurchaseBatch
createPurchaseBatch(payload) → POST /purchase-batches
updatePurchaseBatch(id, payload) → PATCH /purchase-batches/{id}
aceptarPurchaseBatch(id) → PATCH /purchase-batches/{id}/aceptar
cancelPurchaseBatch(id, payload) → PATCH /purchase-batches/{id}/cancelar
downloadPurchaseBatchPdf(id)

// PedidoUsuario (alias para PurchaseBatch internamente)
createPedidoUsuario(payload) → POST /pedido-usuarios
updatePedidoUsuario(id, payload) → PATCH /pedido-usuarios/{id}
aceptarPedidoUsuario(id) → PATCH /pedido-usuarios/{id}/aceptar
cancelPedidoUsuario(id, payload) → PATCH /pedido-usuarios/{id}/cancelar
downloadPedidoUsuarioPdf(id)
```

### 2.4 HOOKS DE ACCIONES

`usePedidoActions` expone ambas variantes:

```typescript
export function usePedidoActions() {
  const approvePedidoById = (id) => aceptarPedido(id)
  const approvePurchaseBatchById = (id) => aceptarPedidoUsuario(id)  // ⚠️ misma lógica
  const cancelPedidoById = (id) => cancelPedido(id)
  const cancelPurchaseBatchById = (id) => cancelPedidoUsuario(id)  // ⚠️ duplicado
  
  return { 
    approvePedidoById, 
    approvePurchaseBatchById, 
    cancelPedidoById, 
    cancelPurchaseBatchById 
  }
}
```

**Problema**: `savePedido` tiene lógica condicional:
```typescript
if (formData.isBatchAggregate && formData.batchId) {
  await updatePedidoUsuario(formData.batchId, ...)
} else if (formData.id) {
  await updatePedido(formData.id, ...)
}
```

### 2.5 FLUJO DE APROBACIÓN (CONFUSO)

En `Pedidos.tsx` `handleAceptarConfirm`:

```typescript
if (itemToAceptar.isBatchAggregate) {
  // Tab 2: PurchaseBatch
  await approvePurchaseBatchById(itemToAceptar.id)
} else {
  // Tab 0-1: Pedido individual
  // Pero en lugar de aceptar, lo CONSOLIDA en un batch semanal
  await consolidatePedidosByIds([itemToAceptar.id], observaciones)
}
```

→ **Inconsistencia UX**: aprobar PurchaseBatch ≠ aprobar Pedido individual

---

## 3. TARGETS A CAMBIAR (ENFORCEMENT)

### 3.1 SEGREGACIÓN DE TIPOS

**Objetivo**: 
- `Pedido` = INTERNAL ONLY (nunca en componentes de UI)
- `PedidoUsuario` = PEDIDOS UI (tab 0-1)
- `PurchaseBatch` = COMPRAS UI (tab 2)

**Archivos a refactorizar:**

```
frontend/smart-economat-frontend/src/

TYPES:
└─ services/pedido.types.ts
   - Separar tipos en 3 namespaces/archivos:
     * pedido-usuario.types.ts (PedidoUsuario, PedidoUsuarioLinea)
     * purchase-batch.types.ts (PurchaseBatch)
     * pedido.types.ts (ONLY Pedido, marcar @deprecated)

COMPONENTS:
├─ components/ui/BatchPedidoLineasViewer.tsx
│  Change: batch: PurchaseBatch | PedidoUsuario
│  To: Split en 2 componentes:
│     - BatchPedidoLineasViewer (PurchaseBatch)
│     - PedidoUsuarioLineasViewer (PedidoUsuario)
│
├─ components/ui/DynamicFormModal.tsx
│  Change: union type in batch preview logic
│  To: Generic<T> o eliminar overlap
│
└─ features/pedidos/components/
   ├─ PurchaseBatchDetailModal.tsx
   │  Change: batch: PurchaseBatch | PedidoUsuario
   │  To: batch: PurchaseBatch ONLY
   │
   └─ PedidoDetailDrawer.tsx (RENAME)
      Change: pedido: Pedido | null
      To: pedidoUsuario: PedidoUsuario | null

UTILS:
├─ features/pedidos/utils/pedidoOwnOrders.ts
│  ELIMINATE: consolidateOwnPedidos() - síntesis artificial
│  Instead: Load from API with proper endpoints
│
├─ features/pedidos/utils/pedidoPayloads.ts
│  Split into:
│  - pedidoUsuarioPayloads.ts
│  - purchaseBatchPayloads.ts
│
└─ features/pedidos/utils/pedidoColumns.tsx
   Split into:
   - pedidoUsuarioColumns.tsx
   - purchaseBatchColumns.tsx

HOOKS:
├─ features/pedidos/hooks/usePedidosData.ts
│  Change: return Pedido[] (mixed)
│  To: return PedidoUsuario[] (tab 0-1)
│         return PurchaseBatch[] (tab 2)
│      → separate hooks or union with explicit discriminator
│
└─ features/pedidos/hooks/usePedidoActions.ts
   Change: approvePedidoById / approvePurchaseBatchById
   To: approvePedidoUsuario / approvePurchaseBatch
       (remove ambiguity in naming)

PAGES:
└─ pages/Pedidos.tsx
   Change: itemToViewBatch: PurchaseBatch | PedidoUsuario
   To: itemToViewPedidoUsuario: PedidoUsuario | null
       itemToViewBatch: PurchaseBatch | null
       → separate state, separate handlers
```

### 3.2 SERVICIOS API

**Objetivo**: Agrupar por dominio, no por dualismo de tipos.

```typescript
// pedido-usuario.service.ts (NUEVO)
export async function fetchPedidoUsuarios(...): Promise<PaginatedData<PedidoUsuario>>
export async function createPedidoUsuario(payload): Promise<PedidoUsuario>
export async function updatePedidoUsuario(id, payload): Promise<PedidoUsuario>
export async function aceptarPedidoUsuario(id): Promise<PedidoUsuario>
export async function cancelPedidoUsuario(id, payload): Promise<PedidoUsuario>
export async function downloadPedidoUsuarioPdf(id): Promise<void>

// purchase-batch.service.ts (NUEVO)
export async function fetchPurchaseBatches(): Promise<PurchaseBatch[]>
export async function fetchPurchaseBatchById(id): Promise<PurchaseBatch>
export async function createPurchaseBatch(payload): Promise<PurchaseBatch>
export async function updatePurchaseBatch(id, payload): Promise<PurchaseBatch>
export async function aceptarPurchaseBatch(id): Promise<PurchaseBatch>
export async function cancelPurchaseBatch(id, payload): Promise<PurchaseBatch>
export async function consolidatePurchaseBatch(payload): Promise<PurchaseBatch>
export async function downloadPurchaseBatchPdf(id): Promise<void>

// Eliminar o marcar @deprecated:
// pedido.service.ts funciones de Pedido (except mappers)
// pedido.service.ts funciones mixtas (aceptarPedido, etc.)
```

---

## 4. IMPLICACIONES UI/UX

### 4.1 APROBACIÓN / ACEPTACIÓN

**Actual (CONFUSO):**

| Acción | Tab | Target | Resultado |
|--------|-----|--------|-----------|
| Approve | 0-1 | Pedido individual | Consolida en PurchaseBatch semanal |
| Approve | 2 | PurchaseBatch | Transita a estado POR_RECEPCIONAR |

→ **UX problema**: Mismo botón (✓) = comportamientos distintos

**Propuesto (CLARO):**

| Acción | Tab | Target | Resultado | Endpoint |
|--------|-----|--------|-----------|----------|
| Approve | 0-1 | PedidoUsuario | Transita PENDIENTE → POR_RECEPCIONAR | PATCH /pedido-usuarios/{id}/aceptar |
| Consolidate | 0-1 | PedidoUsuario[] (semana) | Genera PurchaseBatch | POST /purchase-batches/consolidate |
| Approve | 2 | PurchaseBatch | Transita PENDIENTE → POR_RECEPCIONAR | PATCH /purchase-batches/{id}/aceptar |

**UI cambios necesarios:**
- Tab 0-1: Split botones → "Aprobar Pedido" vs "Consolidar Lote Semanal"
- Tab 2: Mantener "Aprobar Compra"

### 4.2 EDICIÓN

**Actual:**
- Editar Pedido individual → POST /pedidos con split por proveedor
- Editar PedidoUsuario (agregado) → PATCH /pedido-usuarios

**Propuesto:**
- Editar PedidoUsuario → PATCH /pedido-usuarios/{id}
- Editar PurchaseBatch → PATCH /purchase-batches/{id}

**UI:** Mismo formulario DynamicFormModal pero con payloads segregados.

### 4.3 CANCELACIÓN

**Actual:** 
- `cancelPedidoById()` vs `cancelPurchaseBatchById()` (ambos en hook)

**Propuesto:**
- `cancelPedidoUsuario()` 
- `cancelPurchaseBatch()`

No hay cambio UX; botón "Cancelar" es igual. Cambio solo interno (servicios/hooks).

### 4.4 CONSOLIDACIÓN SEMANAL

**Actual:**
- `PedidosWeeklyBoard` + `consolidateOwnPedidos()` crea agregados sintéticos
- Luego usuario puede "Consolidar Lote" → POST /purchase-batches/consolidate

**Propuesto:**
- ELIMINAR `consolidateOwnPedidos()` (síntesis artificial)
- `PedidosWeeklyBoard` carga PedidoUsuario[] directos del API
- Botón "Consolidar Semana" → POST /purchase-batches/consolidate [pedidoIds]
- Resultado: PurchaseBatch real (no sintético)

**UI**: Ídem visual pero datos reales desde inicio.

### 4.5 DETALLE / VISTA

**Actual:**
- `itemToViewBatch: PurchaseBatch | PedidoUsuario`
- Componente `PurchaseBatchDetailModal` con discriminador `mode: 'batch' | 'pedido'`

**Propuesto:**
- `itemToViewPedidoUsuario: PedidoUsuario | null`
- `itemToViewBatch: PurchaseBatch | null`
- Componentes separados:
  - `PedidoUsuarioDetailDrawer`
  - `PurchaseBatchDetailModal`

**UI**: No cambio visual; flujos separados internamente.

---

## ACTUALIZACIÓN - Revisado 2026-04-02

Confirmado que la mezcla conceptual sigue presente. Hallazgos principales actualizados:

### Mercado Mayor - Tipos Ambiguos Activos
1. `pedido.types.ts` → Define ambas (PedidoUsuario extends Pedido, PurchaseBatch)
2. `pedidos-ui.types.ts` → Tipos de UI sin segregación
3. Componentes usan Union Types extensamente

---

## 5. TESTS A ACTUALIZAR

### Unit Tests (Frontend)

```
src/features/pedidos/hooks/
├─ usePedidosData.spec.ts
│  - Segregar test para tab 0-1 (PedidoUsuario)
│  - Segregar test para tab 2 (PurchaseBatch)
│  - REMOVE tests de mapPedidoUsuarioToPedidoRow() síntesis
│
├─ usePedidoActions.spec.ts
│  - Split suite: approvePedidoUsuario vs approvePurchaseBatch
│  - cambiar expectativas de consolidate
│
└─ usePedidosFilters.spec.ts
   - Validar discriminación de tabs

src/features/pedidos/utils/
├─ pedidoOwnOrders.spec.ts
│  - ELIMINATE (removemos consolidateOwnPedidos)
│
├─ pedidoPayloads.spec.ts
│  - Split en pedidoUsuarioPayloads.spec + purchaseBatchPayloads.spec
│
└─ pedidoColumns.spec.ts
   - Split en pedidoUsuarioColumns.spec + purchaseBatchColumns.spec

src/components/ui/
└─ BatchPedidoLineasViewer.spec.ts
   - Split en:
     * PedidoUsuarioLineasViewer.spec.ts
     * PurchaseBatchLineasViewer.spec.ts
```

### E2E Tests (Frontend)

```
test/
├─ pedidos.e2e.spec.ts (refactor)
│  - Test "Consultar Mis Pedidos (tab 0)"
│  - Test "Consultar Todos Pedidos (tab 1)"
│  - Test "Crear Pedido de Usuario"
│  - Test "Editar Pedido de Usuario"
│  - Test "Aprobar Pedido de Usuario"
│  - Test "Cancelar Pedido de Usuario"
│
├─ compras.e2e.spec.ts (NUEVO)
│  - Test "Listar Compras (PurchaseBatch)"
│  - Test "Crear Compra desde catálogo"
│  - Test "Crear Compra desde recetas"
│  - Test "Consolidar Lote Semanal"
│  - Test "Aprobar Compra"
│  - Test "Recibir Compra"
│  - Test "Cancelar Compra"
│
└─ pedido-usuario-weekly-consolidation.e2e.spec.ts (NUEVO)
   - Test "Agrupar por semana PedidoUsuario[]"
   - Test "Consolidar múltiples pedidos en PurchaseBatch"
```

### Backend Tests (Affected by Frontend Calls)

Validar que los endpoints esperados sean correctos:
```
POST /pedido-usuarios (create PedidoUsuario)
PATCH /pedido-usuarios/{id}/aceptar
PATCH /purchase-batches/{id}/aceptar
POST /purchase-batches/consolidate
```

---

## 6. RESUMEN DE ARCHIVOS CRÍTICOS

### Modificación URGENTE

```
frontend/smart-economat-frontend/src/
├─ services/
│  ├─ pedido.types.ts (restructure)
│  ├─ pedido.service.ts (split en 2 servicios)
│  ├─ pedido-usuario.service.ts (NUEVO)
│  └─ purchase-batch.service.ts (NUEVO)
│
├─ features/pedidos/
│  ├─ types/pedidos-ui.types.ts (remove unions, split)
│  ├─ hooks/
│  │  ├─ usePedidosData.ts (segregate)
│  │  └─ usePedidoActions.ts (rename methods)
│  ├─ utils/
│  │  ├─ pedidoOwnOrders.ts (REMOVE consolidateOwnPedidos)
│  │  ├─ pedidoColumns.tsx (split)
│  │  └─ pedidoPayloads.ts (split)
│  └─ components/
│     ├─ PurchaseBatchDetailModal.tsx (restrict type)
│     └─ [NEW] PedidoUsuarioDetailDrawer.tsx
│
├─ components/ui/
│  ├─ BatchPedidoLineasViewer.tsx (split)
│  └─ DynamicFormModal.tsx (type constraints)
│
└─ pages/
   └─ Pedidos.tsx (segregate state)
```

### Módulos ESTABLES (no cambiar)

```
- backend/smart-economat-backend/src/modules/pedido/ (entidades OK)
- features/pedidos/components/PedidosWeeklyBoard.tsx (refactor para API real)
- features/pedidos/components/PurchasesWeeklyBoard.tsx (OK)
```
