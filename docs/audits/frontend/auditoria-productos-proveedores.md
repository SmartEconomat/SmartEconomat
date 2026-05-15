# Auditoría Técnica: Módulos de Productos y Proveedores

> **Auditor:** Staff Engineer Senior (análisis estático exhaustivo)
> **Fecha:** 2026-05-14
> **Stack auditado:** React 19 + TypeScript + MUI 7 + React Router 7 + Context API
> **Archivos analizados:** 18 archivos fuente (~3 200 LOC efectivas)

---

## Resumen Ejecutivo

Los módulos de Productos y Proveedores presentan una base sólida: la arquitectura de servicios está bien separada, el cliente HTTP centralizado (`baseFetch`) es robusto, y hay buenas prácticas como el patrón de request-ID para evitar race conditions en la carga principal. Sin embargo, se identifican **16 hallazgos** distribuidos en severidades crítica (1), alta (5), media (7) y baja (3). Los problemas más relevantes son: la posibilidad de doble submit con pérdida de datos en el formulario de producto por ausencia de guards anti-race-condition en el helper async, una cadena de estados imposibles que puede bloquear la UI, y un export individual de proveedores con una lógica de filtrado completamente incorrecta que devuelve resultados erróneos. El código de alergenos y la integración OpenFoodFacts son correctos conceptualmente pero tienen fragilidades ante datos inesperados. El PMP se muestra correctamente pero no está protegido ante `null` de forma consistente.

---

## Métricas

| Dimensión                   | Calificación | Notas                                                                |
|-----------------------------|--------------|----------------------------------------------------------------------|
| Validación de formularios   | 7 / 10       | Frontend robusto pero el helper lanza excepciones sin i18n           |
| Gestión de estado           | 6 / 10       | Estados imposibles, falta de guards en re-submit asíncrono           |
| Integración API             | 7 / 10       | Cache bien implementada, pero export individual tiene bug grave       |
| Performance                 | 7 / 10       | Code splitting correcto, proveedores se cargan en bucle secuencial    |
| Tipado TypeScript           | 6 / 10       | Múltiples `as string` inseguros, `[key: string]: unknown` demasiado amplio |
| UX y accesibilidad          | 7 / 10       | `AllergenSelector` sin roles ARIA; `aria-label` en íconos correctos  |
| Manejo de errores           | 6 / 10       | OFf silencia todos los errores; historial de precios también         |

---

## Hallazgos

---

### [PROD-001] Doble submit posible: `handleSaveProduct` no protege ante clicks simultáneos mientras `buildProductoPayload` procesa la imagen

#### Severidad: Alta
#### Categoría: Race Condition / Formularios

#### Descripción

`handleSaveProduct` fija `isSaving = true` antes de llamar a `buildProductoPayload`, lo cual es correcto para la bandera visual. Sin embargo, en `Productos.tsx` el callback se pasa al modal como:

```tsx
onSubmit={(data) =>
  void handleSaveProduct(data as ProductoFormValues)
}
```

El modal interno (`DynamicFormModal`) puede invocar `onSubmit` nuevamente si el usuario pulsa el botón "Guardar" una segunda vez antes de que la promesa resuelva (el botón se desactiva con `isSubmitting`, pero esta prop se propaga con un render delay). Si el upload de imagen en `buildProductoPayload` es lento (red lenta), el `isSaving` todavía no ha sido pintado cuando un segundo click llega al evento nativo.

#### Riesgo real

Creación duplicada de productos en el backend. El `invalidateProductosCache()` dentro de `createProducto` borra la caché antes de la respuesta, por lo que el segundo submit encuentra caché vacía y lanza otra petición legítima.

#### Evidencia

```ts
// productoForm.helpers.ts – línea 122-127
let finalPathImg: string | undefined;
if (typedFormData.imagen instanceof File) {
  try {
    finalPathImg = await uploadFile(typedFormData.imagen);  // ← await aquí
  } catch {
    throw new Error('Hubo un error al subir la imagen del producto.');
  }
}
```

```tsx
// Productos.tsx – línea 321-322
const handleSaveProduct = async (formData: ProductoFormValues) => {
  setIsSaving(true);   // ← setState es asíncrono; el re-render no es inmediato
```

#### Impacto

Duplicados en catálogo de productos. Difícil de detectar sin revisión manual.

#### Solución recomendada

Usar un `useRef` como guard síncrono (no un estado React):

```ts
const isSavingRef = useRef(false);

const handleSaveProduct = async (formData: ProductoFormValues) => {
  if (isSavingRef.current) return;
  isSavingRef.current = true;
  setIsSaving(true);
  try { /* ... */ }
  finally {
    isSavingRef.current = false;
    setIsSaving(false);
  }
};
```

#### Prioridad: Alta
#### Riesgo de regresión: Bajo (cambio localizado)

---

### [PROD-002] Export individual de proveedor usa `searchTerm` sobre nombre/NIF en lugar de endpoint por ID

#### Severidad: Crítica
#### Categoría: Lógica de Negocio / Bug

#### Descripción

`handleExportIndividualPdf` en `Proveedores.tsx` construye la URL del PDF usando el campo `nif` o `nombre` del proveedor como `searchTerm`. Esto provoca que el PDF exportado contenga **todos los proveedores cuyo nombre o NIF coincida parcialmente con la cadena pasada**. Si el NIF es `null`, usa el nombre, que podría ser un término muy común.

#### Riesgo real

El usuario descarga un PDF con datos de múltiples proveedores pensando que es la ficha individual de uno solo. Problema de confidencialidad e integridad de información.

#### Evidencia

```ts
// Proveedores.tsx – líneas 261-272
const handleExportIndividualPdf = async (proveedor: Proveedor) => {
  try {
    // Nota: Si el backend tuviera /proveedor/:id/pdf sería preferible
    await DownloadService.downloadFile(
      `/export/proveedores/pdf?searchTerm=${proveedor.nif || proveedor.nombre}`,
      { filename: `proveedor_${proveedor.nombre}.pdf`, toast }
    );
  } catch { /* ... */ }
};
```

El propio comentario en el código reconoce que el endpoint correcto sería `/proveedor/:id/pdf`. La solución actual es una workaround que introduce un bug real.

#### Impacto

- Confidencialidad: exporta datos de más proveedores.
- Integridad: el nombre del archivo sugiere que es individual pero no lo es.
- Si `nif` es `null` (campo opcional), el `searchTerm` usa el nombre, que puede devolver múltiples coincidencias.

#### Solución recomendada

Añadir endpoint backend `/export/proveedores/:id/pdf` o, en su defecto, pasar el ID explícito como query param `id`:

```ts
await DownloadService.downloadFile(
  `/export/proveedores/pdf?id=${proveedor.id}`,
  { filename: `proveedor_${proveedor.nombre}.pdf`, toast }
);
```

Requiere que el backend soporte filtrado por `id` en el endpoint de exportación.

#### Prioridad: Inmediata
#### Riesgo de regresión: Bajo (cambio localizado en servicio)

---

### [PROD-003] `loadProveedores` en `ProductoFormModal` realiza peticiones secuenciales bloqueantes en bucle

#### Severidad: Alta
#### Categoría: Performance

#### Descripción

El helper `loadProveedores` carga todos los proveedores paginando de forma **secuencial** (un await por página), con un límite de `PROVEEDORES_MAX_PAGES = 40` páginas de 50 items cada una = potencialmente 2 000 proveedores en 40 llamadas en serie. Cada llamada espera la anterior antes de lanzar la siguiente.

#### Riesgo real

En entornos con muchos proveedores (p. ej. 200+), abrir el formulario de producto puede tardar varios segundos bloqueando el hilo de render del componente. El usuario ve el modal abierto sin los proveedores disponibles durante ese tiempo.

#### Evidencia

```ts
// ProductoFormModal.tsx – líneas 157-181
const loadProveedores = useCallback(async () => {
  try {
    const providersById = new Map<string, Proveedor>();
    let page = 1;
    let totalPages = 1;

    while (page <= totalPages && page <= PROVEEDORES_MAX_PAGES) {
      const response = await fetchProveedores(page, PROVEEDORES_PAGE_SIZE); // ← secuencial
      // ...
      page += 1;
    }
    // ...
  }
}, []);
```

#### Impacto

- UX degradada al abrir el formulario con muchos proveedores.
- 40 llamadas HTTP secuenciales pueden tardar 4-10 segundos en red media.
- No hay indicador de carga específico para los proveedores: el Autocomplete aparece vacío o con un spinner genérico.

#### Solución recomendada

1. **Solución corta plazo:** Cargar solo la primera página en la apertura inicial y permitir búsqueda incremental vía `searchTerm` en el Autocomplete.
2. **Solución correcta:** Paralelizar las páginas tras conocer `totalPages` de la primera:

```ts
const firstPage = await fetchProveedores(1, PROVEEDORES_PAGE_SIZE);
const totalPages = Math.min(firstPage.totalPages, PROVEEDORES_MAX_PAGES);
const remainingPages = await Promise.all(
  Array.from({ length: totalPages - 1 }, (_, i) =>
    fetchProveedores(i + 2, PROVEEDORES_PAGE_SIZE)
  )
);
```

Este mismo patrón ya existe en `fetchAllProductos` del `producto.service.ts` y debería replicarse aquí.

#### Prioridad: Alta
#### Riesgo de regresión: Bajo

---

### [PROD-004] Estado imposible: `isLoading=true` + `error` visible simultáneamente

#### Severidad: Media
#### Categoría: Gestión de Estado / UX

#### Descripción

En `Productos.tsx`, el error se limpia al inicio de `loadData` pero la condición de render del `Alert` es `!isLoading && error`. Esto protege la visualización. Sin embargo, en `Proveedores.tsx` la misma condición se aplica pero `setError(null)` no se llama al inicio de `loadData`, lo que puede causar que el error anterior persista en pantalla durante un breve momento mientras `isLoading` está activo si hay un error previo y el usuario fuerza un reload.

Más grave: en ambas páginas, `syncPaginationFromResponse` se llama con `{ total: 0, data: [] }` en el catch, pero `setData` no se llama con array vacío en el path de error de `Proveedores.tsx`, por lo que los datos anteriores quedan en pantalla mientras se muestra un error.

#### Evidencia

```ts
// Proveedores.tsx – líneas 85-108
const loadData = useCallback(async () => {
  setIsLoading(true);
  setError(null);  // ← sí limpia error
  try {
    // ...
    setData(proveedoresData.data);  // ← solo se setea en éxito
  } catch (err: unknown) {
    syncPaginationFromResponse({ total: 0, data: [] });
    // ← falta setData([]) aquí
    setError(message);
  } finally {
    setIsLoading(false);
  }
}, [queryParams, includeDeleted, syncPaginationFromResponse, t]);
```

En caso de error: `data` mantiene los valores anteriores, `error` muestra mensaje → **tabla con datos obsoletos + mensaje de error simultáneos**.

#### Impacto

UX confusa: el usuario ve datos posiblemente incorrectos junto a un mensaje de error. En un entorno de inventario, esto puede llevar a tomar decisiones sobre datos obsoletos.

#### Solución recomendada

```ts
} catch (err: unknown) {
  setData([]);  // ← limpiar datos al error
  syncPaginationFromResponse({ total: 0, data: [] });
  setError(message);
}
```

#### Prioridad: Media
#### Riesgo de regresión: Bajo

---

### [PROD-005] `buildProductoPayload` lanza errores en inglés hardcodeados sin pasar por i18n

#### Severidad: Media
#### Categoría: i18n / UX

#### Descripción

Las validaciones en `productoForm.helpers.ts` lanzan errores con mensajes en español hardcodeados (no i18n). Aunque el proyecto es mayoritariamente en español, esto viola el contrato de internacionalización y hace imposible la traducción futura o adaptación de mensajes.

#### Evidencia

```ts
// productoForm.helpers.ts – líneas 44-48
if (precioUnitario == null || precioUnitario < 0.01) {
  throw new Error(
    `El precio unitario del proveedor ${index + 1} es obligatorio y debe ser mayor que 0 (mínimo 0.01).`
  );
}
```

```ts
// línea 86-88
if (!nombre) {
  throw new Error('El nombre del producto es obligatorio.');
}
```

Hay al menos 7 mensajes de error hardcodeados en este helper.

#### Impacto

- Inconsistencia con el sistema i18n del proyecto.
- Imposible adaptar mensajes desde archivos de traducción.
- El error llega al `toast.error` en `Productos.tsx` tal cual, visible al usuario.

#### Solución recomendada

Convertir `buildProductoPayload` para aceptar un `t: TFunction` como parámetro, o mover la validación de mensajes al componente donde `t` está disponible. Alternativamente, usar claves de error estandarizadas y dejar la presentación a la capa UI.

#### Prioridad: Media
#### Riesgo de regresión: Bajo

---

### [PROD-006] `handleSearchScannerResult` puede abrir el formulario con datos de OpenFoodFacts aunque el escaneo falle silenciosamente

#### Severidad: Alta
#### Categoría: Race Condition / UX / Datos

#### Descripción

En el catch de `handleSearchScannerResult`, si `canCreate` es `true`, se llama a `buildCreateProductDraft(code)` que a su vez llama a `searchByBarcode(code)`. La función `searchByBarcode` en `openfoodfacts.service.ts` **silencia todos los errores y devuelve `null`** sin distinguir entre "producto no encontrado" y "error de red/timeout". De esta forma:

1. Si hay error de red con el backend OFf → el formulario se abre con datos vacíos (solo el código de barras), lo que es aceptable.
2. Sin embargo, el toast que aparece es `productos.toast.errorCatalogo` (warning), cuando debería comunicar más claramente que es un problema transitorio de red.

Más grave: **dentro del catch principal de `handleSearchScannerResult`**, se vuelve a llamar a `buildCreateProductDraft(code)` — que también llama a `searchByBarcode` — sin capturar su posible excepción propia. Si `searchByBarcode` lanza (aunque actualmente no lo hace), la promesa quedaría sin manejar.

#### Evidencia

```ts
// Productos.tsx – líneas 528-535
} catch {
  if (!canCreate) {
    toast.error(t('productos.toast.errorValidar'));
    return;
  }

  setProductToEdit(await buildCreateProductDraft(code));  // ← segundo await sin try/catch
  toast.warning(t('productos.toast.errorCatalogo'));
}
```

```ts
// openfoodfacts.service.ts – líneas 93-106
try {
  // ...
} catch {
  return null;  // ← silencia absolutamente todo
}
```

#### Impacto

- Si el segundo `buildCreateProductDraft` lanza, el error es completamente silencioso (void de la promesa).
- El usuario puede no ver ningún feedback si ambas llamadas fallan.

#### Solución recomendada

```ts
} catch {
  if (!canCreate) {
    toast.error(t('productos.toast.errorValidar'));
    return;
  }
  try {
    setProductToEdit(await buildCreateProductDraft(code));
    toast.warning(t('productos.toast.errorCatalogo'));
  } catch {
    toast.error(t('productos.toast.errorInesperado'));
  }
}
```

#### Prioridad: Media
#### Riesgo de regresión: Bajo

---

### [PROD-007] `AllergenSelector` no es accesible por teclado ni tiene roles ARIA semánticos

#### Severidad: Alta
#### Categoría: Accesibilidad (a11y)

#### Descripción

`AllergenSelector` renderiza los alérgenos como `Box` con `onClick`, sin `role="checkbox"`, sin `aria-checked`, sin soporte a `Enter`/`Space` y sin `tabIndex`. Un usuario de teclado o lector de pantalla no puede interactuar con el selector.

#### Evidencia

```tsx
// AllergenSelector.tsx – líneas 58-85
<Box
  key={allergen.id}
  onClick={() => handleToggle(allergen.id)}
  sx={{ /* estilos */ }}
>
  {/* Sin role, sin aria-checked, sin tabIndex */}
  <Tooltip title={...}>
    <Box sx={{ display: 'flex', mb: 0.5 }}>{allergen.icon}</Box>
  </Tooltip>
  <Typography variant="caption">{...}</Typography>
</Box>
```

La sección de alergenos en `ProductCard.tsx` también oculta los iconos con `aria-hidden="true"` sin proporcionar texto alternativo accesible para los iconos de alergenos:

```tsx
// ProductCard.tsx – línea 233
<Box ... aria-hidden="true">
  {a.icon}
</Box>
```

Esto es correcto para decoración, pero el `Tooltip` que envuelve la Box es la única fuente de información para tecnologías asistivas. Sin embargo, `Tooltip` en MUI no garantiza accesibilidad en todos los contextos si el elemento hijo no es interactivo.

#### Impacto

- WCAG 2.1 nivel A – violación de criterio 4.1.2 (Name, Role, Value).
- Usuarios con discapacidad motora o visual no pueden seleccionar/deseleccionar alérgenos.

#### Solución recomendada

```tsx
<Box
  key={allergen.id}
  role="checkbox"
  aria-checked={isSelected}
  tabIndex={disabled ? -1 : 0}
  onClick={() => handleToggle(allergen.id)}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle(allergen.id);
    }
  }}
  aria-label={allergen.label}
  // ...resto de sx
>
```

#### Prioridad: Alta
#### Riesgo de regresión: Bajo

---

### [PROD-008] Cache de productos no invalida en caso de error durante `uploadFile`

#### Severidad: Media
#### Categoría: Consistencia de Cache

#### Descripción

En `producto.service.ts`, tanto `createProducto` como `updateProducto` llaman a `invalidateProductosCache()` **antes** de la petición HTTP. Si la petición falla, la caché ya ha sido vaciada innecesariamente. Esto fuerza un refetch innecesario en el siguiente acceso, pero más importante: en `handleSaveProduct`, si `buildProductoPayload` lanza (error en upload de imagen), la caché **no** ha sido invalidada (porque `createProducto`/`updateProducto` nunca se llamó). Esto es correcto. Pero si el upload de imagen tiene éxito y la llamada al backend falla, la imagen ya fue subida al servidor de archivos pero la caché se invalidó prematuramente, causando un refetch que puede devolver el estado inconsistente donde el archivo existe pero el producto no fue creado.

#### Evidencia

```ts
// producto.service.ts – líneas 333-336
export async function createProducto(
  producto: ProductoMutationPayload
): Promise<Producto> {
  invalidateProductosCache();  // ← antes del fetch
  const response = await baseFetch('/productos', { ... });
```

#### Impacto

- Menor: la invalidación prematura causa un refetch extra en el siguiente uso.
- Mayor: imagen huérfana subida sin producto asociado (no hay cleanup).

#### Solución recomendada

Mover `invalidateProductosCache()` al bloque `finally` o, mejor, solo invalidar en caso de éxito (dentro de `handleSaveProduct` tras la respuesta positiva), no dentro del servicio.

#### Prioridad: Media
#### Riesgo de regresión: Bajo

---

### [PROD-009] `ProductoFormValues` usa `[key: string]: unknown` como índice lo que rompe el tipado

#### Severidad: Media
#### Categoría: Tipado TypeScript

#### Descripción

La interfaz `ProductoFormValues` en `Productos.tsx` declara `[key: string]: unknown` como índice de firma, lo que hace que TypeScript no pueda verificar los tipos de las propiedades nombradas. Esto provoca que accesos como `formData.tipo` retornen `unknown` y requieran casts explícitos en múltiples lugares.

#### Evidencia

```ts
// Productos.tsx – líneas 113-134
interface ProductoFormValues {
  [key: string]: unknown;   // ← índice de firma que anula type-safety
  id?: string;
  nombre?: string;
  // ...
}
```

En `handleSaveProduct`:
```ts
const payload = await buildProductoPayload(
  formData as Record<string, unknown>  // ← cast necesario por el índice
);
```

Y más abajo:
```ts
productCategory: (formData as { tipo?: CategoriaProducto }).tipo, // ← cast redundante
```

#### Impacto

- Pérdida de inferencia de tipos en toda la función `handleSaveProduct`.
- Bugs silenciosos si se añaden propiedades con nombres conflictivos.

#### Solución recomendada

Eliminar el índice de firma o separar la interfaz en dos: una tipada para los campos conocidos y otra para los extras del formulario dinámico.

#### Prioridad: Media
#### Riesgo de regresión: Bajo

---

### [PROD-010] PMP mostrado con `.toFixed(2)` directamente sobre `number | undefined` sin guardia

#### Severidad: Baja
#### Categoría: Robustez / Crashes

#### Descripción

En `ProductCard.tsx` y en la vista de detalle de `Productos.tsx`, el PMP se accede como `(producto.pmp ?? 0).toFixed(2)`. En `ProductCard.tsx` esto es correcto. Pero en el modal de detalle:

```tsx
// Productos.tsx – línea 1042
{(p.pmp ?? 0).toFixed(2)} €
```

Y en la comparación de proveedores (línea 1245):
```tsx
{precioUnitario.toFixed(2)} €
```

Aquí `precioUnitario` proviene de `comparison?.precioUnitario ?? pv.precioUnitario` que es `number | undefined`. Si ambos son `undefined`, el operador `??` devuelve el segundo operando (`undefined`), y `.toFixed(2)` sobre `undefined` lanza `TypeError`.

#### Evidencia

```tsx
// Productos.tsx – líneas 1129-1130
const precioUnitario =
  comparison?.precioUnitario ?? pv.precioUnitario;
// ...
{precioUnitario.toFixed(2)} €  // ← si precioUnitario es undefined → crash
```

La condición `{precioUnitario != null && ( ... )}` en la línea 1229 protege el render, pero TypeScript no puede garantizar esto en tiempo de compilación porque el tipado de `ComparacionProveedorItem` tiene `precioUnitario: number` (no-optional), mientras que `ProductoProveedor` tiene `precioUnitario?: number`.

#### Impacto

Crash en runtime si se abre el detalle de un producto con un proveedor sin precio definido (posible en importaciones o datos legados).

#### Solución recomendada

```tsx
{precioUnitario != null ? `${precioUnitario.toFixed(2)} €` : '—'}
```

#### Prioridad: Baja
#### Riesgo de regresión: Bajo

---

### [PROD-011] `pruneProductosCache` usa FIFO sin respetar TTL: elimina entradas válidas

#### Severidad: Baja
#### Categoría: Performance / Cache

#### Descripción

La función `pruneProductosCache` elimina el primer entry del Map cuando se supera `PRODUCTOS_CACHE_MAX_ENTRIES = 120`. Sin embargo, el `Map` en JS mantiene orden de inserción, no de acceso. Por tanto, una entrada muy frecuentemente accedida pero insertada antes puede ser eliminada antes que una entrada nueva pero poco usada. Esto hace que la caché sea FIFO en vez de LRU, lo que es subóptimo para el patrón de acceso de esta aplicación.

#### Evidencia

```ts
// producto.service.ts – líneas 85-93
function pruneProductosCache<T>(cache: Map<string, T>): void {
  while (cache.size > PRODUCTOS_CACHE_MAX_ENTRIES) {
    const oldestEntry = cache.keys().next();
    if (oldestEntry.done) { break; }
    cache.delete(oldestEntry.value);  // ← FIFO, no LRU
  }
}
```

#### Impacto

Con 120 entradas y acceso frecuente a los primeros queries (página 1), esas entradas serán las primeras en ser eliminadas cuando se alcance el límite. Impacto menor en rendimiento real, pero puede causar refetches innecesarios en la lista principal.

#### Solución recomendada

Usar un patrón LRU simple: al acceder a una entrada, eliminarla y reinsertarla al final del Map (dado que Map mantiene orden de inserción).

#### Prioridad: Baja
#### Riesgo de regresión: Bajo

---

### [PROD-012] `buildEditData` en `Productos.tsx` mezcla tipos de alergenos sin garantía

#### Severidad: Media
#### Categoría: Tipado / Robustez

#### Descripción

La función `buildEditData` convierte los alergenos del producto usando una guardia de tipo:

```ts
editData.alergenos = row.alergenos.map((alergeno) =>
  typeof alergeno === 'string'
    ? alergeno
    : (alergeno as ProductoAlergeno).alergeno || ''
);
```

El problema es que `ProductoAlergeno.alergeno` es de tipo `string` (no `BackendAlergeno`), por lo que valores inválidos pasarían sin ser rechazados. Además, el filtrado posterior en `buildProductoPayload` usa `normalizeAlergeno` que devuelve `undefined` para valores inválidos, lo que silenciosamente descartaría alergenos con valores no reconocidos sin informar al usuario.

#### Evidencia

```ts
// producto.types.ts – líneas 89-92
export interface ProductoAlergeno {
  productoId: string;
  alergeno: string;  // ← debería ser BackendAlergeno
}
```

Si el backend devuelve un alérgeno no reconocido (p. ej. de una migración de datos), el frontend lo descarta silenciosamente sin notificar al usuario.

#### Impacto

Pérdida silenciosa de datos de alergenos al editar productos con datos legados o migrados.

#### Solución recomendada

Cambiar el tipo de `ProductoAlergeno.alergeno` a `BackendAlergeno` y agregar un warning en `buildEditData` cuando se descarten alergenos no reconocidos.

#### Prioridad: Media
#### Riesgo de regresión: Bajo

---

### [PROD-013] Filtro de historial de precios: estados no sincronizados al cambiar de producto

#### Severidad: Media
#### Categoría: Gestión de Estado / UX

#### Descripción

En `Productos.tsx`, `historyProviderFilter` se resetea a `'all'` en `handleViewClick` al abrir un nuevo producto. Sin embargo, si el usuario cierra el modal de detalle sin navegación explícita (pulsa ESC o el botón X), `historyProviderFilter` permanece en el último valor usado. Al abrir el siguiente producto, el `useEffect` que carga el historial ejecuta con el valor anterior de `historyProviderFilter` antes de que `handleViewClick` lo resetee, porque `setHistoryProviderFilter('all')` es asíncrono y el useEffect puede dispararse antes del re-render que aplica ese reset.

#### Evidencia

```ts
// Productos.tsx – líneas 543-546
const handleViewClick = (row: Producto) => {
  setProductToView(row);
  setHistoryProviderFilter('all');  // ← setState, asíncrono
};

// Líneas 559-581 – useEffect depende de ambos
useEffect(() => {
  if (productToView) {
    const loadHistory = async () => {
      const providerId =
        historyProviderFilter === 'all' ? undefined : historyProviderFilter;
      // ← puede ejecutar con historyProviderFilter del producto anterior
```

#### Impacto

Al abrir el detalle de un producto diferente, el historial puede cargarse inicialmente filtrado por el proveedor del producto anterior (si ese ID existe en el nuevo producto), mostrando historial incorrecto brevemente.

#### Solución recomendada

Resetear `historyProviderFilter` usando `useEffect` que depende de `productToView`:

```ts
useEffect(() => {
  if (productToView) {
    setHistoryProviderFilter('all');
  }
}, [productToView?.id]); // ← solo en cambio de producto
```

Y reorganizar los efectos para que este reset se aplique antes de la carga.

#### Prioridad: Media
#### Riesgo de regresión: Bajo

---

### [PROD-014] `Proveedores.tsx` no tiene protección ante `loadData` race condition

#### Severidad: Alta
#### Categoría: Race Condition

#### Descripción

A diferencia de `Productos.tsx` que implementa el patrón `loadDataRequestIdRef` para cancelar respuestas obsoletas, `Proveedores.tsx` no tiene ninguna protección similar. Si el usuario cambia el `searchTerm` o `includeDeleted` rápidamente, múltiples llamadas a `loadData` pueden estar en vuelo simultáneamente, y la respuesta más lenta (no necesariamente la última) puede sobrescribir los datos de la respuesta más reciente.

#### Evidencia

```ts
// Proveedores.tsx – líneas 85-108
const loadData = useCallback(async () => {
  setIsLoading(true);
  setError(null);
  try {
    const proveedoresData = await fetchProveedores(/* ... */);
    setData(proveedoresData.data);  // ← sin comprobación de si sigue vigente
    syncPaginationFromResponse(proveedoresData);
  } catch (err: unknown) { /* ... */ }
  finally { setIsLoading(false); }
}, [queryParams, includeDeleted, syncPaginationFromResponse, t]);
```

#### Impacto

Si el usuario activa "Mostrar Eliminados" y vuelve a desactivarlo rápidamente, los datos mostrados pueden ser los eliminados (respuesta lenta) en lugar de los activos (respuesta rápida).

#### Solución recomendada

Implementar el mismo patrón de `loadDataRequestIdRef` que existe en `Productos.tsx`:

```ts
const loadDataRequestIdRef = useRef(0);

const loadData = useCallback(async () => {
  const requestId = ++loadDataRequestIdRef.current;
  setIsLoading(true);
  try {
    const data = await fetchProveedores(/* ... */);
    if (requestId !== loadDataRequestIdRef.current) return;
    setData(data.data);
    // ...
  } finally {
    if (requestId === loadDataRequestIdRef.current) {
      setIsLoading(false);
    }
  }
}, [/* deps */]);
```

#### Prioridad: Alta
#### Riesgo de regresión: Bajo

---

### [PROD-015] `resolveStoredFileUrl` retorna `string` vacío para null/undefined en lugar de `string | null`

#### Severidad: Baja
#### Categoría: Tipado / API Contract

#### Descripción

`resolveStoredFileUrl` en `api.service.ts` devuelve `''` cuando `filePath` es `null` o `undefined`. En `ProductCard.tsx` y en el modal de detalle, se usa `imageUrl` como condición de verdad:

```tsx
const imageUrl = resolveStoredFileUrl(producto.pathImg);
// ...
{imageUrl ? ( <img src={imageUrl} ... /> ) : ( placeholder )}
```

Esto funciona correctamente porque `''` es falsy. Sin embargo, cuando `imageUrl = ''` y se pasa como `src` a `<img>`, algunos navegadores interpretan una URL vacía como una petición al documento actual, causando una petición HTTP innecesaria antes de que la condición `imageUrl ?` lo filtre.

En `Productos.tsx`, línea 1623:
```tsx
src={zoomedImage ?? undefined}
```

`zoomedImage` es `string | null`, así que `?? undefined` convierte `null` a `undefined` pero una cadena vacía `''` pasaría como `src=""`.

#### Impacto

Menor en la mayoría de browsers modernos, pero puede generar peticiones HTTP espúreas en algunos contextos de renderizado.

#### Solución recomendada

Cambiar la firma a `string | null` y adaptar las comprobaciones, o usar `||` en lugar de `??` para las URLs.

#### Prioridad: Baja
#### Riesgo de regresión: Bajo

---

### [PROD-016] `handleSave` en `Proveedores.tsx` hace cast inseguro con `as string` en todos los campos del formulario

#### Severidad: Media
#### Categoría: Tipado TypeScript

#### Descripción

La función `handleSave` construye el payload del proveedor usando casts `as string` directos en todos los campos:

```ts
const payload: CreateProveedorPayload = {
  nombre: formData.nombre as string,
  contacto: formData.contacto as string,
  // ...
};
```

Si cualquier campo tiene un tipo diferente (por ejemplo, si el formulario dinámico devuelve `null` en lugar de `undefined` para campos vacíos, o un número en un campo de texto), el cast silencia el error. La función `sanitizeProveedorPayload` en `proveedor.service.ts` hace una normalización posterior, pero el `createProveedor` recibirá un payload mal tipado que solo es corregido internamente.

El mismo patrón existe en `QuickProveedorModal.tsx` (líneas 77-84).

#### Evidencia

```ts
// Proveedores.tsx – líneas 177-184
const payload: CreateProveedorPayload = {
  nombre: formData.nombre as string,    // ← cast inseguro
  contacto: formData.contacto as string,
  telefono: formData.telefono as string,
  email: formData.email as string,
  direccion: formData.direccion as string,
  nif: formData.nif as string,
};
```

#### Impacto

Si el modal dinámico devuelve un tipo inesperado, el error llega silenciosamente al backend.

#### Solución recomendada

Usar type guards o funciones de extracción tipadas:

```ts
const nombre = typeof formData.nombre === 'string' ? formData.nombre.trim() : '';
```

O reutilizar la utilidad `toOptionalTrimmedString` que ya existe en `api.utils.ts`.

#### Prioridad: Media
#### Riesgo de regresión: Bajo

---

## Inconsistencias Frontend/Backend

### 1. Campo `marcaEspecifica` vs `marca` en `ProductoProveedorPayload`

El payload enviado al backend usa `marcaEspecifica` (línea 64 de `productoForm.helpers.ts`) pero el tipo `ProductoProveedor` en el frontend tiene `marca?: string`. El backend espera `marcaEspecifica` para crear/actualizar, pero devuelve `marca` en las respuestas. Esta asimetría está gestionada (el campo `marca` es solo para lectura), pero no está documentada explícitamente.

### 2. Tipo `ProductoAlergeno.alergeno` debería ser `BackendAlergeno`

El tipo `ProductoAlergeno` define `alergeno: string` pero debería ser `BackendAlergeno` para mantener el contrato con el backend. Actualmente la aplicación acepta cualquier string de alergeno devuelto por el backend sin validación tipada.

### 3. `ProductoProveedor.proveedorId` es opcional en el frontend pero requerido en el backend

```ts
// producto.types.ts – línea 97
proveedorId?: string;  // ← opcional
```

El backend siempre devuelve `proveedorId` en la relación. Hacerlo opcional fuerza defensivas innecesarias como `resolveProveedorId` en `Productos.tsx`.

### 4. `HistorialPrecio.productoProveedor` llega completamente hydrated desde el backend pero `precio` llega como `number` (no `string`)

En `Productos.tsx` línea 1535: `{Number(h.precio).toFixed(2)} €` — el `Number()` wrapper sugiere que en algún momento `h.precio` puede ser string (p. ej. desde TypeORM `ColumnNumericTransformer`). La definición del tipo dice `precio: number` pero la coerción explícita con `Number()` implica que el backend puede devolver strings para campos `numeric`. Esto indica que el tipo frontend y el tipo real de la respuesta no coinciden.

### 5. `Proveedor` del servicio de restoreProveedor usa `POST` pero el estándar del proyecto es `PATCH`

```ts
// proveedor.service.ts – línea 138
const response = await baseFetch(`/proveedor/${id}/restore`, {
  method: 'POST',  // ← POST
});
```

`restoreProducto` en `producto.service.ts` usa `PATCH`. Inconsistencia en el verbo HTTP para la misma semántica.

---

## Riesgos Potenciales Futuros

### 1. Escalabilidad de la caché de productos

Con `PRODUCTOS_CACHE_MAX_ENTRIES = 120` entradas y `PRODUCTOS_CACHE_TTL_MS = 15000ms`, la caché puede generar hasta 120 promesas pendientes en memoria simultáneamente. Si el TTL se mantiene bajo (15s) pero el volumen de queries únicos es alto (muchas combinaciones de filtros), la caché puede ser ineficaz y la memoria puede crecer. Considerar una estrategia de caché más sofisticada o React Query/SWR.

### 2. `fetchAllProductos` sin control de abort

`fetchAllProductos` lanza hasta 20 páginas en paralelo pero no tiene AbortController. Si el componente que llama a esta función se desmonta mientras las peticiones están en vuelo, las promesas seguirán ejecutando y podrían actualizar estado de un componente ya desmontado.

### 3. `BarcodeScanner` crea un `AudioContext` por beep

```ts
// BarcodeScanner.tsx – líneas 299-314
const playBeep = () => {
  const ctx = new AudioContext();
  // ...
  setTimeout(() => ctx.close(), 500);
};
```

Si el escaneo continuo está activo y se detectan múltiples códigos en rápida sucesión, se crean múltiples `AudioContext` antes de que los anteriores se cierren. Los navegadores tienen un límite de AudioContexts concurrentes (~6 en Chrome). El `setTimeout` de 500ms puede causar acumulación si el delay entre beeps es menor.

### 4. Filtros no persistidos en URL

Ni los filtros de categoría/alérgenos de `ProductFilters` ni el `searchTerm` se sincronizan con la URL del navegador. Si el usuario recarga la página o comparte la URL, los filtros se pierden. Para un módulo de inventario con flujos de trabajo recurrentes, esto supone fricción de UX.

### 5. `proveedorSchema` en `Proveedores.tsx` tiene `nif` como `required: true`

El campo NIF en `proveedorSchema` está marcado como requerido en el formulario pero no lo es en el tipo `Proveedor` ni en el DTO del backend. Esto puede causar fricción al registrar proveedores informales o extranjeros sin NIF.

---

## Deuda Técnica

| Ref. | Deuda | Esfuerzo estimado | Impacto |
|------|-------|-------------------|---------|
| TD-01 | `ProductoFormValues` con `[key: string]: unknown` — refactorizar a type-safe | 2h | Medio |
| TD-02 | Mensajes de error de `buildProductoPayload` sin i18n — externalizar a `t()` | 1h | Bajo |
| TD-03 | `AllergenSelector` sin ARIA — añadir roles, tabIndex y handlers de teclado | 2h | Alto (a11y) |
| TD-04 | `loadProveedores` secuencial — paralelizar como `fetchAllProductos` | 1h | Medio |
| TD-05 | `handleSave` de Proveedores con casts `as string` — usar `toOptionalTrimmedString` | 1h | Bajo |
| TD-06 | Gráfico de evolución de precios (placeholder con comentario en código) | 4-8h | Medio UX |
| TD-07 | Persistencia de filtros en URL con `useSearchParams` | 3h | Medio UX |
| TD-08 | Export individual de proveedor por `searchTerm` — reemplazar por ID | 2h | Crítico |
| TD-09 | `pruneProductosCache` FIFO → LRU | 1h | Bajo |
| TD-10 | Race condition de `loadData` en Proveedores — añadir `requestIdRef` | 1h | Alto |

**Deuda total estimada: ~18-24 horas de desarrollo**

---

## Conclusión

El módulo de Productos es sustancialmente más maduro que el de Proveedores: tiene protección anti-race-condition, gestión de estados bien pensada, y una integración compleja con OpenFoodFacts y el escáner de código de barras que funciona correctamente en los caminos felices. La caché de productos es una solución artesanal sólida, aunque con algunos detalles a pulir.

El módulo de Proveedores, en contraste, es más simple pero tiene el bug más crítico del análisis completo: el export individual de PDF es funcionalmente incorrecto y podría exponer datos de múltiples proveedores. Además, le falta el patrón de protección anti-race-condition que sí tiene Productos.

Las dos áreas de mayor riesgo transversal son: (1) la accesibilidad del `AllergenSelector`, que viola criterios WCAG básicos afectando a usuarios con diversidad funcional; y (2) la posibilidad de doble submit en el formulario de producto cuando el upload de imagen es lento.

Ninguno de los problemas identificados requiere un rediseño arquitectural significativo. Todos son correcciones concretas y localizadas que pueden abordarse en 2-3 sprints de baja fricción.
