# Plan: Unificar modal "Crear Pedido" en Dashboard

## TL;DR
El modal de "Nuevo Pedido" en las acciones rápidas del Dashboard usa un schema simplificado (con selector de proveedor único, fecha de entrega) y lógica de submit propia. El de Pedidos usa `getPedidoSchema(null)` (solo líneas + observaciones, multi-proveedor por línea) y `usePedidoActions.savePedido()` con agrupación automática por proveedor. Hay que reemplazar la implementación del Dashboard para que use exactamente la misma del módulo Pedidos.

## Diferencias actuales

| Aspecto | Dashboard (Home.tsx) | Pedidos (Pedidos.tsx) |
|---------|---------------------|----------------------|
| Schema | `pedidoSchema` de `utils/schemas.ts` (proveedorId select + fechaEntrega + obs + líneas) | `getPedidoSchema(null)` de `features/pedidos/utils/pedidoSchema.ts` (solo líneas + obs) |
| Size modal | `md` | `lg` |
| Submit | `handleSaveQuickAction` → `createPedido()` (un solo proveedor) | `savePedido()` de `usePedidoActions` → `createPedidoUsuario()` (multi-proveedor) |
| Drafts | No | Sí (auto-save con `usePedidoDraft`) |
| Confirmación | No | `requireConfirmation={true}` |
| `onValuesChange` | No | Sí (auto-save draft) |

## Steps

### Fase 1: Cambiar schema y props del modal

1. **Reemplazar import del schema** en `Home.tsx`:
   - Quitar: `import { pedidoSchema } from '../utils/schemas'`
   - Añadir: `import { getPedidoSchema } from '../features/pedidos/utils/pedidoSchema'`
   - *Depende de:* nada

2. **Reemplazar el `DynamicFormModal` de pedidos** en `Home.tsx`:
   - Cambiar `size` de `md` a `lg`
   - Cambiar `fields` de `currentPedidoSchema` a `getPedidoSchema(null)` 
   - Cambiar `initialData` de `PEDIDO_INITIAL_DATA` a `{}`
   - Añadir `requireConfirmation={true}`
   - Añadir `confirmationMessage="¿Estás seguro de que deseas registrar este nuevo pedido?"`
   - *Depende de:* paso 1

### Fase 2: Cambiar lógica de submit

3. **Importar y usar `usePedidoActions`** en `Home.tsx`:
   - Importar `usePedidoActions` de `features/pedidos/hooks/usePedidoActions`
   - Importar `PedidoFormValues` de `features/pedidos/types/pedidos-ui.types`
   - Inicializar el hook con `reload: loadStats` y `discardDraft: async () => {}` (no-op ya que el dashboard no maneja drafts)
   - *Depende de:* nada (paralelo con paso 1)

4. **Reemplazar handler de submit** en `Home.tsx`:
   - En el `DynamicFormModal` de pedidos, cambiar `onSubmit` y `isSubmitting`:
     - `onSubmit` → nueva función que llama `savePedido(formData)` de `usePedidoActions` y luego cierra el modal
     - `isSubmitting` → `isSaving` de `usePedidoActions`
   - *Depende de:* paso 3

### Fase 3: Limpieza

5. **Eliminar código muerto** de `Home.tsx`:
   - Quitar `PEDIDO_INITIAL_DATA`
   - Quitar `const [proveedores, setProveedores]` y el `useEffect` que carga proveedores para `quickActionTask === 'order'`
   - Quitar `currentPedidoSchema` y toda la lógica de mapear proveedores en el schema
   - Quitar la rama `else if (quickActionTask === 'order')` dentro de `handleSaveQuickAction`
   - Quitar `PedidoProductoFormValue` interface si ya no se usa
   - Quitar imports no usados: `createPedido`, `CreatePedidoPayload`, `fetchProveedores`, `Proveedor`
   - *Depende de:* pasos 1-4

6. **Verificar que `pedidoSchema` de `utils/schemas.ts` no se usa en otro sitio**
   - Si solo lo usaba Home.tsx, eliminar la exportación (o dejar si se usa en otro lugar)
   - *Depende de:* paso 5

## Relevant files

- `frontend/smart-economat-frontend/src/pages/Home.tsx` — Modificar: reemplazar schema, props del modal, handler de submit, limpiar código muerto
- `frontend/smart-economat-frontend/src/features/pedidos/hooks/usePedidoActions.ts` — Reusar: `savePedido()` con `createPedidoUsuario`
- `frontend/smart-economat-frontend/src/features/pedidos/utils/pedidoSchema.ts` — Reusar: `getPedidoSchema(null)`
- `frontend/smart-economat-frontend/src/features/pedidos/utils/pedidoPayloads.ts` — Reusar indirectamente vía `usePedidoActions`
- `frontend/smart-economat-frontend/src/features/pedidos/types/pedidos-ui.types.ts` — Reusar: `PedidoFormValues`
- `frontend/smart-economat-frontend/src/utils/schemas.ts` — Posible limpieza: eliminar `pedidoSchema` si no se usa en otro sitio

## Verification

1. Compilación limpia: `cd frontend/smart-economat-frontend && npx tsc --noEmit`
2. Lint limpio: `npx eslint src/pages/Home.tsx`
3. Abrir Dashboard → click "Nuevo Pedido" → verificar que se abre modal tamaño `lg` con PedidoLineasSelector (producto + proveedor por línea + cantidad + precio)
4. Crear un pedido con múltiples productos de distintos proveedores → verificar que se agrupa correctamente y se crean mediante `createPedidoUsuario`
5. Verificar que la página de Pedidos sigue funcionando igual (no se tocó)
6. Buscar usos de `pedidoSchema` de `utils/schemas.ts` en el proyecto. Si cero usos → eliminar

## Decisions

- **Sin soporte de drafts en dashboard:** El auto-guardado en draft es una feature compleja acoplada a la vista de Pedidos (banner, diálogo de recuperación, etc.). Incluirla requeriría duplicar mucha lógica de UI. Para la acción rápida del dashboard, usamos un `discardDraft` no-op. El usuario que quiera drafts puede usar la vista completa de Pedidos.
- **Se reutiliza `usePedidoActions` directamente:** Es la forma más limpia de mantener sincronizadas ambas implementaciones. Si la lógica de creación cambia en el futuro, ambos sitios se actualizan automáticamente.
