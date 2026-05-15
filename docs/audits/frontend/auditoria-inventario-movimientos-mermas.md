# Auditoría Técnica: Inventario, Movimientos y Mermas

**Fecha:** 2026-05-14  
**Auditor:** Staff Engineer (análisis estático exhaustivo)  
**Alcance:** Frontend — módulos Inventario, Movimientos y Mermas  
**Stack:** React 19 · TypeScript · MUI 7 · React Router 7 · Vite 6

---

## Resumen Ejecutivo

Los tres módulos presentan un **nivel de madurez heterogéneo**. El módulo de **Inventario** es el más complejo y el que concentra los riesgos más críticos: la arquitectura de carga de datos descarga todo el stock del servidor en el cliente (hasta 20.000 registros), la lógica de `bajoStock` es semánticamente incorrecta en escenarios multi-ubicación, y el sistema de filtros almacena nombres en lugar de IDs, rompiendo la unicidad referencial.

Los módulos de **Movimientos** y **Mermas** son más sencillos pero contienen inconsistencias importantes: la columna de cantidad en movimientos no diferencia ajustes positivos/negativos, las estadísticas de merma suman unidades heterogéneas sin contexto suficiente, y la distinción entre mermas manuales y de producción es invisible en la UI.

El API service tiene una inconsistencia de serialización de arrays que puede producir comportamientos silenciosamente incorrectos según el módulo.

No se detectaron vulnerabilidades de seguridad críticas (XSS, CSRF, exposición de tokens). El hardening con httpOnly cookies y validación de IDs antes de enviar peticiones está bien implementado.

---

## Métricas

| Dimensión | Calificación |
|-----------|-------------|
| Gestión de stock (lógica de negocio) | ⚠️ 5/10 — bajoStock incorrecto, carga total en cliente |
| Validaciones numéricas | ✅ 7/10 — `normalizeNumericInput`, parseo localizado |
| Manejo de errores | ✅ 7/10 — toast + ApiError consistentes |
| Performance / Escalabilidad | ❌ 3/10 — hasta 20k registros en memoria del cliente |
| Tipado TypeScript | ⚠️ 6/10 — enums paralelos, casts `as` inseguros |
| UX y accesibilidad | ⚠️ 6/10 — aria-labels presentes, falta confirmación en borrado |
| i18n | ⚠️ 5/10 — labels de categorías hardcodeados en español |
| Estado en URL | ❌ 3/10 — filtros no persisten en URL |

---

## Hallazgos

---

### [INV-001] Carga cliente-side de todo el inventario — hasta 20.000 registros en memoria

#### Severidad: Crítica
#### Categoría: Performance / Escalabilidad / Arquitectura

#### Descripción
`fetchInventario` itera **todas las páginas del backend** en un bucle `while`, acumula los resultados en un array `merged` y los guarda en un módulo-level cache. La paginación real ocurre después, en el cliente, dentro de `agregarInventarioPorProducto` (que devuelve arrays sin paginar al componente `DataTable`).

#### Evidencia

```typescript
// inventario.service.ts — líneas 114–169
const run = (async (): Promise<InventarioItem[]> => {
  const merged: InventarioItem[] = [];
  let page = 1;
  let totalPages = 1;
  const limit = 50;
  const MAX_PAGES = 400;           // ← 400 × 50 = 20.000 registros máximos

  while (page <= totalPages && page <= MAX_PAGES) {
    // ... baseFetch('/inventario?...')
    merged.push(...chunk);
    page += 1;
  }
  // ...
  return merged;
})();
```

```typescript
// Inventario.tsx — línea 527–530
const agregado = agregarInventarioPorProducto(itemsToGroup);
setData(agregado);
onTotalItemsChange(agregado.length);  // ← paginación local
```

#### Riesgo real
- Con 500+ SKUs (escenario habitual en un economato escolar real), la primera carga puede superar los 2 MB de JSON y bloquear el hilo principal durante el procesamiento.
- El DataTable recibe el **array completo** y renderiza solo la página visible, pero el array completo está en memoria.
- El cache de módulo (variable global `inventarioCache`) no se invalida entre sesiones de diferentes usuarios que compartan pestaña, aunque esto es menos probable con httpOnly cookies.
- `MAX_PAGES = 400` es un techo arbitrario que no protege contra crecimiento real del dato.

#### Solución recomendada
Rediseñar `fetchInventario` para delegar la paginación, búsqueda y agrupación **al backend**:

```typescript
// Nuevo endpoint sugerido: GET /inventario/agrupado-por-producto?page=1&limit=20&search=...
// El backend devuelve directamente InventarioPorProducto[] paginado
export async function fetchInventarioAgrupado(
  params: FetchInventarioFilters & { page: number; limit: number }
): Promise<PaginatedData<InventarioPorProducto>> {
  const qs = buildQueryParams(params);
  const response = await baseFetch(`/inventario/resumen?${qs}`);
  // ...
}
```

Mientras no se implementa el endpoint, añadir un límite práctico y advertencia en consola:

```typescript
const MAX_PAGES = 20; // máximo 1000 items en cache local; warn si se supera
if (page > MAX_PAGES) {
  console.warn('[Inventario] Se ha alcanzado el límite de carga local. Considera implementar paginación server-side.');
  break;
}
```

#### Prioridad: Inmediata
#### Riesgo de regresión: Alto — requiere cambio de arquitectura

---

### [INV-002] `bajoStock` calculado por lote individual, no por total del producto

#### Severidad: Alta
#### Categoría: Lógica de negocio / Correctitud

#### Descripción
En `agregarInventarioPorProducto`, cuando se acumula un producto que ya existe en el `Map`, `cantidadMinima` se **suma** lote a lote, pero `bajoStock` se evalúa comparando `cantidadActual` del **lote individual** con `cantidadMinima` del **lote individual**. El resultado final de `bajoStock` puede ser semánticamente incorrecto.

#### Evidencia

```typescript
// inventario.service.ts — líneas 239–244
existing.cantidadTotal += cantidadActual;
existing.cantidadMinima += cantidadMinima;         // suma acumulada de mínimos
existing.bajoStock =
  existing.bajoStock || cantidadActual < cantidadMinima;  // compara el lote actual
```

**Escenario problemático:**
- Producto P en ubicación A: stock=15, mínimo=5 → `bajoStock=false`
- Producto P en ubicación B: stock=2, mínimo=10 → `bajoStock=true` (2 < 10)
- Resultado: `cantidadTotal=17`, `cantidadMinima=15`, `bajoStock=true`
- Pero `cantidadTotal (17) > cantidadMinima (15)` → el total no está bajo el umbral global

#### Riesgo real
Falsos positivos en alertas de stock bajo, generando pedidos innecesarios. Los usuarios pierden confianza en las alertas del sistema.

#### Solución recomendada

```typescript
// Después de construir todo el Map, recalcular bajoStock como comparación de totales
for (const row of map.values()) {
  row.bajoStock = row.cantidadTotal < row.cantidadMinima;
}
```

O, si se quiere preservar la semántica "bajo stock en ALGUNA ubicación":

```typescript
// Documentar explícitamente que bajoStock significa "algún lote por debajo de su mínimo"
// y mostrar en el tooltip: "Stock bajo en al menos una ubicación"
```

#### Prioridad: Alta
#### Riesgo de regresión: Bajo — cambio localizado en `agregarInventarioPorProducto`

---

### [INV-003] Filtro de ubicaciones basado en nombre, no en ID

#### Severidad: Alta
#### Categoría: Correctitud / Integridad de datos

#### Descripción
El estado de filtros de inventario almacena **nombres** de ubicaciones en lugar de IDs. La resolución de IDs se hace en runtime comparando nombres contra el catálogo disponible.

#### Evidencia

```typescript
// InventarioFilters.tsx — línea 179–182
onChange={(_, newValue) => {
  onChange({
    ...filters,
    ubicaciones: newValue.map((v) => v.nombre),  // ← nombre, no ID
  });
}}
```

```typescript
// Inventario.tsx — líneas 463–471
const porNombre = ubicacionesParaFiltro
  .filter((u) => ubicacionNombresSeleccionados.has(u.nombre))
  .map((u) => u.id);
```

#### Riesgo real
- Dos ubicaciones con el mismo nombre producen un filtro que devuelve resultados de ambas (comportamiento inesperado).
- Si el nombre de una ubicación cambia en el backend, el filtro queda silenciosamente roto (no filtra nada).
- La URL podría incluir nombres con caracteres especiales que requieren encoding correcto.

#### Solución recomendada

```typescript
// InventarioFilters.tsx — cambiar a IDs
ubicaciones: newValue.map((v) => v.id),  // ← ID estable

// InventarioFilters.tsx — estado
export interface InventarioFiltersState {
  categorias: CategoriaProducto[];
  ubicacionIds: string[];   // ← renombrar para claridad
}
```

```typescript
// Inventario.tsx — usar IDs directamente
const ubicacionIds = filters.ubicacionIds?.length ? filters.ubicacionIds : undefined;
```

#### Prioridad: Alta
#### Riesgo de regresión: Medio — afecta estado de URL y serialización de filtros

---

### [INV-004] Eliminación de ubicaciones sin confirmación

#### Severidad: Alta
#### Categoría: UX / Integridad de datos

#### Descripción
`UbicacionesModal` elimina una ubicación inmediatamente al pulsar el icono de papelera, sin ningún diálogo de confirmación. Si hay inventario asignado a esa ubicación, la operación puede generar inconsistencias o ser rechazada silenciosamente por el backend.

#### Evidencia

```typescript
// UbicacionesModal.tsx — líneas 91–101
const handleDelete = async (id: string) => {
  try {
    await UbicacionService.remove(id);           // ← sin confirmación previa
    toast.success(t('inventario.ubicaciones.toast.eliminada'));
    onChanged();
    loadUbicaciones();                           // ← no awaited
  } catch (err) {
    const error = err as Error;
    toast.error(error.message || t('inventario.ubicaciones.errors.eliminar'));
  }
};
```

Además, `loadUbicaciones()` se llama sin `await`, lo que puede producir una lista desactualizada si la respuesta llega fuera de orden.

#### Riesgo real
Pérdida accidental de configuración de ubicaciones. Si el backend implementa soft-delete y el inventario tiene FK a la ubicación, los registros huérfanos pueden romper cálculos de stock.

#### Solución recomendada

```typescript
const handleDelete = async (id: string) => {
  const confirmed = await showConfirmDialog({
    title: t('inventario.ubicaciones.confirm.titulo'),
    message: t('inventario.ubicaciones.confirm.mensaje'),
  });
  if (!confirmed) return;
  try {
    await UbicacionService.remove(id);
    toast.success(...);
    onChanged();
    await loadUbicaciones();  // ← await
  } catch ...
};
```

#### Prioridad: Alta
#### Riesgo de regresión: Bajo

---

### [INV-005] Tipo de ajuste manual siempre `'entrada'` para positivos

#### Severidad: Alta  
#### Categoría: Lógica de negocio / Trazabilidad

#### Descripción
En `InventoryDetailModal`, los ajustes manuales positivos se registran con `tipo: 'entrada'`. Esto mezcla la semántica de "entrada por compra/recepción" con "ajuste de inventario positivo" en el historial de movimientos.

#### Evidencia

```typescript
// InventoryDetailModal.tsx — líneas 314–319
const payload: CreateAjusteManualInventarioPayload = {
  inventarioId: item.id,
  tipo: adjustment > 0 ? 'entrada' : 'salida_ajuste',   // ← 'entrada' para ajuste positivo
  ajuste: adjustment,
  motivo: t(AUDIT_MANUAL_REASON_KEY),
};
```

```typescript
// inventario.types.ts — línea 87
export type TipoMovimientoManualAjuste = 'entrada' | 'salida_ajuste';
```

#### Riesgo real
Un ajuste manual positivo (+5 unidades corregidas) aparece en el historial como `tipo: ENTRADA`, indistinguible de una entrada por recepción de pedido. La trazabilidad de movimientos queda contaminada.

#### Solución recomendada
El backend debería ofrecer un tipo explícito `'ajuste_entrada'`. Si ya existe en el enum del backend, actualizar el tipo frontend:

```typescript
export type TipoMovimientoManualAjuste = 'ajuste_entrada' | 'ajuste_salida';
```

Y verificar que el endpoint `/inventario/ajustes-manuales` soporte estos valores.

#### Prioridad: Alta
#### Riesgo de regresión: Medio — requiere coordinación con backend

---

### [INV-006] Lógica de formateo de unidades duplicada entre componentes

#### Severidad: Media
#### Categoría: Mantenibilidad / DRY

#### Descripción
La lógica `formatEquivalentAmount` (conversión ML→L, G→KG) y la constante `MEASURABLE_STOCK_UNITS` están duplicadas en `Inventario.tsx` (líneas 104-116) y `InventoryDetailModal.tsx` (líneas 104-114). Cualquier cambio de unidades requiere actualizar ambos ficheros.

#### Evidencia

```typescript
// Inventario.tsx — líneas 104–116
const formatEquivalentAmount = (value: number, unit: UnidadMedida): string => {
  if (unit === UnidadMedida.ML && Math.abs(value) >= 1000) {
    return `${(value / 1000).toFixed(2)} ${UnidadMedida.L}`;
  }
  if (unit === UnidadMedida.G && Math.abs(value) >= 1000) {
    return `${(value / 1000).toFixed(2)} ${UnidadMedida.KG}`;
  }
  return `${value.toFixed(2)} ${unit}`;
};

// InventoryDetailModal.tsx — líneas 104–114 (idéntica)
const formatEquivalentAmount = (value: number, unit: string): string => {
  if (unit === 'ML' && Math.abs(value) >= 1000) {
    return `${(value / 1000).toFixed(2)} L`;
  }
  // ...
};
```

Nótese también que una versión usa `UnidadMedida` (enum tipado) y la otra usa `string` literal — inconsistencia de tipado adicional.

#### Solución recomendada
Extraer a `src/utils/stockUnits.ts`:

```typescript
export function formatEquivalentAmount(value: number, unit: string): string { ... }
export function formatEquivalentByConstruction(...): string | null { ... }
export const MEASURABLE_STOCK_UNITS = new Set(['KG', 'G', 'L', 'ML']);
```

#### Prioridad: Media
#### Riesgo de regresión: Bajo

---

### [INV-007] `InventarioFilters` — etiquetas de categoría hardcodeadas en español

#### Severidad: Media
#### Categoría: i18n / Internacionalización

#### Descripción
Las opciones del filtro de categorías en `InventarioFilters.tsx` tienen las etiquetas hardcodeadas en español, sin usar el sistema de traducción. El formulario de creación de producto ya usa correctamente `getEnumLabel(t, 'productoCategoria', value)`.

#### Evidencia

```typescript
// InventarioFilters.tsx — líneas 29–45
const CATEGORIA_OPTIONS: { value: CategoriaProducto; label: string }[] = [
  { value: CategoriaProducto.VERDURA, label: 'Verdura' },   // ← hardcoded
  { value: CategoriaProducto.FRUTA, label: 'Fruta' },
  { value: CategoriaProducto.CARNE, label: 'Carne' },
  // ...
];
```

```typescript
// Inventario.tsx — línea 584–587 (correcto)
const categoriaOptions = Object.values(CategoriaProducto).map((value) => ({
  value,
  label: getEnumLabel(t, 'productoCategoria', value),  // ← i18n
}));
```

También el placeholder del filtro de categorías está hardcodeado:
```typescript
// InventarioFilters.tsx — línea 126
placeholder={selectedCategorias.length === 0 ? 'Filtrar categoría...' : ''}
```

#### Solución recomendada

```typescript
// InventarioFilters.tsx
const InventarioFilters: React.FC<InventarioFiltersProps> = ({ ... }) => {
  const { t } = useTranslation();
  const categoriaOptions = useMemo(
    () => Object.values(CategoriaProducto).map((v) => ({
      value: v,
      label: getEnumLabel(t, 'productoCategoria', v),
    })),
    [t]
  );
  // ...
  placeholder={selectedCategorias.length === 0 ? t('inventario.filtros.placeholderCategoria') : ''}
```

#### Prioridad: Media
#### Riesgo de regresión: Bajo

---

### [INV-008] `UbicacionesModal.loadUbicaciones` no awaited en `handleAdd`

#### Severidad: Media
#### Categoría: Concurrencia / Correctitud asíncrona

#### Descripción
En `UbicacionesModal`, tras crear una ubicación, se llama `loadUbicaciones()` sin `await`. Si la UI re-renderiza antes de que termine la carga, el estado puede quedar desincronizado. El mismo problema ocurre en `handleDelete`.

#### Evidencia

```typescript
// UbicacionesModal.tsx — líneas 72–84
const handleAdd = async () => {
  if (!newNombre.trim()) return;
  try {
    await UbicacionService.create({ nombre: newNombre.trim() });
    setNewNombre('');
    toast.success(t('inventario.ubicaciones.toast.creada'));
    onChanged();
    loadUbicaciones();   // ← fire-and-forget sin await
  } catch ...
};
```

Además, hay un `eslint-disable-next-line react-hooks/exhaustive-deps` en el `useEffect` para evitar incluir `loadUbicaciones` en dependencias, lo que indica una deuda técnica de organización de la función.

#### Solución recomendada

```typescript
const handleAdd = async () => {
  if (!newNombre.trim()) return;
  try {
    await UbicacionService.create({ nombre: newNombre.trim() });
    setNewNombre('');
    toast.success(...);
    onChanged();
    await loadUbicaciones();  // ← await
  } catch ...
};
```

#### Prioridad: Media
#### Riesgo de regresión: Bajo

---

### [INV-009] Filtros de inventario no persisten en URL

#### Severidad: Media
#### Categoría: UX / Navegación

#### Descripción
Los filtros de categorías y ubicaciones del inventario se almacenan solo en estado React local (`useState`). Al navegar fuera y volver, los filtros se pierden. El único filtro que usa `searchParams` es el de `filter=stockBajo` proveniente del dashboard.

#### Evidencia

```typescript
// Inventario.tsx — líneas 162–163
const [filters, setFilters] = useState<InventarioFiltersState>(initialFilters);
// No hay inicialización desde searchParams para categorías/ubicaciones
```

#### Riesgo real
Un administrador que estaba filtrando por "Bodega Refrigerada" pierde el contexto al navegar a otro módulo y volver.

#### Solución recomendada
Inicializar los filtros desde `searchParams` y sincronizarlos al cambiar:

```typescript
const [searchParams, setSearchParams] = useSearchParams();
const [filters, setFilters] = useState<InventarioFiltersState>(() => ({
  categorias: searchParams.getAll('categoria') as CategoriaProducto[],
  ubicacionIds: searchParams.getAll('ubicacion'),
}));
```

#### Prioridad: Media
#### Riesgo de regresión: Bajo

---

### [INV-010] `QuickLocationDialog` — detección de errores por inclusión de string

#### Severidad: Baja
#### Categoría: Robustez / Manejo de errores

#### Descripción
La detección de ubicación duplicada se hace comparando el mensaje de error del servidor con strings hardcodeados. Un cambio en el mensaje del backend o un error 400 por otra causa mostraría el mensaje incorrecto.

#### Evidencia

```typescript
// QuickLocationDialog.tsx — líneas 63–73
if (
  msg.includes('ya existe') ||
  msg.includes('already exists') ||
  msg.includes('400')          // ← cualquier 400 se trata como "ya existe"
) {
  toast.error(t('inventario.nuevaUbicacion.yaExiste'));
} else {
  toast.error(t('inventario.nuevaUbicacion.error'));
}
```

#### Solución recomendada
Usar `ApiError.status === 409` (Conflict) para detectar duplicados:

```typescript
import { ApiError } from '../../services/api.service';
// ...
} catch (error: unknown) {
  if (error instanceof ApiError && error.status === 409) {
    toast.error(t('inventario.nuevaUbicacion.yaExiste'));
  } else {
    toast.error(t('inventario.nuevaUbicacion.error'));
  }
}
```

#### Prioridad: Baja
#### Riesgo de regresión: Bajo

---

### [INV-011] Items con `cantidadActual === 0` filtrados, invisibles en modo auditoría

#### Severidad: Baja
#### Categoría: UX / Lógica de negocio

#### Descripción
El servicio `fetchInventario` filtra explícitamente los items con `cantidadActual <= 0`. Esto significa que un lote que fue ajustado a 0 (vaciado) no aparece en el modal de auditoría, impidiendo al auditor ver el historial completo.

#### Evidencia

```typescript
// inventario.service.ts — líneas 144–149
const chunk = (paginated ? paginated.data : unwrapList<InventarioItem>(body.data))
  .filter(
    (item) =>
      !isInventarioItemDeleted(item) && Number(item.cantidadActual ?? 0) > 0  // ← oculta lotes a 0
  );
```

#### Prioridad: Baja
#### Riesgo de regresión: Bajo

---

### [MOV-001] Cantidad de movimiento tipo AJUSTE siempre positiva en la UI

#### Severidad: Alta
#### Categoría: Lógica de negocio / Correctitud visual

#### Descripción
La columna de cantidad en `Movimientos.tsx` solo aplica el signo negativo para `SALIDA`, `SALIDA_ELABORACION` y `SALIDA_DISTRIBUCION`. Los movimientos de tipo `AJUSTE` siempre muestran `+` y color verde, aunque sean ajustes de corrección negativa.

#### Evidencia

```typescript
// Movimientos.tsx — líneas 220–237
const isNegative =
  row.tipo === TipoMovimiento.SALIDA ||
  row.tipo === TipoMovimiento.SALIDA_ELABORACION ||
  row.tipo === TipoMovimiento.SALIDA_DISTRIBUCION;
  // ← AJUSTE no está incluido, aunque puede ser negativo

return (
  <Typography sx={{ color: isNegative ? 'error.main' : 'success.main' }}>
    {isNegative ? '-' : '+'}    {/* ← AJUSTE siempre '+' */}
    {row.cantidad}
  </Typography>
);
```

En el backend, los ajustes manuales pueden ser positivos o negativos (campo `ajuste` en `CreateAjusteManualInventarioPayload`). El historial de movimientos debería reflejar esto.

#### Solución recomendada
Detectar el signo a partir de la cantidad si el tipo es `AJUSTE`, o bien depender del campo `cantidad` del backend que ya debería ser negativo para ajustes de salida:

```typescript
const isNegative =
  row.tipo === TipoMovimiento.SALIDA ||
  row.tipo === TipoMovimiento.SALIDA_ELABORACION ||
  row.tipo === TipoMovimiento.SALIDA_DISTRIBUCION ||
  (row.tipo === TipoMovimiento.AJUSTE && row.cantidad < 0);
```

#### Prioridad: Alta
#### Riesgo de regresión: Bajo

---

### [MOV-002] Filtros de movimiento sin validación de rango de fechas

#### Severidad: Media
#### Categoría: Validación / UX

#### Descripción
`MovimientoFilters` y `MermasTable` usan `DateRangeFilter` sin validar que `startDate <= endDate`. El backend puede recibir un rango inválido (`startDate > endDate`) y devolver 0 resultados sin error, dejando al usuario confundido.

#### Evidencia

```typescript
// MovimientoFilters.tsx — líneas 127–135
<DateRangeFilter
  startDate={filters.startDate}
  endDate={filters.endDate}
  onChange={(start, end) =>
    onChange({ ...filters, startDate: start, endDate: end })
  }
  // ← sin validación de start <= end
/>
```

#### Solución recomendada

```typescript
onChange={(start, end) => {
  if (start && end && start > end) {
    toast.warn(t('filtros.rangoFechaInvalido'));
    return;
  }
  onChange({ ...filters, startDate: start, endDate: end });
}}
```

O añadir validación en `DateRangeFilter` directamente.

#### Prioridad: Media
#### Riesgo de regresión: Bajo

---

### [MOV-003] `tableFilters` usado directamente sin debounce en `loadData` de Movimientos

#### Severidad: Media
#### Categoría: Performance / UX

#### Descripción
`Movimientos.tsx` usa `tableFilters` (estado sin debounce) para los filtros de `type`, `startDate` y `endDate`, mientras que `queryParams` (con debounce) se usa para `page`, `limit` y `searchTerm`. Esto crea una inconsistencia: cambiar el tipo de movimiento dispara una petición API inmediata, mientras que escribir en el buscador espera 500ms.

#### Evidencia

```typescript
// Movimientos.tsx — líneas 121–149
const loadData = useCallback(async () => {
  const dataLoad = await fetchMovimientos({
    page: queryParams.page,          // ← usa debouncedValues
    limit: queryParams.limit,        // ← usa debouncedValues
    searchTerm: queryParams.searchTerm, // ← debounced
    type: (tableFilters.types as TipoMovimiento[])?.length > 0
      ? (tableFilters.types as TipoMovimiento[])
      : undefined,                   // ← sin debounce (tableFilters directo)
    startDate: (tableFilters.startDate as string) || undefined, // ← sin debounce
    endDate: (tableFilters.endDate as string) || undefined,     // ← sin debounce
  });
}, [queryParams, tableFilters, syncPaginationFromResponse, t]);
```

#### Solución recomendada
Usar `debouncedFilters` de `useDataTable` en lugar de `tableFilters`:

```typescript
const { ..., debouncedFilters } = useDataTable({ ... });
// En loadData:
type: (debouncedFilters.types as TipoMovimiento[])?.length > 0 ? ... : undefined,
startDate: (debouncedFilters.startDate as string) || undefined,
```

#### Prioridad: Media
#### Riesgo de regresión: Bajo

---

### [MOV-004] Cantidad de movimiento sin unidad de medida

#### Severidad: Baja
#### Categoría: UX / Legibilidad

#### Descripción
La columna `cantidad` en la tabla de movimientos muestra solo el número sin unidad. Un movimiento de `+5` puede ser 5 kg, 5 litros o 5 unidades, según el producto. Sin contexto de unidad, el historial es difícil de interpretar.

#### Evidencia

```typescript
// Movimientos.tsx — líneas 230–236
{isNegative ? '-' : '+'}
{row.cantidad}        // ← sin unidad
```

La interfaz `Movimiento` no incluye la unidad del producto, aunque se podría acceder vía:
```typescript
row.productoProveedor?.producto?.nombre  // ya se accede para la descripción
```

#### Prioridad: Baja
#### Riesgo de regresión: Bajo — requiere que el backend incluya `unidad` en la respuesta de movimientos

---

### [MER-001] `MermaStats` suma cantidades de unidades heterogéneas

#### Severidad: Alta
#### Categoría: Integridad de datos / Semántica

#### Descripción
El componente `MermaStats` suma `totalCantidad` de todos los motivos de merma para calcular un "total de pérdidas". Esta suma agrega kg + litros + unidades en un único número sin dimensión, lo cual no tiene sentido físico.

#### Evidencia

```typescript
// MermaStats.tsx — líneas 40–43
const totalCantidad = stats.porMotivo.reduce(
  (acc, curr) => acc + Number(curr.totalCantidad),
  0
);
```

```typescript
// MermaStats.tsx — línea 77
<Typography variant="h4" fontWeight={700}>
  {totalCantidad.toFixed(2)}   {/* ← suma de kg + L + uds */}
</Typography>
<Typography variant="caption">
  {t('merma.stats.disclaimerUnidadesMixtas')}   {/* disclaimer, pero el número persiste */}
</Typography>
```

#### Riesgo real
Un auditor puede tomar decisiones incorrectas basándose en este número. El disclaimer existe pero el número prominente en `h4` genera anclaje cognitivo.

#### Solución recomendada
Mostrar el total de **registros** como métrica principal, y el desglose por producto (con su unidad) como secundario. Eliminar o contextualizar claramente el total de cantidad:

```typescript
// Alternativa: mostrar solo totalRegistros como KPI primario
<Typography variant="h4">{totalRegistros}</Typography>
<Typography variant="caption">{t('merma.stats.totalRegistros')}</Typography>
```

#### Prioridad: Alta
#### Riesgo de regresión: Bajo

---

### [MER-002] `TipoMerma` y `MotivoMerma` — enums paralelos con valores duplicados

#### Severidad: Alta
#### Categoría: Tipado / Consistencia de dominio

#### Descripción
Existen dos enums en `merma.types.ts` que modelan conceptos distintos pero comparten valores, creando confusión semántica y riesgo de errores de tipo en runtime.

#### Evidencia

```typescript
// merma.types.ts — líneas 5–21
export enum MotivoMerma {
  ROTURA = 'rotura',
  DETERIORO = 'deterioro',
  HURTO = 'hurto',            // ← también en TipoMerma
  ERROR_PREPARACION = 'error_preparacion',
  OTROS = 'otros',
}

export enum TipoMerma {
  RECEPCION = 'recepcion',
  PRODUCCION = 'produccion',
  CADUCIDAD = 'caducidad',
  ROTURA = 'rotura',          // ← también en MotivoMerma
  INVENTARIO = 'inventario',
  HURTO = 'hurto',            // ← también en MotivoMerma
}
```

Problemas concretos:
- `TipoMerma.ROTURA` y `MotivoMerma.ROTURA` tienen el mismo valor de string `'rotura'`. Si se recibe un valor del backend y se hace `as MotivoMerma`, podría ser realmente un `TipoMerma`.
- `CADUCIDAD` existe en `TipoMerma` pero **no en `MotivoMerma`**, aunque la caducidad es un motivo legítimo de merma (inconsistencia respecto al backend si el backend tiene `CADUCIDAD` como motivo).
- El UI de creación de mermas solo permite seleccionar `MotivoMerma`, ocultando `TipoMerma.CADUCIDAD` al usuario.

#### Solución recomendada
Alinear con los enums del backend:
```typescript
// Verificar merma.enums.ts del backend y replicar exactamente
// Si el backend tiene TipoMerma y MotivoMerma separados, mantenerlos pero sin solapamiento
// Eliminar HURTO y ROTURA de TipoMerma si son exclusivos de MotivoMerma
```

#### Prioridad: Alta
#### Riesgo de regresión: Medio — requiere auditoría de los valores usados en el backend

---

### [MER-003] Mermas de producción no distinguibles visualmente en la tabla

#### Severidad: Alta
#### Categoría: UX / Trazabilidad

#### Descripción
`MermasTable` no muestra el campo `tipo` (que indica si la merma fue manual, de producción, de recepción, etc.) ni `origenEntidad`/`origenId`. Un auditor no puede distinguir entre una merma reportada manualmente y una generada automáticamente desde un lote de producción cancelado.

#### Evidencia

```typescript
// MermasTable.tsx — columnas definidas (líneas 67–131)
// Columnas: createdAt | producto | cantidad | motivo | usuario | notas
// ← NO hay columna 'tipo' ni 'origen'
```

```typescript
// merma.types.ts — interfaz Merma
export interface Merma {
  tipo?: TipoMerma;          // ← existe pero no se muestra
  origenEntidad?: string;    // ← existe pero no se muestra
  origenId?: string;         // ← existe pero no se muestra
}
```

#### Solución recomendada
Añadir columna `tipo` con `StatusChip` y badge de origen:

```typescript
{
  id: 'tipo',
  label: t('merma.tabla.tipo'),
  render: (row) => row.tipo ? (
    <StatusChip status={row.tipo} size="small" variant="outlined" />
  ) : <Typography variant="caption" color="text.secondary">Manual</Typography>,
  hideOnMobile: true,
},
```

#### Prioridad: Alta
#### Riesgo de regresión: Bajo — añadir columna no rompe nada

---

### [MER-004] Creación de merma sin validación frontend de `productoId` ni `cantidad`

#### Severidad: Media
#### Categoría: Validación / Robustez

#### Descripción
`handleCreateMerma` en `Mermas.tsx` e `handleSaveMerma` en `InventoryDetailModal.tsx` no validan que `productoId` sea un UUID válido ni que `cantidad > 0` antes de llamar al backend. El cast `as MotivoMerma` tampoco valida en runtime.

#### Evidencia

```typescript
// Mermas.tsx — líneas 231–250
const handleCreateMerma = async (formData: Record<string, unknown>) => {
  setIsSaving(true);
  try {
    await createMerma({
      productoId: String(formData.productoId),    // ← String('') es válido TypeScript
      cantidad: Number(formData.cantidad),         // ← Number(undefined) = NaN
      motivo: formData.motivo as MotivoMerma,      // ← cast inseguro en runtime
```

```typescript
// InventoryDetailModal.tsx — líneas 488–497
await createMerma({
  productoId: String(formData.productoId),   // ← idem
  cantidad: Number(formData.cantidad),
  motivo: formData.motivo as MotivoMerma,
```

#### Solución recomendada

```typescript
const productoId = String(formData.productoId ?? '').trim();
if (!productoId) {
  toast.error(t('mermas.validacion.productoObligatorio'));
  return;
}
const cantidad = Number(formData.cantidad);
if (!Number.isFinite(cantidad) || cantidad <= 0) {
  toast.error(t('mermas.validacion.cantidadInvalida'));
  return;
}
const validMotivos = Object.values(MotivoMerma) as string[];
if (!validMotivos.includes(String(formData.motivo))) {
  toast.error(t('mermas.validacion.motivoInvalido'));
  return;
}
```

#### Prioridad: Media
#### Riesgo de regresión: Bajo

---

### [MER-005] `MermasTable` — `sortKey: 'productoId'` ordena por UUID en lugar de nombre

#### Severidad: Media
#### Categoría: UX / Ordenación

#### Descripción
La columna `producto` en `MermasTable` usa `sortKey: 'productoId'` para la ordenación en backend. Esto ordena por UUID (completamente no significativo para el usuario) en lugar de por nombre del producto.

#### Evidencia

```typescript
// MermasTable.tsx — líneas 76–81
{
  id: 'producto',
  label: t('merma.tabla.producto'),
  render: (row) => row.producto?.nombre || '—',
  sortable: true,
  sortType: 'string',
  sortKey: 'productoId',   // ← ordena por UUID, no por nombre
},
```

#### Solución recomendada
```typescript
sortKey: 'productoNombre',  // o el campo que el backend soporte
```

Verificar primero que el backend de mermas soporte ordenación por nombre de producto en el endpoint `/merma`.

#### Prioridad: Media
#### Riesgo de regresión: Bajo — depende de soporte backend

---

### [MER-006] `fetchMermaStats` no indica el período de referencia en la UI

#### Severidad: Media
#### Categoría: UX / Transparencia de datos

#### Descripción
El panel de estadísticas de mermas no muestra al usuario qué período de tiempo están representando los datos. El backend probablemente aplica un período por defecto (últimos 30 o 90 días), pero el usuario no tiene forma de saberlo.

#### Evidencia

```typescript
// Mermas.tsx — líneas 85–116
const reloadStats = useCallback(async () => {
  // ...
  const statsData = await fetchMermaStats({
    motivo: ...,
    startDate: ...,
    endDate: ...,
    // ← si startDate y endDate están vacíos, el backend aplica su default silenciosamente
  });
}, [...]);
```

```typescript
// MermaStats.tsx — no hay indicador de período en el render
```

#### Solución recomendada
Mostrar el período en la cabecera de estadísticas:
```tsx
<Typography variant="caption" color="text.secondary">
  {startDate && endDate
    ? t('merma.stats.periodo', { desde: formatLocalizedDate(startDate), hasta: formatLocalizedDate(endDate) })
    : t('merma.stats.periodoPorDefecto')}
</Typography>
```

#### Prioridad: Media
#### Riesgo de regresión: Bajo

---

### [API-001] `buildQueryParams` serializa arrays con coma vs `append` múltiple — inconsistencia

#### Severidad: Alta
#### Categoría: Contrato API / Correctitud

#### Descripción
El helper `buildQueryParams` en `api.service.ts` serializa arrays con `.join(',')` (un solo parámetro con valores separados por coma). Sin embargo, `movimiento.service.ts` usa `URLSearchParams.append` para repetir el parámetro por cada valor. Esta inconsistencia produce formatos distintos según el módulo.

#### Evidencia

```typescript
// api.service.ts — líneas 102–104
if (Array.isArray(value)) {
  searchParams.set(key, value.join(','));   // ← "ubicacionIds=id1,id2,id3"
}
```

```typescript
// movimiento.service.ts — líneas 133–136
if (Array.isArray(params.type)) {
  params.type.forEach((t) => queryParams.append('type', t));
  // ← "type=entrada&type=salida&type=ajuste"
}
```

También en `inventario.service.ts`:
```typescript
// inventario.service.ts — línea 131
ubicacionIds: filters?.ubicacionIds?.length
  ? filters.ubicacionIds
  : undefined,
// → buildQueryParams lo serializa como "ubicacionIds=id1,id2"
```

#### Riesgo real
Si el backend espera `ubicacionIds[]=...` o múltiples params `ubicacionIds=...&ubicacionIds=...`, el formato de coma puede causar que el filtro no funcione silenciosamente.

#### Solución recomendada
Estandarizar: preferiblemente múltiple `append` para compatibilidad con NestJS `@Query` arrays:

```typescript
// api.service.ts — reemplazar el bloque de Array:
if (Array.isArray(value)) {
  value.forEach((item) => searchParams.append(key, String(item)));
}
```

#### Prioridad: Alta
#### Riesgo de regresión: Medio — cambio en formato de query string puede afectar a filtros existentes

---

### [API-002] `useDataTable` — debounce aplicado a filtros y búsqueda conjuntamente

#### Severidad: Media
#### Categoría: UX / Performance

#### Descripción
El hook `useDataTable` aplica el mismo debounce de 500ms tanto a cambios en `searchTerm` (texto libre, debounce apropiado) como a cambios en `filters` (selects, checkboxes — debounce innecesario que añade latencia).

#### Evidencia

```typescript
// useDataTable.ts — líneas 73–79
useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedFilters(state.filters);      // ← debounce de 500ms en filtros de select
    setDebouncedSearchTerm(state.searchTerm);
  }, 500);
  return () => clearTimeout(timer);
}, [state.filters, state.searchTerm]);
```

#### Solución recomendada
Separar el debounce:

```typescript
useEffect(() => {
  const timer = setTimeout(() => setDebouncedSearchTerm(state.searchTerm), 500);
  return () => clearTimeout(timer);
}, [state.searchTerm]);

// Los filtros no necesitan debounce
useEffect(() => {
  setDebouncedFilters(state.filters);
}, [state.filters]);
```

#### Prioridad: Media
#### Riesgo de regresión: Bajo

---

### [API-003] Estado de `useDataTable` no persiste en URL

#### Severidad: Media
#### Categoría: UX / Navegación

#### Descripción
El hook `useDataTable` gestiona paginación, ordenación y filtros completamente en estado local React. No hay sincronización con `useSearchParams`. Al navegar entre módulos, el usuario pierde su posición, ordenación y filtros activos.

#### Prioridad: Media
#### Riesgo de regresión: Medio — requiere refactorización de todos los consumidores del hook

---

## Inconsistencias Frontend/Backend

### 1. `MotivoMerma` — posible desincronización con backend tras commit reciente
El fichero `backend/smart-economat-backend/src/modules/merma/enums/merma.enums.ts` fue modificado recientemente (según `git status`). El frontend tiene `MotivoMerma: ROTURA | DETERIORO | HURTO | ERROR_PREPARACION | OTROS`. Si el backend añadió `CADUCIDAD` como motivo (actualmente solo existe en `TipoMerma` del frontend), la UI no lo mostrará en el selector de creación de mermas.

**Acción requerida:** Verificar el enum backend y sincronizar `merma.types.ts`.

### 2. `TipoMovimientoManualAjuste` — backend puede tener tipos más específicos
El tipo frontend es `'entrada' | 'salida_ajuste'`. Si el backend ya diferencia `'ajuste_entrada'` y `'ajuste_salida'` en sus enums, los movimientos se registran con tipos incorrectos.

### 3. Arrays de IDs en query strings — serialización inconsistente
`buildQueryParams` usa coma; `movimiento.service.ts` usa append múltiple. Requiere auditar qué acepta el backend en cada endpoint.

### 4. `sortKey: 'productoId'` en MermasTable vs capacidades reales del backend
Es probable que el backend de mermas no soporte `sortBy=productoNombre`. Antes de cambiar el frontend, verificar la implementación del endpoint `/merma` en el repositorio NestJS.

### 5. Fechas sin timezone en filtros
Los filtros de fecha envían `YYYY-MM-DD` como string plano. El backend interpreta esto en UTC. Un usuario en UTC+2 que filtra "hoy" (`2026-05-14`) puede no ver movimientos de las primeras 2 horas del día UTC (00:00-02:00 UTC = 02:00-04:00 local).

---

## Riesgos Potenciales Futuros

### 1. Escalabilidad del inventario (Riesgo: Crítico)
Con el modelo actual de carga completa, añadir más de 400 SKUs con múltiples lotes por producto puede hacer la página de inventario inutilizable. El límite `MAX_PAGES = 400` es una barrera temporal que no resuelve el problema arquitectural.

### 2. Cache de inventario no aislado por usuario (Riesgo: Bajo en SPA pero documentar)
`inventarioCache` es una variable de módulo global. En modo multi-tab, dos pestañas del mismo usuario comparten la misma cache. En sistemas con RBAC donde diferentes usuarios ven diferentes ubicaciones, si el backend aplica filtros por usuario, la cache podría ser compartida erróneamente entre tabs (aunque con httpOnly cookies por sesión, esto es poco probable en la práctica).

### 3. Mermas de producción sin inventarioId (Riesgo: Medio)
`createMermaProduccion` acepta `inventarioId?` como opcional, pero sin él, la merma no descuenta del lote de inventario correcto. Dependiendo de cómo el backend maneje esto, podría haber discrepancias entre el inventario real y el registrado.

### 4. Transferencias sin reversión en caso de error parcial (Riesgo: Medio)
`ejecutarTransferenciaInventario` envía múltiples líneas de transferencia. Si el backend no usa transacciones atómicas para todas las líneas, una falla parcial puede dejar el stock inconsistente. El frontend no tiene mecanismo de compensación.

---

## Deuda Técnica

| Ítem | Esfuerzo | Impacto |
|------|----------|---------|
| Paginación server-side en inventario (endpoint nuevo en backend) | Alto | Crítico |
| Extracción de utils de formateo de stock a módulo compartido | Bajo | Medio |
| Persistencia de filtros en URL (todos los módulos) | Medio | Alto |
| Separación de debounce en `useDataTable` | Bajo | Bajo |
| Confirmación antes de eliminar ubicaciones | Bajo | Alto |
| Validación de rangos de fechas en filtros | Bajo | Medio |
| Etiquetas de categorías con i18n en `InventarioFilters` | Bajo | Bajo |
| Columna `tipo` en `MermasTable` | Bajo | Medio |
| Estandarización de serialización de arrays en `buildQueryParams` | Bajo | Alto |
| Auditoría de sincronización `MotivoMerma` frontend-backend | Bajo | Crítico |
| Comentarios de JSDoc generados automáticamente con contenido genérico | Bajo | Bajo (claridad) |

> **Nota sobre JSDoc:** Se detecta un patrón sistemático de comentarios JSDoc generados automáticamente con texto genérico ("Ejecuta la lógica de operación dentro del flujo de la aplicación.") en múltiples archivos (`QuickLocationDialog.tsx`, `UbicacionesModal.tsx`, `MovimientoFilters.tsx`, `MermaStats.tsx`, `inventario.types.ts`). Estos comentarios no aportan valor y dificultan la lectura del código.

---

## Conclusión

Los módulos analizados son funcionales y tienen buenas prácticas en las capas de seguridad (httpOnly cookies, validación de IDs pre-petición, CSRF token) y en la gestión de errores (ApiError unificado, toasts consistentes). Sin embargo, hay **tres problemas que deben abordarse de forma inmediata**:

1. **[INV-001]** La carga completa del inventario en el cliente es insostenible desde el punto de vista de escalabilidad y es la deuda técnica más urgente.
2. **[API-001]** La inconsistencia de serialización de arrays puede causar que los filtros de inventario no funcionen correctamente de forma silenciosa.
3. **[MER-002]** La confusión entre `MotivoMerma` y `TipoMerma` con valores duplicados, combinada con el commit reciente al enum backend, puede producir registros de merma con tipos incorrectos.

Los hallazgos de **severidad Alta** (INV-002, INV-003, INV-004, INV-005, MOV-001, MER-001, MER-003) deben planificarse en el siguiente sprint. Los de severidad Media representan deuda técnica acumulable pero con límite de tiempo recomendado de 2-3 sprints.

El módulo de **Movimientos** es el más maduro de los tres: paginación real en backend, filtros funcionales y código bien estructurado. Se recomienda usarlo como referencia al refactorizar el módulo de Inventario.
