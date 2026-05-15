# Auditoría Técnica: Recetas, Preparaciones y Distribución

> **Fecha:** 2026-05-14  
> **Auditor:** Staff Engineer — React 19 / TypeScript / Arquitectura Frontend  
> **Stack:** React 19 · Vite 6 · MUI 7 · React Router 7 · i18next · Context API  
> **Cobertura:** 14 archivos analizados en profundidad

---

## Resumen Ejecutivo

Los módulos de **Recetas**, **Preparaciones** y **Distribución** presentan una arquitectura sólida en líneas generales: gestión de race conditions con refs, debounce en validaciones de stock, idempotency keys en operaciones críticas y una capa de servicio centralizada (`api.service.ts`) con CSRF, retry lógico y contrato de IDs. Sin embargo, se han identificado **4 hallazgos críticos** y **7 altos** que afectan directamente a la fiabilidad en producción.

Los puntos de mayor riesgo son:

1. El **campo `mermaAplicada` no es editable** desde `RecetaIngredientesSelector` —la columna simplemente no existe en el formulario—, lo que invalida silenciosamente toda la lógica de merma por ingrediente.
2. El **`RecipeCarousel` muestra datos de muestra hardcoded** sin relación alguna con las recetas reales del sistema.
3. El flujo de **cancelación de distribución usa `window.prompt()`**, con la consecuencia de que pulsar "Cancelar" en el prompt *confirma igualmente la cancelación*.
4. Los **índices numéricos como keys de React** en `RecetaIngredientesSelector` corrompen el estado de búsqueda al eliminar un ingrediente intermedio.

---

## Métricas

| Dimensión | Calificación |
|---|---|
| Formularios complejos (RecetaFormModal) | ★★★★☆ |
| Lógica de dominio (helpers, utils) | ★★★★☆ |
| Validaciones de negocio | ★★★☆☆ |
| Manejo de errores | ★★★☆☆ |
| Performance / race conditions | ★★★★☆ |
| Accesibilidad | ★★☆☆☆ |
| Tipado TypeScript | ★★★☆☆ |
| Consistencia frontend/backend | ★★★☆☆ |

---

## Hallazgos

---

### [REC-001] Campo `mermaAplicada` inaccesible en el selector de ingredientes

#### Severidad: **Crítica**
#### Categoría: Formulario / Lógica de Dominio
#### Descripción
`RecetaIngredientesSelector` define el tipo `UI_RecetaIngrediente` con `mermaAplicada?: number`, la lógica de coste en `RecetaFormModal` incluye `mermaAplicada` en el payload de preview, y `normalizeIngredients` en `recetaForm.helpers.ts` la valida y envía al backend. Sin embargo, la tabla del selector no tiene ninguna columna ni input para que el usuario asigne la merma por ingrediente.

#### Riesgo real
Los cálculos de coste unitario y los descuentos de inventario durante la producción asumen la merma configurada. Como el campo nunca se puede editar, todas las recetas creadas o editadas desde la UI tienen `mermaAplicada = 0` por defecto. Esto subestima el consumo real de materias primas y produce costes irreales.

#### Evidencia
```typescript
// RecetaIngredientesSelector.tsx — columnas de la tabla (líneas 579-600)
<TableCell sx={{ fontWeight: 'bold', width: '44%' }}>Producto</TableCell>
<TableCell sx={{ fontWeight: 'bold', width: '10%' }}>Cantidad</TableCell>
<TableCell sx={{ fontWeight: 'bold', width: '10%' }}>Unidad</TableCell>
<TableCell sx={{ fontWeight: 'bold', width: '30%' }}>Proveedor</TableCell>
<TableCell sx={{ width: '6%' }}></TableCell>
// ⚠️ No existe columna "Merma aplicada (%)"
```

```typescript
// normalizeIngredients en recetaForm.helpers.ts (líneas 129-138)
const mermaAplicada = Number(ingredient.mermaAplicada ?? 0);
if (!Number.isFinite(mermaAplicada) || mermaAplicada < 0 || mermaAplicada > 99) {
  throw new Error(`La merma del ingrediente ${index + 1} debe estar entre 0 y 99.`);
}
// Siempre será 0 porque nunca se permite editar
```

#### Impacto
Todos los cálculos de coste de producción y los consumos de inventario son incorrectos para ingredientes con merma real > 0%.

#### Solución recomendada
Añadir una columna `mermaAplicada` (%) al `TableHead` y un `NumericInput` en cada fila del `TableBody`. Validar en el componente que el valor esté en `[0, 99]`. Configurar `min=0`, `max=99`, `step=1`.

#### Prioridad: **Inmediata**
#### Riesgo de regresión: **Bajo** (sólo añade una columna nueva)

---

### [REC-002] `RecipeCarousel` muestra datos de muestra hardcoded irreales

#### Severidad: **Crítica**
#### Categoría: Funcionalidad / Datos
#### Descripción
El componente `RecipeCarousel` no carga recetas reales del backend. Contiene un array `ITEMS` estático con tres recetas inventadas (*Handmade Marble Chicken*, *Fresh Mediterranean Pasta*, *Quinoa & Avocado Power Bowl*) que se muestran en la cabecera de la página de gestión de recetas.

#### Riesgo real
En un entorno de producción escolar (CPT de hostelería), los usuarios ven recetas ficticias en inglés sobre el listado real. Confunde al personal sobre qué recetas están "destacadas" y puede generar preguntas de soporte. La credibilidad de la aplicación queda afectada.

#### Evidencia
```typescript
// RecipeCarousel.tsx — líneas 45-76
const ITEMS: CarouselItem[] = [
  {
    id: '1',
    title: 'Handmade Marble Chicken',      // ← dato inventado
    description: 'Una pechuga de pollo...',
    image: '/assets/images/recetas/chicken.png',
    time: '45 min',
    difficulty: 'Media',
    category: 'Gourmet',
  },
  // ...
];
```

El componente tampoco usa `useTranslation()`, con lo que los textos no son i18n.

#### Impacto
UX degradada en producción; contenido no representativo del catálogo real.

#### Solución recomendada
Reemplazar `ITEMS` por un `useEffect` que llame a `fetchRecetas(1, 3)` con las últimas recetas añadidas o las más usadas. Mostrar `Skeleton` durante la carga. Si no hay recetas disponibles, ocultar el carousel. Añadir `useTranslation` para los textos estáticos.

#### Prioridad: **Inmediata**
#### Riesgo de regresión: **Bajo**

---

### [REC-003] `window.prompt()` en cancelación de distribución: confirmar "Cancel" cancela igualmente

#### Severidad: **Crítica**
#### Categoría: UX / Lógica de Negocio
#### Descripción
`handleCancel` en `Distribucion.tsx` usa `window.prompt()` para capturar el motivo de cancelación. `window.prompt()` devuelve `null` cuando el usuario pulsa el botón "Cancelar" (dismiss). La expresión `null || undefined` produce `undefined`, de modo que la cancelación se ejecuta igualmente con `motivoCancelacion: undefined`, ignorando la intención del usuario de abortar la operación.

#### Riesgo real
Un operario que pulsa "Cancelar" en el diálogo nativo del navegador pensando que está abortando la acción, en realidad confirma la cancelación de la entrega. Esta es una acción irreversible.

#### Evidencia
```typescript
// Distribucion.tsx — líneas 527-544
const handleCancel = async (id: string) => {
  const motivo =
    window.prompt(t('distribucion.motivoCancelacion')) || undefined;
  // ⚠️ window.prompt retorna null si el usuario cancela → null || undefined = undefined
  // La cancelación continúa igualmente
  try {
    await cancelDistribucion(id, motivo);
    toast.success(t('distribucion.toast.distribucionCancelada'));
    // ...
  }
};
```

Además, `window.prompt()` bloquea el hilo principal, es incompatible con el diseño visual del sistema (MUI), y en muchos navegadores móviles está desactivado.

#### Impacto
Cancelaciones de distribución no deseadas; pérdida de trazabilidad del motivo de cancelación.

#### Solución recomendada
Sustituir `window.prompt()` por un `Dialog` MUI con un `TextField` para el motivo, un botón "Confirmar cancelación" (rojo) y un botón "Abortar" que cierre el dialog sin ejecutar ninguna acción.

#### Prioridad: **Inmediata**
#### Riesgo de regresión: **Medio** (refactor del flujo de cancelación)

---

### [REC-004] Index numérico como key de React en `RecetaIngredientesSelector` corrompe el estado al eliminar ingredientes

#### Severidad: **Crítica**
#### Categoría: React / Estado
#### Descripción
Las filas del selector de ingredientes usan `key={`ing-row-${index}`}`. Todo el estado de búsqueda por línea (`searchResultsByLine`, `isSearchingByLine`, timers, requestIds) está indexado por posición. Al eliminar un ingrediente de una posición intermedia, los índices de los elementos posteriores cambian pero el estado no se reindexea correctamente.

#### Riesgo real
Escenario: receta con 3 ingredientes [A, B, C]. Se busca en B (index 1) → resultados en cache en index 1. Se elimina A (index 0) → B pasa a index 0, C a index 1. El cache de búsqueda de B (ahora en index 0) muestra los resultados que pertenecen al antiguo index 1, y C muestra los resultados de B. El usuario puede seleccionar un producto incorrecto sin darse cuenta.

#### Evidencia
```typescript
// RecetaIngredientesSelector.tsx — línea 648
<TableRow key={`ing-row-${index}`}>  // ← índice como key

// handleRemoveLine (líneas 301-321)
const handleRemoveLine = (index: number) => {
  const newLines = value.filter((_, i) => i !== index);
  onChange(newLines);
  // Se elimina el estado en index, pero los estados de index+1, index+2... 
  // mantienen sus valores con indices incorrectos
  delete searchDebounceTimersRef.current[index];
  delete searchRequestIdRef.current[index];
  setSearchResultsByLine((prev) => {
    const next = { ...prev };
    delete next[index];  // ⚠️ Solo borra el índice eliminado, no reindexea los siguientes
    return next;
  });
};
```

#### Impacto
Posible selección de producto incorrecto en ingredientes con búsquedas activas previas; comportamiento confuso para el usuario.

#### Solución recomendada
1. Usar IDs estables como keys: añadir un campo `_uid = crypto.randomUUID()` al crear una línea nueva.
2. Cambiar los mapas de estado por línea (searchResultsByLine, etc.) de `Record<number, T>` a `Record<string, T>` usando el `_uid`.
3. En `handleRemoveLine`, eliminar por `_uid` en lugar de por índice.

#### Prioridad: **Inmediata**
#### Riesgo de regresión: **Medio** (afecta el patrón de indexación en todo el componente)

---

### [REC-005] Filename del PDF de exportación de recetas contiene coma inválida

#### Severidad: **Alta**
#### Categoría: Bug / Exportación
#### Descripción
`exportRecipesPdf` en `receta.service.ts` construye el filename del PDF usando `new Date().toISOString().split('T')`. Esto devuelve un array `['2026-05-14', '12:42:00.000Z']`. La interpolación en template string convierte el array a string usando `.toString()`, produciendo `'2026-05-14,12:42:00.000Z'`. El nombre de archivo resultante contiene una coma y puntos suspensivos.

#### Riesgo real
El archivo se descarga con el nombre `SmartEconomat_Recetas_2026-05-14,12:42:00.000Z.pdf`. En Windows, las comas en nombres de archivo son problemáticas; en algunos sistemas de archivos el archivo queda con extensión `.000Z.pdf`. En macOS la coma es válida pero el formato es confuso.

#### Evidencia
```typescript
// receta.service.ts — líneas 221-224
await DownloadService.downloadFile(
  `/recetas/export/pdf?${query.toString()}`,
  {
    filename: `SmartEconomat_Recetas_${new Date().toISOString().split('T')}.pdf`,
    //                                                           ^^^^^^^^^^^^^^^^
    // .split('T') devuelve ['2026-05-14', '12:42:00.000Z']
    // template literal → 'SmartEconomat_Recetas_2026-05-14,12:42:00.000Z.pdf'
  }
);
```

#### Solución recomendada
```typescript
filename: `SmartEconomat_Recetas_${new Date().toISOString().split('T')[0]}.pdf`,
```

#### Prioridad: **Alta**
#### Riesgo de regresión: **Ninguno**

---

### [REC-006] Funciones `getFirstUserUbicacionId` y `getFirstAvailableDestinationId` son idénticas (código muerto duplicado)

#### Severidad: **Alta**
#### Categoría: Mantenibilidad / Código Muerto
#### Descripción
`Distribucion.tsx` define dos funciones `useCallback` con exactamente el mismo cuerpo que hacen exactamente lo mismo.

#### Evidencia
```typescript
// Distribucion.tsx — líneas 276-293
const getFirstUserUbicacionId = useCallback(() => {
  const ownIds = new Set(preferredUbicacionIds);
  return (
    ubicaciones.find(u => ownIds.has(u.id) && u.id !== originId)?.id || ''
  );
}, [originId, preferredUbicacionIds, ubicaciones]);

const getFirstAvailableDestinationId = useCallback(() => {
  const ownIds = new Set(preferredUbicacionIds);
  return (
    ubicaciones.find(u => ownIds.has(u.id) && u.id !== originId)?.id || ''
  );
}, [originId, preferredUbicacionIds, ubicaciones]);
// ⚠️ Cuerpo y dependencias 100% idénticos
```

#### Impacto
El nombre `getFirstAvailableDestinationId` sugiere que tiene semántica diferente (cualquier ubicación disponible, no sólo las del usuario), pero hace exactamente lo mismo que `getFirstUserUbicacionId`. Cualquier desarrollador que intente diferenciarlas producirá bugs.

#### Solución recomendada
Eliminar `getFirstAvailableDestinationId` y usar sólo `getFirstUserUbicacionId` en todos los call sites. Renombrar a `getPreferredDestinationId` para claridad.

#### Prioridad: **Alta**
#### Riesgo de regresión: **Bajo**

---

### [REC-007] Sin paginación ni debounce en búsqueda de distribuciones disponibles

#### Severidad: **Alta**
#### Categoría: Performance / UX
#### Descripción
El tab "Disponibles" de `Distribucion.tsx` tiene dos problemas relacionados:

1. **Límite duro de 50**: `fetchDistribucionesDisponibles({ searchTerm, limit: 50 })` — si hay más de 50 pedidos pendientes de distribución, simplemente no se muestran.
2. **Sin debounce en búsqueda**: `setSearchTerm` se pasa directamente como `onSearchChange`. Cada pulsación de tecla actualiza `searchTerm` → recrea `loadDisponibles` → recrea `loadData` → dispara el `useEffect` → llama a la API.

#### Evidencia
```typescript
// Distribucion.tsx — líneas 226-232
const loadDisponibles = useCallback(async () => {
  const data = await fetchDistribucionesDisponibles({
    searchTerm,
    limit: 50,  // ⚠️ límite duro, sin paginación
  });
  setDisponibles(data);
}, [searchTerm]);  // ⚠️ recrea en cada pulsación → loadData recrea → useEffect dispara

// línea 999-1001
onSearchChange={setSearchTerm}  // ⚠️ sin debounce
```

#### Impacto
En entornos con muchos pedidos activos (apertura de curso, semanas de alta demanda), los distribuidores no pueden ver todos los pedidos pendientes. Además, cada carácter tecleado lanza una petición HTTP.

#### Solución recomendada
1. Usar `useDataTable` hook (ya disponible en el proyecto) que incorpora debounce de búsqueda.
2. Añadir paginación al tab disponibles o incrementar el límite con paginación cursor-based.

#### Prioridad: **Alta**
#### Riesgo de regresión: **Medio**

---

### [REC-008] `loadUserUbicaciones` sin gestión de errores

#### Severidad: **Alta**
#### Categoría: Robustez / Error Handling
#### Descripción
La función `loadUserUbicaciones` en `Distribucion.tsx` no tiene bloque `try/catch`. Si `/usuarios/perfil` falla (503, timeout, CORS), la excepción se propaga a `loadData` donde es capturada con un mensaje genérico. Pero `setUserUbicacionIds([])` no se ejecuta, dejando el estado en su valor previo (posiblemente de una sesión anterior).

#### Evidencia
```typescript
// Distribucion.tsx — líneas 190-212
const loadUserUbicaciones = useCallback(async () => {
  if (!user?.id) {
    setUserUbicacionIds([]);
    return;
  }
  // ⚠️ Sin try/catch
  const profileResponse = await baseFetch('/usuarios/perfil');
  const profileResult = await parseApiResponse<PerfilDistribucion>(
    profileResponse,
    t('distribucion.toast.errorDetalle')
  );
  const profileUbicacionIds = collectUbicacionIdsFromPerfil(profileResult.data);
  // ...
}, [t, user?.id]);
```

#### Solución recomendada
```typescript
const loadUserUbicaciones = useCallback(async () => {
  if (!user?.id) { setUserUbicacionIds([]); return; }
  try {
    const profileResponse = await baseFetch('/usuarios/perfil');
    // ...
  } catch {
    setUserUbicacionIds([]);  // fallback seguro
  }
}, [t, user?.id]);
```

#### Prioridad: **Alta**
#### Riesgo de regresión: **Ninguno**

---

### [REC-009] Nombre de ubicación "Almacén Principal" hardcodeado

#### Severidad: **Alta**
#### Categoría: Fragilidad / Configuración
#### Descripción
La lógica de selección de ubicación de origen por defecto en `Distribucion.tsx` busca una ubicación por nombre literal.

#### Evidencia
```typescript
// Distribucion.tsx — líneas 218-221
const ubicacionPrincipal = data.find(
  (u) => u.nombre === 'Almacén Principal'  // ⚠️ string literal hardcoded
);
setOriginId(current => current || ubicacionPrincipal?.id || data[0]?.id || '');
```

#### Riesgo real
Si el almacén se renombra en la base de datos, el selector siempre defaultea a `data[0]` (primera ubicación alfabética o de inserción), que podría ser una aula o una ubicación inadecuada como origen. No hay ningún error visible.

#### Solución recomendada
Añadir un campo `esPrincipal: boolean` a la entidad `Ubicacion` (o `tipo: 'almacen' | 'aula' | 'otro'`) y filtrar por ese campo. Alternativamente, añadir la lógica de defaulting de la ubicación al backend (endpoint perfil de distribución).

#### Prioridad: **Alta**
#### Riesgo de regresión: **Bajo** (requiere migración de BD menor)

---

### [REC-010] `RecipeCarousel` no cumple WCAG 2.1 SC 2.2.2 (auto-play sin pausa)

#### Severidad: **Media**
#### Categoría: Accesibilidad
#### Descripción
El carousel rota automáticamente cada 5 segundos sin mecanismo de pausa visible. WCAG 2.1 SC 2.2.2 "Pause, Stop, Hide" exige que el contenido que se mueve, parpadea o se desplaza automáticamente disponga de un control para pausarlo. Adicionalmente:

- Los botones de navegación `<IconButton>` carecen de `aria-label`.
- Los indicadores de posición (puntos) no tienen `role`, `aria-label`, ni `tabIndex`.
- No existe `role="region" aria-roledescription="carousel"` en el contenedor.
- No hay `aria-live` region para anunciar el cambio de slide.

#### Evidencia
```typescript
// RecipeCarousel.tsx — líneas 92-97
useEffect(() => {
  const timer = setInterval(() => {
    setActiveIndex((prev) => (prev === ITEMS.length - 1 ? 0 : prev + 1));
  }, 5000);  // ⚠️ autoplay sin pausa posible
  return () => clearInterval(timer);
}, []);

// líneas 205-223
<IconButton onClick={(e) => { e.stopPropagation(); prevSlide(); }}
  // ⚠️ Sin aria-label
>
```

#### Solución recomendada
Añadir un botón "Pause/Play" visible. Añadir `aria-label` a los controles de navegación. Pausar el timer `onMouseEnter`/`onFocus` y reanudar `onMouseLeave`/`onBlur`.

#### Prioridad: **Media**
#### Riesgo de regresión: **Ninguno**

---

### [REC-011] `RecetaTiempoLabel` muestra siempre "60+" para recetas ≥ 60 min

#### Severidad: **Media**
#### Categoría: UX / Lógica de Dominio
#### Descripción
`getRecetaTiempoLabel` usa un umbral fijo: toda receta con tiempo ≥ 60 minutos muestra el mismo label "60+ min". Una receta de 3 horas aparece igual que una de exactamente 60 min.

#### Evidencia
```typescript
// receta-tiempo.utils.ts — líneas 69-77
export function getRecetaTiempoLabel(minutes: number, t: TranslateFn): string {
  if (minutes >= RECETA_TIEMPO_UMBRAL_60_PLUS_MINUTOS) {
    return t('recipes.tiempoMinutos60Plus', {
      count: RECETA_TIEMPO_UMBRAL_60_PLUS_MINUTOS,  // siempre 60, nunca el valor real
    });
  }
  return t('recipes.tiempoMinutos', { count: minutes });
}
```

#### Impacto
En una escuela de hostelería, distinguir "1 h" de "3 h" es relevante para la planificación.

#### Solución recomendada
Para valores ≥ 60, mostrar horas y minutos: `1h 30min`. Mantener `60+` sólo como etiqueta de franja de filtro.

```typescript
export function getRecetaTiempoLabel(minutes: number, t: TranslateFn): string {
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
  }
  return t('recipes.tiempoMinutos', { count: minutes });
}
```

#### Prioridad: **Media**
#### Riesgo de regresión: **Bajo**

---

### [REC-012] `i18n.t()` directo en `Preparaciones.tsx` en lugar del hook `useTranslation`

#### Severidad: **Media**
#### Categoría: i18n / React
#### Descripción
`formatRationInfo` en `Preparaciones.tsx` llama directamente a `i18n.t()` importado como módulo singleton, en lugar de usar `const { t } = useTranslation()`. Esto significa que si el usuario cambia el idioma de la aplicación en runtime, las cadenas de texto de esta función no se actualizan hasta que el componente se re-renderiza por otro motivo.

#### Evidencia
```typescript
// Preparaciones.tsx — líneas 1, 147-153
import i18n from '../i18n';

const formatRationInfo = (lote?: ProduccionLote, portions?: number): string | null => {
  // ...
  return safePortions === 1
    ? i18n.t('preparaciones.racionEquiv.una', { amountLabel, unit })    // ⚠️
    : i18n.t('preparaciones.racionEquiv.varias', { ... });              // ⚠️
};
```

#### Solución recomendada
Mover `formatRationInfo` al interior del componente y usar el `t` del hook, o inyectar `t` como parámetro de la función.

#### Prioridad: **Media**
#### Riesgo de regresión: **Ninguno**

---

### [REC-013] `resolveValidDestinationId` en submit puede sobreescribir la selección explícita del usuario

#### Severidad: **Media**
#### Categoría: UX / Lógica de Negocio
#### Descripción
Al confirmar una distribución, `handleCreateDistribucion` llama `resolveValidDestinationId` que recalcula el destino desde una lista de candidatos (incluyendo el `destinationId` actual, sugerido, y ubicaciones preferidas). Si `effectiveDestinationId !== destinationId`, silenciosamente actualiza el selector a un valor diferente al seleccionado por el usuario.

#### Evidencia
```typescript
// Distribucion.tsx — líneas 438-455
const effectiveDestinationId = resolveValidDestinationId(
  selectedDisponible,
  ubicaciones
);

if (effectiveDestinationId !== destinationId) {
  setDestinationId(effectiveDestinationId);  // ⚠️ sobreescribe sin avisar al usuario
}
```

#### Impacto
El usuario elige un destino concreto, envía el formulario, y la distribución se registra en una ubicación diferente. No hay ningún aviso.

#### Solución recomendada
Si `effectiveDestinationId !== destinationId`, mostrar un `Alert` en el diálogo indicando que la ubicación seleccionada no es válida y cuál es la alternativa, permitiendo al usuario corregir antes de confirmar.

#### Prioridad: **Media**
#### Riesgo de regresión: **Bajo**

---

### [REC-014] `RecetaPayload` hace todos los campos opcionales a nivel de tipo

#### Severidad: **Media**
#### Categoría: Tipado TypeScript
#### Descripción
El tipo `RecetaPayload` es `Omit<Partial<Receta>, 'ingredientes'> & { ingredientes?: ... }`. `Partial<Receta>` hace que `nombre`, `instrucciones`, `dificultad`, `tiempoEstimadoMinutos` sean opcionales en el tipo. La validación real sólo existe en `buildRecetaPayload` (runtime). El compilador no puede garantizar que se envíe un payload completo.

#### Evidencia
```typescript
// receta.types.ts — líneas 93-96
export type RecetaPayload = Omit<Partial<Receta>, 'ingredientes'> & {
  ingredientes?: RecetaIngredientePayload[];
};
// ⚠️ Partial<Receta> → nombre?: string, instrucciones?: string, etc.
```

```typescript
// Recetas.tsx — línea 465
await updateReceta(String(formData.id), payload as RecetaPayload);
// El cast 'as RecetaPayload' oculta que payload podría estar incompleto
```

#### Solución recomendada
Crear un tipo `CreateRecetaPayload` (todos obligatorios) y `UpdateRecetaPayload` (todos opcionales). Usar el tipo apropiado en cada endpoint del servicio.

#### Prioridad: **Media**
#### Riesgo de regresión: **Ninguno** (cambio de tipos, sin cambio de runtime)

---

### [REC-015] `tamanioRacion` se calcula automáticamente sin notificar al usuario

#### Severidad: **Media**
#### Categoría: UX / Lógica de Negocio
#### Descripción
Si el usuario no rellena `tamanioRacion`, `buildRecetaPayload` lo calcula automáticamente como `rendimiento / raciones`. Este cálculo es silencioso y el valor resultante se persiste en BD.

#### Evidencia
```typescript
// recetaForm.helpers.ts — líneas 261-283
tamanioRacion: (() => {
  const explicit = parsePositiveOptionalNumber(formData.tamanioRacion, ...);
  if (explicit != null) return explicit;

  const rendimientoVal = parsePositiveOptionalNumber(formData.rendimiento, ...);
  const racionesVal = parsePositiveOptionalNumber(formData.raciones, ...) ?? 1;

  if (rendimientoVal != null && racionesVal > 0) {
    return rendimientoVal / racionesVal;  // ⚠️ calculado sin mostrar al usuario
  }
  return undefined;
})(),
```

#### Impacto
Si el usuario configura `rendimiento=1000g` y `raciones=8`, obtiene `tamanioRacion=125g` sin haberlo introducido explícitamente. Al editar la receta, ese valor ya está guardado y puede confundir.

#### Solución recomendada
Mostrar el valor calculado en el formulario como campo de sólo lectura con etiqueta "(calculado automáticamente)". Permitir al usuario sobreescribirlo para convertirlo en valor explícito.

#### Prioridad: **Baja**
#### Riesgo de regresión: **Ninguno**

---

### [REC-016] Estado "cancelado" de lotes no visible en `Preparaciones.tsx`

#### Severidad: **Media**
#### Categoría: Funcionalidad
#### Descripción
`ProduccionLote.estado` admite tres valores: `'disponible' | 'agotado' | 'cancelado'`. `Preparaciones.tsx` sólo muestra dos tabs: "Disponibles" (estado=disponible) y "Historial" (estado=agotado). Los lotes cancelados son invisibles para el usuario.

#### Evidencia
```typescript
// Preparaciones.tsx — líneas 260-262
const estado = activeTab === 0 ? 'disponible' : 'agotado';
// ⚠️ 'cancelado' nunca se pide al backend
```

#### Impacto
No hay visibilidad de lotes cancelados. Si una producción se cancela por error, no hay forma de auditarlo desde la UI de preparaciones.

#### Solución recomendada
Añadir un tercer tab "Cancelados" o incluir los cancelados en el historial con un `StatusChip` diferenciado.

#### Prioridad: **Media**
#### Riesgo de regresión: **Bajo**

---

### [REC-017] Dos `useEffect` redundantes para `destinationId` en `Distribucion.tsx` (potencial double-set)

#### Severidad: **Baja**
#### Categoría: Calidad de Código
#### Descripción
Existen dos `useEffect` que actualizan `destinationId` cuando se abre el diálogo de distribución: uno en líneas 362-382 y otro en líneas 981-993. Ambos tienen lógica parcialmente superpuesta. El segundo tiene dependencias más amplias y puede sobreescribir el valor correcto establecido por el primero si `originId` cambia por algún motivo entre renders.

#### Solución recomendada
Consolidar en un único `useEffect` que cubra todos los casos de inicialización del destino.

#### Prioridad: **Baja**
#### Riesgo de regresión: **Bajo**

---

### [REC-018] Merma de producción sin validación de cantidad máxima

#### Severidad: **Baja**
#### Categoría: Validación de Negocio
#### Descripción
Al reportar merma desde `Preparaciones.tsx`, no se valida que la cantidad de merma declarada sea ≤ a la cantidad del ingrediente en el lote. Un usuario podría reportar 999 kg de merma de un ingrediente del que sólo había 50g.

#### Evidencia
```typescript
// Preparaciones.tsx — líneas 583-584
if (mermaCantidad === null || mermaCantidad <= 0) {
  toast.error(t('preparaciones.merma.cantidadMayorCero'));
  // ⚠️ No hay validación de máximo
}
```

#### Solución recomendada
Si `detalleIngredientes` está disponible (se carga en `openMermaDialog`), usar `cantidadNecesaria` como límite superior orientativo. Mostrar un warning (no bloqueo) si la merma supera la cantidad del ingrediente en el lote.

#### Prioridad: **Baja**
#### Riesgo de regresión: **Ninguno**

---

## Inconsistencias Frontend/Backend

### 1. Doble parámetro de búsqueda en `fetchProducciones`

```typescript
// produccion.service.ts — líneas 129-131
if (params.searchTerm) {
  query.append('searchTerm', params.searchTerm);
  query.append('search', params.searchTerm);  // ← enviado dos veces con nombres distintos
}
```

Indica que ha habido al menos un cambio de API en el nombre del parámetro. El código de duplicación debería consolidarse una vez confirmado qué nombre acepta el backend.

### 2. `DificultadReceta` usa valores de display en español como claves de enum

```typescript
// receta.types.ts
export enum DificultadReceta {
  FACIL = 'Fácil',   // valor con acento
  MEDIA = 'Media',
  DIFICIL = 'Difícil', // valor con acento
}
```

Si el backend NestJS usa `@IsEnum(DificultadReceta)` y compara con los valores, los acentos son críticos. Un test de integración debería verificar que `'Fácil'` (con acento en é) es exactamente lo que el backend acepta y no `'Facil'` sin acento.

### 3. `Distribucion.estado` tipado como `string` plano

```typescript
// distribucion.types.ts
export interface Distribucion {
  estado: string;  // ⚠️ sin union type ni enum
}
```

Mientras `ProduccionLote.estado` usa un union type correcto, `Distribucion.estado` es `string`. Consecuencia: la comparación en `renderHistorialActions`:
```typescript
if (!['entregada', 'parcial', 'cancelada'].includes(row.estado))
```
...no tiene protección de tipos. Si el backend cambia un estado, el TypeScript no avisa.

**Recomendación:** Definir `type DistribucionEstado = 'borrador' | 'preparada' | 'parcial' | 'entregada' | 'cancelada'` y usarlo en la interfaz.

### 4. `RecetaIngrediente.id` requerido pero `productoId` opcional

```typescript
// receta.types.ts
export interface RecetaIngrediente {
  id: string;            // requerido
  productoId?: string;   // opcional — ¿puede existir un ingrediente sin producto?
  // ...
}
```

A nivel de base de datos, `receta_ingrediente.producto_id` es FK NOT NULL. La opcionalidad en el tipo frontend es incorrecta. Debería ser `productoId: string`.

### 5. `RecetaCostResponse` usa `costoTotal` (con "o") vs. `costeTotal` (con "e") en el resto del modelo

```typescript
// receta.types.ts
export interface RecetaCostResponse {
  costoTotal: number;           // ← "costo" (castellano latinoamericano)
  costoUnitarioEstimado?: number; // ← "costo"
}

export interface ProduccionLote {
  costeTotalReal: number;       // ← "coste" (castellano peninsular)
}

export interface Receta {
  costeUnitarioEstimado?: number; // ← "coste"
}
```

Hay inconsistencia de vocabulario en los tipos. Probablemente refleja una inconsistencia en la API del backend entre el endpoint `/recetas/calculate-preview` y las entidades persistidas.

---

## Riesgos Potenciales Futuros

### R1 — Escalabilidad de `RecetaIngredientesSelector`
El selector carga los detalles de producto de todos los ingredientes existentes en paralelo con `Promise.all(productIdsToLoad.map(id => getProductoById(id)))`. Con recetas de muchos ingredientes (>20), esto genera muchas peticiones paralelas. Si el backend implementa rate limiting, pueden empezar a fallar.

**Mitigación:** Añadir un endpoint `GET /productos/batch?ids=a,b,c` para cargar múltiples productos en una sola petición.

### R2 — Cache de búsqueda de productos sin invalidación
```typescript
// RecetaIngredientesSelector.tsx — líneas 344-375
productSearchCacheRef.current.set(cacheKey, products);
```
La cache de búsqueda de productos persiste durante toda la vida del componente y no se invalida cuando se actualiza un producto. Si un producto se renombra o se da de baja durante la sesión, el selector seguirá mostrando el nombre antiguo desde la cache.

### R3 — Race condition en Distribución sin `loadRequestRef`
`Distribucion.tsx` no usa el patrón `loadRequestRef` presente en `Recetas.tsx` y `Preparaciones.tsx`. Con cambios rápidos de pestaña y búsquedas simultáneas, los datos podrían mezclarse.

### R4 — Lotes de producción sin expiración automática en la UI
Si un lote tiene `fechaCaducidad` pasada, la UI lo sigue mostrando como "disponible" hasta que el backend lo marque o alguien lo consuma. Debería mostrarse un indicador visual de caducidad próxima o expirada.

### R5 — Producción en paralelo sin bloqueo de UI
`handleConfirmCook` usa `Promise.all` para ejecutar múltiples producciones en paralelo. Si una falla a mitad, las que se ejecutaron antes ya han descontado stock y no se puede hacer rollback automático desde el frontend. El usuario sólo recibe un toast parcial.

---

## Deuda Técnica

| ID | Descripción | Esfuerzo |
|---|---|---|
| DT-01 | Todos los JSDoc de `distribucion.types.ts` son genéricos (`"Ejecuta la lógica de operación..."`) — generados por IA sin valor | ~30 min |
| DT-02 | `buildRecetaPayload` calcula `rendimiento` dos veces (líneas 247 y 269) | ~5 min |
| DT-03 | `fetchProducciones` tiene tres overloads para soportar firma legacy; debería simplificarse a una firma con objeto | ~30 min |
| DT-04 | `pageSize = 10` como constante no reactiva en Distribución impide el control de usuario | ~1h |
| DT-05 | Comentario duplicado JSDoc en `buildRecetaPayload` (dos bloques `/** */` consecutivos) | ~5 min |
| DT-06 | `downloadFile` exportado en `api.service.ts` pero toda la aplicación usa `DownloadService.downloadFile`; una de las dos debería deprecarse | ~2h |
| DT-07 | `RecetaPayload` con `Partial<>` genérico debería separarse en `Create` y `Update` payload types | ~1h |

---

## Conclusión

Los módulos auditados demuestran un nivel de madurez razonable para una aplicación en desarrollo activo: el cliente HTTP centralizado, la gestión de idempotency, el debounce en validaciones de stock y el patrón de race-condition con refs son puntos fuertes que denotan experiencia arquitectural.

Sin embargo, hay **cuatro bugs críticos que deben corregirse antes del despliegue en producción**:

1. **REC-001** — La merma por ingrediente es una función de negocio central y no puede configurarse desde la UI.
2. **REC-002** — El carousel con datos de muestra activos en producción daña la credibilidad del sistema.
3. **REC-003** — La cancelación vía `window.prompt()` puede generar cancelaciones de entregas no deseadas con consecuencias operativas reales.
4. **REC-004** — Los índices numéricos como keys provocan que el selector de ingredientes asigne resultados de búsqueda al ingrediente equivocado.

El módulo de Distribución, en particular, requiere mayor atención: acumula más hallazgos que los otros dos módulos combinados, incluyendo código duplicado, falta de paginación y una cadena de lógica de selección de destino difícil de seguir que puede sobreescribir la intención del usuario en silencio.
