# Auditoría Técnica Completa

## Resumen Ejecutivo
- Estado general del modulo:
  - El modulo de recetas (frontend/backend) es funcional en flujo basico, pero presenta riesgos graves de seguridad autorizacion, integridad transaccional y coherencia de dominio entre preparacion, produccion y compras desde recetas.
- Nivel de riesgo:
  - Alto.
- Principales problemas:
  - Control de acceso inconsistente en endpoint critico de recalculo de costes.
  - Finalizacion de preparaciones sin atomicidad end-to-end ni garantia de idempotencia.
  - Inconsistencia matematica de merma entre produccion y generacion de pedidos desde recetas.
  - Conversion de unidades incompleta con fallback silencioso que degrada exactitud de inventario.
  - Deriva funcional FE/BE en busqueda/ordenacion de lotes y manejo de errores UX.
  - Riesgo de abuso en exportacion PDF (sin limite de IDs) y superficie de lectura de rutas locales via imagen de receta.
- Principales fortalezas:
  - DTOs y validacion base presentes en modulo receta.
  - Separacion de servicios FE y cliente HTTP centralizado.
  - Cobertura parcial de casos de merma y validacion en tests unitarios de produccion.
- Criticidad general:
  - No recomendado para produccion exigente sin corregir primero hallazgos de prioridad Inmediata/Alta.

## Métricas Generales
- arquitectura: Aceptable
- mantenibilidad: Deficiente
- escalabilidad: Deficiente
- seguridad: Deficiente
- performance: Aceptable
- coherencia de dominio: Deficiente
- tipado: Aceptable
- resiliencia: Deficiente
- claridad del código: Aceptable

## Hallazgos

### [REC-AUD-001] Brecha de autorizacion en recalcular-costes por uso de Roles sin RolesGuard

#### Severidad
- Crítica

#### Categoría
- Backend
- Seguridad
- Autorizacion

#### Descripción
El endpoint de recalculo de costes declara `@Roles(ADMIN, PROFESOR)` pero el controlador de recetas no aplica `RolesGuard`; solo usa `JwtAuthGuard` y `PermisosGuard`. Ademas, en ese endpoint no se declara `@RequirePermissions`, por lo que `PermisosGuard` no exige permisos especificos.

#### Riesgo real
Un usuario autenticado con permiso general de acceso al modulo puede invocar recalculo de costes aunque no cumpla el rol declarado, alterando datos economicos sensibles.

#### Evidencia
Archivo: backend/smart-economat-backend/src/modules/receta/controller/receta.controller.ts:47
```ts
@UseGuards(JwtAuthGuard, PermisosGuard)
```

Archivo: backend/smart-economat-backend/src/modules/receta/controller/receta.controller.ts:289
```ts
@Post(':id/recalcular-costes')
@Roles(rolUsuario.ADMIN, rolUsuario.PROFESOR)
```

Archivo: backend/smart-economat-backend/src/modules/sherlock-auth/guards/permissions.guard.ts:58
```ts
if (requiredPermissions.length === 0) {
  return true;
}
```

Archivo: backend/smart-economat-backend/src/app.module.ts:121
```ts
provide: APP_GUARD,
useClass: SmartAuthThrottlerGuard,
```

#### Impacto
- Técnico: politicas de seguridad declaradas no ejecutadas.
- Negocio: recalculo no autorizado de costes con impacto financiero.
- UX: comportamiento inconsistente segun perfil real.
- Escalabilidad: riesgo creciente al ampliar perfiles y permisos.
- Mantenibilidad: falsa sensacion de cobertura de seguridad.

#### Solución recomendada
- qué cambiar:
  - Aplicar `RolesGuard` en `RecetaController` o en el endpoint `recalcular-costes`.
  - Añadir `@RequirePermissions(...)` explicito al endpoint.
- por qué:
  - Alinea autorizacion efectiva con el contrato de seguridad declarado.
- cómo mejorarlo:
  - Definir matriz endpoint -> roles -> permisos y validarla con tests de contrato.
- cómo reducir riesgos:
  - Añadir e2e con token de rol no autorizado y expect 403.

#### Prioridad recomendada
- Inmediata

#### Riesgo de regresión
- Medio

---

### [REC-AUD-002] Manejo de no autenticado con Error genérico provoca 500 en lugar de 401

#### Severidad
- Alta

#### Categoría
- Backend
- API
- Resiliencia

#### Descripción
En `PreparacionController` se lanza `throw new Error(...)` cuando falta `req.user.id` en `create` y `finalizar`. Eso evita el flujo normal de excepciones HTTP y puede devolver 500 en vez de 401/403.

#### Riesgo real
Errores funcionales previsibles se convierten en errores internos, elevando ruido operativo, dificultando trazabilidad y rompiendo contrato API para cliente frontend.

#### Evidencia
Archivo: backend/smart-economat-backend/src/modules/preparacion/controller/preparacion.controller.ts:52
```ts
if (!userId) {
  throw new Error(I18nHelper.getError('USER_NOT_AUTHENTICATED'));
}
```

Archivo: backend/smart-economat-backend/src/modules/preparacion/controller/preparacion.controller.ts:130
```ts
if (!userId) {
  throw new Error(I18nHelper.getError('USER_NOT_AUTHENTICATED'));
}
```

Archivo: backend/smart-economat-backend/src/common/filters/global-exception.filter.ts:142
```ts
const status =
  exception instanceof HttpException
    ? exception.getStatus()
    : HttpStatus.INTERNAL_SERVER_ERROR;
```

#### Impacto
- Técnico: semantica HTTP incorrecta para errores de autenticacion.
- Negocio: incremento de alertas 500 evitables.
- UX: mensajes no consistentes en frontend.
- Escalabilidad: observabilidad degradada bajo carga/errores.
- Mantenibilidad: debugging mas costoso.

#### Solución recomendada
- qué cambiar:
  - Sustituir por `UnauthorizedException` o `ForbiddenException` segun el caso.
- por qué:
  - Preserva contrato API y reduce 500 espurios.
- cómo mejorarlo:
  - Centralizar extraccion de `userId` con helper/guard para no duplicar checks.
- cómo reducir riesgos:
  - Test e2e: ausencia de usuario autenticado debe devolver 401/403.

#### Prioridad recomendada
- Alta

#### Riesgo de regresión
- Bajo

---

### [REC-AUD-003] Falta de ParseUUIDv7Pipe en rutas de preparación

#### Severidad
- Alta

#### Categoría
- Backend
- Validacion
- API

#### Descripción
Los endpoints `GET :id`, `PATCH :id/iniciar`, `PATCH :id/finalizar` y otros de preparacion reciben `@Param('id')` como string sin pipe UUID. En modulo receta si se usa `ParseUUIDv7Pipe` en rutas equivalentes.

#### Riesgo real
IDs malformados pueden propagarse a capa de persistencia y provocar errores SQL evitables o respuestas no deterministas.

#### Evidencia
Archivo: backend/smart-economat-backend/src/modules/preparacion/controller/preparacion.controller.ts:89
```ts
async findOne(
  @Param('id') id: string,
```

Archivo: backend/smart-economat-backend/src/modules/preparacion/controller/preparacion.controller.ts:106
```ts
async iniciar(@Param('id') id: string)
```

Archivo: backend/smart-economat-backend/src/modules/preparacion/controller/preparacion.controller.ts:123
```ts
@Param('id') id: string,
```

Archivo: backend/smart-economat-backend/src/modules/receta/controller/receta.controller.ts:296
```ts
recalcularCostes(@Param('id', ParseUUIDv7Pipe) id: string)
```

#### Impacto
- Técnico: validacion tardia en capa equivocada.
- Negocio: incidentes 4xx/5xx no controlados.
- UX: errores confusos ante IDs invalidos.
- Escalabilidad: superficie de fallo mas amplia en trafico externo.
- Mantenibilidad: contratos API inconsistentes entre modulos cercanos.

#### Solución recomendada
- qué cambiar:
  - Añadir `ParseUUIDv7Pipe` en todos los params `id` de `PreparacionController`.
- por qué:
  - Falla temprano y de forma uniforme (400 controlado).
- cómo mejorarlo:
  - Introducir regla de arquitectura para IDs UUID en controladores.
- cómo reducir riesgos:
  - Suite e2e con IDs invalidos en todas las rutas de preparacion.

#### Prioridad recomendada
- Alta

#### Riesgo de regresión
- Bajo

---

### [REC-AUD-004] Finalizar preparación no es atómico ni idempotente

#### Severidad
- Crítica

#### Categoría
- Backend
- Concurrencia
- Integridad de datos

#### Descripción
`finalizarPreparacion` realiza: 1) lectura de estado, 2) ejecucion de produccion, 3) guardado de estado COMPLETADA. No existe transaccion unificada ni lock de fila de preparacion. En paralelo, dos requests pueden pasar el check de estado y ejecutar produccion dos veces.

#### Riesgo real
Doble consumo de inventario, doble creacion de lotes y coste real duplicado para una misma preparacion.

#### Evidencia
Archivo: backend/smart-economat-backend/src/modules/preparacion/service/preparacion.service.ts:121
```ts
const preparacion = await this.findOne(id);

if (preparacion.estado !== PreparacionEstado.EN_PROCESO) {
  throw new ConflictException(...);
}
```

Archivo: backend/smart-economat-backend/src/modules/preparacion/service/preparacion.service.ts:138
```ts
await this.produccionService.ejecutarProduccion(..., preparacion.id);
```

Archivo: backend/smart-economat-backend/src/modules/preparacion/service/preparacion.service.ts:151
```ts
return this.preparacionRepository.save(preparacion);
```

Archivo: backend/smart-economat-backend/src/modules/receta/produccion-lote.entity/produccion-lote.entity.ts:15
```ts
@Index(['preparacionId'])
```

Archivo: backend/smart-economat-backend/src/modules/receta/service/produccion.service.ts:305
```ts
preparacionId: preparacionId,
```

#### Impacto
- Técnico: perdida de atomicidad transaccional en flujo critico.
- Negocio: inventario y costes falseados.
- UX: estados de preparacion/lote incoherentes.
- Escalabilidad: probabilidad aumenta con concurrencia real.
- Mantenibilidad: correccion posterior compleja y costosa.

#### Solución recomendada
- qué cambiar:
  - Envolver finalizar + produccion + cambio de estado en una transaccion unica.
  - Aplicar lock pesimista sobre preparacion EN_PROCESO.
  - Hacer `preparacionId` unico (constraint/indice unico) en `produccion_lote`.
- por qué:
  - Garantiza exactamente-una-ejecucion por preparacion.
- cómo mejorarlo:
  - Idempotency key por `preparacionId` y retorno del lote existente si ya se ejecuto.
- cómo reducir riesgos:
  - Test de concurrencia (2 requests simultaneas) y validacion de no duplicados.

#### Prioridad recomendada
- Inmediata

#### Riesgo de regresión
- Alto

---

### [REC-AUD-005] Fórmula de merma inconsistente entre producción y pedido desde recetas

#### Severidad
- Alta

#### Categoría
- Dominio
- Backend
- Costes

#### Descripción
Produccion calcula merma con formula fisica `cantidad / (1 - merma)`, mientras `receta-to-pedido` usa `cantidad * (1 + merma)`. Son matematicamente distintas y generan necesidades de compra diferentes.

#### Riesgo real
Subcompra sistematica para mermas altas, roturas de stock y desviaciones de coste esperado.

#### Evidencia
Archivo: backend/smart-economat-backend/src/modules/receta/service/produccion.service.ts:830
```ts
return merma > 0 && merma < 100
  ? cantidadNeta / (1 - merma / 100)
  : cantidadNeta;
```

Archivo: backend/smart-economat-backend/src/modules/pedido/service/receta-to-pedido.service.ts:236
```ts
const cantidadConMerma =
  Number(ingrediente.cantidad) *
  (1 + Number(ingrediente.mermaAplicada ?? 0) / 100);
```

Archivo: backend/smart-economat-backend/test/modules/receta/produccion.service.spec.ts:432
```ts
expect(result.ingredients[0].requerido).toBe(1.111);
```

Archivo: backend/smart-economat-backend/test/modules/pedido/receta-to-pedido.service.spec.ts:390
```ts
{ productoProveedorId: 'pp-1-b', cantidad: 3.2 },
```

#### Impacto
- Técnico: reglas de negocio contradictorias en modulos conectados.
- Negocio: compras insuficientes y sobrecostes operativos.
- UX: recomendaciones de pedido poco confiables.
- Escalabilidad: desviacion acumulativa a mayor volumen.
- Mantenibilidad: imposibilidad de razonar con una unica regla canonica.

#### Solución recomendada
- qué cambiar:
  - Definir formula canonica unica de merma para todo el dominio.
- por qué:
  - Evita decisiones de compra y produccion divergentes.
- cómo mejorarlo:
  - Extraer calculo a helper de dominio compartido + tests parametrizados.
- cómo reducir riesgos:
  - Migracion controlada con comparativa historica antes/despues.

#### Prioridad recomendada
- Alta

#### Riesgo de regresión
- Medio

---

### [REC-AUD-006] Conversión de unidades incompleta con fallback silencioso a factor 1

#### Severidad
- Alta

#### Categoría
- Backend
- Dominio
- Inventario

#### Descripción
El enum de unidades incluye `pieza`, `cda`, `cdta`, pero `conversionFactor` solo contempla kg/g y l/ml. Para cualquier otra combinacion devuelve 1 sin advertencia.

#### Riesgo real
Validaciones de stock y consumos se ejecutan con equivalencias incorrectas y sin error explicito, degradando la exactitud del inventario.

#### Evidencia
Archivo: backend/smart-economat-backend/src/modules/receta/enums/receta.enums.ts:2
```ts
export enum UnidadIngrediente {
  GRAMO = 'g',
  KILOGRAMO = 'kg',
  LITRO = 'l',
  MILILITRO = 'ml',
  PIEZA = 'pieza',
  CUCHARADA = 'cda',
  CUCHARADITA = 'cdta',
}
```

Archivo: backend/smart-economat-backend/src/modules/receta/service/produccion.service.ts:839
```ts
private conversionFactor(fromUnit: unknown, toUnit: unknown): number {
```

Archivo: backend/smart-economat-backend/src/modules/receta/service/produccion.service.ts:862
```ts
return 1;
```

#### Impacto
- Técnico: errores silenciosos de conversion en calculos criticos.
- Negocio: merma/consumo mal estimados y compras defectuosas.
- UX: recomendaciones de faltantes no confiables.
- Escalabilidad: el error escala con diversidad de unidades.
- Mantenibilidad: deuda de dominio dificil de depurar por ausencia de fallo explicito.

#### Solución recomendada
- qué cambiar:
  - Reemplazar fallback `1` por error controlado en conversion no soportada.
  - Definir mapa de conversion explicito por familia de unidades.
- por qué:
  - Es mejor fallar con mensaje claro que operar con dato falso.
- cómo mejorarlo:
  - Servicio de conversion central con tests de tabla (unit tests parametricos).
- cómo reducir riesgos:
  - Telemetria temporal de unidades no convertibles antes de endurecer.

#### Prioridad recomendada
- Alta

#### Riesgo de regresión
- Medio

---

### [REC-AUD-007] Endpoint legacy cocinar opera con lógica distinta a producción moderna

#### Severidad
- Alta

#### Categoría
- Backend
- Dominio
- Coherencia

#### Descripción
`receta.service.cocinar` sigue activo y descuenta inventario sin conversion robusta de unidades ni uso de formula de merma del flujo moderno. Convive con `produccionService.ejecutarProduccion` y puede producir resultados incompatibles.

#### Riesgo real
Misma receta puede consumir stock de forma distinta segun endpoint usado, generando incoherencia de inventario/coste.

#### Evidencia
Archivo: backend/smart-economat-backend/src/modules/receta/service/receta.service.ts:393
```ts
async cocinar(id: string, dto: CocinarRecetaDto): Promise<void> {
```

Archivo: backend/smart-economat-backend/src/modules/receta/service/receta.service.ts:422
```ts
let cantidadRequerida = ing.cantidad * cantidadRecetas;
```

Archivo: backend/smart-economat-backend/src/modules/receta/service/receta.service.ts:429
```ts
const totalStock = invsProducto.reduce(
  (sum, inv) => sum + Number(inv.cantidadActual),
  0
);
```

#### Impacto
- Técnico: dos motores de consumo no equivalentes.
- Negocio: discrepancias de stock y costes por ruta usada.
- UX: resultado impredecible para usuario final.
- Escalabilidad: deriva de comportamiento al crecer casos de uso.
- Mantenibilidad: alta complejidad operando codigo paralelo.

#### Solución recomendada
- qué cambiar:
  - Deprecar endpoint legacy o reusar internamente `ejecutarProduccion`.
- por qué:
  - Unifica regla de negocio en un solo motor.
- cómo mejorarlo:
  - Mantener endpoint por compatibilidad, pero delegar a servicio canonico.
- cómo reducir riesgos:
  - Test de equivalencia entre ambos flujos durante transicion.

#### Prioridad recomendada
- Alta

#### Riesgo de regresión
- Medio

---

### [REC-AUD-008] Filtro de soft-delete puede anularse en findAll de producción

#### Severidad
- Alta

#### Categoría
- Backend
- Datos
- Integridad de consulta

#### Descripción
En `findAll`, el query builder arranca con `.withDeleted().andWhere('deleted_at IS NULL')`, pero ramas de estado usan `.where(...)`, que en TypeORM reemplaza condiciones previas. Eso puede reintroducir filas soft-deleteadas cuando se filtra por estado.

#### Riesgo real
Exposicion de lotes eliminados en listados activos y decisiones de consumo sobre datos no vigentes.

#### Evidencia
Archivo: backend/smart-economat-backend/src/modules/receta/service/produccion.service.ts:441
```ts
.withDeleted()
...
.andWhere('lote.deleted_at IS NULL');
```

Archivo: backend/smart-economat-backend/src/modules/receta/service/produccion.service.ts:447
```ts
queryBuilder.where(
  'lote.porciones_restantes < lote.porciones_producidas'
);
```

Archivo: backend/smart-economat-backend/src/modules/receta/service/produccion.service.ts:451
```ts
queryBuilder.where('lote.estado = :estadoDisponible', {
```

#### Impacto
- Técnico: consulta semantica inconsistente.
- Negocio: visualizacion/accion sobre lotes eliminados.
- UX: listados confusos por estado.
- Escalabilidad: errores mas frecuentes con historico grande.
- Mantenibilidad: bug sutil dificil de detectar en QA superficial.

#### Solución recomendada
- qué cambiar:
  - Sustituir todos los `.where(...)` condicionales por `.andWhere(...)`.
  - Evitar `withDeleted()` salvo caso de uso explicito.
- por qué:
  - Preserva condicion base de no eliminados.
- cómo mejorarlo:
  - Helper de query para estado de lotes con condiciones compuestas seguras.
- cómo reducir riesgos:
  - Test unitario/e2e: un lote soft-deleteado no aparece en ningun filtro normal.

#### Prioridad recomendada
- Alta

#### Riesgo de regresión
- Bajo

---

### [REC-AUD-009] Búsqueda y ordenación en Preparaciones no se aplican en la llamada API

#### Severidad
- Alta

#### Categoría
- Frontend
- API
- UX

#### Descripción
La UI de Preparaciones expone buscador y tabla con estado de query (`useDataTable`), pero `loadData` invoca `fetchProducciones(page, limit, estado)` en modo legacy posicional. Se pierden `searchTerm`, `sortBy` y `order`.

#### Riesgo real
El usuario cree que filtra/ordena datos, pero el backend recibe una consulta parcial y devuelve resultados no alineados con la interfaz.

#### Evidencia
Archivo: frontend/smart-economat-frontend/src/pages/Preparaciones.tsx:252
```ts
const response = await fetchProducciones(
  queryParams.page,
  queryParams.limit,
  estado
);
```

Archivo: frontend/smart-economat-frontend/src/pages/Preparaciones.tsx:773
```tsx
<PageToolbar
  ...
  searchValue={searchTerm}
  onSearchChange={onSearchChange}
```

Archivo: frontend/smart-economat-frontend/src/hooks/useDataTable.ts:185
```ts
const params: QueryParams = {
  ...
  sortBy: state.sortBy,
  order: state.order,
  search: debouncedSearchTerm,
  searchTerm: debouncedSearchTerm,
};
```

#### Impacto
- Técnico: deriva entre estado UI y payload HTTP.
- Negocio: analisis de lotes menos fiable.
- UX: buscador aparentemente roto.
- Escalabilidad: confusión crece con volumen de datos.
- Mantenibilidad: tickets recurrentes de "filtro no funciona".

#### Solución recomendada
- qué cambiar:
  - Pasar objeto completo a `fetchProducciones({ ...queryParams, estado })`.
- por qué:
  - Alinea UI y backend con un unico contrato de consulta.
- cómo mejorarlo:
  - Eliminar sobrecarga legacy por argumentos posicionales.
- cómo reducir riesgos:
  - Test de integración FE: buscar termino y verificar query string enviada.

#### Prioridad recomendada
- Alta

#### Riesgo de regresión
- Bajo

---

### [REC-AUD-010] Backend de producción ignora searchTerm aunque DTO lo soporta

#### Severidad
- Media

#### Categoría
- Backend
- API
- Contrato

#### Descripción
`PaginationQueryDto` soporta `search/searchTerm`, pero `produccion.service.findAll` no utiliza `query.searchTerm` en ningun filtro.

#### Riesgo real
Aunque frontend mande termino de busqueda correctamente, el backend lo ignora y rompe expectativas de contrato.

#### Evidencia
Archivo: backend/smart-economat-backend/src/common/dto/pagination-query.dto.ts:26
```ts
declare searchTerm?: string;
```

Archivo: backend/smart-economat-backend/src/common/dto/pagination-query.dto.ts:30
```ts
search?: string;
```

Archivo: backend/smart-economat-backend/src/modules/receta/service/produccion.service.ts:414
```ts
async findAll(
  query: PaginationQueryDto
): Promise<PaginatedResponseDto<ProduccionLote>> {
```

Archivo: backend/smart-economat-backend/src/modules/receta/service/produccion.service.ts:418-432
```ts
const page = query.page ?? 1;
const limit = Math.min(query.limit ?? 20, 50);
const sortBy = query.sortBy ?? 'fechaProduccion';
const order = query.order ?? 'DESC';
const estado = (query.estado || '').trim().toLowerCase();
```

#### Impacto
- Técnico: incumplimiento de contrato de query.
- Negocio: menor eficiencia operativa al buscar lotes.
- UX: percepcion de sistema lento/no fiable.
- Escalabilidad: impacto aumenta con historico de produccion.
- Mantenibilidad: deuda API silenciosa.

#### Solución recomendada
- qué cambiar:
  - Implementar filtro por `search/searchTerm` (nombre receta, usuario, lote).
- por qué:
  - Cierra el gap contractual FE/BE.
- cómo mejorarlo:
  - Definir campos buscables y usar `ILIKE` index-friendly.
- cómo reducir riesgos:
  - Test unitario/e2e de busqueda en produccion.

#### Prioridad recomendada
- Media

#### Riesgo de regresión
- Bajo

---

### [REC-AUD-011] Recarga redundante de ubicaciones en Recetas por dependencia de loadData

#### Severidad
- Media

#### Categoría
- Frontend
- Performance
- Eficiencia

#### Descripción
En `Recetas.tsx`, el mismo `useEffect` dispara `loadData()` y `UbicacionService.findAll()` cuando cambia `loadData`. Como `loadData` depende de paginacion/filtros, ubicaciones se recargan innecesariamente.

#### Riesgo real
Llamadas extra de red y renderizaciones adicionales sin valor funcional.

#### Evidencia
Archivo: frontend/smart-economat-frontend/src/pages/Recetas.tsx:389
```ts
useEffect(() => {
  loadData();
  UbicacionService.findAll().then(setUbicaciones).catch(console.error);
}, [loadData]);
```

#### Impacto
- Técnico: overhead de red evitable.
- Negocio: consumo de recursos sin beneficio.
- UX: posible latencia extra bajo conexiones lentas.
- Escalabilidad: coste acumulativo con mas usuarios.
- Mantenibilidad: mezcla de responsabilidades en un unico efecto.

#### Solución recomendada
- qué cambiar:
  - Separar carga de ubicaciones en `useEffect([])` o cache global.
- por qué:
  - Evita peticiones repetidas por cambios no relacionados.
- cómo mejorarlo:
  - TTL cache para ubicaciones si se requiere refresco ocasional.
- cómo reducir riesgos:
  - Medir llamadas antes/despues en telemetria frontend.

#### Prioridad recomendada
- Media

#### Riesgo de regresión
- Bajo

---

### [REC-AUD-012] Validación de stock en modal de cocinar vulnerable a respuestas stale

#### Severidad
- Media

#### Categoría
- Frontend
- Estado
- UX

#### Descripción
La validacion usa `setTimeout(async ...)` y luego `setStockValidation(result)` sin control de version de request ni cancelacion real de la promesa en curso.

#### Riesgo real
Una respuesta vieja puede sobrescribir la validacion actual y mostrar faltantes que ya no aplican.

#### Evidencia
Archivo: frontend/smart-economat-frontend/src/pages/Recetas.tsx:561
```ts
const timer = setTimeout(async () => {
  setIsValidatingStock(true);
  try {
    const result = await validarStock(...);
    setStockValidation(result);
```

Archivo: frontend/smart-economat-frontend/src/pages/Recetas.tsx:577
```ts
return () => clearTimeout(timer);
```

#### Impacto
- Técnico: carrera de estado en UI.
- Negocio: decisiones de generar pedidos sobre datos desfasados.
- UX: warnings intermitentes y confusos.
- Escalabilidad: empeora con latencia real y uso intensivo.
- Mantenibilidad: bugs no deterministas.

#### Solución recomendada
- qué cambiar:
  - Añadir requestId incremental o AbortController por validacion.
- por qué:
  - Garantiza aplicar solo la ultima respuesta valida.
- cómo mejorarlo:
  - Hook reutilizable para async debounced con cancelacion.
- cómo reducir riesgos:
  - Tests con latencia simulada y cambios rapidos de cantidades.

#### Prioridad recomendada
- Media

#### Riesgo de regresión
- Medio

---

### [REC-AUD-013] Exportación Excel sin feedback al usuario en caso de error

#### Severidad
- Baja

#### Categoría
- Frontend
- UX
- Observabilidad

#### Descripción
El catch de `handleExportExcel` solo hace `console.error`, sin toast de error ni accion de recuperacion.

#### Riesgo real
Usuario percibe que no pasa nada o no entiende el fallo de exportacion.

#### Evidencia
Archivo: frontend/smart-economat-frontend/src/pages/Recetas.tsx:526
```ts
} catch (err: unknown) {
  console.error('Export Excel Error:', err);
}
```

#### Impacto
- Técnico: manejo de errores incompleto.
- Negocio: soporte adicional por incidencias ambiguas.
- UX: mala comunicacion de fallos.
- Escalabilidad: incremento de tickets de soporte.
- Mantenibilidad: deuda de manejo consistente de errores.

#### Solución recomendada
- qué cambiar:
  - Mostrar toast de error con mensaje traducido.
- por qué:
  - Mejora transparencia y accionabilidad para usuario.
- cómo mejorarlo:
  - Reusar patrón de errores de `exportRecipesPdf`.
- cómo reducir riesgos:
  - Test unitario: fallo en descarga debe disparar toast.error.

#### Prioridad recomendada
- Media

#### Riesgo de regresión
- Bajo

---

### [REC-AUD-014] Riesgo de lectura de rutas locales en exportación PDF por pathImg confiable

#### Severidad
- Alta

#### Categoría
- Backend
- Seguridad
- Hardening

#### Descripción
`CreateRecetaDto` acepta `pathImg/pathImgOptimized` como string libre. Frontend permite enviar `formData.imagen` como string arbitrario. Luego, en PDF, se resuelve ruta aceptando absolutos y rutas relativas resueltas a filesystem local.

#### Riesgo real
Un actor con capacidad de crear/editar receta puede intentar referenciar rutas locales existentes de imagen y forzar su inclusion en PDF, ampliando superficie de exfiltracion de recursos locales.

#### Evidencia
Archivo: backend/smart-economat-backend/src/modules/receta/dto/create-receta.dto.ts:68
```ts
@IsOptional()
@IsString()
pathImg?: string;
```

Archivo: frontend/smart-economat-frontend/src/features/recetas/recetaForm.helpers.ts:201
```ts
finalPathImg = formData.imagen.trim();
```

Archivo: frontend/smart-economat-frontend/src/features/recetas/recetaForm.helpers.ts:258
```ts
...(finalPathImg ? { pathImg: finalPathImg } : {}),
```

Archivo: backend/smart-economat-backend/src/modules/receta/service/receta-pdf.service.ts:733
```ts
if (path.isAbsolute(normalizedUrl)) {
  possiblePaths.add(normalizedUrl);
}
```

Archivo: backend/smart-economat-backend/src/modules/receta/service/receta-pdf.service.ts:737
```ts
possiblePaths.add(path.resolve(normalizedUrl));
```

#### Impacto
- Técnico: incremento de superficie de filesystem local.
- Negocio: potencial fuga de informacion/activos locales.
- UX: no aplica directamente.
- Escalabilidad: riesgo aumenta con mas usuarios con permisos de receta.
- Mantenibilidad: hardening reactivo posterior mas caro.

#### Solución recomendada
- qué cambiar:
  - Permitir solo rutas emitidas por upload service (prefijo/UUID controlado).
  - Rechazar paths absolutos y traversal.
- por qué:
  - Reduce drásticamente superficie de acceso a archivos locales.
- cómo mejorarlo:
  - Persistir identificador de archivo, no ruta libre.
- cómo reducir riesgos:
  - Validacion backend + tests de seguridad con payloads de path maliciosos.

#### Prioridad recomendada
- Inmediata

#### Riesgo de regresión
- Medio

---

### [REC-AUD-015] Exportación PDF múltiple sin límite de IDs y procesamiento secuencial pesado

#### Severidad
- Alta

#### Categoría
- Backend
- Performance
- Disponibilidad

#### Descripción
`exportMultiplePdf` solo valida que exista al menos un ID. No hay maximo de items por request. `generatePdf` procesa IDs en secuencia y para cada uno ejecuta `getDetalle + calcularEscandallo`.

#### Riesgo real
Requests con muchos IDs pueden degradar severamente CPU/IO y bloquear recursos, afectando disponibilidad.

#### Evidencia
Archivo: backend/smart-economat-backend/src/modules/receta/controller/receta.controller.ts:226
```ts
if (idArray.length === 0) {
  throw new BadRequestException(...)
}
```

Archivo: backend/smart-economat-backend/src/modules/receta/service/receta-pdf.service.ts:136
```ts
for (const id of ids) {
  recipesData.push(await this.getCompleteRecetaData(id, normalizedLang));
}
```

Archivo: backend/smart-economat-backend/src/modules/receta/service/receta-pdf.service.ts:175
```ts
const detalle = await this.recetaService.getDetalle(id);
const escandallo = await this.recetaService.calcularEscandallo(id);
```

Archivo: frontend/smart-economat-frontend/src/services/receta.service.ts:214
```ts
ids: ids.join(','),
```

#### Impacto
- Técnico: cuello de botella en endpoint binario.
- Negocio: degradacion percibida de toda la plataforma en picos.
- UX: tiempos largos o timeouts al exportar.
- Escalabilidad: no escala linealmente con volumen de recetas.
- Mantenibilidad: hardening tardio mas complejo.

#### Solución recomendada
- qué cambiar:
  - Limitar IDs por request (ej. 20/50) y devolver 400 si excede.
  - Considerar job asincrono para lotes grandes.
- por qué:
  - Protege disponibilidad y previsibilidad del endpoint.
- cómo mejorarlo:
  - Chunking en frontend + cola backend para exportaciones masivas.
- cómo reducir riesgos:
  - Rate limiting especifico para rutas de exportacion PDF.

#### Prioridad recomendada
- Alta

#### Riesgo de regresión
- Bajo

---

### [REC-AUD-016] Lectura con efectos colaterales en RecetaRepository.findById

#### Severidad
- Media

#### Categoría
- Backend
- Diseño
- Mantenibilidad

#### Descripción
`findById` modifica y guarda la receta si detecta `rendimiento <= 0` o `unidadResultado` vacia. Una operacion de lectura provoca escritura implicita.

#### Riesgo real
Aumenta lock contention y genera cambios de datos fuera de flujos de actualizacion explicitos.

#### Evidencia
Archivo: backend/smart-economat-backend/src/modules/receta/repository/receta.repository.ts:244
```ts
if (receta && (!receta.rendimiento || receta.rendimiento <= 0)) {
  receta.rendimiento = 1;
  if (!receta.unidadResultado) {
    receta.unidadResultado = UnidadIngrediente.PIEZA;
  }
  await this.recetaRepo.save(receta);
}
```

#### Impacto
- Técnico: side effects ocultos en lectura.
- Negocio: trazabilidad de cambios menos clara.
- UX: no aplica directo.
- Escalabilidad: escrituras extra bajo lecturas masivas.
- Mantenibilidad: comportamiento inesperado para futuros desarrolladores.

#### Solución recomendada
- qué cambiar:
  - Mover normalizacion a migracion de datos o flujo de escritura.
- por qué:
  - Mantiene principio de lecturas sin side-effects.
- cómo mejorarlo:
  - Validar defaults en create/update y sanear historico en script controlado.
- cómo reducir riesgos:
  - Test de no-mutacion para metodos find*.

#### Prioridad recomendada
- Media

#### Riesgo de regresión
- Bajo

---

### [REC-AUD-017] Clave i18n inconsistente en selector de ingredientes

#### Severidad
- Baja

#### Categoría
- Frontend
- UX
- Internacionalizacion

#### Descripción
En una rama del componente se usa `recetas.ingredientes...` y en otra `recipes.ingredientes...`. Los locales definidos usan `recipes`.

#### Riesgo real
Fallback a clave sin traducir en UI para ciertos renderizados.

#### Evidencia
Archivo: frontend/smart-economat-frontend/src/components/ui/RecetaIngredientesSelector.tsx:798
```ts
t('recipes.ingredientes.proveedorDesconocido');
```

Archivo: frontend/smart-economat-frontend/src/components/ui/RecetaIngredientesSelector.tsx:924
```ts
t('recetas.ingredientes.proveedorDesconocido')
```

Archivo: frontend/smart-economat-frontend/src/i18n/es.json:346
```json
"proveedorDesconocido": "Proveedor desconocido"
```

#### Impacto
- Técnico: inconsistencia de claves de traduccion.
- Negocio: nulo directo.
- UX: texto sin traducir en escenarios concretos.
- Escalabilidad: deuda menor acumulativa.
- Mantenibilidad: ruido semantico en i18n.

#### Solución recomendada
- qué cambiar:
  - Unificar a `recipes.ingredientes.proveedorDesconocido`.
- por qué:
  - Evita fallback de clave visible.
- cómo mejorarlo:
  - Lint de claves i18n inexistentes en CI.
- cómo reducir riesgos:
  - Test de render multilenguaje para selector.

#### Prioridad recomendada
- Media

#### Riesgo de regresión
- Bajo

---

### [REC-AUD-018] Cobertura de testing insuficiente en seguridad y concurrencia del módulo recetas

#### Severidad
- Alta

#### Categoría
- Testing
- QA
- Seguridad

#### Descripción
Existen tests para rutas de recetas/preparaciones, pero con asserts permisivos y sin casos criticos de seguridad/concurrencia (roles no autorizados, UUID invalidos, doble finalizacion simultanea).

#### Riesgo real
Regresiones de seguridad e integridad pueden llegar a produccion sin ser detectadas por CI.

#### Evidencia
Archivo: backend/smart-economat-backend/test/e2e/endpoint-inventory-coverage.e2e-spec.ts:591
```ts
.expect([200, 400]);
```

Archivo: backend/smart-economat-backend/test/e2e/endpoint-inventory-coverage.e2e-spec.ts:1025
```ts
.expect([200, 400]);
```

Archivo: backend/smart-economat-backend/test/e2e/endpoint-inventory-coverage.e2e-spec.ts:1027
```ts
.post(`/api/v1/recetas/${rid}/recalcular-costes`)
  .set('Authorization', `Bearer ${adminToken}`)
  .expect(200);
```

Archivo: backend/smart-economat-backend/test/modules/preparacion/preparacion.service.spec.ts:82
```ts
await service.finalizarPreparacion('prep-1', 'user-1');
```

#### Impacto
- Técnico: poca deteccion preventiva de regresiones graves.
- Negocio: incidentes en produccion por huecos de pruebas.
- UX: fallos visibles no detectados previamente.
- Escalabilidad: riesgo creciente con cada nueva feature.
- Mantenibilidad: QA reactivo en vez de preventivo.

#### Solución recomendada
- qué cambiar:
  - Añadir tests dirigidos a hallazgos criticos/altos.
- por qué:
  - Bloquea regresiones antes de merge.
- cómo mejorarlo:
  - e2e: rol no autorizado en recalcular, UUID invalido en preparaciones.
  - concurrencia: doble finalize simultaneo debe crear solo un lote.
  - contrato: busqueda/orden en produccion y exclusion de soft-delete.
- cómo reducir riesgos:
  - Definir suite minima obligatoria del modulo recetas en CI.

#### Prioridad recomendada
- Inmediata

#### Riesgo de regresión
- Bajo

---

## Inconsistencias Frontend/Backend
- El frontend de Preparaciones expone buscador/ordenacion (`useDataTable`) pero la llamada actual a backend no envia `searchTerm/sortBy/order` al usar firma posicional de `fetchProducciones`.
- El backend de Produccion declara contrato de paginacion con `search/searchTerm` pero no aplica ningun filtro por termino.
- Formula de merma no canonica entre produccion (`cantidad/(1-merma)`) y compra desde recetas (`cantidad*(1+merma)`), generando resultados distintos para misma receta.
- El endpoint legacy `/recetas/:id/cocinar` mantiene logica de consumo distinta del flujo de produccion actual, provocando comportamientos divergentes para el mismo dominio.
- Frontend permite enviar `pathImg` como string libre y backend lo consume para resolver rutas de imagen locales en PDF, sin whitelist estricta de origen de archivo.
- En i18n de selector de ingredientes coexisten claves `recipes.*` y `recetas.*` para el mismo texto.

---

## Riesgos Potenciales Futuros
- Riesgo de incidente de seguridad por acceso no autorizado a recalculos de coste si se amplian perfiles/permisos.
- Riesgo de corrupcion operativa de inventario y costes por doble finalizacion concurrente de preparaciones.
- Riesgo de degradacion de disponibilidad por exportaciones PDF masivas sin limite ni asincronia.
- Riesgo de errores de compra por divergencia matematica de merma en cadena recetas -> pedido.
- Riesgo de deuda funcional en UX por buscadores/filtros que aparentan funcionar pero no impactan backend.
- Riesgo de fugas de recursos locales si no se endurece el manejo de rutas de imagen.

---

## Deuda Técnica
- deuda crítica:
  - autorizacion incompleta en endpoint de recalculo de costes.
  - falta de atomicidad e idempotencia en finalizar preparacion.
- deuda importante:
  - inconsistencia de merma entre modulos.
  - conversion de unidades incompleta con fallback silencioso.
  - filtros de produccion con posible fuga de soft-delete.
  - deriva FE/BE en busqueda/orden de preparaciones.
  - hardening insuficiente en rutas de imagen para PDF.
  - cobertura de tests insuficiente en seguridad/concurrencia.
- deuda tolerable:
  - recarga redundante de ubicaciones en frontend.
  - manejo de error UX incompleto en export Excel.
  - side effects de escritura en lectura de receta.
  - typo i18n puntual en selector.

---

## Recomendaciones Estratégicas
- Bloquear release productiva del modulo recetas hasta cerrar hallazgos Inmediatos (`REC-AUD-001`, `REC-AUD-004`, `REC-AUD-014`, `REC-AUD-018`).
- Establecer una regla de arquitectura obligatoria: endpoint con `@Roles` debe incluir `RolesGuard` (o guard global equivalente) y permiso explicito.
- Unificar modelo canonico de produccion: deprecar logica legacy `cocinar` y centralizar consumos/costes en `ProduccionService`.
- Formalizar libreria de dominio para calculos de merma y conversion de unidades (una sola fuente de verdad).
- Endurecer exportaciones: limites de batch, rate-limit dedicado y opcion asincrona para lotes grandes.
- Introducir contract tests FE/BE del modulo recetas para query params, errores esperados y shapes de respuesta.
- Añadir pruebas de concurrencia e idempotencia como parte obligatoria de CI para flujos de preparacion/produccion.

---

## Conclusión Final
El modulo recetas no esta en estado de colapso, pero si en una zona de riesgo operativo alto para un entorno enterprise exigente. El principal problema no es la ausencia de funcionalidad, sino la falta de consistencia fuerte entre seguridad, transaccionalidad y reglas de dominio compartidas.

Hay base tecnica aprovechable, pero la plataforma necesita endurecimiento inmediato en autorizacion, atomicidad y hardening de exportaciones antes de escalar con confianza. Sin esas correcciones, el sistema mantiene un perfil de incidente elevado en escenarios reales de concurrencia, volumen y operacion multirol.