# Auditoría Técnica Completa

## Resumen Ejecutivo
- estado general del proyecto:
  - El módulo de mermas tiene una base sólida en backend (transacciones, lock pesimista, validaciones DTO, guardas de permisos, idempotencia persistida), pero presenta desalineaciones críticas de contrato y de UX técnica en frontend.
- nivel de riesgo:
  - Alto.
- principales problemas:
  - Contrato frontend/backend roto en estadísticas (`/merma/stats`) por envío de query params no admitidos.
  - Desalineación de permisos entre navegación/acciones frontend y permisos reales de API.
  - Deducción de stock de merma sin contexto de ubicación/lote, con riesgo de descontar inventario correcto pero en ubicación operativamente incorrecta.
  - Idempotencia funcionalmente correcta ante reintentos, pero semánticamente débil (no valida huella de payload).
- principales fortalezas:
  - Servicio backend transaccional con `pessimistic_write` para evitar dobles consumos concurrentes.
  - Restricción única de `idempotency_key` en base de datos.
  - DTOs con validación estricta y controles de autorización en endpoints críticos.
  - Tests backend unitarios existentes y pasando para casos base del servicio.
- criticidad general:
  - Alta, por combinación de errores de integración contractual y riesgos de consistencia operativa al escalar.

## Métricas Generales
- arquitectura: Aceptable
- mantenibilidad: Aceptable
- escalabilidad: Deficiente
- seguridad: Buena
- performance: Aceptable
- coherencia de dominio: Deficiente
- tipado: Buena
- resiliencia: Aceptable
- claridad del código: Buena

## Hallazgos

### [MERMA-001] Contrato roto en `/merma/stats` por query params extra generados por frontend

#### Severidad
- Alta

#### Categoría
- API

#### Descripción
El frontend construye la query de estadísticas usando un helper genérico que siempre inyecta `page` y `limit`. El backend de `stats` no define esos campos en el DTO y ejecuta validación con `forbidNonWhitelisted: true`.

#### Riesgo real
Las peticiones a estadísticas pueden fallar con `400 Bad Request` por propiedades no permitidas, dejando la tarjeta de métricas inoperativa o inestable.

#### Evidencia
- Frontend llama al builder genérico en stats:

```ts
// frontend/smart-economat-frontend/src/services/merma.service.ts:38-44
function buildMermaStatsQueryString(params?: MermaStatsQueryParams): string {
  const search = buildQueryParams({
    startDate: params?.startDate,
    endDate: params?.endDate,
  }, 20, 50);
```

- El helper siempre añade `page` y `limit`:

```ts
// frontend/smart-economat-frontend/src/services/api.service.ts:64-67
const requestedPage = typeof params.page === 'number' ? params.page : 1;
const searchParams = new URLSearchParams({
  page: String(Math.max(1, requestedPage)),
  limit: String(safeLimit),
});
```

- DTO backend de stats solo admite fechas:

```ts
// backend/smart-economat-backend/src/modules/merma/dto/merma-stats-query.dto.ts:5-20
export class MermaStatsQueryDto {
  startDate?: string;
  endDate?: string;
}
```

- Validación global estricta:

```ts
// backend/smart-economat-backend/src/main.ts:61-62
whitelist: true,
forbidNonWhitelisted: true,
```

#### Impacto
- Técnico: errores 400 recurrentes en endpoint de estadísticas.
- Negocio: pérdida de visibilidad operativa en KPIs de merma.
- UX: bloque de métricas vacío/errático con toasts de error.
- Escalabilidad: aumenta ruido de errores y soporte.
- Mantenibilidad: contrato no determinista entre módulos.

#### Solución recomendada
- qué cambiar:
  - Crear builder específico para stats sin `page/limit` o parametrizar `buildQueryParams` para modo sin paginación.
- por qué:
  - El DTO backend no define paginación para stats y la validación estricta debe respetarse.
- cómo mejorarlo:
  - En frontend `fetchMermaStats`, construir `URLSearchParams` manual solo con `startDate/endDate`.
  - Añadir test de integración frontend (mock fetch) que verifique URL exacta.
- cómo reducir riesgos:
  - Añadir test backend de contrato que rechace explícitamente campos extra en `/merma/stats` para detectar regresiones tempranas.

#### Prioridad recomendada
- Inmediata

#### Riesgo de regresión
- Bajo

---

### [MERMA-002] Desalineación de permisos: UI permite acciones que API protege con permisos adicionales

#### Severidad
- Alta

#### Categoría
- Seguridad

#### Descripción
La ruta de mermas se expone con permiso `merma:listar`, pero la pantalla ejecuta endpoints de `stats` y `crear` sin control de capacidad en UI. Esto provoca flujos permitidos visualmente pero denegados por backend.

#### Riesgo real
Usuarios con permiso de listado pero sin creación o stats verán botones y componentes funcionales que terminan en 403, degradando experiencia y aumentando intentos fallidos.

#### Evidencia
- Menú/ruta con permiso solo listar:

```ts
// frontend/smart-economat-frontend/src/utils/config/menuConfig.tsx:188
permiso: PERMISSIONS.merma.listar,
```

- La pantalla siempre muestra acción de registrar y llama a stats al cargar:

```ts
// frontend/smart-economat-frontend/src/pages/Mermas.tsx:83
const statsData = await fetchMermaStats();

// frontend/smart-economat-frontend/src/pages/Mermas.tsx:244-248
primaryAction={{
  label: t('mermas.acciones.registrar'),
  onClick: openMermaModal,
}}
```

- Backend exige permisos distintos:

```ts
// backend/smart-economat-backend/src/modules/merma/controller/merma.controller.ts:57,107,122
@RequirePermissions(PERMISSIONS.merma.crear)
@RequirePermissions(PERMISSIONS.merma.stats)
```

#### Impacto
- Técnico: cascada de 403 en clientes válidos pero con permisos parciales.
- Negocio: tickets falsos de “funcionalidad rota”.
- UX: frustración por affordances engañosos.
- Escalabilidad: mayor presión sobre soporte/operaciones.
- Mantenibilidad: complejidad innecesaria en manejo de errores de autorización.

#### Solución recomendada
- qué cambiar:
  - Ocultar/deshabilitar acciones y bloques según permisos efectivos (`merma:crear`, `merma:stats`).
- por qué:
  - Coherencia entre affordance visual y autorización real.
- cómo mejorarlo:
  - Inyectar `hasPermission` en `Mermas.tsx` y condicionar botón de alta + carga/render de stats.
- cómo reducir riesgos:
  - Test UI de permisos (snapshot funcional) para roles con combinaciones parciales.

#### Prioridad recomendada
- Alta

#### Riesgo de regresión
- Bajo

---

### [MERMA-003] Deducción de stock sin contexto de ubicación/lote en merma manual y de producción

#### Severidad
- Alta

#### Categoría
- Dominio

#### Descripción
El consumo de inventario por merma se hace por `productoId` global, aplicando FEFO/FIFO sobre todo inventario del producto, sin acotar por ubicación ni lote operativo asociado al evento.

#### Riesgo real
Puede descontarse stock de una ubicación distinta a la que sufrió la merma física, generando inventario contable correcto a nivel agregado pero incorrecto operativamente por localización.

#### Evidencia
```ts
// backend/smart-economat-backend/src/modules/merma/service/merma.service.ts:603-605
.where('pp.producto_id = :productoId', { productoId })
.andWhere('inv.cantidad_actual > 0')
.orderBy('inv.fecha_caducidad', 'ASC', 'NULLS LAST')
```

```ts
// backend/smart-economat-backend/src/modules/merma/service/merma.service.ts:532
const consumos = await this.consumeInventoryByProduct(...)
```

No hay filtro por `ubicacion_id`, `inventario_id` o `origen logístico` en el flujo de merma.

#### Impacto
- Técnico: divergencia entre stock físico y stock por ubicación.
- Negocio: errores en reposición interna y planificación de compras.
- UX: usuarios ven mermas “en otro sitio” sin trazabilidad operativa clara.
- Escalabilidad: empeora en escenarios multi-ubicación.
- Mantenibilidad: más ajustes manuales correctivos.

#### Solución recomendada
- qué cambiar:
  - Permitir opcionalmente contexto de inventario/ubicación en comando de merma.
- por qué:
  - Mantener coherencia entre evento físico y asiento contable.
- cómo mejorarlo:
  - Introducir `inventarioId` o `ubicacionId` opcional en DTO manual y resolver consumo contextual con fallback al modo global actual.
- cómo reducir riesgos:
  - Mantener compatibilidad retroactiva: si no se informa contexto, conservar comportamiento vigente.

#### Prioridad recomendada
- Alta

#### Riesgo de regresión
- Medio

---

### [MERMA-004] Idempotencia semánticamente débil: no valida coherencia de payload para la misma clave

#### Severidad
- Media

#### Categoría
- Backend

#### Descripción
Si llega una `idempotencyKey` existente, el servicio devuelve el registro previo sin verificar que el nuevo payload sea equivalente al original (producto, cantidad, motivo, usuario, origen).

#### Riesgo real
Reutilizaciones accidentales o maliciosas de la clave pueden devolver resultados incorrectos para la intención actual del cliente, ocultando errores de integración.

#### Evidencia
```ts
// backend/smart-economat-backend/src/modules/merma/service/merma.service.ts:503-507
const existingMerma = await this.findByIdempotencyKey(command.idempotencyKey);
if (existingMerma) {
  return existingMerma;
}
```

No hay comparación de fingerprint de request antes de retornar el evento existente.

#### Impacto
- Técnico: respuestas “válidas” semánticamente incorrectas.
- Negocio: auditoría confusa de qué operación realmente se intentó.
- UX: usuario percibe éxito con datos que no corresponden a su acción.
- Escalabilidad: incidentes difíciles de depurar en clientes con reintentos.
- Mantenibilidad: deuda en trazabilidad de reintentos.

#### Solución recomendada
- qué cambiar:
  - Asociar a la clave un hash/fingerprint del payload canónico.
- por qué:
  - La idempotencia debe ser misma clave + misma intención.
- cómo mejorarlo:
  - Si la clave existe y el fingerprint difiere, devolver `409 Conflict` con mensaje explícito.
- cómo reducir riesgos:
  - Mantener retorno actual solo para coincidencia exacta de payload.

#### Prioridad recomendada
- Media

#### Riesgo de regresión
- Medio

---

### [MERMA-005] Fallback de idempotency key no cumple el contrato UUID del backend

#### Severidad
- Media

#### Categoría
- Frontend

#### Descripción
Cuando `crypto.randomUUID` no está disponible, el frontend genera una cadena no-UUID para `idempotencyKey`, pero el backend exige UUID.

#### Riesgo real
En entornos sin `randomUUID` (navegadores legacy, shells embebidos específicos), el alta de merma puede fallar por validación.

#### Evidencia
```ts
// frontend/smart-economat-frontend/src/pages/Mermas.tsx:206
mermaIdempotencyKeyRef.current = `merma-${Date.now()}-${Math.random().toString(36).slice(2)}`;

// frontend/smart-economat-frontend/src/pages/Preparaciones.tsx:503
mermaIdempotencyKeyRef.current = `merma-prod-${Date.now()}-${Math.random().toString(36).slice(2)}`;
```

```ts
// backend/smart-economat-backend/src/modules/merma/dto/create-merma.dto.ts:87-88
@IsUUID('all')
idempotencyKey?: string;
```

#### Impacto
- Técnico: errores 400 por contrato incumplido.
- Negocio: pérdidas de registro en escenarios de compatibilidad.
- UX: fallos intermitentes difíciles de entender.
- Escalabilidad: aumenta complejidad de soporte en clientes heterogéneos.
- Mantenibilidad: comportamiento no determinista por entorno.

#### Solución recomendada
- qué cambiar:
  - Generar UUID válido también en fallback (librería `uuid` o polyfill seguro).
- por qué:
  - Mantener contrato estable entre clientes.
- cómo mejorarlo:
  - Extraer helper `generateIdempotencyKey()` reutilizable en todas las pantallas.
- cómo reducir riesgos:
  - Test unitario de helper en modo con y sin `crypto.randomUUID`.

#### Prioridad recomendada
- Media

#### Riesgo de regresión
- Bajo

---

### [MERMA-006] Inconsistencia semántica en `origenEntidad`: mensaje “snake_case” pero datos reales en PascalCase

#### Severidad
- Media

#### Categoría
- Dominio

#### Descripción
El DTO comunica una regla de formato `snake_case`, pero la expresión regular admite mayúsculas y el backend guarda `ProduccionLote` (PascalCase).

#### Riesgo real
Nomenclatura inconsistente en trazabilidad, analítica y filtros por contexto de origen.

#### Evidencia
```ts
// backend/smart-economat-backend/src/modules/merma/dto/create-merma.dto.ts:62-63
@Matches(/^[A-Za-z][A-Za-z0-9_]*$/, {
  message: i18nValidationMessage('validation.ORIGEN_ENTIDAD_SNAKE_CASE'),
})
```

```ts
// backend/smart-economat-backend/src/modules/merma/service/merma.service.ts:205
origenEntidad: 'ProduccionLote',
```

#### Impacto
- Técnico: baja consistencia de campos de trazabilidad.
- Negocio: reportes menos fiables por variantes de naming.
- UX: etiquetas de contexto ambiguas.
- Escalabilidad: proliferación de valores heterogéneos.
- Mantenibilidad: validaciones y filtros más frágiles.

#### Solución recomendada
- qué cambiar:
  - Definir catálogo/enum de `origenEntidad` o normalizar naming único (p. ej. PascalCase o snake_case real).
- por qué:
  - Evitar deriva semántica en datos operativos.
- cómo mejorarlo:
  - Reemplazar regex libre por enum y mapear origen desde casos de uso.
- cómo reducir riesgos:
  - Migración de datos para normalizar históricos.

#### Prioridad recomendada
- Media

#### Riesgo de regresión
- Medio

---

### [MERMA-007] Conversión de fin de día dependiente de zona horaria del servidor

#### Severidad
- Media

#### Categoría
- Backend

#### Descripción
`resolveDateRange` usa `setHours` (zona local del runtime), mezclando fechas ISO con manipulación local.

#### Riesgo real
Off-by-hours en filtros por fecha cuando backend no corre en la misma TZ esperada por negocio.

#### Evidencia
```ts
// backend/smart-economat-backend/src/modules/merma/service/merma.service.ts:759
end.setHours(23, 59, 59, 999);
```

#### Impacto
- Técnico: consultas con borde temporal incorrecto.
- Negocio: métricas diarias inconsistentes.
- UX: discrepancias entre “lo que el usuario filtró” y “lo que devuelve el sistema”.
- Escalabilidad: errores difíciles en despliegues multi-región.
- Mantenibilidad: deuda oculta de temporalidad.

#### Solución recomendada
- qué cambiar:
  - Usar normalización UTC consistente (`setUTCHours`) o librería temporal explícita.
- por qué:
  - El rango debe ser determinista e independiente del host.
- cómo mejorarlo:
  - Centralizar util de rango temporal y reutilizar en list/stats/kpis.
- cómo reducir riesgos:
  - Tests con TZ forzada para validar bordes de día.

#### Prioridad recomendada
- Media

#### Riesgo de regresión
- Medio

---

### [MERMA-008] Contención incompleta de consultas temporales (rango máximo solo si hay dos fechas)

#### Severidad
- Media

#### Categoría
- Performance

#### Descripción
El control de `validateDateRange` solo se activa en stats/kpis y únicamente cuando hay ambas fechas. `findAll` no aplica límite temporal máximo.

#### Riesgo real
Consultas de alto costo sobre tablas crecientes (especialmente por fechas abiertas) con potencial degradación de latencia.

#### Evidencia
```ts
// backend/smart-economat-backend/src/modules/merma/controller/merma.controller.ts:114,128
validateDateRange(query.startDate, query.endDate, 365, 'Mermas');
```

```ts
// backend/smart-economat-backend/src/modules/merma/controller/merma.controller.ts:141-145
findAll(...) {
  return this.mermaService.findAll(query);
}
```

#### Impacto
- Técnico: riesgo de queries lentas al crecer histórico.
- Negocio: paneles más lentos en horas pico.
- UX: tiempos de espera altos y percepción de inestabilidad.
- Escalabilidad: peor comportamiento bajo carga.
- Mantenibilidad: tuning reactivo en vez de preventivo.

#### Solución recomendada
- qué cambiar:
  - Aplicar política temporal explícita también en listado o exigir al menos una ventana acotada en vistas de alto volumen.
- por qué:
  - Controlar coste de lectura desde diseño.
- cómo mejorarlo:
  - En `findAll`, definir default de ventana (p. ej. 90/180 días) configurable.
- cómo reducir riesgos:
  - Mantener endpoint histórico completo solo para roles/auditoría con exportación asíncrona.

#### Prioridad recomendada
- Media

#### Riesgo de regresión
- Bajo

---

### [MERMA-009] `tipo` de merma puede ser impuesto por cliente sin coherencia obligatoria con `motivo`

#### Severidad
- Media

#### Categoría
- Dominio

#### Descripción
En merma manual, el backend acepta `tipo` opcional del cliente y solo lo deriva cuando no viene informado. Esto permite estados semánticamente inconsistentes para analítica.

#### Riesgo real
Datos contradictorios en reportes (ejemplo: `motivo=hurto` con `tipo=recepcion`) y pérdida de fiabilidad en KPIs por tipo.

#### Evidencia
```ts
// backend/smart-economat-backend/src/modules/merma/dto/create-merma.dto.ts:52
tipo?: TipoMerma;
```

```ts
// backend/smart-economat-backend/src/modules/merma/service/merma.service.ts:544
tipo: command.tipo ?? this.resolveTipoMerma(command.motivo),
```

#### Impacto
- Técnico: dataset analítico con contradicciones.
- Negocio: decisiones basadas en métricas distorsionadas.
- UX: reportes confusos por categorías no coherentes.
- Escalabilidad: mayor costo de limpieza de datos históricos.
- Mantenibilidad: reglas de dominio implícitas y frágiles.

#### Solución recomendada
- qué cambiar:
  - Derivar `tipo` siempre en backend o validar matriz `motivo`↔`tipo` permitida.
- por qué:
  - Proteger invariantes de dominio en servidor.
- cómo mejorarlo:
  - Si se mantiene editable, devolver 400 cuando la combinación no sea válida.
- cómo reducir riesgos:
  - Añadir test de contrato por combinaciones inválidas.

#### Prioridad recomendada
- Media

#### Riesgo de regresión
- Medio

---

### [MERMA-010] UX técnica inconsistente: estadísticas no sincronizadas con filtros visibles del listado

#### Severidad
- Baja

#### Categoría
- UX

#### Descripción
La vista aplica filtros de fecha/motivo al listado de mermas, pero las estadísticas se cargan sin esos filtros y permanecen desacopladas del estado visible de tabla.

#### Riesgo real
El usuario interpreta que ambos bloques representan el mismo universo de datos cuando no es así.

#### Evidencia
```ts
// frontend/smart-economat-frontend/src/pages/Mermas.tsx:83
const statsData = await fetchMermaStats();
```

```ts
// frontend/smart-economat-frontend/src/pages/Mermas.tsx:276
onFiltersChange={(newFilters) => {
  onFilter('motivo', newFilters.motivo);
  onFilter('startDate', newFilters.startDate);
  onFilter('endDate', newFilters.endDate);
}}
```

No hay recarga de stats vinculada a `tableFilters`.

#### Impacto
- Técnico: estado de UI no coherente.
- Negocio: lectura errónea de indicadores.
- UX: confianza reducida en panel.
- Escalabilidad: errores de interpretación en equipos grandes.
- Mantenibilidad: más soporte para “datos que no cuadran”.

#### Solución recomendada
- qué cambiar:
  - Permitir dos modos: stats globales (etiquetadas) o stats filtradas por los mismos filtros de tabla.
- por qué:
  - Claridad de estado y consistencia perceptiva.
- cómo mejorarlo:
  - Pasar `startDate/endDate` (y opcionalmente motivo) a `fetchMermaStats` y mostrar contexto de ventana aplicada.
- cómo reducir riesgos:
  - Añadir etiqueta explícita de periodo activo en el bloque de stats.

#### Prioridad recomendada
- Baja

#### Riesgo de regresión
- Bajo

---

### [MERMA-011] Cobertura QA insuficiente en frontend de mermas y cobertura parcial en integración

#### Severidad
- Media

#### Categoría
- Testing

#### Descripción
No se encontraron tests específicos en frontend para `merma.service`, `Mermas.tsx`, `MermasTable` o `MermaStats`. En backend hay unit test del servicio y e2e de producción-idempotencia, pero faltan casos de contrato frontend/backend (p. ej. query params inválidos en stats).

#### Riesgo real
Regresiones de integración y UX no detectadas antes de producción.

#### Evidencia
- Tests backend presentes:
  - `backend/smart-economat-backend/test/modules/merma/merma.service.spec.ts`
  - `backend/smart-economat-backend/test/e2e/merma-produccion.e2e-spec.ts`
- Resultado ejecutado:
  - `npx jest --runInBand test/modules/merma/merma.service.spec.ts` -> 7/7 tests OK.
- Ausencia de specs frontend de mermas por patrón de búsqueda en `frontend/smart-economat-frontend`.

#### Impacto
- Técnico: menor capacidad de detección temprana.
- Negocio: mayor probabilidad de incidentes post-release.
- UX: regresiones visuales/funcionales sin alarma.
- Escalabilidad: deuda de pruebas crece con cada feature.
- Mantenibilidad: cambios más lentos y arriesgados.

#### Solución recomendada
- qué cambiar:
  - Añadir tests frontend de contrato URL y de estado UI en la página de mermas.
- por qué:
  - Cerrar brecha entre validaciones backend y comportamiento cliente.
- cómo mejorarlo:
  - Unit tests para `buildMermaStatsQueryString` y `fetchMermas/fetchMermaStats`.
  - Integration test de `Mermas.tsx` verificando permisos, filtros y errores.
- cómo reducir riesgos:
  - Incluir estos tests en gate de CI para módulos críticos de inventario.

#### Prioridad recomendada
- Alta

#### Riesgo de regresión
- Bajo

---

## Inconsistencias Frontend/Backend
- `fetchMermaStats` envía `page` y `limit` por helper genérico, mientras backend de stats solo acepta `startDate/endDate`.
- La navegación permite acceso con `merma:listar`, pero la propia pantalla invoca endpoints que requieren `merma:stats` y `merma:crear` sin control visual previo.
- Frontend genera fallback de `idempotencyKey` no UUID, backend exige UUID.
- Contrato semántico de `origenEntidad` ambiguo: mensaje y etiqueta hablan de `snake_case`, implementación y datos reales usan PascalCase.
- Frontend muestra métricas y tabla en la misma pantalla, pero no comparten filtro/ventana temporal efectiva.
- Frontend permite disparar alta de merma desde múltiples contextos (pantalla mermas e inventario) sin una política uniforme de permisos y feedback por capacidad.

---

## Riesgos Potenciales Futuros
- Saturación de consultas de mermas al crecer histórico por ausencia de ventana acotada uniforme en listados.
- Desalineación de inventario por ubicación en despliegues multi-sede debido a consumo global por producto.
- Contaminación progresiva de analítica por combinaciones `motivo/tipo` no controladas.
- Incidentes difíciles de depurar por idempotencia sin verificación de fingerprint de payload.
- Mayor tasa de fallos por entorno cliente heterogéneo si no se corrige generación de UUID en fallback.
- Incremento de falsos incidentes de permisos (“funciona/no funciona”) por affordances no alineadas con autorizaciones.

---

## Deuda Técnica
- deuda crítica:
  - Contrato de stats roto por query params extra desde frontend.
- deuda importante:
  - Desacople entre permisos UI y permisos API.
  - Consumo de stock sin contexto logístico explícito.
  - Idempotencia sin validación semántica del request.
  - Cobertura de pruebas frontend inexistente para mermas.
- deuda tolerable:
  - Inconsistencia de naming en `origenEntidad`.
  - Incoherencia entre filtros de tabla y bloque de estadísticas.
  - Normalización temporal dependiente de TZ local del servidor.

---

## Recomendaciones Estratégicas
- Corregir inmediatamente el builder de query en `fetchMermaStats` para cumplir contrato estricto de backend.
- Introducir control de permisos en UI por capacidad (`crear`, `stats`) y degradación elegante por rol.
- Añadir contexto opcional de ubicación/lote al registro de merma para preservar consistencia operativa sin romper compatibilidad.
- Endurecer idempotencia: misma clave con payload distinto debe responder `409` y trazarse explícitamente.
- Normalizar estrategia temporal (UTC) en filtros y documentar la semántica de rangos.
- Definir y congelar vocabulario de dominio para `origenEntidad` (enum/catálogo).
- Subir cobertura QA orientada a contratos y estado UI del módulo de mermas, no solo lógica interna backend.

---

## Conclusión Final
El módulo de mermas no está en estado catastrófico, pero no está listo para considerarse robusto enterprise sin correcciones inmediatas en integración contractual, permisos UI/API y consistencia operativa del consumo de stock. El backend demuestra buenas bases de ingeniería (transacciones, locks, validación, guardas), pero el frontend rompe al menos un contrato clave y expone flujos inconsistentes para roles parciales. Si se corrigen los hallazgos de prioridad Inmediata/Alta en este ciclo, el módulo puede pasar de riesgo alto a riesgo controlado sin reescribir la lógica de negocio central.