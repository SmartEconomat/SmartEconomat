# Auditoría Técnica: Módulo de Pedidos (Frontend)

> **Auditor:** Staff Engineer Senior  
> **Fecha:** 2026-05-14  
> **Alcance:** Frontend React — `src/pages/Pedidos.tsx`, `src/features/pedidos/**`, `src/hooks/usePedidoDraft.ts`, `src/services/pedido*.ts`, `src/components/ui/PedidoLineasSelector.tsx`, `src/components/ui/BatchPedidoLineasViewer.tsx`  
> **Versión tecnológica:** React 19, Vite 6, MUI 7, React Router 7, TypeScript strict

---

## Resumen Ejecutivo

El módulo de Pedidos es el más complejo de SmartEconomat, gestionando tres entidades paralelas (`Pedido`, `PedidoUsuario`, `PurchaseBatch`) con flujos de estado diferenciados. La arquitectura base es correcta: separación entre hooks de datos, hooks de acciones, utilidades y componentes de presentación. Sin embargo, la auditoría detecta **21 hallazgos** (3 críticos, 6 altos, 7 medios, 5 bajos) que constituyen riesgos reales de seguridad, pérdida de datos y comportamientos inesperados en producción.

Los problemas más graves son: derivación incorrecta de permisos RBAC (cualquier usuario con permiso de editar puede aprobar y cancelar), pérdida silenciosa de borradores en error de red, y carga masiva descontrolada de N páginas concurrentes sin backpressure.

---

## Métricas

| Dimensión | Calificación | Nota |
|-----------|-------------|------|
| Máquina de estados | 6/10 | Estado `BORRADOR` invisible; `isEditable` duplicado e inconsistente |
| Sistema de draft | 5/10 | Optimistic delete con error swallowing; autosave silente |
| Gestión de permisos | 4/10 | `canCancel = canEdit`, `canApprove = canEdit`; botón recepción sin guardia |
| Manejo de errores | 5/10 | Errores de draft silenciados; falta feedback en cascadas de fallo |
| Performance | 5/10 | N×Promise.all sin límite; caché de módulo no invalidable |
| Tipado TypeScript | 5/10 | `unknown[]` para líneas; `any` explícito en selector; tipos cruzados |
| UX y flujos | 7/10 | Buen diseño general; draft banner bien pensado; paginación rota en "finalizados" |

---

## Hallazgos

---

### [PED-001] Permisos RBAC derivados incorrectamente — canCancel y canApprove colapsan en canEdit

#### Severidad: Crítica
#### Categoría: Seguridad / Control de Acceso

#### Descripción
La función `buildPedidoPermissions` en `pedidoPermissions.ts` asigna `canCancel` y `canApprove` directamente al valor de `canEdit`. No existen permisos granulares independientes para cancelar ni aprobar pedidos.

#### Evidencia

```typescript
// src/features/pedidos/utils/pedidoPermissions.ts
export const buildPedidoPermissions = (
  canCreate: boolean,
  canEdit: boolean,
  canDelete: boolean
): PedidoPermissions => ({
  canCreate,
  canEdit,
  canDelete,
  canCancel: canEdit,   // ← mismo que canEdit
  canApprove: canEdit,  // ← mismo que canEdit
});
```

```typescript
// Pedidos.tsx — los tres permisos base:
const canEdit = usePermission(PERMISSIONS.pedidos.editar);
const canDelete = usePermission(PERMISSIONS.pedidos.eliminar);
const canCreate = usePermission(PERMISSIONS.pedidos.crear);
```

No se consulta ningún permiso específico como `PERMISSIONS.pedidos.aprobar` o `PERMISSIONS.pedidos.cancelar`.

#### Riesgo real
Todo rol que tenga `PERMISSIONS.pedidos.editar` puede aprobar pedidos de usuario (transición de estado irreversible) y cancelarlos. Un alumno con permiso de edición podría aprobar sus propios pedidos sin intervención del profesor/administrador, rompiendo el flujo de aprobación.

#### Impacto
- Escalación de privilegios silenciosa.
- El sistema RBAC del backend puede estar correctamente configurado pero el frontend expone las acciones a usuarios sin permiso real.
- Riesgo de aprobaciones no autorizadas que generan compras.

#### Solución recomendada
Añadir permisos específicos en el backend y consultarlos en el frontend:
```typescript
const canApprove = usePermission(PERMISSIONS.pedidos.aprobar);
const canCancel = usePermission(PERMISSIONS.pedidos.cancelar);

const permissions: PedidoPermissions = useMemo(
  () => buildPedidoPermissions(canCreate, canEdit, canDelete, canApprove, canCancel),
  [canCreate, canEdit, canDelete, canApprove, canCancel]
);
```

#### Prioridad: Inmediata
#### Riesgo de regresión: Medio

---

### [PED-002] Pérdida silenciosa de borrador en `discardDraft` y `saveDraft`

#### Severidad: Crítica
#### Categoría: Fiabilidad / UX / Pérdida de datos

#### Descripción
`usePedidoDraft.ts` tiene dos problemas graves de fiabilidad:

**a) `discardDraft` usa optimistic delete sin recuperación de error:**

```typescript
// src/hooks/usePedidoDraft.ts — discardDraft
const discardDraft = useCallback(async () => {
  try {
    setDraft(null);                // ← limpia estado local PRIMERO
    lastSavedPayloadRef.current = '';
    await deletePedidoDraft();     // ← si esto falla...
  } catch (error) {
    console.error('Error deleting pedido draft:', error); // ← solo log, sin restore
  }
}, [setDraft]);
```

Si `deletePedidoDraft()` falla (timeout, 500, sin red), el estado local queda a `null` pero el draft sigue en el servidor. La próxima vez que el usuario cargue la página, el draft "descartado" reaparecerá como si no hubiera sido eliminado.

**b) `saveDraft` silencia errores de autosave:**

```typescript
// src/hooks/usePedidoDraft.ts — saveDraft
saveTimerRef.current = setTimeout(async () => {
  try {
    const updated = await upsertPedidoDraft(payload, draftRef.current?.version);
    // ...
  } catch (error: unknown) {
    const err = error as { status?: number; data?: { draft: PedidoDraftRecord } };
    if (err?.status === 409 && err?.data?.draft) {
      setDraft(err.data.draft);
    } else {
      console.error('Error saving pedido draft:', error); // ← usuario NO se entera
    }
  }
}, 1000);
```

Si el autosave falla por error de red, el usuario continúa editando sin saber que sus cambios no se están guardando. Al cerrar o refrescar, todo se pierde.

#### Riesgo real
- Un usuario puede estar trabajando durante minutos en un pedido complejo y perder todo el contenido sin ninguna notificación.
- En entornos de red inestable (móvil, VPN), este escenario es frecuente.

#### Impacto
- Pérdida de trabajo del usuario sin feedback.
- Inconsistencia entre estado percibido (draft eliminado) y estado real del servidor.

#### Solución recomendada
```typescript
// discardDraft con rollback:
const discardDraft = useCallback(async () => {
  const previousDraft = draftRef.current;
  setDraft(null);
  lastSavedPayloadRef.current = '';
  try {
    await deletePedidoDraft();
  } catch (error) {
    setDraft(previousDraft); // rollback
    toast.error(t('pedidos.draft.errorEliminar'));
  }
}, [setDraft, toast, t]);

// saveDraft con feedback de error:
} catch (error: unknown) {
  if (err?.status === 409 && err?.data?.draft) {
    setDraft(err.data.draft);
  } else {
    toast.warning(t('pedidos.draft.errorGuardar')); // notificar al usuario
  }
}
```

#### Prioridad: Inmediata
#### Riesgo de regresión: Bajo

---

### [PED-003] Carga masiva descontrolada — N peticiones paralelas sin límite de concurrencia

#### Severidad: Crítica
#### Categoría: Performance / Fiabilidad

#### Descripción
Dos funciones ejecutan `Promise.all` con un número arbitrario de peticiones HTTP simultáneas, sin mecanismo de throttling ni límite de páginas efectivo.

**a) `fetchPurchaseBatches` en `pedido.service.ts`:**

```typescript
// src/services/pedido.service.ts — fetchPurchaseBatches
const rest = await Promise.all(
  Array.from({ length: totalPages - 1 }, (_, index) =>
    baseFetch(
      `/purchase-batches?page=${normalizePageParam(index + 2)}&limit=${limit}`
    )
  )
);
```

Si hay 50 páginas de batches, se disparan 49 peticiones HTTP simultáneas. El `maxPages = 200` pretende ser un límite de seguridad, pero en realidad puede disparar hasta 199 peticiones en paralelo.

**b) `usePedidosData.ts` para el tab semanal (tabIndex === 1):**

```typescript
// src/features/pedidos/hooks/usePedidosData.ts
if (firstWeeklyPage.totalPages > 1) {
  const remainingWeeklyPages = await Promise.all(
    Array.from({ length: firstWeeklyPage.totalPages - 1 }, (_, index) =>
      fetchPedidoUsuarios(index + 2, WEEKLY_PEDIDOS_PAGE_SIZE, ...)
    )
  );
}
```

Con `WEEKLY_PEDIDOS_PAGE_SIZE = 50` y 500 pedidos históricos, se dispararían 9 peticiones paralelas. Con 5.000 pedidos, serían 99 peticiones simultáneas.

#### Riesgo real
- Saturación del servidor con picos de N×50 RPS generados por un solo usuario.
- Posible trigger de rate limiting o circuit breakers del backend.
- En dispositivos móviles, el límite de conexiones TCP del sistema operativo (normalmente 6 por dominio) crea una cola que puede bloquear otras operaciones.

#### Impacto
- Degradación del rendimiento del servidor bajo carga concurrente de múltiples usuarios.
- La UI puede quedar bloqueada esperando decenas de peticiones.

#### Solución recomendada
Implementar paginación real con lazy loading o usar un chunker con concurrencia limitada:
```typescript
// Opción 1: lazy load (preferida) — solo cargar la página visible
// Opción 2: chunking con límite
async function fetchAllPages<T>(
  fetchPage: (page: number) => Promise<PaginatedData<T>>,
  concurrency = 3
): Promise<T[]> {
  const first = await fetchPage(1);
  const allItems = [...first.data];
  
  for (let i = 2; i <= first.totalPages; i += concurrency) {
    const chunk = Array.from(
      { length: Math.min(concurrency, first.totalPages - i + 1) },
      (_, j) => fetchPage(i + j)
    );
    const results = await Promise.all(chunk);
    results.forEach(r => allItems.push(...r.data));
  }
  return allItems;
}
```

#### Prioridad: Alta
#### Riesgo de regresión: Medio

---

### [PED-004] Estado `BORRADOR` invisible en todas las tabs de "Mis Pedidos"

#### Severidad: Alta
#### Categoría: Lógica de negocio / Máquina de estados

#### Descripción
El enum `EstadoPedidoUsuario` incluye `BORRADOR = 'borrador'`, pero las tres funciones de clasificación de estado no lo contemplan en ninguna categoría:

```typescript
// src/services/pedido.types.ts
export const isPendingPedidoUsuarioStatus = (estado?: string): boolean =>
  estado === EstadoPedidoUsuario.PENDIENTE;
// ↑ BORRADOR no es "pendiente"

export const isActivePedidoUsuarioStatus = (estado?: string): boolean =>
  estado === EstadoPedidoUsuario.APROBADO;
// ↑ BORRADOR no es "activo"

export const isFinishedPedidoUsuarioStatus = (estado?: string): boolean =>
  estado === EstadoPedidoUsuario.CANCELADO ||
  estado === EstadoPedidoUsuario.CONSOLIDADO;
// ↑ BORRADOR no es "finalizado"
```

En `Pedidos.tsx`, el filtro `ownOrdersData` aplica exactamente estas funciones:
```typescript
// Pedidos.tsx — ownOrdersData
return data.filter((pedido) => {
  if (misPedidosStatus === 'pendientes')
    return isPendingPedidoUsuarioStatus(String(pedido.estado));
  if (misPedidosStatus === 'activos')
    return isActivePedidoUsuarioStatus(String(pedido.estado));
  return isFinishedPedidoUsuarioStatus(String(pedido.estado));
});
```

Si el backend devuelve un `PedidoUsuario` con `estado: 'borrador'`, desaparecerá de la vista sin ningún mensaje de error.

#### Riesgo real
Si el backend permite crear pedidos de usuario en estado BORRADOR (que es parte del enum oficial), estos son completamente invisibles para el alumno/profesor. No pueden gestionarlos, editarlos ni saber que existen.

#### Impacto
- Pedidos fantasma que existen en base de datos pero no aparecen en la UI.
- Confusión en usuarios que ven un contador de pedidos diferente al visible.

#### Solución recomendada
```typescript
export const isPendingPedidoUsuarioStatus = (estado?: string): boolean =>
  estado === EstadoPedidoUsuario.PENDIENTE ||
  estado === EstadoPedidoUsuario.BORRADOR; // incluir borradores en "pendientes"
```

O bien crear una tab explícita para borradores si el flujo de negocio lo requiere.

#### Prioridad: Alta
#### Riesgo de regresión: Bajo

---

### [PED-005] Paginación rota para el filtro "finalizados" en "Mis Pedidos"

#### Severidad: Alta
#### Categoría: Lógica de negocio / UX

#### Descripción
Para el filtro `misPedidosStatus === 'finalizados'`, el hook `usePedidosData` envía `estadoFilter = ''` al backend (sin filtro de estado), lo que hace que el servidor devuelva todos los pedidos del usuario. El frontend luego filtra en cliente:

```typescript
// usePedidosData.ts
const estadoFilter =
  misPedidosStatus === 'pendientes'
    ? EstadoPedidoUsuario.PENDIENTE
    : misPedidosStatus === 'activos'
      ? EstadoPedidoUsuario.APROBADO
      : '';  // ← finalizados: sin filtro de estado en el servidor
```

```typescript
// Pedidos.tsx — ownOrdersData (filtrado en cliente)
return isFinishedPedidoUsuarioStatus(String(pedido.estado));
```

Esto produce:
1. El servidor devuelve `totalItems = 100` (todos los pedidos del usuario).
2. `ownOrdersData.length = 30` (solo los finalizados de la página actual).
3. `visibleTotalItems = ownOrdersTotalItems = 30` (correcto en apariencia).
4. Pero la paginación navega a página 2 de los 100 totales del servidor, mostrando 10 más (de los cuales solo algunos son "finalizados").

El resultado es que se muestra un número variable de items por página según cuántos "finalizados" hay en cada página del servidor, lo cual es comportamiento totalmente inesperado.

#### Riesgo real
Un usuario con 100 pedidos (40 finalizados, 60 activos) ve la paginación malformada: puede ver páginas con 0 pedidos finalizados intercaladas con páginas que tienen varios.

#### Solución recomendada
Enviar los estados finalizados al backend como filtro combinado, o implementar lazy loading con filtro solo en servidor:
```typescript
const estadoFilter =
  misPedidosStatus === 'pendientes'
    ? EstadoPedidoUsuario.PENDIENTE
    : misPedidosStatus === 'activos'
      ? EstadoPedidoUsuario.APROBADO
      : `${EstadoPedidoUsuario.CANCELADO},${EstadoPedidoUsuario.CONSOLIDADO}`;
```

(Requiere que el backend soporte múltiples estados separados por coma, o añadir parámetros `estados[]`.)

#### Prioridad: Alta
#### Riesgo de regresión: Medio

---

### [PED-006] Botón "Iniciar Recepción" en PurchaseBatch sin verificación de permisos

#### Severidad: Alta
#### Categoría: Seguridad / Control de Acceso

#### Descripción
En `pedidoColumns.tsx`, `renderBatchActions` muestra el botón "Iniciar Recepción" sin verificar ningún permiso:

```tsx
// src/features/pedidos/utils/pedidoColumns.tsx — renderBatchActions
export const renderBatchActions = (
  row: PurchaseBatch,
  handlers: PurchaseBatchActionHandlers
): React.ReactNode => (
  <Stack direction="row" spacing={1} justifyContent="center">
    <Tooltip title={i18n.t('comun.iniciarRecepcion')}>
      <IconButton
        color="success"
        onClick={(e) => {
          e.stopPropagation();
          handlers.onRecepcion(row);  // ← sin guardia de permiso
        }}
```

Cualquier usuario que pueda ver la pestaña "Compras" (tabIndex === 2) puede intentar iniciar una recepción, incluso sin permiso para `recepciones.crear`.

Esta función también se usa en `PurchasesWeeklyBoard` sin ninguna verificación adicional.

#### Riesgo real
Un alumno o usuario sin permisos de recepción podría iniciar el flujo de recepción, provocando cambios de estado en el draft de recepción que luego no puede completar, dejando datos inconsistentes.

#### Solución recomendada
```typescript
interface PurchaseBatchActionHandlers {
  onView: (batch: PurchaseBatch) => void;
  onRecepcion: (batch: PurchaseBatch) => void;
  canRecepcion?: boolean; // añadir guardia
}

// En renderBatchActions:
{handlers.canRecepcion && (
  <Tooltip title={i18n.t('comun.iniciarRecepcion')}>
    <IconButton onClick={...} />
  </Tooltip>
)}
```

#### Prioridad: Alta
#### Riesgo de regresión: Bajo

---

### [PED-007] `PedidoDetailDrawer.canEdit` hardcodeado a `false` — botón Editar nunca visible

#### Severidad: Alta
#### Categoría: Bug funcional / UX

#### Descripción
En `Pedidos.tsx`, el componente `PedidoDetailDrawer` recibe `canEdit` siempre como `false`, independientemente de los permisos reales del usuario:

```tsx
// Pedidos.tsx — línea ~1029
<PedidoDetailDrawer
  pedido={itemToViewDetails}
  canEdit={false}          // ← hardcoded false
  onClose={() => setItemToViewDetails(null)}
  onEdit={() => undefined} // ← handler vacío
/>
```

`PedidoDetailDrawer` muestra el botón de edición únicamente cuando `canEdit === true` y el pedido está en estado `PENDIENTE_DE_APROBACION`:

```tsx
// PedidoDetailDrawer.tsx
{canEdit && pedido.estado === EstadoPedido.PENDIENTE_DE_APROBACION && (
  <Button onClick={() => onEdit(pedido)}>
    {t('pedidos.detalle.acciones.editarPedido')}
  </Button>
)}
```

El botón de edición en el drawer de detalle de pedidos directos (`Pedido`) nunca se mostrará.

#### Riesgo real
Los administradores con permiso de edición no pueden editar pedidos directos desde el drawer de detalle. Esto fuerza un workaround manual o hace que la funcionalidad sea inaccesible.

#### Solución recomendada
```tsx
<PedidoDetailDrawer
  pedido={itemToViewDetails}
  canEdit={permissions.canEdit}
  onClose={() => setItemToViewDetails(null)}
  onEdit={(pedido) => { setItemToViewDetails(null); setItemToEdit(pedido); }}
/>
```

#### Prioridad: Alta
#### Riesgo de regresión: Bajo

---

### [PED-008] `buildPedidoColumns` ejecutado a nivel de módulo antes de que i18n esté listo

#### Severidad: Alta
#### Categoría: Internacionalización / Bug de inicio

#### Descripción
En `PedidosTable.tsx`, la función `buildPedidoColumns()` se invoca fuera de cualquier componente React, a nivel de módulo:

```tsx
// src/features/pedidos/components/PedidosTable.tsx
const columns = buildPedidoColumns(); // ← ejecutado al importar el módulo
```

`buildPedidoColumns` usa `i18n.t(...)` directamente (no el hook `useTranslation`):

```tsx
// src/features/pedidos/utils/pedidoColumns.tsx
export const buildPedidoColumns = (): Column<PedidoListItem>[] => [
  {
    id: 'pedidoId',
    label: i18n.t('pedidos.columnsList.pedidoId'), // ← instancia i18n directa
    ...
  },
```

Si el módulo se importa antes de que i18n termine de cargar los namespaces (lo cual ocurre al importar dinámicamente o en rutas lazy), los labels de las columnas serán las claves en crudo (p.ej., `"pedidos.columnsList.pedidoId"`) o el fallback en inglés.

#### Riesgo real
En rutas con lazy loading, las columnas de la tabla pueden mostrar claves i18n sin resolver en lugar de etiquetas legibles. Esto ocurre especialmente en el primer render antes de que i18n complete la hidratación.

#### Solución recomendada
Mover la construcción de columnas dentro del componente o usar `useMemo`:
```tsx
const PedidosTable: React.FC<PedidosTableProps> = (props) => {
  const { t } = useTranslation();
  const columns = useMemo(() => buildPedidoColumns(t), [t]); // pasar t como argumento
  ...
};
```

Y modificar `buildPedidoColumns` para aceptar una función `t` en lugar de usar la instancia global.

#### Prioridad: Alta
#### Riesgo de regresión: Bajo

---

### [PED-009] Labels de formulario en `getPedidoSchema` hardcodeados en español — sin i18n

#### Severidad: Alta
#### Categoría: Internacionalización

#### Descripción
La función `getPedidoSchema` en `pedidoSchema.ts` define todos los labels directamente en español sin usar i18n:

```typescript
// src/features/pedidos/utils/pedidoSchema.ts
export const getPedidoSchema = (
  row: Record<string, unknown> | null
): DynamicField[] => {
  if (!row) {
    return [
      {
        name: 'pedidoProductos',
        label: 'Detalle de Productos',   // ← hardcoded español
        ...
      },
      {
        name: 'observaciones',
        label: 'Observaciones Generales', // ← hardcoded español
        ...
      },
    ];
  }
  // También:
  label: 'Motivo de la Cancelación',     // ← hardcoded
  label: 'Motivo de la Incidencia',      // ← hardcoded
  label: 'Detalle de Productos',         // ← hardcoded
  label: 'Observaciones Generales',      // ← hardcoded
```

El resto del módulo usa correctamente `useTranslation` y claves i18n. Esto es inconsistente y bloquea cualquier internacionalización futura.

#### Solución recomendada
```typescript
export const getPedidoSchema = (
  row: Record<string, unknown> | null,
  t: TFunction
): DynamicField[] => {
  // ...
  label: t('pedidos.schema.detalleProductos'),
  label: t('pedidos.schema.observaciones'),
  ...
};
```

#### Prioridad: Alta
#### Riesgo de regresión: Bajo

---

### [PED-010] `buildPurchaseBatchPayload` reutilizado para `updatePedidoUsuario` — tipo semánticamente incorrecto

#### Severidad: Media
#### Categoría: Mantenibilidad / Contrato de API

#### Descripción
En `usePedidoActions.ts`, la actualización de un `PedidoUsuario` usa el mismo builder de payload que un `PurchaseBatch`:

```typescript
// src/features/pedidos/hooks/usePedidoActions.ts
if (formData.id && targetType === 'pedido_usuario') {
  await updatePedidoUsuario(
    formData.id,
    buildPurchaseBatchPayload(formData.observaciones, normalizedLines) // ← batch payload
  );
  ...
}
```

Esto tiene dos problemas:
1. `updatePedidoUsuario` está tipado con `UpdatePurchaseBatchPayload` que incluye `fechaEntrega?: string`, un campo no aplicable a un pedido de usuario.
2. Si los contratos de la API divergen en el futuro, el TypeScript no detectará el error porque los tipos son intercambiables.

```typescript
// pedido.service.ts — updatePedidoUsuario con tipo incorrecto
export async function updatePedidoUsuario(
  id: string,
  payload: UpdatePurchaseBatchPayload  // ← debería ser UpdatePedidoUsuarioPayload
): Promise<PedidoUsuario> {
```

#### Solución recomendada
Crear un tipo específico `UpdatePedidoUsuarioPayload` y un builder dedicado `buildPedidoUsuarioUpdatePayload`.

#### Prioridad: Media
#### Riesgo de regresión: Bajo

---

### [PED-011] `PedidoFormValues.pedidoProductos` tipado como `unknown[]` — pérdida total de seguridad de tipos

#### Severidad: Media
#### Categoría: Tipado TypeScript

#### Descripción
El campo más importante del formulario de pedido está tipado con el tipo más débil posible:

```typescript
// src/features/pedidos/types/pedidos-ui.types.ts
export interface PedidoFormValues extends Record<string, unknown> {
  id?: string;
  batchId?: string;
  targetType?: PedidoEntityType;
  numeroGlobal?: string;
  proveedorId?: string;
  observaciones?: string;
  pedidoProductos?: unknown[];  // ← pérdida total de tipo
  estado?: string;
}
```

Como consecuencia, en `pedidoPayloads.ts` se accede a las propiedades con casting explícito:
```typescript
// src/features/pedidos/utils/pedidoPayloads.ts
const current = line as {
  id?: string;
  productoProveedorId?: string;
  proveedorId?: string;
  cantidad?: number | string;
  productoProveedor?: {
    proveedor?: { id?: string };
    proveedorId?: string;
  };
};
```

Y en `PedidoLineasSelector.tsx` hay varios `as any` y `// eslint-disable-next-line @typescript-eslint/no-explicit-any`:
```typescript
// src/components/ui/PedidoLineasSelector.tsx
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const lineData = line as any;
```

#### Solución recomendada
```typescript
import { PedidoProducto } from '../../../services/pedido.types';

export interface PedidoFormValues extends Record<string, unknown> {
  // ...
  pedidoProductos?: Partial<PedidoProducto & {
    productoId?: string;
    proveedorId?: string;
    nombreProducto?: string;
    nombreProveedor?: string;
    _key?: string;
  }>[];
}
```

#### Prioridad: Media
#### Riesgo de regresión: Medio

---

### [PED-012] Strings hardcodeados sin i18n en `PedidosTable.tsx` y `MisPedidosStatusTabs.tsx`

#### Severidad: Media
#### Categoría: Internacionalización

#### Descripción
Múltiples strings de usuario están hardcodeados en español en dos componentes:

```tsx
// src/features/pedidos/components/PedidosTable.tsx
<Typography variant="h6" color="text.secondary" gutterBottom>
  No se encontraron pedidos           {/* ← hardcoded */}
</Typography>
<Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
  Empieza registrando un nuevo pedido al catálogo de proveedores.  {/* ← hardcoded */}
</Typography>
<Button variant="outlined" onClick={onCreateClick}>
  Registrar Pedido                    {/* ← hardcoded */}
</Button>

// También:
getRowAriaLabel={(row) => `Ver detalle del pedido ${formatPedidoListNumber(row)}`} {/* ← hardcoded */}
```

```tsx
// src/features/pedidos/components/MisPedidosStatusTabs.tsx
const options = [
  { value: 'pendientes', label: 'PENDIENTES', ... },  // ← hardcoded
  { value: 'activos',    label: 'EN PROCESO', ... },  // ← hardcoded
  { value: 'finalizados', label: 'FINALIZADOS', ... }, // ← hardcoded
];
```

#### Prioridad: Media
#### Riesgo de regresión: Bajo

---

### [PED-013] `hasPromptedRef` no se resetea — borrador creado en la misma sesión no dispara el dialog de recuperación

#### Severidad: Media
#### Categoría: UX / Lógica de negocio

#### Descripción
En `Pedidos.tsx`, `hasPromptedRef` se establece a `true` la primera vez que se detecta un draft (o cuando no hay draft), y nunca se resetea:

```tsx
// Pedidos.tsx
useEffect(() => {
  if (isLoadingDraft) return;
  if (draft && !isRecoveryOpen && !hasPromptedRef.current && ...) {
    setIsRecoveryOpen(true);
    hasPromptedRef.current = true; // ← se pone a true
  } else if (!draft && !hasPromptedRef.current) {
    hasPromptedRef.current = true; // ← también se pone a true si no hay draft
  }
}, [draft, isLoadingDraft, isRecoveryOpen, itemToEdit]);
```

**Escenario problemático:**
1. Usuario carga página, no hay draft → `hasPromptedRef = true`.
2. Usuario abre formulario y empieza a escribir → se guarda el draft (autosave).
3. Usuario cierra el formulario sin guardar (backdropClick).
4. El draft sigue existiendo en servidor, pero `hasPromptedRef.current === true`.
5. El usuario NO verá el dialog de recuperación aunque haya un draft activo.

En este escenario, el banner `PedidoDraftBanner` se mostraría, pero el dialog modal de recuperación automática no aparecería.

#### Solución recomendada
Manejar la referencia como un Set de IDs de draft que ya se han promovido, o resetear al crear/descartar:
```typescript
const hasPromptedRef = useRef(false);
// Al descartar o guardar con éxito:
hasPromptedRef.current = false;
```

#### Prioridad: Media
#### Riesgo de regresión: Bajo

---

### [PED-014] `getWeekRangeLabel` duplicada entre `PedidosWeeklyBoard` y `PurchasesWeeklyBoard`

#### Severidad: Media
#### Categoría: Mantenibilidad / DRY

#### Descripción
La función `getWeekRangeLabel` está definida de forma idéntica en dos archivos:

```typescript
// Duplicado en PedidosWeeklyBoard.tsx Y PurchasesWeeklyBoard.tsx:
const getWeekRangeLabel = (
  referenceDate: string | undefined,
  invalidLabel: string,
  weekLabel: (start: string, end: string) => string
): string => {
  if (!referenceDate || !dayjs(referenceDate).isValid()) {
    return invalidLabel;
  }
  const start = dayjs(referenceDate).startOf('isoWeek');
  const end = dayjs(referenceDate).endOf('isoWeek');
  return weekLabel(formatLocalizedDate(start.toDate()), formatLocalizedDate(end.toDate()));
};
```

Si hay un bug (como el de timezone del hallazgo PED-015), debe corregirse en dos sitios.

#### Solución recomendada
Extraer a `src/features/pedidos/utils/weeklyBoardUtils.ts`.

#### Prioridad: Media
#### Riesgo de regresión: Bajo

---

### [PED-015] Timezone en Weekly Board — `dayjs` sin UTC puede agrupar pedidos en la semana incorrecta

#### Severidad: Media
#### Categoría: Bug potencial / Internacionalización

#### Descripción
Ambos tableros semanales usan `dayjs` sin plugin UTC ni configuración de timezone:

```tsx
// PedidosWeeklyBoard.tsx
const weekKey = dayjs(pedido.fechaPedido).isValid()
  ? dayjs(pedido.fechaPedido).startOf('isoWeek').format('YYYY-MM-DD')
  : 'sin-fecha';
```

Si el backend almacena `fechaPedido` como `"2026-05-14T23:00:00.000Z"` (UTC), un cliente en `UTC+2` lo interpretará como `"2026-05-15T01:00:00"` (hora local), asignando el pedido a la semana del 11-17 de mayo en lugar del 4-10 de mayo.

El mismo problema afecta a `PurchasesWeeklyBoard.tsx` con `batch.createdAt`.

#### Impacto potencial
Pedidos apareciendo en semanas incorrectas, acumulando en semanas equivocadas para la consolidación, y generando lotes semanales con pedidos de semanas diferentes.

#### Solución recomendada
Usar `dayjs.utc()` para parsear las fechas ISO antes de convertir a semana:
```typescript
import utc from 'dayjs/plugin/utc';
dayjs.extend(utc);

// Para agrupar por semana del servidor (UTC):
const weekKey = dayjs.utc(pedido.fechaPedido).startOf('isoWeek').format('YYYY-MM-DD');

// Para mostrar en hora local:
const displayDate = dayjs.utc(pedido.fechaPedido).local().format(...);
```

#### Prioridad: Media
#### Riesgo de regresión: Bajo

---

### [PED-016] Caché de catálogo de productos a nivel de módulo sin invalidación por usuario o sesión

#### Severidad: Media
#### Categoría: Seguridad / Fiabilidad

#### Descripción
`PedidoLineasSelector.tsx` usa tres variables globales mutables a nivel de módulo para cachear el catálogo de productos:

```typescript
// src/components/ui/PedidoLineasSelector.tsx
const CATALOG_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos
let cachedDefaultProducts: FlatProductoProveedor[] | null = null;
let cacheTimestamp = 0;
let cacheLoadingPromise: Promise<FlatProductoProveedor[]> | null = null;
```

**Problemas:**
1. El caché sobrevive al cambio de usuario (logout → nuevo login en la misma pestaña del navegador). Un usuario podría ver productos del catálogo cargado para otro usuario si el TTL no ha expirado.
2. Si el catálogo de productos se actualiza, el cambio no se refleja durante hasta 5 minutos.
3. Si hay múltiples instancias del componente abiertas simultáneamente, comparten el mismo caché, lo cual en este caso es el comportamiento deseado. Pero si una instancia causa un error en la carga, `cacheLoadingPromise = null` en el `finally`, por lo que la próxima instancia intentará cargar de nuevo — esto es correcto pero no obvio.

#### Solución recomendada
- Invalidar el caché en el evento de logout: `cachedDefaultProducts = null; cacheTimestamp = 0;`
- Usar Context API o React Query para gestionar el caché con invalidación automática por usuario.
- Considerar usar `useSWR` o `@tanstack/react-query` para este tipo de caché compartido.

#### Prioridad: Media
#### Riesgo de regresión: Bajo

---

### [PED-017] `saveDraft` en autosave silencia errores sin notificación al usuario

#### Severidad: Baja (impacto real: potencialmente alto)
#### Categoría: UX / Fiabilidad

#### Descripción
Ver descripción detallada en PED-002 (punto b). Se lista como hallazgo separado por afectar a un flujo diferente. Los errores del timer de autosave dentro de `saveDraft` solo se registran en `console.error`, sin ninguna notificación visual.

```typescript
// usePedidoDraft.ts
saveTimerRef.current = setTimeout(async () => {
  try { ... }
  catch (error: unknown) {
    if (err?.status === 409 ...) { ... }
    else {
      console.error('Error saving pedido draft:', error); // ← usuario no lo ve
    }
  }
}, 1000);
```

#### Prioridad: Baja
#### Riesgo de regresión: Bajo

---

### [PED-018] `aceptarPedido` es dead code — los pedidos directos no pueden aprobarse desde la UI actual

#### Severidad: Baja
#### Categoría: Mantenibilidad / Dead code

#### Descripción
La función `aceptarPedido` existe en `pedido.service.ts` pero no es llamada desde ninguna parte del módulo de pedidos:

```typescript
// pedido.service.ts — función existente pero no usada
export async function aceptarPedido(id: string): Promise<Pedido> {
  const response = await baseFetch(`/pedidos/${id}/aceptar`, { method: 'PATCH' });
  ...
}
```

`usePedidoActions.ts` solo llama a `aceptarPedidoUsuario` y `aceptarPurchaseBatch`. Los pedidos directos (`Pedido`) no tienen botón de aprobación en la UI — sus handlers en `Pedidos.tsx` solo actúan sobre `PedidoUsuarioRow`:

```tsx
// Pedidos.tsx — onApprove solo para isPedidoUsuarioRow
onApprove: (pedido: PedidoListItem) => {
  if (!isPedidoUsuarioRow(pedido)) {
    return; // ← pedidos directos ignorados
  }
  setItemToAceptar({ id: pedido.id, targetType: 'pedido_usuario', ... });
},
```

#### Solución recomendada
Evaluar si los pedidos directos deberían tener flujo de aprobación propio. Si no, eliminar `aceptarPedido` para reducir la superficie de API.

#### Prioridad: Baja
#### Riesgo de regresión: Bajo

---

### [PED-019] `PedidosTabs` — componente creado pero no utilizado en `Pedidos.tsx`

#### Severidad: Baja
#### Categoría: Mantenibilidad / Dead code

#### Descripción
Existe un componente `PedidosTabs.tsx` completo con sus estilos MUI, pero en `Pedidos.tsx` se usa directamente el componente `Tabs` de MUI con código inline:

```tsx
// Pedidos.tsx — usa Tabs de MUI directamente (no PedidosTabs)
<Tabs
  id="pedidos-tabs"
  value={tabIndex}
  onChange={(_, newValue: PedidosTabValue) => {
    setTabIndex(newValue);
    onPageChange(null, 1);
  }}
  variant="fullWidth"
  ...
```

`PedidosTabs.tsx` no se importa en ningún archivo del módulo actualmente activo.

#### Solución recomendada
Eliminar `PedidosTabs.tsx` o migrar `Pedidos.tsx` para usarlo, consolidando los estilos de la tab en un solo lugar.

#### Prioridad: Baja
#### Riesgo de regresión: Bajo

---

### [PED-020] Cast inseguro `recepcionesPedido` en `getConsolidationBlockReason`

#### Severidad: Baja
#### Categoría: Tipado TypeScript / Fiabilidad

#### Descripción
En `PedidosWeeklyBoard.tsx`, se comprueba si un pedido tiene recepciones usando un cast de tipo explícito sobre un campo que no está en la interfaz `Pedido`:

```tsx
// PedidosWeeklyBoard.tsx
if (
  (pedido.pedidos || []).some(
    (p) => (p as { recepcionesPedido?: unknown[] }).recepcionesPedido?.length
  )
) {
  return 'hasRecepciones';
}
```

El campo `recepcionesPedido` no forma parte de la interfaz `Pedido` definida en `pedido.types.ts`. Si el backend cambia el nombre del campo o no lo incluye en esta respuesta, la condición siempre retornará `undefined` (false), permitiendo consolidar pedidos con recepciones activas.

#### Solución recomendada
Añadir `recepcionesPedido?: unknown[]` a la interfaz `Pedido`, o eliminar esta comprobación si el backend ya lo valida.

#### Prioridad: Baja
#### Riesgo de regresión: Bajo

---

### [PED-021] Cast `batch as PurchaseBatch` en `PurchaseBatchDetailModal` sin distinción de tipo segura

#### Severidad: Baja
#### Categoría: Tipado TypeScript

#### Descripción
En `PurchaseBatchDetailModal.tsx`, cuando `detail.entityType === 'purchase_batch'`, el `batch` ya está tipado correctamente. Pero en el botón de recepción:

```tsx
// PurchaseBatchDetailModal.tsx
{!isPedidoUsuarioDetail && onRecepcion && batch && (
  <Button onClick={() => onRecepcion(batch as PurchaseBatch)}>
    {t('pedidos.batchDetail.recepcion')}
  </Button>
)}
```

`batch` es `PurchaseBatch | PedidoUsuario`. El cast `as PurchaseBatch` es correcto lógicamente (porque `isPedidoUsuarioDetail === false`), pero TypeScript no puede verificarlo en ese scope. Si en el futuro se añade una tercera variante de `PedidoBatchDetail`, este código compilará sin error pero fallará en runtime.

#### Solución recomendada
Usar narrowing explícito:
```tsx
{detail?.entityType === 'purchase_batch' && onRecepcion && batch && (
  <Button onClick={() => onRecepcion(detail.data)}>
```

#### Prioridad: Baja
#### Riesgo de regresión: Bajo

---

## Inconsistencias Frontend/Backend

### 1. Doble enum `EstadoLote` — riesgo de importación equivocada
En el backend existen dos enums `EstadoLote`: uno en el módulo de pedidos y otro en recetas. El frontend define un único `EstadoLote` en `pedido.types.ts`. Si el backend alguna vez devuelve valores del enum de recetas en un contexto de pedido, las comparaciones fallarán silenciosamente.

### 2. `createPedidoUsuario` acepta `CreatePurchaseBatchPayload`
La firma de `createPedidoUsuario` en `pedido.service.ts` usa el tipo de payload de PurchaseBatch. Aunque actualmente los campos son compatibles, esto oculta cualquier divergencia futura entre los contratos de la API para cada endpoint.

### 3. `updatePedidoUsuario` acepta `UpdatePurchaseBatchPayload`
El tipo incluye `fechaEntrega?: string`, que puede no ser un campo válido para `PATCH /pedido-usuarios/:id`. El backend lo rechazará o lo ignorará, pero el TypeScript no detectará el error.

### 4. Campo `proveedor` en `PedidoUsuarioRow` es sintético
`mapPedidoUsuarioToVisibleRow` genera un `proveedor.id` sintético con prefijo `agg:` cuando hay múltiples proveedores:
```typescript
const proveedorRowId = uniqueProveedorIds.length === 1
  ? uniqueProveedorIds[0]!
  : `agg:${normalizedPedidoUsuario.id}`;
```
Este ID sintético nunca existe en el backend. Si alguna parte del código lo usa para consultar al servidor, producirá un error 404.

### 5. `PedidoFormValues.estado` es `string` en lugar de unión de enums
El campo `estado` en `PedidoFormValues` está tipado como `string`, pero debería ser `EstadoPedido | EstadoPedidoUsuario | EstadoLote | undefined` para aprovechar el type-narrowing y detectar comparaciones incorrectas.

---

## Riesgos Potenciales Futuros

### Escalado del catálogo de productos
`PedidoLineasSelector` carga los primeros 50 productos del catálogo como default. Con un catálogo grande, el límite de 50 impide mostrar todos los productos al abrir el formulario. El usuario debe buscar explícitamente, lo cual no es evidente.

### Consolidación con pedidos de usuarios anónimos
`getConsolidationBlockReason` asigna `userId: \`sin-id-${userName}\`` a pedidos sin ID de usuario. Si dos pedidos tienen el mismo nombre (sin ID), se agruparán bajo el mismo "usuario" en el board semanal, mezclando sus pedidos.

### Race condition en operaciones paralelas sobre el mismo pedido
No existe mutex ni bloqueo optimista para prevenir que dos usuarios procesen el mismo pedido simultáneamente (aprobar y cancelar al mismo tiempo). El backend debería tener validaciones transaccionales, pero el frontend no informa al usuario si recibe un error de concurrencia.

### Draft de pedido compartido entre tabs/ventanas
El sistema de draft es por usuario en el servidor, no por sesión de navegador. Si el mismo usuario abre dos tabs de la aplicación y trabaja en ambas, los drafts colisionarán (el servidor manejará el conflicto con 409, pero la UX resultante puede ser confusa).

---

## Deuda Técnica

| Item | Impacto | Esfuerzo |
|------|---------|---------|
| Migrar `PedidoFormValues.pedidoProductos` de `unknown[]` a tipo específico | Alto | Medio |
| Extraer tipos de permisos de pedido y crearlos en RBAC del backend | Alto | Alto |
| Implementar paginación real en lugar de N×Promise.all para batches y weekly | Alto | Medio |
| Crear `UpdatePedidoUsuarioPayload` independiente | Bajo | Bajo |
| Extraer `getWeekRangeLabel` a utilidad compartida | Bajo | Bajo |
| Añadir plugin UTC a dayjs en los weekly boards | Medio | Bajo |
| Invalidar caché de `PedidoLineasSelector` en logout | Medio | Bajo |
| Eliminar `aceptarPedido` dead code o implementar su uso | Bajo | Bajo |
| Eliminar `PedidosTabs` o usarlo en `Pedidos.tsx` | Bajo | Bajo |
| Completar i18n en `getPedidoSchema`, `PedidosTable`, `MisPedidosStatusTabs` | Medio | Bajo |
| Mover `buildPedidoColumns` dentro de componente con hook `useTranslation` | Medio | Bajo |
| Implementar notificación de fallo en autosave del draft | Alto | Bajo |

---

## Conclusión

El módulo de Pedidos tiene una base arquitectónica sólida con buena separación de responsabilidades: hooks de datos (`usePedidosData`), hooks de acciones (`usePedidoActions`), filtros con URL sync (`usePedidosFilters`) y gestión de draft (`usePedidoDraft`). La experiencia general para el flujo principal está bien diseñada.

Sin embargo, existen **tres problemas críticos que deben resolverse antes de cualquier release de producción**:

1. **PED-001**: Los permisos `canCancel` y `canApprove` deben derivarse de permisos RBAC independientes, no de `canEdit`. El riesgo de escalación de privilegios es real y silencioso.

2. **PED-002**: El sistema de draft necesita manejo de errores con feedback visual. La pérdida silenciosa de datos del borrador es inaceptable en un contexto de negocio donde el usuario puede pasar minutos construyendo un pedido complejo.

3. **PED-003**: La estrategia de N×Promise.all para cargar todas las páginas de batches/pedidos semanales es un vector de degradación de rendimiento no controlado. Debe implementarse paginación real o chunking con concurrencia limitada.

Los problemas de prioridad alta (PED-004 a PED-009) deben planificarse para el siguiente sprint, ya que afectan visibilidad de datos (estado BORRADOR), corrección de paginación y accesibilidad de funcionalidades (botón editar siempre oculto).

Los hallazgos de prioridad media y baja representan deuda técnica acumulable, con especial atención al timezone en el Weekly Board (PED-015) que puede causar consolidaciones de pedidos en semanas equivocadas en entornos internacionales o con servidores en zona UTC distinta al cliente.
