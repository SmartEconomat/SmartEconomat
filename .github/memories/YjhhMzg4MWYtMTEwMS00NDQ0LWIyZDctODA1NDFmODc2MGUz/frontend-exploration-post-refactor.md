# Exploración Frontend Post-Refactor - Hallazgos de Alta Prioridad

## RESUMEN EJECUTIVO

Tras exploración del refactor reciente, hay **3 problemas de alta prioridad confirmados** que siguen siendo realmente problemáticos y requieren acción inmediata:

### 1. ⚠️ CREACIÓN DIRECTA DE PURCHASEBATCH DESDE UI (2 FLUJOS CRÍTICOS)

**Problema**: Las vías "from-missing-stock" y "from-recipes" crean `PurchaseBatch` directamente desde servicios API sin pasar por `PedidoUsuario`, violando el modelo de dominio donde `PurchaseBatch` debe ser siempre generado únicamente por:
- Aprobación individual de un `PedidoUsuario`
- Consolidación semanal de múltiples `PedidoUsuario`

**Ubicaciones**:
- [frontend/smart-economat-frontend/src/pages/Recetas.tsx#L479-L495](frontend/smart-economat-frontend/src/pages/Recetas.tsx#L479) — `createMissingStockBatch()` desde validación de stock de cooking
- [frontend/smart-economat-frontend/src/pages/Recetas.tsx#L684](frontend/smart-economat-frontend/src/pages/Recetas.tsx#L684) — `createPurchaseBatchFromRecetas()` desde selector de recetas

**Servicios involucrados**:
```typescript
// pedido.service.ts líneas 305-382
export async function createMissingStockBatch(payload): Promise<PurchaseBatch>
  → POST /purchase-batches/from-missing-stock  ❌

export async function createPurchaseBatchFromRecetas(payload): Promise<PurchaseBatch>
  → POST /purchase-batches/from-recipes  ❌
```

**Por qué es problema de producción**:
- Cortocircuita la trazabilidad: el batch se crea sin rastreo de usuario en el root visible
- Genera `PurchaseBatch` sin un `PedidoUsuario` raíz asociado
- Si el backend cambió a requerir `pedidoUsuarioIds`, estos endpoints van a romper
- Inconsistencia UI: tabs 0-1 muestran solo `PedidoUsuario`, tab 2 muestra compras de ambos orígenes

**Solución esperada**: Estos flujos deben crear `PedidoUsuario` primero, luego generar batch por aprobación o consolidación.

---

### 2. ⚠️ UNION TYPES EN COMPONENTES COMPARTIDOS (DISCRIMINACIÓN FRÁGIL)

**Problema**: Varios componentes aún aceptan `PurchaseBatch | PedidoUsuario` como tipo único con discriminación manual basada en propiedades de tipo (`'numeroGlobal' in batch`), no tipos TypeScript. Esto es frágil ante cambios de modelo.

**Ubicaciones**:

#### a) [frontend/smart-economat-frontend/src/components/ui/BatchPedidoLineasViewer.tsx#L57](frontend/smart-economat-frontend/src/components/ui/BatchPedidoLineasViewer.tsx#L57)
```typescript
interface BatchPedidoLineasViewerProps {
  batch: PurchaseBatch | PedidoUsuario;  // ❌ Union type
  entityType?: PedidoDetailEntityType;
  showPdfActions?: boolean;
}

// Discriminación manual:
const resolvedEntityType =
  entityType ??
  ('numeroGlobal' in batch ? 'pedido_usuario' : 'purchase_batch');
```
→ Detecta tipo por presencia de `numeroGlobal`, no por discriminador TypeScript

#### b) [frontend/smart-economat-frontend/src/features/pedidos/components/PurchaseBatchDetailModal.tsx#L52-L53](frontend/smart-economat-frontend/src/features/pedidos/components/PurchaseBatchDetailModal.tsx#L52)
```typescript
interface PurchaseBatchDetailModalProps {
  detail: PedidoBatchDetail | null;  // ✅ Discriminada correctamente
  // ...
}

// Pero internally en BatchPedidoLineasViewer sigue siendo problemático:
<BatchPedidoLineasViewer
  batch={detail.data}  // ✅ Correcto aquí
  entityType={detail.entityType}  // ✅ Discriminator explícito
/>
```

#### c) [frontend/smart-economat-frontend/src/components/ui/DynamicFormModal.tsx#L29](frontend/smart-economat-frontend/src/components/ui/DynamicFormModal.tsx#L29)
```typescript
import { PedidoUsuario, PurchaseBatch } from '../../services/pedido.types';
// Los tipos se usan en el renderizado pero no hay discriminador explícito
```

**Por qué es problema**:
- Si `numeroGlobal` se hace nulo en algún caso edge, la discriminación falla silenciosamente
- Dificulta mantenimiento: no está claro dentro del componente qué tipo de dato llega
- Facilita bugs de hard-to-debug cuando se mezclan campos de ambos tipos

**Solución**: Split `BatchPedidoLineasViewer` en variantes específicas:
- `PedidoUsuarioLineasViewer(pedidoUsuario: PedidoUsuario)`
- `PurchaseBatchLineasViewer(batch: PurchaseBatch)`

---

### 3. ⚠️ AMBIGÜEDAD EN LÓGICA DE SAVEPEDIDO (TARGETTYPE DUAL)

**Problema**: `usePedidoActions.savePedido()` sigue manejando lógica condicional compleja basada en `targetType` sin segregación clara de payloads.

**Ubicación**: [frontend/smart-economat-frontend/src/features/pedidos/hooks/usePedidoActions.ts#L62-L150](frontend/smart-economat-frontend/src/features/pedidos/hooks/usePedidoActions.ts#L62)

```typescript
const savePedido = useCallback(
  async (formData: PedidoFormValues) => {
    const targetType = formData.targetType ?? 'pedido_usuario';

    // Branch 1: Update PurchaseBatch
    if (formData.id && targetType === 'purchase_batch') {
      await updatePurchaseBatch(formData.id, buildPurchaseBatchPayload(...))
    }

    // Branch 2: Update PedidoUsuario
    if (formData.id && targetType === 'pedido_usuario') {
      await updatePedidoUsuario(formData.id, buildPurchaseBatchPayload(...))  // ⚠️ Same payload builder!
    }

    // Branch 3: Update legacy Pedido + create split pedidos
    if (formData.id) {
      const mainProviderId = formData.proveedorId || '';
      const mainProviderLines = linesByProvider.get(mainProviderId);
      await updatePedido(formData.id, buildPedidoUpdatePayload(...))
      // ... luego crea más pedidos
    }

    // Branch 4: Create PedidoUsuario
    if (!formData.id) {
      await createPedidoUsuario(buildPurchaseBatchPayload(formData...))
    }
  }
)
```

**Por qué es problema**:
- Usa `buildPurchaseBatchPayload` para ambos `PurchaseBatch` y `PedidoUsuario` updates → reutilización que oculta diferencias contract
- Las 4 ramas hacen que sea difícil agregar validaciones específicas por tipo si el contrato diverge
- La rama 3 (update `Pedido` legacy) sugiere que aún hay código que trata `Pedido` como entidad editable desde UI, lo cual contradice el modelo deseado

**Solución**: Separar en funciones específicas:
- `savePedidoUsuario()` con validaciones y payload específicos
- `savePurchaseBatch()` con validaciones y payload específicos
- Eliminar rama 3 si `Pedido` es ya completamente interno

---

## ESTADO POR COMPONENTE/MÓDULO

### ✅ YA REFACTORIZADO CORRECTAMENTE
- `PurchaseBatchDetailModal` — Usa `PedidoBatchDetail` con discriminador explícito `entityType`
- `PedidoDetailDrawer` — Especifico para `Pedido`, no mezcla tipos
- `usePedidosData.ts` — Carga separado para tabs 0-1 (`PedidoUsuario`) vs tab 2 (`PurchaseBatch`)
- `pedido.types.ts` — Define tipos segregados con `PedidoListItem | PedidoBatchDetail` discriminados

### ⚠️ AÚN PROBLEMÁTICO (MEZCLA CONCEPTUAL)
- `BatchPedidoLineasViewer.tsx` — Union type sin discriminador explícito TypeScript
- `savePedido()` hook — Lógica condicional + payload builder compartido
- `Recetas.tsx` — Dos endpoints que crean `PurchaseBatch` directamente

### 🚀 ACCIONES RECOMENDADAS DE ALTA PRIORIDAD

#### 1️⃣ INMEDIATO (Bloquea integridad de datos)
Buscar en backend si los endpoints `/purchase-batches/from-missing-stock` y `/purchase-batches/from-recipes` aún existen o si ya fueron migrados a crear `PedidoUsuario` primero. Si existen tal cual:
- ❌ Estos endpoints violarán el modelo si el backend espera `pedidoUsuarioIds`
- ✅ Confirmar si backend ya los cambió a retornar `PedidoUsuario` en lugar de `PurchaseBatch`

#### 2️⃣ SEGUNDO (Refactor de componentes)
Dividir `BatchPedidoLineasViewer` en variantes tipadas específicas o implementar discriminador TypeScript explícito.

#### 3️⃣ TERCERO (Limpieza lógica)
Refactorizar `savePedido()` en funciones segregadas por tipo con payloads y validaciones específicas.

---

## CONFIRMACIÓN FINAL — Reexploración 2026-04-02

### Problema #1: Creación directa de PURCHASEBATCH desde UI
**ESTADO**: ✅ **RESUELTO — YA NO ES PROBLEMA**
- `createMissingStockBatch()` y `createPurchaseBatchFromRecetas()` existen en servicio pero **NO se llaman en ningún lado**
- Recetas.tsx usa correctamente `createPedidoUsuarioFromMissingStock()` y `createPedidoUsuarioFromRecetas()`
- **Dead code**: las funciones antiguas de `PurchaseBatch` directo podrían ser removidas (opcional)
- **Conclusión**: Flujo arreglado correctamente; no requiere acción inmediata

### Problema #2: Uniones ambiguas en componentes compartidos
**ESTADO**: ⚠️ **AÚN PROBLEMA DE ALTA PRIORIDAD**
- `BatchPedidoLineasViewer.tsx` línea 58: `batch: PurchaseBatch | PedidoUsuario` (union cruda)
- Discriminación manual línea 71: `'numeroGlobal' in batch ? 'pedido_usuario' : 'purchase_batch'`
- **Riesgo**: Si `numeroGlobal` falla de algún modo (null, no deserializado), la lógica se quiebra silenciosamente
- **Ubicación crítica**: Usado en detalle de pedidos y compras
- **Acción necesaria**: Dividir en dos componentes específicos o implementar discriminador TypeScript explícito

### Problema #3: Edición de Pedido interno desde la vista visible
**ESTADO**: ⚠️ **AÚN PROBLEMA DE ALTA PRIORIDAD**
- Pedidos.tsx línea 507-514: `onEdit` callback permite editar `Pedido` interno (cuando no es `isPedidoUsuarioRow()`)
- Llama a `buildEditData(pedido)` asignando `targetType: 'pedido'`
- Ejecuta rama 3 en `usePedidoActions.savePedido()` que llama `updatePedido()` + posible creación de múltiples pedidos
- **Viola modelo**: Según plan (3.7), `Pedido` nunca debe ser editable desde UI; solo `PedidoUsuario` debe serlo
- **¿Por qué existe?**: Los Pedidos internos (split por proveedor) se muestran en tabla y el botón Edit está habilitado para ellos
- **Acción necesaria**: Ocultar/deshabilitar botón Edit para `entityType === 'pedido'` O retirar esa rama de savePedido

## RESUMEN DE ESTADO ACTUAL

**De los 3 problemas originales de alta prioridad:**
- 1 ✅ Resuelto (creación directa de batch)
- 2 ⚠️ Sigue siendo bloqueador (union types)
- 1 ⚠️ Sigue siendo bloqueador (edición de internos)

**¿Hay mezcla conceptual de alta prioridad AÚN?** ✅ SÍ, DOS problemas confirmados y activos requieren acción.
