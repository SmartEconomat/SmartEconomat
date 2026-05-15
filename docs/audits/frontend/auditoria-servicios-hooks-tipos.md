# Auditoría Técnica: Capa de Servicios, Hooks y Tipos Globales

**Fecha:** 2026-05-14  
**Auditor:** Staff Engineer (análisis estático exhaustivo)  
**Alcance:** `api.service.ts`, `api.utils.ts`, `download.service.ts`, `serial.service.ts`, hooks globales, store/context, tipos, i18n, enums, componentes UI base  
**Stack:** React 19 + Vite 6 + MUI 7 + Redux Toolkit + i18next

---

## Resumen Ejecutivo

La capa de servicios de SmartEconomat presenta una arquitectura sólida como base (`baseFetch` centralizado, ApiError tipado, validación de contratos previa al envío, retry logic diferenciada por método HTTP), pero acumula **deuda técnica relevante** en varios frentes:

- **Duplicación de lógica crítica**: las funciones de descarga/PDF existen en dos lugares con implementaciones distintas, generando inconsistencias silenciosas.
- **Sin AbortController global**: ninguna petición de datos puede cancelarse si el componente se desmonta. Riesgo de memory leaks y actualizaciones de estado en componentes ya desmontados.
- **Tipos contradictorios**: `ApiResponse<T>` está definido dos veces con interfaces diferentes. Los tipos de `Usuario` usan `string | number` para IDs que el backend garantiza como UUID strings.
- **i18n con interpolación rota**: las claves de error del backend usan `{count}` (una llave) en lugar de `{{count}}` (doble llave de i18next). Las traducciones de errores nunca mostrarán valores interpolados.
- **Componentes UI sin accesibilidad uniforme**: `DetailModal` y `SummaryModal` usan `<Dialog>` de MUI sin el focus trap personalizado de `AccessibleDialog`, rompiendo la consistencia de accesibilidad.
- **Estado serial sin timeout**: `SerialService.startContinuousRead` puede quedar bloqueado indefinidamente si la báscula se desconecta silenciosamente.

La base es más que suficiente para continuar. Las correcciones son acotadas y no requieren cambios de arquitectura.

---

## Métricas

| Dimensión | Calificación | Detalle |
|-----------|-------------|---------|
| Cliente HTTP central (`baseFetch`) | 🟡 7/10 | Sólido pero sin timeout ni AbortSignal automático |
| Gestión de errores global | 🟡 6/10 | ApiError bien tipado; duplicación en descarga |
| Hooks reutilizables (`useDataTable`) | 🟡 7/10 | Funcional; parámetros duplicados; sin sync URL |
| Tipos TypeScript | 🔴 5/10 | Dos `ApiResponse<T>` contradictorias; `id: string|number` |
| i18n y localización | 🔴 5/10 | Interpolación rota en errores; dominios incompletos |
| Componentes UI base | 🟡 7/10 | DataTable sólido; accesibilidad inconsistente en modales |
| Context / Store | 🟡 7/10 | Arquitectura limpia; posible duplicidad Redux vs sherlock-auth |
| SerialService | 🔴 5/10 | Sin timeout en lectura; @ts-ignore; writer no inicializado |

---

## Hallazgos

---

### [SVC-001] No existe mecanismo de timeout ni AbortController en `baseFetch`

#### Severidad: Alta
#### Categoría: Fiabilidad / Memory Leaks

#### Descripción

`baseFetch` implementa retry logic y manejo de 401, pero **no tiene timeout propio** ni acepta/propaga un `AbortSignal` desde el exterior. Cualquier petición puede quedar colgada indefinidamente si el servidor no responde. Cuando un componente se desmonta antes de que la petición complete, el callback de la promesa actualiza el estado de un componente ya destruido.

#### Evidencia

```typescript
// api.service.ts - línea 513-586
export async function baseFetch(
  path: string,
  options: RequestInit = {},
  retryOptions: { maxRetries?: number; delayMs?: number; silent?: boolean } = {}
): Promise<Response> {
  // ❌ No hay timeout global
  // ❌ No acepta AbortSignal del consumidor (options.signal existe en RequestInit pero no se gestiona especialmente)
  // ❌ No hay límite de tiempo máximo absoluto por petición
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await executeFetch(path, options);
    // ...
  }
}
```

`download.service.ts` sí implementa `AbortController` con timeout de 30s, pero como excepción puntual:

```typescript
// download.service.ts - línea 56-57
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), EXPORT_TIMEOUT_MS);
```

#### Riesgo real

En producción con red lenta o servidor sobrecargado, las peticiones de datos (listados, filtros) pueden quedar colgadas minutos. Los usuarios verán spinners perpetuos sin feedback de error.

#### Impacto

Todo el frontend. Afecta todos los servicios de datos (pedidos, productos, mermas, etc.).

#### Solución recomendada

Añadir `AbortController` con timeout configurable dentro de `baseFetch` y propagarlo al `fetch` subyacente:

```typescript
export async function baseFetch(
  path: string,
  options: RequestInit = {},
  retryOptions: { maxRetries?: number; delayMs?: number; timeoutMs?: number } = {}
): Promise<Response> {
  const { timeoutMs = 30_000, ...retryRest } = retryOptions;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const signal = options.signal
    ? AbortSignal.any([options.signal, controller.signal])
    : controller.signal;
  try {
    return await executeWithRetry(path, { ...options, signal }, retryRest);
  } finally {
    clearTimeout(timeoutId);
  }
}
```

#### Prioridad: Alta
#### Riesgo de regresión: Bajo (cambio aditivo no destructivo)

---

### [SVC-002] Blob URL leak en `openPdfInNewTab` (`api.service.ts`)

#### Severidad: Media
#### Categoría: Memory Leak / UX

#### Descripción

`openPdfInNewTab` en `api.service.ts` revoca la blob URL a los **10 segundos** independientemente de si la nueva pestaña ya cargó el PDF. Si la red es lenta o el PDF es grande, la URL se revoca antes de que el navegador pueda procesarla.

#### Evidencia

```typescript
// api.service.ts - líneas 695-704
const blob = await response.blob();
const url = URL.createObjectURL(blob);
const anchor = document.createElement('a');
anchor.href = url;
anchor.target = '_blank';
anchor.rel = 'noopener noreferrer';
document.body.appendChild(anchor);
anchor.click();
document.body.removeChild(anchor);
setTimeout(() => URL.revokeObjectURL(url), 10000); // ⚠️ revocación arbitraria a los 10s
```

En contraste, `DownloadService.openPdfInNewTab` en `download.service.ts` nunca revoca:

```typescript
// download.service.ts - líneas 118-123
static openPdfInNewTab(blob: Blob) {
  const url = window.URL.createObjectURL(blob);
  window.open(url, '_blank');
  // Nota: No podemos hacer revokeObjectURL inmediatamente porque la pestaña necesita la URL.
  // Navegadores modernos suelen manejar esto, pero es una limitación de blobs.
}
```

#### Impacto

PDF en blanco o error de carga en PDFs grandes/conexiones lentas. La segunda implementación nunca libera memoria.

#### Solución recomendada

Unificar en un solo método y usar una estrategia que espere al evento de carga (aunque limitado por restricciones de seguridad entre ventanas):

```typescript
export async function openPdfInNewTab(path: string): Promise<void> {
  const response = await baseFetch(path);
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank', 'noopener,noreferrer');
  // Revocar al cerrar la ventana (mejor que timeout arbitrario)
  if (win) {
    win.addEventListener('beforeunload', () => URL.revokeObjectURL(url));
  }
  // Fallback: revocar después de 5 minutos
  setTimeout(() => URL.revokeObjectURL(url), 5 * 60 * 1000);
}
```

#### Prioridad: Media
#### Riesgo de regresión: Bajo

---

### [SVC-003] Duplicación de lógica de descarga entre `api.service.ts` y `download.service.ts`

#### Severidad: Alta
#### Categoría: Mantenibilidad / Inconsistencia

#### Descripción

La lógica de descarga y apertura de PDFs está **duplicada** en dos archivos con implementaciones diferentes:

| Funcionalidad | `api.service.ts` | `download.service.ts` |
|---|---|---|
| Descargar fichero | `downloadFile()` | `DownloadService.downloadFile()` |
| Abrir PDF en pestaña | `openPdfInNewTab()` | `DownloadService.openPdfInNewTab()` |
| Obtener blob | (inline en funciones) | `DownloadService.getBlob()` |

Las diferencias entre implementaciones son significativas:
- `DownloadService.downloadFile` tiene timeout de 30s con `AbortController`; `api.service.ts` `downloadFile` no tiene timeout.
- `api.service.ts` `downloadFile` hace una comprobación redundante de `response.ok` después de `baseFetch` (que ya lanza error si no es OK).
- El manejo de errores es diferente (toast en `DownloadService`, throw en `api.service.ts`).

#### Evidencia

```typescript
// api.service.ts - línea 652 (sin timeout, comprobación redundante)
export async function downloadFile(path: string, filename: string): Promise<void> {
  const response = await baseFetch(path); // baseFetch ya lanza si !ok
  if (!response.ok) { // ❌ nunca se ejecutará
    throw new Error(`Error al descargar: ${response.status}`);
  }
  // ...
}

// download.service.ts - línea 51 (con timeout, con feedback toast)
static async downloadFile(path: string, options: DownloadOptions): Promise<void> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), EXPORT_TIMEOUT_MS);
  // ...
}
```

#### Impacto

Los consumidores no saben qué función usar. Mantenimiento doble. Bugs en una implementación no se corrigen en la otra.

#### Solución recomendada

Eliminar las funciones de descarga de `api.service.ts` (o convertirlas en thin wrappers) y consolidar toda la lógica en `DownloadService`. Actualizar los importadores.

#### Prioridad: Alta
#### Riesgo de regresión: Medio (requiere auditar importadores)

---

### [SVC-004] Variable `silent` declarada y descartada con `void` en `baseFetch`

#### Severidad: Baja
#### Categoría: Dead Code / Calidad

#### Descripción

La opción `silent` se destrutura del objeto de retryOptions y se declara pero inmediatamente se descarta con `void`. Es dead code que confunde la API pública.

#### Evidencia

```typescript
// api.service.ts - líneas 521-527
const {
  maxRetries = defaultRetries,
  delayMs = 1000,
  silent: _silent = false, // ❌ se declara
} = retryOptions;
let lastError: unknown;
void _silent; // ❌ se descarta. Nunca se usa.
```

#### Impacto

Confusión para consumidores que pasen `silent: true` esperando suprimir logs/notificaciones. No produce ningún efecto.

#### Solución recomendada

Eliminar la opción `silent` de la firma o implementarla correctamente (evitar `eventBus.emit` si `silent: true`).

#### Prioridad: Baja
#### Riesgo de regresión: Ninguno

---

### [SVC-005] `useDataTable` envía parámetros duplicados en cada query

#### Severidad: Media
#### Categoría: Performance / Mantenibilidad

#### Descripción

`useDataTable` envía los parámetros de búsqueda y filtros **duplicados** por "retrocompatibilidad", añadiendo ruido innecesario a cada petición HTTP.

#### Evidencia

```typescript
// useDataTable.ts - líneas 185-226 (queryParams)
const params: QueryParams = {
  // ...
  search: debouncedSearchTerm,
  searchTerm: debouncedSearchTerm, // ❌ duplicado
};

// Y para filtros de fecha:
params.dateFrom = normalized;
params.startDate = normalized;   // ❌ alias redundante
params.fechaDesde = normalized;  // ❌ alias en español redundante

// Y para estado:
params.status = normalized;
params.estado = normalized;      // ❌ alias en español redundante
```

Esto genera URLs como:
```
/api/v1/pedidos?search=abc&searchTerm=abc&dateFrom=2026-01-01&startDate=2026-01-01&fechaDesde=2026-01-01
```

#### Impacto

Queries más largas, potenciales conflictos en backends que no esperan parámetros duplicados, dificultad para depurar.

#### Solución recomendada

Eliminar los aliases desde `useDataTable` y mantener solo el alias canónico (el que acepta el backend). Si hay endpoints con nombres legacy, el alias debe estar en el servicio específico, no en el hook genérico.

#### Prioridad: Media
#### Riesgo de regresión: Medio (hay que verificar qué endpoints esperan cada alias)

---

### [SVC-006] `useDataTable` no sincroniza estado con URL params

#### Severidad: Media
#### Categoría: UX / Mantenibilidad

#### Descripción

Los filtros, página y orden de `useDataTable` viven exclusivamente en el estado local de React. Al navegar hacia atrás, recargar la página o compartir una URL, se pierde todo el contexto de filtrado.

#### Evidencia

```typescript
// useDataTable.ts - línea 56
const [state, setState] = useState<DataTableState>({
  page: 1,
  pageSize: 10,
  // ❌ Sin lectura de URLSearchParams inicial
  // ❌ Sin escritura a URLSearchParams en cada cambio
  filters: initialState.filters || {},
  searchTerm: initialState.searchTerm || '',
});
```

#### Impacto

- El usuario no puede compartir vistas filtradas por URL.
- Volver desde el detalle de un elemento siempre reinicia los filtros.
- Dificulta el debugging en producción (no se puede reproducir el estado exacto de un usuario).

#### Solución recomendada

Añadir sincronización bidireccional con `useSearchParams` de React Router 7 como opción opt-in:

```typescript
export function useDataTable(
  initialState: Partial<DataTableState> = {},
  options: { syncWithUrl?: boolean } = {}
) {
  const [searchParams, setSearchParams] = useSearchParams();
  // Leer estado inicial desde URL si syncWithUrl = true
  // Actualizar URL en cada cambio de filtro/página
}
```

#### Prioridad: Media
#### Riesgo de regresión: Bajo (cambio opt-in)

---

### [SVC-007] `DataTable` usa índices de fila como keys de React

#### Severidad: Media
#### Categoría: Performance / Correctitud

#### Descripción

Las filas de `DataTable` usan el índice del array como key de React, lo que puede causar problemas de reconciliación cuando el orden de datos cambia (por ordenación o filtrado).

#### Evidencia

```typescript
// DataTable.tsx - línea 706
data.map((row, rowIndex) => (
  <TableRow
    key={`row-${rowIndex}`} // ❌ índice como key
    // ...
  >
```

También en los skeletons (aceptable) y grid items:
```typescript
// DataTable.tsx - línea 905
data.map((row, index) => (
  <Grid key={`grid-item-${index}`}> // ❌
```

#### Riesgo real

Al ordenar la tabla, React reutiliza incorrectamente nodos del DOM, lo que puede causar animaciones incorrectas, pérdida de foco o estado interno incorrecto en celdas con componentes con estado propio.

#### Solución recomendada

```typescript
// Usar el prop uniqueKey (ya existe en la interfaz)
data.map((row) => (
  <TableRow
    key={String(row[uniqueKey as keyof T])}
    // ...
  >
```

#### Prioridad: Media
#### Riesgo de regresión: Bajo

---

### [SVC-008] Props `filters` y `onFilter` en `DataTable` recibidas pero descartadas

#### Severidad: Media
#### Categoría: Dead Code / Feature Incompleta

#### Descripción

`DataTable` declara las props `filters` y `onFilter` en su interfaz y las recibe en el componente, pero las descarta inmediatamente con `void`.

#### Evidencia

```typescript
// DataTable.tsx - líneas 323-329
export function DataTable<T>({
  // ...
  filters: _filters = {},   // ❌ recibida
  onFilter: _onFilter,      // ❌ recibida
  // ...
}: DataTableProps<T>) {
  void _filters;   // ❌ descartada
  void _onFilter;  // ❌ descartada
```

La interfaz define todo el contrato de filtrado por columna (incluyendo `filterType`, `filterOptions`, `filterable` en `Column<T>`), pero ninguna de esas propiedades se procesa.

#### Impacto

Los consumidores que pasen `filters` u `onFilter` no recibirán ningún error pero la funcionalidad no hará nada. Genera confusión y false confidence.

#### Solución recomendada

Implementar la funcionalidad de filtrado por columna (usando los `filterType` y `filterOptions` definidos en `Column<T>`), o eliminar estas props y la definición de `filterable`/`filterType`/`filterOptions` de `Column<T>` hasta que se implementen.

#### Prioridad: Media
#### Riesgo de regresión: Bajo

---

### [SVC-009] `DetailModal` y `SummaryModal` usan `Dialog` de MUI sin `AccessibleDialog`

#### Severidad: Alta
#### Categoría: Accesibilidad / Inconsistencia

#### Descripción

El proyecto invirtió en un `AccessibleDialog` personalizado que gestiona focus trap, atributo `inert` en el fondo, restauración del foco y stacking de diálogos anidados. Sin embargo, `DetailModal` y `SummaryModal` usan el `Dialog` de MUI directamente, sin ninguna de esas garantías.

#### Evidencia

```typescript
// DetailModal.tsx - línea 136
return (
  <>
    <Dialog  // ❌ MUI Dialog directo, sin focus trap personalizado
      open={isOpen}
      onClose={onClose}
      scroll="paper"
      // ...
    >
```

```typescript
// SummaryModal.tsx - línea 666
return (
  <Dialog open={isOpen} onClose={onClose} fullWidth maxWidth="sm"> // ❌
```

Comparado con:
```typescript
// Modal.tsx - línea 53 (correcto)
return (
  <AccessibleDialog
    open={isOpen}
    // ...
  >
```

#### Riesgo real

- Usuarios de lectores de pantalla pueden salir del diálogo con Tab y acceder a elementos del fondo.
- Foco no se restaura correctamente al cerrar el diálogo.
- Diálogos anidados (`DetailModal` → `DynamicFormModal`) pueden comportarse incorrectamente respecto al atributo `inert`.

#### Solución recomendada

Reescribir `DetailModal` y `SummaryModal` para usar `AccessibleDialog` (o el componente `Modal`) en lugar de `Dialog` de MUI directamente.

#### Prioridad: Alta
#### Riesgo de regresión: Bajo (cambio de wrapper, sin cambio de lógica de negocio)

---

### [SVC-010] Tipos `ApiResponse<T>` duplicados con interfaces contradictorias

#### Severidad: Alta
#### Categoría: Type Safety / Correctitud

#### Descripción

Hay **dos interfaces `ApiResponse<T>` en el proyecto** con definiciones diferentes e incompatibles:

#### Evidencia

```typescript
// api.service.ts - línea 345
export interface ApiResponse<T> {
  success: boolean;  // ✅ required
  message: string;   // ✅ required
  data: T;
  error?: unknown;
}

// types/usuario.ts - línea 55
export interface ApiResponse<T> {
  success?: boolean; // ❌ optional (diferente)
  data: T;
  message?: string;  // ❌ optional (diferente)
  status: number;    // ❌ campo extra que no existe en api.service.ts
}
```

Ambas se exportan y son importadas en distintos lugares. TypeScript no detectará el conflicto si se usan por separado.

#### Impacto

Código que use una interfaz esperará `success: boolean` pero el objeto real puede no tenerlo. `status` solo existe en la interfaz local. Los tipos mienten sobre la forma de los datos.

#### Solución recomendada

Eliminar `ApiResponse<T>` de `types/usuario.ts` y usar exclusivamente la de `api.service.ts`. Si se necesita `status`, añadirlo a la definición canónica o crear un tipo extendido con nombre diferente.

#### Prioridad: Alta
#### Riesgo de regresión: Medio (hay que migrar los importadores)

---

### [SVC-011] `Usuario.id` tipado como `string | number` cuando el backend garantiza UUID

#### Severidad: Media
#### Categoría: Type Safety

#### Descripción

El backend usa UUID v7 (siempre string) para todos los IDs de usuario. El tipo frontend `Usuario.id` es `string | number`, lo que obliga a conversiones en toda la aplicación y puede ocultar bugs de comparación.

#### Evidencia

```typescript
// types/usuario.ts - línea 13
export interface Usuario {
  id: string | number; // ❌ number nunca llega del backend
  username: string;
  // ...
}
```

#### Riesgo real

```typescript
// Potencial bug
if (usuario.id === selectedId) { // selectedId es string UUID
  // Si usuario.id viene como number (no debería), esta comparación nunca es true
}
```

#### Solución recomendada

```typescript
export interface Usuario {
  id: string; // UUID v7
  // ...
}
```

#### Prioridad: Media
#### Riesgo de regresión: Bajo (puede requerir eliminar castings defensivos innecesarios)

---

### [SVC-012] i18n: Interpolación rota en claves de error del backend

#### Severidad: Alta
#### Categoría: i18n / UX

#### Descripción

i18next usa `{{variable}}` (doble llaves) para interpolación, pero varias claves de error en `es.json` y `en.json` usan `{variable}` (una sola llave), que es sintaxis inválida para i18next. Los valores interpolados **nunca se sustituirán**.

#### Evidencia

```json
// es.json y en.json - claves de errores
"CANNOT_DELETE_TEMPLATE_LINKED_TO_ROLES": 
  "No se puede eliminar la plantilla porque está vinculada a {count} rol(es)"
//                                                              ↑ ❌ una sola llave

"TEMPLATE_NAME_ALREADY_EXISTS": 
  "Ya existe una plantilla con el nombre \"{nombre}\""
//                                          ↑ ❌ una sola llave
```

```json
// Correcto (dateRange)
"exceeded": "El rango máximo permitido es de 1 año ({{maxDays}} días)."
//                                                     ↑ ✅ doble llave
```

#### Riesgo real

El mensaje mostrado al usuario será literalmente:
- `"No se puede eliminar la plantilla porque está vinculada a {count} rol(es)"`  
en lugar de:
- `"No se puede eliminar la plantilla porque está vinculada a 3 rol(es)"`

#### Solución recomendada

Reemplazar `{count}` → `{{count}}` y `{nombre}` → `{{nombre}}` en ambos archivos de traducción.

#### Prioridad: Alta
#### Riesgo de regresión: Ninguno (solo corrección de strings)

---

### [SVC-013] `enumPresentation.ts` tiene dominios incompletos

#### Severidad: Media
#### Categoría: i18n / Completitud

#### Descripción

El mapa `enumDomainAlias` en `enumPresentation.ts` no cubre todos los enums del dominio. Estados importantes de entidades del backend no tienen dominio de traducción.

#### Evidencia

```typescript
// enumPresentation.ts - líneas 18-34
const enumDomainAlias: Record<string, string> = {
  pedidoEstado: 'pedidoEstado',
  pedidoUsuarioEstado: 'pedidoUsuarioEstado',
  loteEstado: 'loteEstado',
  recepcionEstado: 'recepcionEstado',
  // ❌ Faltan:
  // preparacionEstado → PreparacionEstado (pendiente, en_proceso, completada, cancelada)
  // produccionLoteEstado → EstadoLote de receta (activo, consumido, cancelado, expirado)
  // recepcionProductoEstado → EstadoProductoRecepcion
  // userStatus → UserStatusEnum (ACTIVE, INACTIVE, BLOCKED)
  // syncStatus → SyncStatusEnum (saving, synced, error, conflict)
};
```

Además, `StatusChip` implementa su propia lógica heurística hardcodeada para determinar el dominio de un valor (`getI18nLabel`), duplicando y divergiendo de `enumPresentation.ts`.

#### Impacto

Estados de preparaciones, lotes de producción y recepciones se muestran sin traducción o con el fallback de capitalización automática.

#### Solución recomendada

1. Añadir los dominios faltantes a `enumDomainAlias`.
2. Añadir las claves correspondientes en `es.json` y `en.json` bajo `enum.*`.
3. Unificar la lógica de resolución de label en `StatusChip` para usar siempre `getEnumLabel` en lugar de la heurística hardcodeada.

#### Prioridad: Media
#### Riesgo de regresión: Bajo

---

### [SVC-014] `SerialService.startContinuousRead` puede bloquearse indefinidamente

#### Severidad: Alta
#### Categoría: Fiabilidad / Cleanup

#### Descripción

`startContinuousRead` ejecuta un bucle `while` que llama a `await this.reader.read()`. Si la báscula se desconecta sin generar un evento de cierre de stream, `read()` puede quedar bloqueado indefinidamente. El flag `readingLoopActive = false` que usa `stopContinuousRead()` solo evita nuevas iteraciones, pero **no puede interrumpir un `await` ya en curso**.

#### Evidencia

```typescript
// serial.service.ts - líneas 211-245
this.readingLoopActive = true;
while (this.readingLoopActive) {
  try {
    const { value, done } = await this.reader.read(); // ⚠️ puede colgar aquí
    // ...
  }
}

// Y stopContinuousRead solo hace:
public stopContinuousRead(): void {
  this.readingLoopActive = false; // ❌ no desbloquea el await pendiente
}
```

#### Impacto

Al intentar desconectar la báscula, `disconnect()` cancela el reader (`this.reader.cancel()`), lo que sí interrumpe el `read()` pero solo si el flujo de cleanup funciona en el orden correcto. Si `startContinuousRead` se llama desde un componente que se desmonta sin llamar a `disconnect`, el loop seguirá corriendo en background.

#### Solución recomendada

Usar `AbortController` para señalar la cancelación de forma que interrumpa la espera:

```typescript
private abortController: AbortController | null = null;

public async startContinuousRead(onWeight, onError): Promise<void> {
  this.abortController = new AbortController();
  this.readingLoopActive = true;
  while (this.readingLoopActive) {
    const result = await Promise.race([
      this.reader.read(),
      new Promise<never>((_, reject) =>
        this.abortController!.signal.addEventListener('abort', () =>
          reject(new DOMException('Aborted', 'AbortError'))
        )
      ),
    ]);
    // ...
  }
}

public stopContinuousRead(): void {
  this.readingLoopActive = false;
  this.abortController?.abort();
}
```

#### Prioridad: Alta
#### Riesgo de regresión: Bajo (uso encapsulado en BarcodeScanner/seriales)

---

### [SVC-015] `SerialService` usa `@ts-ignore` en `pipeTo`

#### Severidad: Media
#### Categoría: Type Safety

#### Descripción

El método `connect()` usa `@ts-ignore` para suprimir un error de TypeScript en `pipeTo`.

#### Evidencia

```typescript
// serial.service.ts - líneas 121-123
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
this.port.readable.pipeTo(decoder.writable).catch(() => {});
```

#### Impacto

El `@ts-ignore` puede estar ocultando un error real de incompatibilidad de tipos entre `ReadableStream<Uint8Array>` y `WritableStream<Uint8Array>`. Además, la promesa de `pipeTo` se ignora con `.catch(() => {})`, descartando cualquier error silenciosamente.

#### Solución recomendada

```typescript
const decoder = new TextDecoderStream();
const readable = this.port.readable as ReadableStream<Uint8Array>;
readable.pipeTo(decoder.writable).catch((err) => {
  if (this.readingLoopActive) {
    console.warn('SerialService: pipe error', err);
  }
});
this.reader = decoder.readable.getReader();
```

#### Prioridad: Media
#### Riesgo de regresión: Bajo

---

### [SVC-016] `SerialService.writer` declarado pero nunca inicializado

#### Severidad: Baja
#### Categoría: Dead Code

#### Descripción

La clase `SerialService` declara un campo `writer` pero nunca lo asigna en `connect()`. Solo se usa en `disconnect()` para limpieza, donde siempre será `null`.

#### Evidencia

```typescript
// serial.service.ts - línea 5
private writer: WritableStreamDefaultWriter<Uint8Array> | null = null;

// connect() - líneas 98-125: writer nunca se asigna

// disconnect() - líneas 274-282
if (this.writer) {          // siempre null
  await this.writer.abort();
  this.writer.releaseLock();
  this.writer = null;
}
```

#### Impacto

Si en el futuro se añade funcionalidad de escritura al puerto serial sin inicializar correctamente `writer`, las pruebas de cleanup fallarán silenciosamente.

#### Solución recomendada

Eliminar el campo `writer` si no se usa, o implementarlo correctamente en `connect()`.

#### Prioridad: Baja
#### Riesgo de regresión: Ninguno

---

### [SVC-017] `DynamicFormModal` tiene double spread en búsqueda OpenFoodFacts

#### Severidad: Baja
#### Categoría: Dead Code / Calidad

#### Descripción

Al seleccionar un resultado único de OpenFoodFacts, el objeto resultado se spreadeado dos veces.

#### Evidencia

```typescript
// DynamicFormModal.tsx - líneas 857-862
if (results.length === 1) {
  setFormData((prev) => ({
    ...prev,
    ...results[0],
    ...results[0], // ❌ duplicado innecesario
  }));
}
```

#### Impacto

Inofensivo funcionalmente, pero evidencia falta de revisión de código en este bloque.

#### Prioridad: Baja
#### Riesgo de regresión: Ninguno

---

### [SVC-018] `DateRangeFilter` usa API deprecada de MUI v5

#### Severidad: Baja
#### Categoría: Compatibilidad

#### Descripción

`DateRangeFilter` usa `InputLabelProps` e `InputProps` que son props deprecated en MUI v7. La API unificada usa `slotProps`.

#### Evidencia

```typescript
// DateRangeFilter.tsx - líneas 67-75
<TextField
  // ...
  InputLabelProps={{ shrink: true }} // ❌ deprecated en MUI v7
  InputProps={{                       // ❌ deprecated en MUI v7
    startAdornment: (...)
  }}
/>
```

#### Solución recomendada

```typescript
<TextField
  slotProps={{
    inputLabel: { shrink: true },
    input: { startAdornment: (...) },
  }}
/>
```

#### Prioridad: Baja
#### Riesgo de regresión: Bajo

---

### [SVC-019] `SummaryModal` no cancela peticiones al cerrarse

#### Severidad: Media
#### Categoría: Memory Leaks

#### Descripción

`SummaryModal` ejecuta múltiples `Promise.all` paralelos cuando se abre. Si el usuario cierra el modal antes de que terminen, las peticiones continúan y pueden intentar actualizar el estado de un componente en proceso de desmontaje.

#### Evidencia

```typescript
// SummaryModal.tsx - líneas 244-275
const loadData = useCallback(async () => {
  setLoading(true);
  // ...
  const firstPage = await fetchPedidos(1, SUMMARY_PAGE_SIZE, '', estado); // ⚠️ sin AbortSignal
  const remainingPages = await Promise.all(
    // ... múltiples peticiones paralelas sin AbortSignal
  );
  setData(result); // ⚠️ puede ejecutarse tras desmontaje
}, []);

useEffect(() => {
  if (isOpen && type) {
    void loadData(); // ❌ no hay cleanup que cancele loadData
  }
}, [isOpen, type, loadData]);
```

#### Solución recomendada

```typescript
useEffect(() => {
  if (!isOpen || !type) return;
  const controller = new AbortController();
  void loadData(controller.signal);
  return () => controller.abort();
}, [isOpen, type]);
```

Los servicios de datos necesitarían aceptar y propagar el `AbortSignal`.

#### Prioridad: Media
#### Riesgo de regresión: Medio

---

### [SVC-020] `ReporteSelectorModal` tiene `console.log` en producción

#### Severidad: Baja
#### Categoría: Calidad / Información sensible

#### Descripción

```typescript
// ReporteSelectorModal.tsx - líneas 91-93
fetchProveedoresConPedidos()
  .then((res: Proveedor[]) => {
    console.log('ReporteSelectorModal - fetched providers with orders:', res); // ❌
    setProveedores(res || []);
  })
```

Este log imprime la lista completa de proveedores con pedidos en la consola del navegador, visible para cualquier usuario con DevTools abierto.

#### Prioridad: Baja
#### Riesgo de regresión: Ninguno

---

### [SVC-021] `PageToolbar` y `DetailModal` tienen strings hardcoded sin i18n

#### Severidad: Baja
#### Categoría: i18n

#### Descripción

Varios valores por defecto están hardcoded en español sin pasar por i18n:

#### Evidencia

```typescript
// PageToolbar.tsx - líneas 140-147
searchPlaceholder = 'Buscar...', // ❌ hardcoded español
totalItemsLabel = 'elementos',   // ❌ hardcoded español

// DetailModal.tsx - línea 115
editLabel = 'Editar', // ❌ hardcoded
```

#### Solución recomendada

Usar claves i18n como valores por defecto dentro del componente, no en la firma de la función:

```typescript
const resolvedEditLabel = editLabel ?? t('comun.editar');
const resolvedSearchPlaceholder = searchPlaceholder ?? t('comun.buscar');
```

#### Prioridad: Baja
#### Riesgo de regresión: Ninguno

---

### [SVC-022] `AccessibleDialog.openDialogCount` es variable de módulo compartida

#### Severidad: Baja
#### Categoría: Testing / Aislamiento

#### Descripción

```typescript
// AccessibleDialog.tsx - línea 28
let openDialogCount = 0; // variable de módulo (singleton)
```

Esta variable persiste entre tests si los módulos no se reinician. En testing con Vitest, puede causar que el estado `inert` del `#root` permanezca activo entre tests, rompiendo pruebas posteriores que dependan de la interactividad del DOM.

#### Solución recomendada

Exportar una función `resetDialogCount()` para uso en tests, o usar un mecanismo basado en el DOM (e.g., `data-` attributes count) en lugar de una variable de módulo.

#### Prioridad: Baja
#### Riesgo de regresión: Solo en entorno de tests

---

### [SVC-023] `DynamicFormModal` incluye `fields` en dependencias del useEffect de reset, contradiciendo el comentario

#### Severidad: Baja
#### Categoría: Performance

#### Descripción

```typescript
// DynamicFormModal.tsx - líneas 254-256
// Eliminamos 'fields' y 'onValuesChange' de las dependencias para evitar re-renders accidentales
// 'initialData' se queda para detectar cambios de entidad (IDs)
}, [fields, initialData, isOpen, onValuesChange]); // ❌ fields Y onValuesChange SÍ están incluidos
```

El comentario dice que se eliminaron estas dependencias, pero el array de dependencias las incluye. Esto causa re-renders no deseados del efecto cuando el padre re-renderiza con nuevas referencias de `fields` (array literal).

#### Impacto

Si el componente padre pasa `fields={[...]}` como literal en cada render, el formulario se resetea innecesariamente, borrando datos introducidos por el usuario.

#### Prioridad: Baja
#### Riesgo de regresión: Bajo

---

## Inconsistencias Frontend/Backend

| Área | Problema | Impacto |
|------|---------|---------|
| `ApiResponse.success` | Backend retorna `{ success, message, data }` pero `types/usuario.ts` lo define como `success?: boolean` | Type mismatch silencioso |
| `ApiResponse.statusCode` | El contexto del proyecto menciona `{ statusCode, message, data }` pero `ApiResponse` tiene `success`, no `statusCode` | Inconsistencia con la documentación |
| `PaginatedResponse` en `types/usuario.ts` | Define `pageSize` pero el backend retorna `limit` | Acceso a campo incorrecto |
| `Usuario.rol` como `string` | El tipo define `rol: string`, pero el backend puede devolver un objeto `{ id, nombre }` dependiendo de la consulta | Crash en runtime |
| `StatusChip` y estados de `preparacion` | Los estados `PreparacionEstado.PENDIENTE`, `EN_PROCESO`, `COMPLETADA` no tienen colores definidos en `getStatusColor` para sus valores exactos | Chips con color `default` |

---

## Riesgos Potenciales Futuros

1. **Crecimiento de `DynamicFormModal`**: Con 14 tipos de campo y lógica de validación, dirección de campos e integración con OpenFoodFacts, este componente ya es complejo. Añadir más tipos sin refactorizarlo puede hacerlo inmanejable.

2. **Redux + sherlock-auth duplicación de permisos**: El `permissionsSlice` define acciones para gestionar permisos, pero `usePermission` viene de `sherlock-auth`. Si ambos sistemas coexisten sin sincronización explícita, los permisos podrían divergir en runtime.

3. **`buildQueryParams` con `maxLimit: 50`**: El límite máximo de 50 registros en `buildQueryParams` puede ser demasiado restrictivo para módulos de administración que necesiten listas completas. Podría requerir una vía de escape para operaciones específicas.

4. **Web Serial API**: La API Serial solo está disponible en Chrome/Edge. `SerialService.isSupported()` devuelve `false` en Firefox y Safari, pero los componentes que la usan no siempre muestran mensajes de "no soportado" al usuario.

5. **Encoding en `DataTable.tsx`**: Los comentarios JSDoc muestran caracteres `?` donde deberían aparecer tildes (problema de encoding del archivo en la última edición). Aunque no afecta el comportamiento, indica que el archivo fue editado con encoding incorrecto y podría empeorar.

---

## Deuda Técnica

| Deuda | Esfuerzo estimado | Beneficio |
|-------|-----------------|---------|
| Unificar lógica de descarga en `DownloadService` | S (2-4h) | Alto |
| Corregir interpolación i18n `{count}` → `{{count}}` | XS (30min) | Alto |
| Reemplazar keys de filas en DataTable | XS (15min) | Medio |
| Migrar `DetailModal` y `SummaryModal` a `AccessibleDialog` | S (2h) | Alto (accesibilidad) |
| Añadir timeout a `baseFetch` | S (2h) | Alto |
| Unificar `ApiResponse<T>` en un solo tipo | S (3h) | Alto |
| Completar dominios i18n en `enumPresentation.ts` | S (2h) | Medio |
| Eliminar props voideadas en DataTable (`filters`, `onFilter`) o implementarlas | M (4-8h si se implementa) | Medio |
| Añadir AbortController a `SerialService.startContinuousRead` | S (2h) | Alto |
| Eliminar aliases de query duplicados en `useDataTable` | S (2h + QA) | Medio |
| Sincronización de filtros con URL en `useDataTable` | L (1-2 días) | Alto |

---

## Conclusión

La capa de servicios de SmartEconomat está bien pensada arquitecturalmente: `baseFetch` centralizado con validación de contratos, `ApiError` tipado, retry diferenciado por verbo HTTP, y eventBus para el 401 son decisiones correctas y maduras.

Los hallazgos críticos son puntuales y corregibles sin refactorizaciones grandes:

1. **Inmediatos** (esta semana): Corrección de interpolación i18n (`{count}` → `{{count}}`), unificación de `ApiResponse<T>`, corrección de keys en DataTable.
2. **Corto plazo** (próximo sprint): Timeout en `baseFetch`, migración de `DetailModal`/`SummaryModal` a `AccessibleDialog`, consolidación de lógica de descarga.
3. **Medio plazo**: Resolver el SerialService blocking, eliminar aliases duplicados en `useDataTable`, completar dominios i18n.

La calidad general es suficiente para un entorno de producción académico/profesional, pero los riesgos de memory leak (peticiones sin cancel) y accesibilidad (diálogos sin focus trap) deben abordarse antes de un despliegue con usuarios con necesidades especiales.
