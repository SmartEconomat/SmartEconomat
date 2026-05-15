# Auditoría Técnica: Recepción, Albaranes e Incidencias

**Proyecto:** SmartEconomat Frontend  
**Stack:** React 19 + Vite 6 + MUI 7 + React Router 7 + TypeScript  
**Fecha:** 2026-05-14  
**Auditor:** Staff Engineer — Revisión técnica exhaustiva  
**Ámbito:** Módulos de Recepción (wizard multi-paso + draft), Albaranes y Gestión de Incidencias

---

## Resumen Ejecutivo

Los módulos auditados constituyen el corazón operativo de la cadena de suministro en SmartEconomat. El wizard de recepción es el componente más complejo del proyecto: 1.640 líneas de lógica reactiva, integración con hardware (báscula serial), sistema de draft con sincronización backend optimista y flujo multi-paso crítico para la trazabilidad de stock.

**Hallazgos totales: 31** — de los cuales **4 son críticos o de alta severidad** con impacto directo en datos e integridad.

El módulo de recepción muestra una arquitectura sólida con patrones bien establecidos (draft centralizado, hooks específicos, hydration defensiva), pero acumula deuda técnica relevante: tipado débil en zonas de alta lógica, errores de casing que anulan la normalización de estados, y un problema de paginación que hace que los filtros de albaranes y recetas sean efectivamente inoperativos sobre datasets grandes.

---

## Métricas

| Dimensión | Calificación | Observaciones |
|-----------|-------------|---------------|
| Wizard multi-paso | 7/10 | Arquitectura correcta; deuda en validación y semántica de diálogos |
| Sistema de draft | 7.5/10 | Implementación robusta; debounce no restablece timer; mutación directa de ref |
| Manejo de errores | 5/10 | Errores silenciosos en PDF; feedback ausente en báscula desconectada |
| Integración API | 6/10 | Bug crítico en normalizeEstadoIncidencia; doble unwrap en albaran upload; N+1 en pedidos |
| Performance | 6/10 | loadPedidos hace hasta 50 llamadas secuenciales; filtrado client-side sobre página actual |
| UX y flujos | 7/10 | Semántica incorrecta en diálogos de recovery; estado final incidencia incompleto |
| Tipado TypeScript | 6/10 | `any`, `unknown[]`, campos extra fuera de interfaces, `keyof` ausente |
| Cobertura i18n | 7/10 | 3 cadenas hardcodeadas en español; estructura i18n correcta en general |

---

## Hallazgos

---

### [INC-001] normalizeEstadoIncidencia siempre retorna `null` — bug de casing

#### Severidad: Crítica
#### Categoría: Lógica de negocio / Bug

#### Descripción

La función `normalizeEstadoIncidencia` en `incidencia.service.ts` normaliza el string de entrada a **minúsculas** (`toLowerCase()`), pero las expresiones `case` del switch usan **valores de enum en mayúsculas**, por lo que nunca se alcanza ningún caso. La función retorna `null` en el 100% de las llamadas para estados canónicos del backend.

#### Evidencia

```typescript
// incidencia.service.ts — líneas 188-192
const normalized = value
  .trim()
  .toLowerCase()        // ← "nueva", "resuelta", "en_ajuste"
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '');

switch (normalized) {
  case EstadoIncidencia.NUEVA:   // ← 'NUEVA' — NUNCA coincide con 'nueva'
    return EstadoIncidencia.NUEVA;
  case EstadoIncidencia.EN_AJUSTE: // ← 'EN_AJUSTE' — NUNCA coincide con 'en_ajuste'
    return EstadoIncidencia.EN_AJUSTE;
  case EstadoIncidencia.RESUELTA:  // ← 'RESUELTA' — NUNCA coincide con 'resuelta'
    return EstadoIncidencia.RESUELTA;
  case EstadoIncidencia.CANCELADA: // ← 'CANCELADA' — NUNCA coincide con 'cancelada'
  case 'cancelado':                // ← este SÍ coincide (hardcoded lowercase)
    return EstadoIncidencia.CANCELADA;
  // ...
  default:
    return null;                   // ← siempre llega aquí para NUEVA, RESUELTA, etc.
}
```

#### Riesgo real

- **Todos** los estados de incidencia que llegan del backend (`NUEVA`, `RESUELTA`, `EN_AJUSTE`, `PENDIENTE_VALIDACION`, `ABIERTA`, `INVALIDA`) son ignorados.
- Se ejecuta `resolveEstadoIncidenciaFallback` en su lugar, que infiere el estado por heurísticas frágiles (conteo de líneas pendientes, regex sobre texto libre).
- Las tabs "por resolver / resueltas" pueden mostrar datos incorrectos.
- El `INCIDENCIA_STATUS_CHIP` recibe estados derivados, no los reales.

#### Impacto

Estado visual de incidencias incorrecto. Un operario puede ver incidencias como "pendientes" cuando el backend las marcó como `RESUELTA`, o viceversa.

#### Solución recomendada

```typescript
// Opción A: no normalizar a minúsculas (simplificación correcta)
function normalizeEstadoIncidencia(value: unknown): EstadoIncidencia | null {
  if (typeof value !== 'string') return null;
  const upper = value.trim().toUpperCase() as EstadoIncidencia;
  if (Object.values(EstadoIncidencia).includes(upper)) return upper;
  // Aliases legacy del backend
  const aliases: Record<string, EstadoIncidencia> = {
    'ABIERTA': EstadoIncidencia.ABIERTA,
    'CANCELADO': EstadoIncidencia.CANCELADA,
    'INVALIDO': EstadoIncidencia.INVALIDA,
    'PENDIENTE': EstadoIncidencia.NUEVA,
    'EN_REVISION': EstadoIncidencia.EN_AJUSTE,
    'PARCIAL': EstadoIncidencia.EN_AJUSTE,
  };
  return aliases[upper] ?? null;
}
```

#### Prioridad: Inmediata
#### Riesgo de regresión: Bajo (corrección puntual, sin cambios en UI)

---

### [INC-002] `resolveEstadoIncidenciaFallback` infiere estados críticos con regex sobre texto libre

#### Severidad: Alta
#### Categoría: Lógica de negocio / Fragilidad

#### Descripción

Como consecuencia directa del bug [INC-001], el fallback `resolveEstadoIncidenciaFallback` determina si una incidencia es `CANCELADA` o `INVALIDA` buscando patrones de texto en `observacionesResolucion`.

#### Evidencia

```typescript
// incidencia.service.ts — líneas 240-252
function resolveEstadoIncidenciaFallback(
  lineas: IncidenciaLinea[],
  resuelta: boolean,
  observacionesResolucion?: string
): EstadoIncidencia {
  if (observacionesResolucion && /cancelad/i.test(observacionesResolucion)) {
    return EstadoIncidencia.CANCELADA;  // ← "no se pudo cancelar" → CANCELADA!
  }
  if (observacionesResolucion && /inválid|invalid/i.test(observacionesResolucion)) {
    return EstadoIncidencia.INVALIDA;   // ← "el pedido no es inválido" → INVALIDA!
  }
  // ...
}
```

#### Riesgo real

Una nota como _"La reclamación no ha sido cancelada por el proveedor"_ haría que la incidencia sea marcada como `CANCELADA` en UI, ocultándola de la lista de pendientes.

#### Solución recomendada

Eliminar la inferencia regex. El estado debe venir exclusivamente del backend. Resolución indirecta: fix [INC-001].

#### Prioridad: Inmediata (resuelto por [INC-001])
#### Riesgo de regresión: Bajo

---

### [REC-001] Auto-save debounce no restablece el timer — cambios intermedios se pierden

#### Severidad: Alta
#### Categoría: Sistema de draft / Pérdida de datos

#### Descripción

El hook `useRecepcionDraft` implementa un debounce para el auto-guardado, pero si ya hay un timer pendiente, descarta las actualizaciones intermedias en lugar de cancelar el timer existente y crear uno nuevo. Esto provoca que rápidas ediciones sucesivas (escaneo de varios productos) solo guarden el primer snapshot, no el último.

#### Evidencia

```typescript
// useRecepcionDraft.ts — líneas 248-273
useEffect(() => {
  if (!isReady || activeStep >= 3 || pendingRecoveryDraft) return;
  if (skipAutoSaveRef.current) {
    skipAutoSaveRef.current = false;
    return;
  }

  if (pendingSyncTimerRef.current != null) {
    return;  // ← BUG: si hay timer activo, ignora el nuevo cambio
  }

  pendingSyncTimerRef.current = window.setTimeout(() => {
    pendingSyncTimerRef.current = null;
    void syncDraft();
  }, debounceMs);
  // ...
}, [activeStep, debounceMs, draft, isReady, pendingRecoveryDraft, syncDraft]);
```

#### Riesgo real

Si el usuario escanea 10 productos en 2 segundos (debounce = 2000ms), solo el primer escaneo queda sincronizado en el backend. Si el navegador se cierra durante ese período, se pierden los últimos 9 productos escaneados.

#### Solución recomendada

```typescript
// Cancelar timer existente y crear uno nuevo
useEffect(() => {
  if (!isReady || activeStep >= 3 || pendingRecoveryDraft) return;
  if (skipAutoSaveRef.current) {
    skipAutoSaveRef.current = false;
    return;
  }

  // Cancelar timer previo antes de crear uno nuevo
  if (pendingSyncTimerRef.current != null) {
    window.clearTimeout(pendingSyncTimerRef.current);
  }

  pendingSyncTimerRef.current = window.setTimeout(() => {
    pendingSyncTimerRef.current = null;
    void syncDraft();
  }, debounceMs);

  return () => {
    if (pendingSyncTimerRef.current != null) {
      window.clearTimeout(pendingSyncTimerRef.current);
      pendingSyncTimerRef.current = null;
    }
  };
}, [activeStep, debounceMs, draft, isReady, pendingRecoveryDraft, syncDraft]);
```

#### Prioridad: Alta
#### Riesgo de regresión: Bajo

---

### [REC-002] `loadPedidos` ejecuta hasta 50 llamadas API secuenciales (N+1 pattern)

#### Severidad: Alta
#### Categoría: Performance / Escalabilidad

#### Descripción

`loadPedidos` en `Recepcion.tsx` implementa un loop de paginación que hace llamadas secuenciales (no paralelas) al backend para obtener todos los pedidos con estado `POR_RECEPCIONAR`. En el peor caso son 50 × 50 = 2.500 pedidos cargados en 50 requests consecutivas.

#### Evidencia

```typescript
// Recepcion.tsx — líneas 411-448
const loadPedidos = useCallback(async () => {
  const pageSize = 50;
  const maxPages = 50;         // ← hasta 50 requests
  let page = 1;
  let totalPages = 1;
  const pedidos: Pedido[] = [];

  while (page <= totalPages && page <= maxPages) {
    const resp = await fetchPedidos(page, pageSize, '', estadosRecepcionables);
    // ↑ await dentro del loop = llamadas SECUENCIALES
    totalPages = Math.max(Number(resp.totalPages || 1), 1);
    for (const pedido of resp.data as Pedido[]) {
      if (!seenIds.has(pedido.id)) {
        seenIds.add(pedido.id);
        pedidos.push(pedido);
      }
    }
    page += 1;
  }
  setPedidosDisponibles(pedidos);
}, [t]);
```

#### Riesgo real

- Con 500 pedidos pendientes → 10 requests, ~2-3 segundos de carga bloqueante.
- Con 2500 pedidos → 50 requests, potencialmente 15+ segundos con red lenta.
- El `seenIds` Set elimina duplicados, lo que implica que el backend puede estar devolviendo duplicados, síntoma de un problema en la paginación backend.

#### Solución recomendada

```typescript
// Opción A: endpoint backend que devuelva todos de una sola llamada sin paginación
const resp = await fetchPedidos(1, 9999, '', estadosRecepcionables);

// Opción B: paginación paralela (requiere conocer totalPages en primer request)
const firstResp = await fetchPedidos(1, pageSize, '', estadosRecepcionables);
const totalPages = Math.ceil(firstResp.total / pageSize);
const remainingPages = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);
const responses = await Promise.all(
  remainingPages.map(p => fetchPedidos(p, pageSize, '', estadosRecepcionables))
);
```

#### Prioridad: Alta
#### Riesgo de regresión: Medio (cambio en carga de datos)

---

### [ALB-001] Filtros de albaranes son client-side sobre la página actual — paginación rompe el filtrado

#### Severidad: Alta
#### Categoría: Integridad de datos / UX

#### Descripción

Los filtros de `concordancia` y rango de fechas en el módulo de albaranes se aplican **únicamente sobre los datos de la página actual** (máximo 50 registros). El propio comentario del código lo reconoce. Esto significa que si hay 200 albaranes no conformes repartidos en 4 páginas, el filtro solo mostrará los de la página 1.

#### Evidencia

```typescript
// Albaran.tsx — líneas 197-222
// El backend no implementa estos filtros, se aplican sobre la página actual.
const filteredData = useMemo(() => {
  let result = data;  // ← 'data' es solo la página actual (≤50 items)

  if (filters.concordancia !== null) {
    result = result.filter((a) => a.concordancia === filters.concordancia);
  }
  if (filters.startDate) {
    const from = new Date(filters.startDate);
    result = result.filter((a) => a.fecha && new Date(a.fecha) >= from);
  }
  // ...
  return result;
}, [data, filters]);
```

Además, `fetchAlbaranes` no envía estos filtros al backend:

```typescript
// albaran.service.ts — líneas 25-35
const queryParams = buildQueryParams({
  page: params.page,
  limit: params.limit,
  search: params.searchTerm,
  sortBy: params.sortBy,
  order: params.order,
  // ← concordancia, startDate, endDate NO enviados
}, 20, 50);
```

#### Riesgo real

Un responsable de compras filtrando albaranes "No conformes" puede creer que la lista está completa cuando solo ve los primeros 50 registros filtrados localmente. Incidencias documentales no detectadas.

#### Solución recomendada

1. Añadir parámetros `concordancia`, `startDate`, `endDate` a `AlbaranQueryParams` y a `fetchAlbaranes`.
2. Implementar filtros en el backend (`/albaranes?concordancia=false&startDate=...`).
3. Eliminar el filtrado client-side.

#### Prioridad: Alta
#### Riesgo de regresión: Requiere cambio backend + frontend

---

### [INC-003] `proveedorId` se mapea al nombre del proveedor, no al UUID

#### Severidad: Alta
#### Categoría: Integridad de datos / Tipado

#### Descripción

En `mapIncidencia` (service), `proveedorId` se asigna al nombre del proveedor en lugar del UUID, con un comentario que reconoce el error.

#### Evidencia

```typescript
// incidencia.service.ts — línea 417
return {
  // ...
  proveedorId: toOptionalText(raw.pedido?.proveedor?.nombre) || '', // fallback id
  // ↑ INCORRECTO: asigna el nombre, no el ID
```

La interfaz define `proveedorId: string` esperando un UUID, pero recibe texto libre como `"Mercadona"`.

#### Riesgo real

Si en el futuro alguna feature usa `incidencia.proveedorId` para hacer queries o navegación, fallará silenciosamente o producirá 404.

#### Solución recomendada

```typescript
proveedorId: toOptionalText(raw.pedido?.proveedor?.id) ||
             toOptionalText(raw.pedido?.proveedor?.nombre) || '', // nombre como último recurso
```

Verificar que el backend incluya `proveedor.id` en la respuesta de incidencias.

#### Prioridad: Alta
#### Riesgo de regresión: Bajo

---

### [REC-003] `validarDraft` declara `isValid = true` y nunca lo muta — erroresPorLinea siempre vacío

#### Severidad: Alta
#### Categoría: Lógica de negocio / Bug

#### Descripción

La función `validarDraft` en `Recepcion.tsx` declara `const isValid = true` y la usa como retorno final, pero nunca la pone a `false`. Los retornos tempranos (`return false`) funcionan correctamente para bloquear el envío, pero si se añade nueva lógica de validación que no tenga return temprano, pasará silenciosamente. Además, `erroresPorLinea` se actualiza al final siempre vacío.

#### Evidencia

```typescript
// Recepcion.tsx — líneas 988-1056
const validarDraft = (): boolean => {
  const errores: Record<string, string[]> = {};
  const isValid = true;  // ← nunca se muta a false

  // ... varios return false tempranos ...

  setDraft({ ...draft, erroresPorLinea: errores }); // ← siempre {}
  return isValid;  // ← siempre true si llega aquí
};
```

Los `erroresPorLinea` en el draft están siempre vacíos, lo que impide mostrar errores por línea en la UI (aunque actualmente no se renderizan).

#### Solución recomendada

```typescript
const validarDraft = (): boolean => {
  const errores: Record<string, string[]> = {};
  let isValid = true;  // ← let en lugar de const

  if (!hasReception) {
    isValid = false;
    errores['global'] = ['Debes recepcionar al menos un producto'];
  }

  // ... acumular errores por línea en errores[l.pedidoProductoId] ...

  setDraft({ ...draft, erroresPorLinea: errores });
  return isValid;
};
```

#### Prioridad: Alta
#### Riesgo de regresión: Medio

---

### [REC-004] `cantidadAlbaran` se inicializa diferente en `mapPedidoToDraft` vs `mapPedidoToDraftLines`

#### Severidad: Alta
#### Categoría: Inconsistencia de datos / DRY

#### Descripción

Existen dos funciones que mapean un `Pedido` a líneas de borrador con comportamientos distintos para `cantidadAlbaran`:

#### Evidencia

```typescript
// Recepcion.tsx — línea 474 (función local mapPedidoToDraft)
cantidadAlbaran: Number(pp.cantidad || 0),   // ← pre-rellena con cantidad pedida

// recepcionMapping.utils.ts — línea 45 (mapPedidoToDraftLines, función compartida)
cantidadAlbaran: '',   // ← vacío

// handleConfirmNewProduct — línea 1317 (productos espontáneos nuevos del modal)
cantidadAlbaran: '',   // ← vacío

// processProductFound — línea 793 (productos espontáneos al escanear)
cantidadAlbaran: 0,    // ← cero (diferente a '' y a Number(cantidad))
```

La función local de `Recepcion.tsx` pre-rellena con la cantidad pedida (que luego se usa como valor por defecto del albarán), mientras que `recepcionMapping.utils.ts` deja vacío. Ambas se usan en distintos flujos pero representan el mismo concepto.

#### Impacto

El campo `cantidadAlbaran` tiene tipo `number | ''` en la interfaz, pero se inicializa con 3 valores distintos (`Number`, `''`, `0`), lo que complica la lógica de validación y comparación downstream.

#### Solución recomendada

Unificar en una sola fuente de verdad: `mapPedidoToDraftLines` en `recepcionMapping.utils.ts`, y usar esa función en `Recepcion.tsx` eliminando `mapPedidoToDraft` local.

#### Prioridad: Alta
#### Riesgo de regresión: Medio

---

### [REC-005] `handleSelectProvider` y `handleDeselectProvider` usan tipo `any`

#### Severidad: Media
#### Categoría: Tipado TypeScript

#### Descripción

Dos handlers del wizard de recepción suprimen el tipado con `any`, ignorando `SelectChangeEvent`.

#### Evidencia

```typescript
// Recepcion.tsx — líneas 510-511 y 530-531
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const handleSelectProvider = (e: any) => {
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const handleDeselectProvider = (e: any) => {
```

#### Solución recomendada

```typescript
import { SelectChangeEvent } from '@mui/material';
const handleSelectProvider = (e: SelectChangeEvent<unknown>) => {
  const providerName = e.target.value as string;
  // ...
};
```

#### Prioridad: Media
#### Riesgo de regresión: Bajo

---

### [REC-006] Título del wizard hardcodeado en español — no usa i18n

#### Severidad: Media
#### Categoría: Internacionalización

#### Descripción

El título principal de la página de recepción y varios mensajes de error están hardcodeados en español, incumpliendo el sistema i18n del proyecto.

#### Evidencia

```tsx
// Recepcion.tsx — línea 1374
<Typography variant="h4" component="h1">
  Gestión de Recepción
</Typography>

// Recepcion.tsx — líneas 1005, 1161-1167
setError('Debes recepcionar al menos un producto.');
setError(`Error crítico: El pedido que intentabas recepcionar ya no existe...`);
setError(`Error crítico en la transacción: ${errorMessage}. Los datos siguen...`);
```

#### Solución recomendada

Añadir claves en `es.json` / `en.json` y usar `t('recepcion.wizard.titulo')`, `t('recepcion.errors.sinProductos')`, etc.

#### Prioridad: Media
#### Riesgo de regresión: Bajo

---

### [REC-007] `ConfirmDialog` de recuperación de draft: `onClose` y `onConfirm` hacen lo mismo

#### Severidad: Media
#### Categoría: UX / Semántica de diálogos

#### Descripción

El diálogo de recuperación de borrador tiene `onClose={handleRecoverDraft}` y `onConfirm={handleRecoverDraft}`, lo que provoca que cerrar el diálogo con la X recupere el draft en lugar de descartarlo.

#### Evidencia

```tsx
// Recepcion.tsx — líneas 1563-1598
<ConfirmDialog
  isOpen={isRecoveryDialogOpen && !!pendingRecoveryDraft}
  onClose={handleRecoverDraft}     // ← X button → recupera draft (incorrecto)
  onConfirm={handleRecoverDraft}   // ← confirmar → recupera draft
  // ...
  onCancel={handleDiscardRecoveredDraft}  // ← cancelar → descarta
/>
```

La X del diálogo debería descartar el borrador (comportamiento esperado: cerrar sin acción), pero actualmente lo recupera.

#### Solución recomendada

```tsx
<ConfirmDialog
  onClose={handleDiscardRecoveredDraft}  // X → descartar
  onConfirm={handleRecoverDraft}          // Confirmar → recuperar
  onCancel={handleDiscardRecoveredDraft}  // Cancelar → descartar
/>
```

#### Prioridad: Media
#### Riesgo de regresión: Bajo

---

### [ALB-002] `uploadDocumentoAlbaran` tiene doble unwrapping de respuesta — workaround de contrato roto

#### Severidad: Media
#### Categoría: Integración API / Contrato backend

#### Descripción

La función de subida de documentos tiene que hacer `body.data.data` para obtener el albarán porque el backend devuelve una respuesta doblemente anidada.

#### Evidencia

```typescript
// albaran.service.ts — líneas 193-197
const body = (await response.json()) as ApiResponse<{
  message: string;
  data: Albaran;  // ← nivel extra de anidación
}>;
return body.data.data;  // ← doble desestructuración
```

El comentario en el código lo confirma: `// El backend devuelve { message, data: Albaran }, que el interceptor envuelve en { success, message, data: { message, data: Albaran } }`.

#### Impacto

Si el backend normaliza su respuesta en el futuro, este workaround producirá `undefined` silenciosamente.

#### Solución recomendada

Corregir el endpoint backend `/albaranes/upload-documento` para devolver `{ data: Albaran }` directamente, y simplificar el service a `return body.data`.

#### Prioridad: Media
#### Riesgo de regresión: Requiere cambio backend coordinado

---

### [ALB-003] `recepcionId` en UploadDocumentoModal es campo de texto libre — sin validación UUID

#### Severidad: Media
#### Categoría: UX / Validación de datos

#### Descripción

El campo `recepcionId` en el modal de subida de documentos es un input de texto plano donde el usuario debe escribir o pegar manualmente un UUID de recepción. No hay validación de formato, ni autocomplete, ni selector.

#### Evidencia

```tsx
// UploadDocumentoModal.tsx — líneas 248-258
<TextField
  label={t('albaran.upload.recepcionId')}
  value={recepcionId}
  onChange={(e) => setRecepcionId(e.target.value)}
  fullWidth
  size="small"
  placeholder={t('albaran.upload.recepcionIdPlaceholder')}
  helperText={t('albaran.upload.recepcionIdHelper')}
/>
```

No hay validación de UUID v4/v7 antes de enviar. Un UUID malformado causará un error 400/422 en el backend cuyo mensaje el usuario verá en el toast de error.

#### Solución recomendada

Añadir un `Autocomplete` que busque recepciones recientes por texto (últimas 10 recepciones + búsqueda por fecha), o al menos validar el formato UUID con regex antes de habilitar el submit.

#### Prioridad: Media
#### Riesgo de regresión: Bajo

---

### [INC-004] `estadoFinal` en `ResolveIncidenciaModal` solo ofrece `RESUELTA` — faltan `CANCELADA` e `INVALIDA`

#### Severidad: Media
#### Categoría: Funcionalidad incompleta / UX

#### Descripción

El selector de estado final en el modal de resolución de incidencias solo muestra la opción `RESUELTA`, aunque el sistema soporta `CANCELADA` e `INVALIDA` como estados terminales válidos.

#### Evidencia

```tsx
// ResolveIncidenciaModal.tsx — líneas 533-538
<Select value={estadoFinal} ...>
  <MenuItem value={EstadoIncidencia.RESUELTA}>
    {t('incidencias.estados.resuelta')}
  </MenuItem>
  {/* ← Faltan EstadoIncidencia.CANCELADA y EstadoIncidencia.INVALIDA */}
</Select>
```

El backend soporta estos estados vía `mapEstadoFinalToApi`:
```typescript
// incidencia.service.ts — líneas 225-238
function mapEstadoFinalToApi(estado?: EstadoIncidencia): 'resuelta' | 'cancelada' | 'invalida' | undefined {
  switch (estado) {
    case EstadoIncidencia.RESUELTA:  return 'resuelta';
    case EstadoIncidencia.CANCELADA: return 'cancelada';
    case EstadoIncidencia.INVALIDA:  return 'invalida';
  }
}
```

La lógica de mapeo existe; la UI simplemente no expone las opciones.

#### Solución recomendada

```tsx
<Select value={estadoFinal} ...>
  <MenuItem value={EstadoIncidencia.RESUELTA}>{t('incidencias.estados.resuelta')}</MenuItem>
  <MenuItem value={EstadoIncidencia.CANCELADA}>{t('incidencias.estados.cancelada')}</MenuItem>
  <MenuItem value={EstadoIncidencia.INVALIDA}>{t('incidencias.estados.invalida')}</MenuItem>
</Select>
```

#### Prioridad: Media
#### Riesgo de regresión: Bajo

---

### [REC-008] `openWeightScale` no proporciona feedback cuando la báscula no está conectada

#### Severidad: Media
#### Categoría: UX / Manejo de errores

#### Descripción

Cuando el usuario escanea un producto de tipo peso (kg, g) y la báscula no está conectada, `openWeightScale` retorna silenciosamente sin abrir el modal ni informar al usuario.

#### Evidencia

```typescript
// Recepcion.tsx — líneas 914-921
const openWeightScale = (pIdx: number | null, lIdx: number) => {
  if (!isScaleConnected) return;  // ← salida silenciosa sin feedback
  
  setWeightTarget({ pIdx, lIdx });
  setWeightModalOpen(true);
  void startWeighing();
};
```

El producto de tipo peso queda con `cantidadRecibida: 0` y el usuario no sabe por qué no ocurrió nada.

#### Solución recomendada

```typescript
const openWeightScale = (pIdx: number | null, lIdx: number) => {
  if (!isScaleConnected) {
    setError(t('recepcion.errors.basculaNoConectadaParaPeso'));
    return;
  }
  // ...
};
```

#### Prioridad: Media
#### Riesgo de regresión: Bajo

---

### [REC-009] `persistCurrentDraftSilently` muta directamente `draftRef.current` — bypassa hydration

#### Severidad: Media
#### Categoría: Consistencia de estado / Arquitectura

#### Descripción

La función de guardado silencioso al salir de la página actualiza la versión del servidor directamente en la referencia mutable, ignorando el proceso de hydración que normaliza los campos del draft.

#### Evidencia

```typescript
// useRecepcionDraft.ts — líneas 190-194
const persisted = await saveRecepcionDraft(draftRef.current);
// Sincronizamos la versión para que el siguiente auto-save no de conflicto 409
draftRef.current.serverVersion = persisted.version;      // ← mutación directa
draftRef.current.serverUpdatedAt = persisted.updatedAt;  // ← mutación directa
```

Esto omite `hydrateRecepcionDraft`, que valida y normaliza todos los campos. Si el backend devuelve una versión con campos adicionales, serán ignorados.

#### Solución recomendada

Almacenar `serverVersion` y `serverUpdatedAt` en refs separadas que se usen en el siguiente save, sin mutar el draft principal.

#### Prioridad: Media
#### Riesgo de regresión: Bajo

---

### [REC-010] `PasoResultado` — errores de descarga de PDF silenciados con `console.error`

#### Severidad: Media
#### Categoría: Manejo de errores / UX

#### Descripción

La descarga del PDF de comprobante atrapa el error pero solo lo imprime en consola, sin notificar al usuario.

#### Evidencia

```typescript
// PasoResultado.tsx — líneas 159-173
const handleDownloadPdf = async () => {
  if (!resultado?.id) return;
  setDownloading(true);
  try {
    await downloadFile(
      `/recepciones/reporte-pdf?tipo=recepcion&recepcionId=${resultado.id}`,
      `recepcion_${new Date().toISOString().split('T')[0]}.pdf`
    );
  } catch (err) {
    console.error('Error al descargar PDF:', err);  // ← usuario no se entera
  } finally {
    setDownloading(false);
  }
};
```

#### Solución recomendada

Añadir estado de error local y mostrarlo con `Alert` o llamar a `toast.error(...)`.

#### Prioridad: Media
#### Riesgo de regresión: Bajo

---

### [REC-011] `onKeyPress` está deprecado en React 17+ — usar `onKeyDown`

#### Severidad: Media
#### Categoría: Compatibilidad / React 19

#### Descripción

`onKeyPress` está marcado como deprecated desde React 17 y está eliminado del estándar DOM. En React 19 puede generar warnings o comportamiento inconsistente.

#### Evidencia

```tsx
// PasoEscaneo.tsx — línea 214
onKeyPress={(e) => e.key === 'Enter' && onSearch()}
```

#### Solución recomendada

```tsx
onKeyDown={(e) => e.key === 'Enter' && onSearch()}
```

#### Prioridad: Media
#### Riesgo de regresión: Bajo

---

### [REC-012] `RecepcionDraftConflictDialog` sin estado de carga en `keepLocalDraft`

#### Severidad: Media
#### Categoría: UX / Race conditions

#### Descripción

El botón "Sobrescribir" en el diálogo de conflicto llama a `keepLocalDraft()` (operación async que hace una llamada al backend), pero el diálogo no muestra estado de carga ni deshabilita los botones durante la operación.

#### Evidencia

```tsx
// RecepcionDraftConflictDialog.tsx — líneas 43-54
<Button
  variant="contained"
  color="warning"
  onClick={() => void onKeepLocal()}  // ← async sin feedback
>
  {t('recepcion.conflicto.sobrescribir')}
</Button>
```

El usuario puede hacer doble clic enviando dos requests de escritura simultáneos al mismo endpoint de draft, potencialmente causando un nuevo conflicto 409.

#### Solución recomendada

Añadir `isLoading` prop al dialog y deshabilitar botones durante la operación:

```tsx
interface RecepcionDraftConflictDialogProps {
  // ...
  isLoading?: boolean;
}
// En los botones: disabled={isLoading}
```

#### Prioridad: Media
#### Riesgo de regresión: Bajo

---

### [REC-013] `mapPedidoToDraftLines` en `recepcionMapping.utils.ts` añade campos fuera de la interfaz

#### Severidad: Media
#### Categoría: Tipado / Consistencia de interfaces

#### Descripción

`mapPedidoToDraftLines` genera objetos con campos que no existen en la interfaz `LineaDraft`, usando `as unknown as` para acceder a propiedades no tipadas.

#### Evidencia

```typescript
// recepcionMapping.utils.ts — líneas 41-44
cantidadYaRecibida: Number(
  (pp as unknown as { cantidadRecibida?: number }).cantidadRecibida || 0
),
// ↑ 'cantidadYaRecibida' no existe en LineaDraft
```

También en `mapPurchaseBatchToRecepcionDraft`:
```typescript
// recepcionMapping.utils.ts — línea 86
estadoPedido: pedido.estado,  // ← no está en PedidoDraft
```

#### Impacto

TypeScript no avisará de usos incorrectos de estos campos. Si se serializa el draft con estos campos extras, el backend podría rechazarlo o ignorarlos.

#### Solución recomendada

Añadir `cantidadYaRecibida?: number` a `LineaDraft` si el campo tiene utilidad real, o eliminarlo. Idem para `estadoPedido` en `PedidoDraft`.

#### Prioridad: Media
#### Riesgo de regresión: Bajo

---

### [REC-014] `LineaDraft.estado` tiene valores duplicados con distinto casing y 5 valores nunca usados

#### Severidad: Baja
#### Categoría: Tipado / Deuda técnica

#### Descripción

El tipo union de `estado` en `LineaDraft` tiene 12 valores posibles, de los cuales solo 5 se usan activamente y hay duplicados con casing diferente.

#### Evidencia

```typescript
// recepcion.types.ts — líneas 98-110
estado:
  | 'escaneado'       // ← NUNCA se asigna
  | 'sin_rellenar'    // ← NUNCA se asigna
  | 'valida'          // ← NUNCA se asigna
  | 'error'           // ← NUNCA se asigna
  | 'parcial'         // ← NUNCA se asigna (duplica 'Parcial')
  | 'rechazada'       // ← NUNCA se asigna
  | 'exceso'          // ← NUNCA se asigna (duplica 'Exceso')
  | 'OK'              // ← usado en calculateEstado
  | 'Parcial'         // ← usado en calculateEstado
  | 'Exceso'          // ← usado en calculateEstado
  | 'No entregado'    // ← usado en calculateEstado
  | 'Nuevo';          // ← usado para espontáneos
```

#### Solución recomendada

Limpiar el tipo a solo los valores activos y crear un enum `EstadoLineaDraft`:
```typescript
export type EstadoLineaDraft = 'OK' | 'Parcial' | 'Exceso' | 'No entregado' | 'Nuevo';
```

#### Prioridad: Baja
#### Riesgo de regresión: Bajo

---

### [REC-015] `handleUpdateLinea` — parámetro `field` sin tipado estricto

#### Severidad: Baja
#### Categoría: Tipado TypeScript

#### Descripción

El campo `field` en `handleUpdateLinea` es `string` en lugar de `keyof LineaDraft`, lo que permite pasar cualquier nombre de campo sin validación en compilación.

#### Evidencia

```typescript
// Recepcion.tsx — líneas 820-825
const handleUpdateLinea = (
  pIdx: number | null,
  lIdx: number,
  field: string,  // ← debería ser keyof LineaDraft
  value: unknown
) => {
```

#### Solución recomendada

```typescript
const handleUpdateLinea = <K extends keyof LineaDraft>(
  pIdx: number | null,
  lIdx: number,
  field: K,
  value: LineaDraft[K]
) => {
```

#### Prioridad: Baja
#### Riesgo de regresión: Bajo

---

### [REC-016] `setTimeout` en `processProductFound` y `handleConfirmNewProduct` sin cleanup

#### Severidad: Baja
#### Categoría: Memory leaks / Comportamiento en desmontaje

#### Descripción

Varios `setTimeout` que abren el modal de báscula no limpian sus timers si el componente se desmonta antes de que disparen.

#### Evidencia

```typescript
// Recepcion.tsx — línea 782
setTimeout(() => openWeightScale(null, indexEsp), 0);

// Recepcion.tsx — líneas 804-808
setTimeout(
  () => openWeightScale(null, prevDraft.productosEspontaneos.length),
  200
);

// Recepcion.tsx — líneas 1353-1357
setTimeout(
  () => openWeightScale(null, draft.productosEspontaneos.length),
  50
);
```

Si el componente se desmonta durante estos 50-200ms, se llama a `setWeightModalOpen(true)` sobre un componente desmontado (React 18+ suprime el warning, pero es un leak de referencia).

#### Solución recomendada

Usar `useRef` para almacenar los IDs de timeout y limpiarlos en el cleanup del efecto o usar `useCallback` con cleanup.

#### Prioridad: Baja
#### Riesgo de regresión: Muy bajo

---

### [REC-017] `PasoRevision` — color `'orange'` hardcodeado en lugar de token de tema MUI

#### Severidad: Baja
#### Categoría: Estilo / Coherencia con design system

#### Descripción

```tsx
// PasoRevision.tsx — líneas 254-259
<TableCell
  align="right"
  sx={{
    color:
      Number(l.cantidadRecibida) !== l.cantidadPedida
        ? 'orange'        // ← hardcoded, no respeta tema MUI
        : 'inherit',
```

También en la fila de espontáneos (línea 424): `sx={{ color: 'orange', fontWeight: 'bold' }}`.

#### Solución recomendada

Usar `theme.palette.warning.main` o el token MUI `'warning.main'`:
```tsx
color: Number(l.cantidadRecibida) !== l.cantidadPedida ? 'warning.main' : 'inherit'
```

#### Prioridad: Baja
#### Riesgo de regresión: Muy bajo

---

### [REC-018] `PasoRevision` — click en AccordionSummary no colapsa acordeón (stopPropagation en toda la caja)

#### Severidad: Baja
#### Categoría: UX

#### Descripción

El `Box` wrapper del `AccordionSummary` en `PasoRevision` llama a `e.stopPropagation()` para evitar que el input de número de albarán colapse el acordeón al escribir. Sin embargo, esto también bloquea el clic en el título del proveedor.

#### Evidencia

```tsx
// PasoRevision.tsx — líneas 138-144
<Box
  display="flex"
  justifyContent="space-between"
  alignItems="center"
  width="100%"
  onClick={(e) => e.stopPropagation()}  // ← bloquea todo el summary
>
```

#### Solución recomendada

Mover el `stopPropagation` al `TextField` en lugar del contenedor:
```tsx
<TextField
  onClick={(e) => e.stopPropagation()}
  onFocus={(e) => e.stopPropagation()}
  // ...
/>
```

#### Prioridad: Baja
#### Riesgo de regresión: Muy bajo

---

### [REC-019] `fetchRecepciones` retorna `unknown[]` — sin tipado

#### Severidad: Baja
#### Categoría: Tipado TypeScript

#### Descripción

```typescript
// recepcion.service.ts — línea 132
export async function fetchRecepciones(): Promise<unknown[]> {
```

Esta función no tiene type safety y no se usa en el código auditado. Si se usa en algún componente no revisado, todos sus accesos son inseguros.

#### Solución recomendada

Definir un tipo `RecepcionResumen` o reutilizar `RecepcionResultado` con los campos del listado, y tipar correctamente el retorno.

#### Prioridad: Baja
#### Riesgo de regresión: Bajo

---

### [INC-005] `ResolveIncidenciaModal` — `esEditable = true` hardcodeado con variable muerta

#### Severidad: Baja
#### Categoría: Código muerto / Deuda técnica

#### Descripción

```typescript
// ResolveIncidenciaModal.tsx — línea 610
const esEditable = true; // Siempre editable ahora para permitir ajustes libres si se desea
```

La variable `esEditable` siempre es `true`, el chip `chipSinAjuste` nunca se muestra, y el comentario indica que fue un cambio deliberado pero dejó código muerto.

#### Solución recomendada

Si todas las líneas son siempre editables, eliminar la variable `esEditable` y simplificar las expresiones que la usan.

#### Prioridad: Baja
#### Riesgo de regresión: Muy bajo

---

## Inconsistencias Frontend/Backend

| # | Frontend | Backend (esperado) | Impacto |
|---|----------|-------------------|---------|
| 1 | `normalizeEstadoIncidencia` mapea uppercase a lowercase (bug) | Estados enviados en UPPERCASE | Todos los estados del backend son ignorados; se usa fallback heurístico |
| 2 | `EstadoRecepcion` tiene solo `COMPLETADA` y `CON_INCIDENCIAS` | Backend puede tener más estados | Enum incompleto; estados desconocidos no renderizados |
| 3 | `uploadDocumentoAlbaran` necesita `body.data.data` | Backend devuelve `{ data: { message, data: Albaran } }` | Doble anidación no documentada como contrato estable |
| 4 | `fetchRecepciones` usa `/recepciones?limit=50` sin paginación propia | Backend paginado | Potencialmente trunca datos si hay más de 50 recepciones |
| 5 | `CreateRecepcionDto` incluye `pedidos` y `pedidoIds` | Backend solo acepta uno de los dos | Campo redundante; puede causar validación errónea |
| 6 | `LineaDraft.isAlbaranDirty` | No existe en backend | Campo UI-only no documentado como tal |
| 7 | `loadPedidos` solo carga estado `POR_RECEPCIONAR` | Backend podría tener `PARCIALMENTE_RECEPCIONADO` | Pedidos parciales podrían no aparecer en el wizard |
| 8 | `incidencia.service.ts` — `proveedorId` = nombre del proveedor | Backend: `proveedorId` = UUID | Campo semánticamente incorrecto |
| 9 | `mapPurchaseBatchToRecepcionDraft` incluye `estadoPedido` | No en `PedidoDraft` interface | Campo extra sin contrato |
| 10 | `ResolveIncidenciaPayload.estadoFinal` acepta `EstadoIncidencia` | Backend acepta `'resuelta' | 'cancelada' | 'invalida'` | Conversión necesaria vía `mapEstadoFinalToApi` (ok, pero acoplamiento) |

---

## Riesgos Potenciales Futuros

1. **Escalabilidad del wizard en dispositivos móviles:** El `PasoEscaneo` renderiza tablas con `minWidth: 800-900px` con scroll horizontal. En tablets pequeñas (<768px) la UX se degrada significativamente. No hay modo compacto adaptativo.

2. **Conflictos de concurrencia multi-usuario:** El sistema de draft es por usuario (implícito en el hook), pero si el mismo usuario abre el wizard en dos pestañas, ambas competirán por el mismo draft remoto y generarán 409 en cada guardado. No hay mecanismo de "tab leader" (como `BroadcastChannel`).

3. **Web Serial API en contextos no-HTTPS:** `serialService.isSupported()` puede retornar `false` en entornos staging sin certificado, silenciando la báscula sin warning claro al usuario.

4. **`normalizeEstadoIncidencia` y futuros estados backend:** Si el backend añade nuevos estados de incidencia, el frontend los mapea a `null` y usa el fallback heurístico. La arquitectura actual no falla de forma visible, lo que dificulta detectar el problema.

5. **Crecimiento de `productosEspontaneos`:** No hay límite máximo de productos espontáneos en el wizard. En una recepción con muchos productos no catalogados, el draft puede volverse muy grande y superar límites de payload del backend.

6. **Race condition en `handleSubmit`:** Si el usuario hace doble clic en "Finalizar Recepción", se envían dos POST simultáneos a `/recepciones`. Aunque `isSubmitting` deshabilita el botón, si el primer request tarda y el estado no se actualiza a tiempo en renders rápidos, podría enviarse duplicado. El Backdrop mitiga esto pero no es a prueba de balas.

---

## Deuda Técnica

| Prioridad | Ítem | Esfuerzo estimado |
|-----------|------|-------------------|
| Alta | Corregir `normalizeEstadoIncidencia` (casing bug) | 30 min |
| Alta | Implementar debounce correcto en `useRecepcionDraft` | 1h |
| Alta | Mover filtros de albaranes al backend | 4h (FE + BE) |
| Alta | Unificar `mapPedidoToDraft` / `mapPedidoToDraftLines` | 2h |
| Media | Reemplazar `loadPedidos` loop secuencial | 3h (requiere BE) |
| Media | Tipado estricto `handleUpdateLinea` (`keyof LineaDraft`) | 1h |
| Media | Corregir semántica `ConfirmDialog` de recovery | 30 min |
| Media | Añadir estados `CANCELADA`/`INVALIDA` al `estadoFinal` Select | 1h |
| Media | Corregir `proveedorId` en `mapIncidencia` | 30 min |
| Media | Eliminar regex en `resolveEstadoIncidenciaFallback` | 30 min (resuelto por INC-001) |
| Baja | Hardcoded strings en español → i18n | 2h |
| Baja | Colores hardcoded → tokens MUI | 1h |
| Baja | Limpiar `LineaDraft.estado` union type | 1h |
| Baja | `onKeyPress` → `onKeyDown` | 15 min |
| Baja | Tipar `fetchRecepciones` | 30 min |

**Deuda técnica total estimada:** ~18 horas de trabajo focalizado

---

## Conclusión

El módulo de recepción es el más maduro y mejor estructurado de los tres: el sistema de draft con sincronización optimista, resolución de conflictos 409, recovery automático y integración con hardware serial es una implementación sólida. Sin embargo, acumula deuda técnica relevante en el debounce del auto-guardado y en la semántica de algunos diálogos.

El módulo de albaranes es funcional pero sufre de una limitación arquitectónica significativa: los filtros de concordancia y fechas operan solo sobre la página actual, haciendo que sean prácticamente inútiles en producción. Esta debe ser la primera corrección post-auditoría.

El módulo de incidencias tiene el hallazgo más crítico de toda la auditoría: **el bug de casing en `normalizeEstadoIncidencia` hace que todos los estados del backend sean ignorados**, derivando el estado a una lógica heurística frágil basada en texto libre. Este bug es silencioso (no produce error visible) pero afecta la correcta visualización y operativa de todas las incidencias del sistema. Debe corregirse con prioridad inmediata.

**Orden de prioridad de corrección recomendado:**
1. `[INC-001]` Bug casing en normalizeEstadoIncidencia
2. `[REC-001]` Debounce auto-save no restablece timer  
3. `[ALB-001]` Filtros de albaranes deben ir al backend
4. `[REC-002]` N+1 en carga de pedidos
5. `[REC-003]` validarDraft lógica incorrecta de isValid
