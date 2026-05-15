# Auditoría Técnica Completa — Módulo Merma

> **Fecha:** 2026-05-13  
> **Auditor:** Equipo de ingeniería senior (Staff-level)  
> **Alcance:** módulo merma (frontend + backend), contratos API, integración producción, integración inventario  
> **Versión analizada:** commit snapshot 2026-05-13

---

## Resumen Ejecutivo

El módulo merma tiene una base arquitectónica sólida —idempotencia, FIFO, transacciones, permisos— pero contiene **un bug funcional crítico**: los filtros que el frontend envía al listado (`motivo`, `startDate`, `endDate`) son silenciosamente ignorados por el backend. El usuario cree estar filtrando; no está filtrando. Este solo fallo invalida la principal funcionalidad de análisis del módulo.

Adicionalmente: el tipo de retorno de `getStats` es `unknown[]` con datos que en runtime son strings PostgreSQL donde el contrato dice `number`; la página de Mermas descarga estadísticas globales en cada cambio de página; el frontend nunca genera `idempotencyKey` pese a que el backend lo soporta; y se usa `alert()` nativo para mostrar notas.

El resto del código —FIFO, locks, idempotencia, permisos, DTOs— está bien implementado.

**Nivel de riesgo global: ALTO**  
El módulo no debe lanzarse a producción con el bug de filtros activo.

### Fortalezas reales

- Idempotencia correctamente implementada con doble check + manejo de race condition por violación única.
- FIFO con `pessimistic_write` lock bien ejecutado.
- Separación limpia de `create` / `createFromProduccion` como use-cases distintos.
- Permisos granulares por acción (`merma:crear`, `merma:listar`, `merma:stats`, `merma:ver`).
- DTOs con validaciones completas (`@IsUUID`, `@Min(0.001)`, `@MaxLength`, `@Matches` para `origenEntidad`).
- KPI con ventana temporal, filtro por producto y porcentaje calculado.
- Test e2e de idempotencia real contra base de datos.

---

## Métricas Generales

| Dimensión | Puntuación |
|-----------|-----------|
| Arquitectura backend | Buena |
| Arquitectura frontend | Aceptable |
| Mantenibilidad | Aceptable |
| Escalabilidad | Deficiente |
| Seguridad | Aceptable |
| Performance | Deficiente |
| Coherencia de dominio | Aceptable |
| Tipado | Deficiente |
| Resiliencia | Aceptable |
| Claridad del código | Aceptable |
| Cobertura de tests | Deficiente |

---

## Hallazgos

---

### [MERMA-01] Los filtros del listado son completamente ignorados por el backend

#### Severidad
Crítica

#### Categoría
API / Backend / Frontend

#### Descripción

El frontend envía tres parámetros de filtro al endpoint `GET /merma`:

```typescript
// merma.service.ts (frontend) – líneas 19-31
const search = buildQueryParams({
  page: params?.page,
  limit: params?.limit,
  sortBy: params?.sortBy,
  order: params?.order,
  motivo: params?.motivo,      // ← enviado
  startDate: params?.startDate, // ← enviado
  endDate: params?.endDate,     // ← enviado
}, 20, 50);
```

El backend recibe `PaginationQueryDto` y el decorador `@SortableFields` usa `plainToInstance` con `whitelist: true`:

```typescript
// sortable-fields.decorator.ts – línea 57-59
const transformedQuery = plainToInstance(dtoClass, normalizedQuery);
const errors = validateSync(transformedQuery as object, {
  whitelist: true,        // ← strip de campos no declarados
  forbidNonWhitelisted: false,
});
```

`PaginationQueryDto` **no declara `motivo`**. Lo más parecido son `fechaDesde`/`fechaHasta` para fechas, pero el frontend envía `startDate`/`endDate` (nombres distintos). Resultado: los tres campos quedan fuera de la instancia DTO transformada.

El servicio `findAll` no aplica ningún filtro adicional:

```typescript
// merma.service.ts (backend) – líneas 199-204
const [data, total] = await this.mermaRepository.findAndCount({
  relations: ['producto', 'usuario'],
  order: { [sortBy]: order },
  skip: (page - 1) * limit,
  take: limit,
  // ← cero WHERE clauses
});
```

#### Riesgo real

El usuario selecciona motivo "hurto" y espera ver solo las mermas por hurto. Recibe todas las mermas. Toma decisiones operativas (investigar pérdidas, alertas de seguridad) sobre datos incorrectos.

#### Evidencia

1. `PaginationQueryDto` no tiene campo `motivo` (confirmado en `pagination-query.dto.ts`).
2. `PaginationQueryDto` tiene `fechaDesde`/`fechaHasta`/`dateFrom`/`dateTo`, pero el frontend envía `startDate`/`endDate` (nombres distintos, sin mapping).
3. El servicio `findAll` usa `findAndCount` sin cláusulas WHERE adicionales.
4. El decorador aplica `whitelist: true` que elimina silenciosamente campos no declarados.

#### Impacto

- **UX**: Filtros completamente inoperantes. Los usuarios no lo saben.
- **Negocio**: Análisis de mermas por tipo es la funcionalidad principal del módulo. No funciona.
- **Confianza**: Si se detecta en producción, invalida los informes previos generados.

#### Solución recomendada

1. Añadir campos a `PaginationQueryDto` o crear `MermaQueryDto extends PaginationQueryDto`:

```typescript
export class MermaQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(MotivoMerma)
  motivo?: MotivoMerma;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
```

2. Modificar `findAll` en el servicio para aplicar los filtros con `createQueryBuilder`.
3. Actualizar el controlador para usar `MermaQueryDto`.
4. Alinear nombres frontend (`startDate`/`endDate`) o adaptar el DTO.

#### Prioridad recomendada
Inmediata

#### Riesgo de regresión
Bajo (solo afecta el endpoint `GET /merma`, lógica aditiva)

---

### [MERMA-02] `getStats` retorna `unknown[]` — strings de PostgreSQL donde el contrato dice `number`

#### Severidad
Alta

#### Categoría
TypeScript / API / Backend

#### Descripción

El servicio declara:

```typescript
// merma.service.ts – línea 363
async getStats(): Promise<{ porMotivo: unknown[]; porProducto: unknown[] }>
```

La consulta PostgreSQL devuelve `COUNT(*)` y `SUM(...)` como **strings** (comportamiento estándar de `pg`). El backend NO hace conversión numérica antes de retornar (a diferencia de `getKpis` que sí hace `Number(...)`).

El frontend declara:

```typescript
// merma.types.ts – líneas 64-76
export interface MermaStats {
  porMotivo: Array<{
    motivo: MotivoMerma;
    totalRegistros: number; // ← dice number
    totalCantidad: number;  // ← dice number
  }>;
  // ...
}
```

El componente `MermaStats.tsx` lo maneja con `Number(curr.totalCantidad)`, lo que enmascara el problema pero no lo resuelve.

Contraste con `getKpis` donde sí hay conversión explícita:

```typescript
// merma.service.ts – líneas 342-350
porTipo: porTipoRaw.map((item) => ({
  tipo: item.tipo,
  totalRegistros: Number(item.totalRegistros), // ← correcto
  totalCantidad: Number(item.totalCantidad),   // ← correcto
})),
```

#### Riesgo real

Cualquier uso futuro de `stats.porMotivo[n].totalCantidad` sin conversión explícita producirá concatenaciones de strings en lugar de sumas. TypeScript no advertirá porque el tipo dice `number`.

#### Evidencia

- `getStats` usa `.getRawMany()` sin mapeo numérico.
- Tipo de retorno `unknown[]` es honesto sobre la opacidad, pero incoherente con el tipo frontend.
- `MermaStats.tsx` hace `Number(curr.totalCantidad)` porque el dato real es string.

#### Impacto

- **Técnico**: Contrato roto entre backend y frontend. Cualquier refactor futuro que elimine el `Number()` del componente producirá bugs silenciosos.
- **Mantenibilidad**: `unknown[]` no comunica la forma del dato. Nadie sabe qué campos existen sin leer la query.

#### Solución recomendada

Crear interface explícita y mapear en el servicio igual que en `getKpis`:

```typescript
interface StatsByMotivo {
  motivo: MotivoMerma;
  totalRegistros: number;
  totalCantidad: number;
}
interface StatsByProducto {
  productoId: string;
  productoNombre: string;
  totalRegistros: number;
  totalCantidad: number;
}

async getStats(): Promise<{ porMotivo: StatsByMotivo[]; porProducto: StatsByProducto[] }> {
  const porMotivoRaw = await ...getRawMany<{ motivo: string; totalRegistros: string; totalCantidad: string }>();
  return {
    porMotivo: porMotivoRaw.map(r => ({
      motivo: r.motivo as MotivoMerma,
      totalRegistros: Number(r.totalRegistros),
      totalCantidad: Number(r.totalCantidad),
    })),
    // ...
  };
}
```

Exportar el tipo para que el frontend lo use directamente.

#### Prioridad recomendada
Alta

#### Riesgo de regresión
Bajo

---

### [MERMA-03] El frontend nunca genera `idempotencyKey` — duplicados posibles

#### Severidad
Alta

#### Categoría
Frontend / Estado / Resiliencia

#### Descripción

El backend soporta idempotencia completa con verificación doble y manejo de race condition por unique constraint. Sin embargo, el frontend nunca genera ni envía `idempotencyKey` en ninguno de los dos flujos de creación:

**Merma manual desde Mermas.tsx:**

```typescript
// Mermas.tsx – líneas 177-183
await createMerma({
  productoId: String(formData.productoId),
  cantidad: Number(formData.cantidad),
  motivo: formData.motivo as MotivoMerma,
  notas: formData.notas as string | undefined,
  // ← idempotencyKey: no enviada
});
```

**Merma desde Preparaciones.tsx:**

```typescript
// Preparaciones.tsx – líneas 567-573
await createMermaProduccion({
  produccionLoteId: mermaLote.id,
  productoId: mermaProductoId,
  cantidad: mermaCantidad,
  motivo: mermaMotivo,
  notas: mermaNotas.trim() || undefined,
  // ← idempotencyKey: no enviada
});
```

Agravante: el test e2e `merma-produccion.e2e-spec.ts` demuestra que la idempotencia FUNCIONA correctamente con clave, validando así el backend. El frontend simplemente no la usa.

#### Riesgo real

Si el usuario hace doble clic en "Registrar", si hay un timeout de red con reintento automático, o si el componente se remonta, se registran dos mermas idénticas descontando stock dos veces.

#### Evidencia

- `CreateMermaPayload` y `CreateMermaProduccionPayload` tienen `idempotencyKey?: string`.
- Ambos flujos de creación omiten el campo.
- El test e2e confirma la idempotencia con la clave explícita.

#### Impacto

- **Negocio**: Doble descuento de stock sin merma real. Genera incidencias de inventario.
- **UX**: El botón de guardar tiene un spinner (`isSaving`/`isSubmittingMerma`), pero no previene doble envío si el usuario desmonta y remonta el componente.
- **Resiliencia**: Sin clave de idempotencia, los reintentos HTTP son destructivos.

#### Solución recomendada

Generar la clave en el frontend antes de enviar la petición usando `crypto.randomUUID()`:

```typescript
const key = crypto.randomUUID();
await createMerma({
  productoId: ...,
  cantidad: ...,
  motivo: ...,
  idempotencyKey: key,
});
```

Para el flujo de Preparaciones, generar la clave al abrir el diálogo de merma (no al submit) para que los reintentos usen la misma clave de la sesión del diálogo.

#### Prioridad recomendada
Alta

#### Riesgo de regresión
Bajo

---

### [MERMA-04] `usuarioId: string | number` en el tipo frontend es incorrecto

#### Severidad
Alta

#### Categoría
TypeScript / Dominio

#### Descripción

```typescript
// merma.types.ts – línea 27
export interface Merma {
  usuarioId: string | number;  // ← number nunca ocurre
  // ...
}
```

El backend siempre emite UUID v7 (string). La entidad backend declara:

```typescript
// merma.entity.ts – línea 24-25
@Column({ name: 'usuario_id', nullable: true })
usuarioId?: string;
```

El `| number` es un artifact que nunca ocurre en runtime. Contaminó a `Merma` desde alguna copia de otro tipo (posiblemente `PedidoProducto` o similar que tenía IDs numéricos en una versión anterior).

#### Riesgo real

Código futuro que haga `merma.usuarioId.padStart(...)` o cualquier operación string es inseguro a nivel de tipos. TypeScript exigirá `typeof merma.usuarioId === 'string'` antes, añadiendo ruido inútil.

#### Evidencia

- `merma.entity.ts`: `usuarioId?: string`
- `merma.types.ts`: `usuarioId: string | number`

#### Solución recomendada

```typescript
usuarioId?: string; // UUID v7, opcional (puede ser null si el usuario fue eliminado)
```

Cambiar a `string | undefined` alineado con la entidad backend.

#### Prioridad recomendada
Alta

#### Riesgo de regresión
Bajo — cambio de tipo, no de lógica

---

### [MERMA-05] `getStats` es una query sin límite sobre toda la tabla — bomba de performance

#### Severidad
Alta

#### Categoría
Performance / Escalabilidad

#### Descripción

`getStats` ejecuta dos agregaciones sin ningún límite temporal ni de registros:

```typescript
// merma.service.ts – líneas 364-385
const porMotivo = await this.mermaRepository
  .createQueryBuilder('m')
  .select('m.motivo', 'motivo')
  .addSelect('COUNT(*)', 'totalRegistros')
  .addSelect('SUM(m.cantidad)', 'totalCantidad')
  .where('m.deleted_at IS NULL')  // ← sin ventana temporal
  .groupBy('m.motivo')
  .orderBy('"totalCantidad"', 'DESC')
  .getRawMany();                   // ← sin LIMIT

const porProducto = await this.mermaRepository  // ← potencialmente miles de productos
  .createQueryBuilder('m')
  .innerJoin('m.producto', 'p')
  // ...
  .getRawMany();                   // ← sin LIMIT
```

Además, en Mermas.tsx esta query se llama **en cada cambio de paginación, sort o filtro**:

```typescript
// Mermas.tsx – líneas 92-95
const [mermasData, statsData] = await Promise.all([
  fetchMermas(params),
  fetchMermaStats(), // ← se lanza aunque no hayan cambiado las estadísticas
]);
```

#### Riesgo real

Con 50.000 registros de merma y 2.000 productos, la query `porProducto` produce 2.000 filas por respuesta. En producción con 5 usuarios viendo la página simultáneamente, esto es 10 queries full-scan simultáneas sin caché.

#### Evidencia

- `getStats` no tiene fecha desde/hasta.
- El endpoint `/merma/stats` no tiene rate limiting declarado.
- `fetchMermaStats()` se llama en cada iteración de `loadData`.
- A diferencia, `getKpis` tiene `validateDateRange(query.startDate, query.endDate, 365, 'Mermas')`.

#### Impacto

- **Escalabilidad**: El módulo no escala. En producción real con crecimiento de datos, el endpoint colapsará.
- **Costes**: Queries costosas en cada interacción del usuario.

#### Solución recomendada

1. Añadir ventana temporal por defecto en `getStats` (últimos 90 días).
2. Añadir LIMIT a `porProducto` (top 20 productos por merma).
3. Separar la carga de stats en Mermas.tsx: cargar una vez al montar, no en cada cambio de página.
4. Considerar caché con TTL de 5 minutos para stats (NestJS `CacheModule` o Redis).

#### Prioridad recomendada
Alta

#### Riesgo de regresión
Medio — cambio de comportamiento visible en el dashboard

---

### [MERMA-06] `mermaSchema` singleton inicializado en tiempo de módulo — i18n race condition y sin reactividad a cambio de idioma

#### Severidad
Alta

#### Categoría
Frontend / Estado / i18n

#### Descripción

```typescript
// schemas.ts – líneas 18-56
export function getMermaSchema(): DynamicField[] {
  const t = i18n.t.bind(i18n);  // ← snapshot del estado i18n en tiempo de import
  return [
    { name: 'productoId', label: t('merma.form.producto'), ... },
    // ...
    { options: Object.values(MotivoMerma).map((value) => ({
        label: getEnumLabel(i18n.t.bind(i18n), 'mermaMotivo', value),  // ← snapshot
      }))
    },
  ];
}

export const mermaSchema: DynamicField[] = getMermaSchema(); // ← ejecutado al importar
```

El singleton se crea en el momento que el módulo es importado por primera vez. Si i18n no está completamente inicializado (en tests, en SSR, o en cold start con lazy loading), las labels serán claves raw (`merma.form.producto`) o cadenas vacías.

Además, si el usuario cambia de idioma en tiempo de ejecución, el `mermaSchema` singleton NO se actualiza. Los labels del formulario quedan en el idioma original.

En `InventoryDetailModal.tsx`, el `dynamicMermaSchema` usa `React.useMemo` pero con dependencias incorrectas:

```typescript
// InventoryDetailModal.tsx – línea 512-529
const dynamicMermaSchema: DynamicField[] = React.useMemo(
  () =>
    mermaSchema.map((field) => {
      // ... solo sobreescribe productoId options
    }),
  [isSearchingProductos, productoId, productosOptions, searchMermaProductos]
  // ← mermaSchema no está en deps porque es "estático", pero no lo es del todo
);
```

#### Riesgo real

En una app multi-idioma, el formulario de merma no responde al cambio de idioma. En CI/test, si los tests importan el módulo antes de que i18n cargue, las labels son claves.

#### Solución recomendada

Mover a hook o factory reactiva que se ejecute dentro del ciclo de vida de React:

```typescript
// En Mermas.tsx y InventoryDetailModal.tsx
const { t } = useTranslation();
const mermaFields = useMemo(() => getMermaSchema(t), [t]);
```

Y modificar `getMermaSchema` para aceptar `t` como parámetro.

#### Prioridad recomendada
Alta

#### Riesgo de regresión
Bajo

---

### [MERMA-07] `createFromProduccion` no valida el estado del `ProduccionLote`

#### Severidad
Media

#### Categoría
Dominio / Backend

#### Descripción

El servicio valida que el lote existe y que el producto es ingrediente de la receta, pero no verifica el estado del lote:

```typescript
// merma.service.ts – líneas 144-163
const lote = await this.produccionLoteRepository.findOne({
  where: { id: dto.produccionLoteId },
});

if (!lote) {
  throw new NotFoundException(I18nHelper.getError('MERMA_LOTE_NOT_FOUND'));
}
// ← no hay check de lote.estado
```

Un `ProduccionLote` en estado `CANCELADO` o `COMPLETADO` puede recibir mermas sin restricción. Esto produce registros de merma en producción huérfanos o históricamente incorrectos.

#### Riesgo real

Registros de merma asociados a lotes cancelados invalidan las estadísticas de ratio de merma por producción. Si se permite reportar merma en lotes completados días después, el sistema pierde trazabilidad temporal.

#### Evidencia

- `ProduccionLote` tiene enum `EstadoLote` con estados `ACTIVO`, `COMPLETADO`, `CANCELADO`, etc.
- El servicio solo comprueba existencia, no estado.
- El test e2e no prueba este caso.

#### Solución recomendada

```typescript
const lote = await this.produccionLoteRepository.findOne({
  where: { id: dto.produccionLoteId },
});

if (!lote) throw new NotFoundException(...);

if (lote.estado === EstadoLote.CANCELADO) {
  throw new BadRequestException(I18nHelper.getError('MERMA_LOTE_CANCELADO'));
}
```

Decidir si también bloquear lotes `COMPLETADO` (debatible — la merma podría descubrirse post-producción).

#### Prioridad recomendada
Media

#### Riesgo de regresión
Bajo

---

### [MERMA-08] `alert()` nativo para mostrar notas de merma

#### Severidad
Media

#### Categoría
UX / Frontend / Accesibilidad

#### Descripción

```typescript
// MermasTable.tsx – líneas 132-136
onRowClick={(row) => {
  if (row.notas) {
    alert(`${t('merma.tabla.notas')}: ${row.notas}`);  // ← nativo alert
  }
}}
```

`window.alert()` es un dialog bloqueante del hilo principal, no estilizable, no accesible con ARIA, incompatible con testing automatizado (Playwright/Jest deben stubear `window.alert`), no respeta el tema de la app, no permite copiar el texto en todos los navegadores, y en muchos contextos (iframes, PWA) está deshabilitado.

Además, filas sin notas son completamente no-interactivas visualmente pero tienen `onRowClick` — el usuario no sabe si una fila es clicable.

#### Evidencia

- `MermasTable.tsx` línea 134.
- No hay Dialog, Drawer, ni Tooltip para notas en toda la tabla.
- `getRowAriaLabel` retorna string vacío para filas sin notas, correcto; pero no hay indicador visual de "esta fila tiene notas".

#### Solución recomendada

Usar un `Dialog` de MUI o un `Tooltip` con el texto de notas. Añadir un icono `NotesIcon` en la fila cuando `row.notas` existe, como indicador visual.

#### Prioridad recomendada
Media

#### Riesgo de regresión
Bajo

---

### [MERMA-09] Stats globales descargadas en cada cambio de paginación/sort/filtro

#### Severidad
Media

#### Categoría
Performance / Frontend

#### Descripción

```typescript
// Mermas.tsx – líneas 92-95
const [mermasData, statsData] = await Promise.all([
  fetchMermas(params),    // ← cambia con filtros/página
  fetchMermaStats(),      // ← NO cambia con filtros/página, pero se llama igual
]);
```

`fetchMermaStats()` devuelve estadísticas globales (totales de toda la base de datos). Estas no dependen de los parámetros de paginación. Sin embargo, se recargan en cada interacción:

- Cambio de página → 2 requests
- Cambio de sort → 2 requests
- Cambio de filtro → 2 requests

En una sesión normal de 5 minutos de revisión (5 páginas, 3 sorts), esto son 16 requests al endpoint de stats, cada uno con una query full-scan sin caché.

#### Solución recomendada

Separar el `useEffect` de stats del de listado:

```typescript
useEffect(() => {
  void loadStats(); // solo al montar el componente
}, []); // sin queryParams en deps

useEffect(() => {
  void loadMermas();
}, [queryParams, tableFilters]);
```

#### Prioridad recomendada
Media

#### Riesgo de regresión
Bajo

---

### [MERMA-10] Colisión semántica `TipoMerma.ROTURA` / `MotivoMerma.ROTURA` con el mismo valor string

#### Severidad
Media

#### Categoría
Dominio / TypeScript

#### Descripción

```typescript
// merma.enums.ts
export enum MotivoMerma {
  ROTURA = 'rotura', // ← mismo valor string
}

export enum TipoMerma {
  ROTURA = 'rotura', // ← mismo valor string
}
```

Dos enums distintos comparten el valor string `'rotura'`. Esto no es un bug en sí mismo (TypeScript distingue los tipos), pero en contextos de serialización/deserialización JSON (o con `as` casts), es posible asignar un `MotivoMerma` donde se espera un `TipoMerma` sin error de compilación.

Adicional: la función `resolveTipoMerma` mapea `MotivoMerma.HURTO` → `TipoMerma.INVENTARIO`. Hurto y inventario son categorías conceptualmente opuestas — hurto es pérdida externa, inventario es ajuste interno. Esto distorsiona las estadísticas `porTipo`.

```typescript
// merma.service.ts – líneas 580-591
private resolveTipoMerma(motivo: MotivoMerma): TipoMerma {
  switch (motivo) {
    case MotivoMerma.ROTURA: return TipoMerma.ROTURA;
    case MotivoMerma.DETERIORO: return TipoMerma.CADUCIDAD;
    case MotivoMerma.ERROR_PREPARACION: return TipoMerma.PRODUCCION;
    default: return TipoMerma.INVENTARIO; // ← HURTO y OTROS → INVENTARIO
  }
}
```

`TipoMerma.RECEPCION` no tiene ningún motivo que mapee a él via `resolveTipoMerma`. Solo se puede asignar explícitamente via DTO. Esto crea un valor de enum prácticamente inaccesible en el flujo automático.

#### Impacto

- **Dominio**: Las estadísticas `porTipo` agrupan hurto como "inventario", ocultando el hurto en el dashboard.
- **Seguridad**: El log de seguridad (`logHighValueMerma`) se activa por cantidad ≥ 50 sin considerar el tipo. Un ajuste de inventario de 100kg aparece igual de sospechoso que un hurto de 100kg.

#### Solución recomendada

Añadir `TipoMerma.HURTO` para mapear `MotivoMerma.HURTO` correctamente. Revisar si `TipoMerma.RECEPCION` tiene un caso de uso real o debe eliminarse.

#### Prioridad recomendada
Media

#### Riesgo de regresión
Medio — afecta estadísticas existentes

---

### [MERMA-11] `fetchMermas` fallback con `total = data.length` rompe la paginación

#### Severidad
Media

#### Categoría
Frontend / API

#### Descripción

```typescript
// merma.service.ts (frontend) – líneas 55-63
if (Array.isArray(body.data)) {
  return {
    data: body.data,
    total: body.data.length, // ← total incorrecto para paginación
    page: params?.page ?? 1,
    limit: params?.limit ?? 10,
    totalPages: 1,            // ← siempre 1 página
  };
}
```

Si por alguna razón el endpoint devuelve un array directo en `body.data`, la paginación calcula `totalPages: 1` independientemente de cuántos registros existan en la base de datos. El usuario no puede navegar a páginas posteriores.

Este path de código sugiere que en algún momento el API respondía así, o que es defensivo frente a un bug. En ambos casos indica una inconsistencia histórica no resuelta.

#### Solución recomendada

Eliminar el path `Array.isArray` o lanzar error si el backend responde en formato inesperado, para detectar el problema en desarrollo en lugar de silenciarlo.

#### Prioridad recomendada
Media

#### Riesgo de regresión
Bajo

---

### [MERMA-12] Naming mismatch fechas — frontend envía `startDate`/`endDate`, backend espera `fechaDesde`/`fechaHasta`

#### Severidad
Media

#### Categoría
API / Inconsistencia Frontend/Backend

#### Descripción

`PaginationQueryDto` define aliases de fecha:

```typescript
fechaDesde?: string;  // o dateFrom
fechaHasta?: string;  // o dateTo
```

El frontend `MermasQueryParams` y `buildMermasQueryString` envían:

```typescript
startDate: params?.startDate,
endDate: params?.endDate,
```

`startDate` y `endDate` no aparecen en `PaginationQueryDto`. Incluso si el servicio `findAll` se arreglara para filtrar por fecha, los nombres de parámetros nunca llegarían al DTO.

Nótese que `MermaKpiQueryDto` también usa `startDate`/`endDate` (correcto para ese DTO específico), mientras que `PaginationQueryDto` usa nombres distintos. Existe dualidad de convención dentro del mismo proyecto.

#### Solución recomendada

Al implementar `MermaQueryDto` (ver MERMA-01), usar consistentemente `startDate`/`endDate` alineados con el frontend, o documentar la convención única a usar en toda la app.

#### Prioridad recomendada
Media

#### Riesgo de regresión
Bajo

---

### [MERMA-13] `logHighValueMerma` usa umbral de 50 sin unidad ni contexto de producto

#### Severidad
Media

#### Categoría
Seguridad / Dominio

#### Descripción

```typescript
// merma.service.ts – líneas 665-670
private logHighValueMerma(merma: Merma, userId: string): void {
  if (merma.cantidad >= MERMA_UMBRAL_ALTO) { // MERMA_UMBRAL_ALTO = 50
    this.logger.warn(`[SECURITY] Merma de alto valor...`);
  }
}
```

El umbral de 50 es adimensional. `50 unidades` de sal de cocina (producto barato, granel) es normal. `50 unidades` de foie gras o langosta es una pérdida catastrófica. El sistema trata ambos casos igual.

Además, `logHighValueMerma` se llama **fuera de la transacción** —después de `registerMerma` pero antes de que el caller haga cualquier error handling adicional. Si la transacción fallara por algún motivo post-commit (edge case en errores de red), el log ya se emitió aunque la merma no se persistió.

#### Impacto

- **Seguridad**: El sistema de alertas produce demasiados falsos positivos con granel, o no detecta pérdidas valiosas bajo el umbral.

#### Solución recomendada

Evaluar alertas basadas en `producto.pmp * merma.cantidad` (valor monetario) en lugar de cantidad física. Mover `logHighValueMerma` dentro de la transacción o ejecutarlo condicionalmente solo si `registerMerma` tuvo éxito real.

#### Prioridad recomendada
Media

#### Riesgo de regresión
Bajo

---

### [MERMA-14] `MermaStats` muestra total de cantidad sin unidad — número sin significado

#### Severidad
Media

#### Categoría
UX / Dominio

#### Descripción

```tsx
// MermaStats.tsx – línea 77
<Typography variant="h4" fontWeight={700}>
  {totalCantidad.toFixed(2)}  {/* ← sin unidad */}
</Typography>
```

`totalCantidad` es la suma de `cantidad` de mermas de productos heterogéneos: KG de carne, L de aceite, unidades de huevos. La suma es matemáticamente correcta pero semánticamente sin sentido. "42.50" no comunica nada operativo.

Mismo problema en el gráfico de distribución por motivo: el porcentaje se calcula sobre una suma de unidades mixtas.

#### Solución recomendada

En lugar de totalizar cantidades, totalizar el **valor económico** (`cantidad * producto.pmp`) o presentar los totales **por unidad de medida** agrupados. Al menos añadir "(unidades mixtas)" como disclaimer.

#### Prioridad recomendada
Media

#### Riesgo de regresión
Bajo

---

### [MERMA-15] Test coverage del servicio extremadamente limitada

#### Severidad
Media

#### Categoría
Testing / Calidad

#### Descripción

`merma.service.spec.ts` solo cubre 3 casos:

1. Idempotencia retorna existente.
2. Lote no encontrado.
3. Ingrediente no en receta.

**Casos no cubiertos:**

- `findAll` paginación y límites.
- `getStats` — ningún test.
- `getKpis` — ningún test.
- `consumeInventoryByProduct` — stock insuficiente, stock exacto, FIFO multi-lote.
- `resolveTipoMerma` — todos los motivos.
- `create` sin idempotencyKey.
- `create` con producto eliminado (soft-delete).
- `logHighValueMerma` — umbral límite.
- Manejo de `QueryFailedError` no relacionado con unique violation.
- Transacción que falla a mitad (Inventario guarda pero Movimiento no).

El test e2e compensa parcialmente, pero los unit tests son la red de seguridad de regresión.

#### Prioridad recomendada
Media

#### Riesgo de regresión
Alto (sin tests, cualquier refactor es ciego)

---

### [MERMA-16] `order?: 'ASC' | 'DESC' | 'asc' | 'desc'` en `MermasQueryParams` — union innecesariamente permisiva

#### Severidad
Baja

#### Categoría
TypeScript

#### Descripción

```typescript
// merma.types.ts – línea 84
order?: 'ASC' | 'DESC' | 'asc' | 'desc';
```

El backend valida `@IsIn(['ASC', 'DESC'])` (solo uppercase). El frontend hace `.toUpperCase()` antes de enviar. La union que incluye `'asc'` y `'desc'` es decorativa — nunca se llega a esos valores en el tipo observable del componente.

#### Solución recomendada

```typescript
order?: 'ASC' | 'DESC';
```

#### Prioridad recomendada
Baja

---

### [MERMA-17] `resolveDateRange` muta el objeto `Date` `end` en lugar de crear uno nuevo

#### Severidad
Baja

#### Categoría
Backend / Código frágil

#### Descripción

```typescript
// merma.service.ts – líneas 653-655
if (end) {
  end.setHours(23, 59, 59, 999); // ← mutación in-place
}
```

`end` es una variable local, así que la mutación no afecta al caller. Sin embargo, si en el futuro se reutiliza `end` después de `resolveDateRange` (por ejemplo, para loggear el rango original), el valor ya estaría modificado. Es un smell de código.

#### Solución recomendada

```typescript
const endOfDay = end ? new Date(end.getTime()) : undefined;
if (endOfDay) endOfDay.setHours(23, 59, 59, 999);
return { start, end: endOfDay };
```

#### Prioridad recomendada
Baja

---

### [MERMA-18] JSDoc autogenerado con `@undefined` contamina el código

#### Severidad
Baja

#### Categoría
Calidad / Mantenibilidad

#### Descripción

Aparece en múltiples lugares del módulo:

```typescript
// merma.service.ts – líneas 359-362
/**
 * Obtiene valores o vistas materializadas.
 * @undefined {Promise<{ porMotivo: unknown[]; porProducto: unknown[]; }>} ...
 */
```

```typescript
// merma.controller.ts – líneas 117-120
/**
 * Obtiene valores o vistas materializadas.
 * @undefined {Promise<{ porMotivo: unknown[]; porProducto: unknown[]; }>} ...
 */
```

`@undefined` no es una etiqueta JSDoc válida. El texto "Obtiene valores o vistas materializadas" no describe lo que hace la función. "Ejecuta la lógica de operación dentro del flujo de la aplicación" aparece en literalmente todos los ficheros. Esto es documentación autogenerada que no aporta información y dificulta la lectura.

#### Prioridad recomendada
Baja

---

## Inconsistencias Frontend / Backend

| # | Área | Frontend | Backend | Riesgo |
|---|------|----------|---------|--------|
| 1 | Filtro `motivo` | `MermasQueryParams.motivo` | No existe en `PaginationQueryDto` | **Crítico** — filtro inoperante |
| 2 | Filtro fechas | `startDate` / `endDate` | `fechaDesde` / `fechaHasta` / `dateFrom` / `dateTo` | **Alto** — nombres diferentes, filtro inoperante |
| 3 | Tipo `usuarioId` | `string \| number` | `string` (UUID) | **Alto** — tipo incorrecto |
| 4 | Tipo de stats | `{ porMotivo: Array<{ totalRegistros: number }>}` | `unknown[]` con strings PostgreSQL | **Alto** — tipos inconsistentes |
| 5 | Idempotency | `idempotencyKey?: string` en tipos | Completamente soportado | **Alto** — nunca enviado |
| 6 | KPI endpoint | `fetchMermaStats()` → `/merma/stats` | Solo stats simples, no KPIs | Semántica diferente — `/merma/kpis` ignorado en frontend |
| 7 | Orden por usuario | Tabla muestra nombre, `sortKey: 'usuarioId'` | Ordena por UUID | **Medio** — sort semánticamente incorrecto |
| 8 | `notas` visualización | `alert()` nativo | `notas` en respuesta | **Medio** — UX rota |

### KPI endpoint ignorado en el frontend

El backend expone `GET /merma/kpis` con métricas detalladas (`porcentajeMerma`, `cantidadReferencia`, `porTipo`, `porContexto`). El frontend **nunca llama a este endpoint** — usa solo `/merma/stats`. Los KPIs reales (incluyendo el porcentaje de merma sobre entradas, que es el indicador clave de una cocina) no se muestran en ninguna pantalla.

```typescript
// merma.service.ts (frontend) – no existe llamada a /merma/kpis
export async function fetchMermaStats(): Promise<MermaStats> {
  const response = await baseFetch('/merma/stats'); // ← stats, no kpis
```

---

## Riesgos Potenciales Futuros

### RF-01 — `consumeInventoryByProduct` con lock sobre todos los lotes del producto

Con crecimiento de inventario, la query FIFO bloqueará potencialmente decenas o cientos de filas de `inventario` con `pessimistic_write`. Si dos mermas del mismo producto se ejecutan concurrentemente, una esperará hasta que la otra termine. En alta frecuencia (cocina industrial con múltiples puestos), esto puede convertirse en un cuello de botella de throughput.

*No es problema hoy. Lo será con >10 usuarios concurrentes en el mismo producto.*

### RF-02 — `getStats` sin caché crecerá O(n) con datos

A 1.000 registros de merma: consulta rápida. A 500.000: escaneo completo. Sin índice compuesto en `(motivo, deleted_at)` ni en `(producto_id, deleted_at)`, el optimizer fallará a sequential scan.

### RF-03 — Soft-delete en `Merma` no validado en `consumeInventoryByProduct`

La entidad hereda `BaseEntity` que presumiblemente incluye soft-delete (`deletedAt`). Si una merma se soft-deletes por corrección, el stock descontado NO se restaura. No existe endpoint de anulación de merma. En producción, cualquier corrección de error requiere una merma manual inversa o intervención directa en BD.

### RF-04 — `productoId` directo en `Merma` bypassea la jerarquía `ProductoProveedor`

La entidad `Merma` apunta a `Producto` directamente, no a `ProductoProveedor`. El `consumeInventoryByProduct` resuelve los lotes via `ProductoProveedor`, pero si un producto tiene proveedores con diferentes unidades (e.g., un proveedor en KG, otro en unidades), no hay claridad sobre qué unidad usa la merma. El campo `unidad` de `Producto` es la referencia implícita, pero no se valida explícitamente.

### RF-05 — Ausencia total de paginación en `MermaStats.porProducto`

Cuando hay 5.000 productos con mermas registradas, el componente `MermaStats` mostraría 5.000 barras de LinearProgress en el DOM. No hay virtualización ni límite.

---

## Deuda Técnica

### Deuda crítica

| ID | Deuda |
|----|-------|
| DT-01 | Filtros del listado (`motivo`, `startDate`, `endDate`) no implementados en backend — funcionalidad prometida pero inexistente |
| DT-02 | Tipos de retorno de `getStats` son `unknown[]` — contrato roto entre capas |
| DT-03 | `idempotencyKey` nunca generado en frontend — resiliencia prometida pero no activa |

### Deuda importante

| ID | Deuda |
|----|-------|
| DT-04 | KPI endpoint existe en backend pero nunca se usa en frontend |
| DT-05 | Stats descargadas en cada interacción de tabla |
| DT-06 | `mermaSchema` singleton con i18n congelado |
| DT-07 | `alert()` nativo para notas |
| DT-08 | `usuarioId: string \| number` tipo incorrecto |
| DT-09 | Test coverage insuficiente (3 de ~20 casos relevantes) |
| DT-10 | Lote sin validación de estado en `createFromProduccion` |

### Deuda tolerable

| ID | Deuda |
|----|-------|
| DT-11 | JSDoc autogenerado sin valor |
| DT-12 | `order?: 'ASC' \| 'DESC' \| 'asc' \| 'desc'` permisivo |
| DT-13 | Mutación in-place de `end` en `resolveDateRange` |
| DT-14 | Total de cantidad en stats sin unidad |
| DT-15 | Umbral de log de seguridad (`50`) sin contexto de producto |

---

## Recomendaciones Estratégicas

### 1. Implementar `MermaQueryDto` con filtros reales (inmediato)

El módulo de merma tiene toda la infraestructura correcta excepto los filtros del listado. Este es el cambio de mayor ROI: pequeño, bajo riesgo de regresión, y elimina el bug funcional más visible.

Estimación: 2-3 horas de implementación.

### 2. Conectar `GET /merma/kpis` al frontend

El backend ya implementa el KPI correcto (`porcentajeMerma` = merma/entradas). Añadir un componente que lo muestre (con filtro por fecha) reemplazaría el dashboard actual, que solo muestra totales acumulados sin contexto temporal. Es el KPI operativo correcto para una cocina.

### 3. Separar carga de stats y paginación

El cambio en `useEffect` es de 3 líneas. Elimina N×queries al endpoint más costoso.

### 4. Añadir `idempotencyKey` generación en frontend

`crypto.randomUUID()` está disponible en todos los browsers modernos. La clave se genera una vez al abrir el formulario. Es una línea de código que activa la resiliencia ya construida en el backend.

### 5. Reemplazar `alert()` con Dialog de MUI

El componente ya usa MUI Dialog en otras partes. Es un cambio de 15 líneas.

### 6. Tipado estricto en `getStats`

Definir la interface de retorno y mapear los valores numéricos en el servicio. Mismo patrón que `getKpis`.

---

## Conclusión Final

El módulo merma tiene una arquitectura backend robusta que no se traduce en funcionalidad real. **Los filtros del listado no funcionan** — éste es el defecto más grave y el que invalida la utilidad principal del módulo para un usuario final. La idempotencia está construida correctamente en el servidor pero nunca activada desde el cliente. El endpoint de KPIs más relevante para el negocio (`porcentajeMerma` sobre entradas) existe pero no se muestra en ninguna pantalla.

El código de la transacción FIFO, los permisos por acción, y la validación de ingredientes en producción son sólidos. La deuda no está en la lógica central sino en la capa de contrato entre frontend y backend, que está mal sincronizada.

**El módulo es funcional parcialmente.** Un usuario puede registrar una merma y verá una lista. No puede filtrarla. No puede ver el porcentaje de merma real. Las estadísticas que ve son números sin unidad ni contexto temporal. Esto es aceptable en alpha, no en producción.

**Prioridad de acción antes de producción:**
1. MERMA-01: Implementar filtros en backend (bug funcional crítico).
2. MERMA-03: Generar idempotencyKey en frontend (resiliencia básica).
3. MERMA-02: Tipar y mapear `getStats` (integridad de contrato).
4. MERMA-09: Separar carga de stats (performance).

Los demás hallazgos son mejoras importantes pero no bloquean el lanzamiento si los 4 anteriores se resuelven.
