# 2026-05-05 - Mejoras UX/UI módulo Pedidos

## Cambios implementados

### 1. Imagen receta compacta (`DynamicFormModal.tsx`)
- Reducir columna imagen de `md:3` → `md:2` (16.7% ancho)
- Altura reducida de `190px` → `120px`
- Container usa `alignItems: flex-start` (antes: center)
- Columna campos ampliada a `md:10` (antes: `md:9`)

### 2. Enums de pedidos traducidos (`StatusChip.tsx`)
- `getI18nLabel` ahora detecta todos los dominios de pedido:
  - `pendiente_de_aprobacion`, `por_recepcionar`, `recepcionado`, `parcial`, `incidencia` → `enum.pedidoEstado.*`
  - `borrador`, `pendiente`, `aprobado`, `consolidado`, `cancelado` → `enum.pedidoUsuarioEstado.*`
  - `completado` → `enum.loteEstado.*`
- `getStatusColor` añade cases: `aprobado/consolidado/recepcionado/completado` → verde, `pendiente_de_aprobacion` → naranja, `por_recepcionar/borrador` → azul
- IMPORTANTE: el case `completado` fue eliminado del bloque `success` original para evitar `no-duplicate-case`

### 3. Exportación Excel + PDF en pedidos (`ReporteSelectorModal.tsx`)
- Nuevo servicio `downloadReportePedidosExcel` en `recepcion.service.ts`
- Endpoint: `GET /export/pedidos/xlsx?fechaDesde=&fechaHasta=`
- El modal muestra dos botones cuando `tipo === 'pedido'`: Excel (verde) + PDF (rojo)
- `handleGenerate(formato: 'pdf' | 'excel')` selecciona el endpoint correcto

### 4. Mensaje "Este producto se pide por…" (`PedidoLineasSelector.tsx`)
- Convertido de `helperText` (gris, discreto) a `Alert` info compacto
- Se muestra debajo del campo de cantidad solo cuando está enfocado
- El TextField + Alert se envuelven en un `Box` para JSX válido

### 5. Performance - Cache de catálogo (`PedidoLineasSelector.tsx`)
- Cache de módulo con TTL 5 min para los productos por defecto
- Variables: `cachedDefaultProducts`, `cacheTimestamp`, `cacheLoadingPromise`
- Primera apertura: carga 100 productos del API; siguientes: usa cache inmediatamente
- Request único compartido si múltiples instancias abren simultáneamente (promise sharing)
- Orden de declaraciones crítico: `buildProductKey` → `mapToFlatProductoProveedor` → `getDefaultProductsCached`

## Correcciones i18n
- `es.json` tenía claves `FÁCIL`/`DIFÍCIL` (con tildes) en `enum.recetaDificultad`
- Deben ser `FACIL`/`DIFICIL` (sin tilde) porque `normalizeEnumValue` aplica NFD stripping
- `en.json` ya usaba las claves correctas sin tilde

## Tests actualizados
- `test/i18n/i18nParity.test.ts`: corregido al alinear claves de es.json
- `test/features/recetas/recetaForm.helpers.test.ts`: namespace `receta.errors.*` → `recipes.errors.*`
- `test/components/ui/PedidoLineasSelector.test.tsx`: parámetro `50` → `100` en carga inicial
- `test/e2e/pedidos-mejoras.spec.ts`: nuevo spec E2E con 4 tests cubriendo todas las mejoras

## Resultado final
- 156/156 unit tests ✅
- 33/33 E2E tests ✅
- 0 errores TypeScript ✅
- 0 errores lint (6 warnings preexistentes en hooks) ✅
