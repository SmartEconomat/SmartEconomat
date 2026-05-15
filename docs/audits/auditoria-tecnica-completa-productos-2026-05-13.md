# Auditoría Técnica Completa

## Resumen Ejecutivo
- estado general del proyecto
  - El modulo de productos esta funcional y con una base tecnica solida (DTOs, guards, transacciones, cliente HTTP centralizado, suites de test relevantes en verde), pero tiene incoherencias de dominio y varios puntos de fragilidad operacional.
- nivel de riesgo
  - Alto.
- principales problemas
  - Regla de visibilidad por rol no implementada aunque el controlador la anuncia.
  - Conflicto estructural entre soft-delete y restriccion unica en producto_proveedor (riesgo real de bloqueo funcional al reinsertar proveedor eliminado).
  - Inconsistencia semantica entre activo vs eliminado entre frontend, backend y tests.
  - Riesgos de estado en frontend por peticiones concurrentes sin cancelacion/guardado de version.
  - Contratos frontend/backend con deriva de tipos en puntos concretos (alergenos, comparativa proveedor).
- principales fortalezas
  - Seguridad base bien planteada: JwtAuthGuard + PermisosGuard aplicado en endpoints del modulo.
  - Validacion por DTO y transformadores en backend.
  - Capa de API frontend centralizada en api.service.
  - Pruebas del modulo ejecutadas en esta auditoria y en verde.
- criticidad general
  - Aceptable para entorno de preproduccion controlado, no recomendable para produccion critica sin resolver primero hallazgos de prioridad inmediata/alta.

## Métricas Generales
- arquitectura: Aceptable
- mantenibilidad: Aceptable
- escalabilidad: Deficiente
- seguridad: Aceptable
- performance: Aceptable
- coherencia de dominio: Deficiente
- tipado: Aceptable
- resiliencia: Deficiente
- claridad del código: Aceptable

## Estado de implementación (2026-05-13)
- Hallazgos corregidos en código: PROD-AUD-001 a PROD-AUD-014.
- Verificación final ejecutada:
  - Backend build: OK.
  - Frontend build: OK.
  - Backend lint (archivos afectados): OK.
  - Frontend lint (archivos afectados): OK.
  - Backend tests (productos): 4 suites, 23 tests OK.
  - Frontend tests (productos): 6 archivos, 14 tests OK.

## Hallazgos

### [PROD-AUD-001] Regla de visibilidad por rol declarada pero no aplicada

#### Severidad
- Alta

#### Categoría
- Backend
- Seguridad
- Dominio

#### Descripción
El controlador de productos declara que usa el rol del usuario para filtrar visibilidad, pero el servicio ignora completamente ese dato. Esto rompe la semantica documentada y deja la proteccion dependiente solo de permisos globales, sin restricciones de contexto de rol dentro del modulo.

#### Riesgo real
Puede exponerse catalogo o detalles de producto a perfiles que deberian ver una vista acotada (por ejemplo, escenarios de alumno/rol restringido). Tambien genera falsa sensacion de cobertura de seguridad por documentacion no cumplida.

#### Evidencia
Archivo: backend/smart-economat-backend/src/modules/producto/controller/producto.controller.ts:119
```ts
* @param req Objeto de petición para extraer el rol del usuario (filtra productos inactivos para alumnos).
```

Archivo: backend/smart-economat-backend/src/modules/producto/controller/producto.controller.ts:130
```ts
const userRole = req.user?.rol;
return this.productoService.findAll(query, userRole);
```

Archivo: backend/smart-economat-backend/src/modules/producto/service/producto.service.ts:165
```ts
void userRole;
```

Archivo: backend/smart-economat-backend/src/modules/producto/service/producto.service.ts:264
```ts
void _userRole;
```

#### Impacto
- Técnico: regla de autorizacion incompleta en capa de dominio.
- Negocio: potencial exposicion de informacion no alineada con politicas de rol.
- UX: comportamiento incoherente respecto a lo esperado por perfil.
- Escalabilidad: al crecer perfiles y permisos, aumenta la complejidad de corregir sin regressions.
- Mantenibilidad: contrato controlador/servicio contradictorio.

#### Solución recomendada
- qué cambiar
  - Implementar filtro real por rol en findAll/findOne o eliminar explicitamente la pretension de filtrado por rol si no aplica al dominio.
- por qué
  - Evita discrepancia entre seguridad declarada y seguridad real.
- cómo mejorarlo
  - Centralizar politica de visibilidad de producto por rol en una funcion de dominio reusable.
  - Añadir tests unitarios/e2e por rol para activos, eliminados y detalle.
- cómo reducir riesgos
  - Feature flag de validacion por rol en rollout progresivo + logging de decisiones de visibilidad.

#### Prioridad recomendada
- Inmediata

#### Riesgo de regresión
- Medio

---

### [PROD-AUD-002] Soft-delete + unicidad en producto_proveedor bloquea re-alta funcional

#### Severidad
- Crítica

#### Categoría
- Backend
- Estado
- Dominio

#### Descripción
La entidad producto_proveedor define unicidad por productoId/proveedorId y el flujo de sincronizacion elimina relaciones con softDelete, pero al volver a agregar el mismo proveedor intenta insertar una nueva fila sin restaurar la anterior soft-deleteada.

#### Riesgo real
En operaciones normales de negocio (quitar proveedor y volver a asociar), se puede disparar conflicto de unicidad y romper un flujo legitimo. Es un bug estructural de persistencia.

#### Evidencia
Archivo: backend/smart-economat-backend/src/modules/producto/producto-proveedor.entity/producto-proveedor.entity.ts:24
```ts
@Unique(['productoId', 'proveedorId'])
```

Archivo: backend/smart-economat-backend/src/modules/producto/service/producto.service.ts:1029
```ts
await manager.softDelete(ProductoProveedor, toDelete.id);
```

Archivo: backend/smart-economat-backend/src/modules/producto/service/producto.service.ts:925
```ts
manager.create(ProductoProveedor, {
```

#### Impacto
- Técnico: colision de integridad en reinsertados.
- Negocio: bloqueo operativo en mantenimiento de acuerdos con proveedores.
- UX: error inesperado al usuario en un caso legitimo.
- Escalabilidad: el problema aumenta con mayor rotacion de proveedores.
- Mantenibilidad: workaround manual recurrente en soporte.

#### Solución recomendada
- qué cambiar
  - En syncProveedoresWithManager, buscar con withDeleted y restaurar si existe relacion previa soft-deleteada en vez de insertar.
- por qué
  - Elimina colisiones de unicidad y preserva historico de relacion.
- cómo mejorarlo
  - Flujo: detectar registro con deletedAt != null -> restore + update de campos.
  - Mantener soft-delete para auditoria, evitando hard delete salvo politica explicita.
- cómo reducir riesgos
  - Test unitario especifico: remove provider -> add same provider -> success.

#### Prioridad recomendada
- Inmediata

#### Riesgo de regresión
- Alto

---

### [PROD-AUD-003] proveedorId en historial de precios sin validación de UUID

#### Severidad
- Alta

#### Categoría
- Backend
- API
- Seguridad

#### Descripción
El endpoint de historial por producto acepta proveedorId como string plano sin ParseUUIDPipe ni DTO de query. Luego se usa directamente en consulta sobre columna UUID.

#### Riesgo real
Un proveedorId malformado puede generar errores de base de datos y respuestas 500 evitables. Es una superficie de fallo y ruido operacional.

#### Evidencia
Archivo: backend/smart-economat-backend/src/modules/producto/controller/producto.controller.ts:223
```ts
@Query('proveedorId') proveedorId?: string
```

Archivo: backend/smart-economat-backend/src/modules/producto/service/producto.service.ts:693
```ts
query.andWhere('pp.proveedorId = :proveedorId', { proveedorId });
```

#### Impacto
- Técnico: errores evitables por input invalido.
- Negocio: mayor ruido en monitorizacion y soporte.
- UX: mensajes de error no predecibles.
- Escalabilidad: mayor coste de observabilidad bajo trafico hostil/erroneo.
- Mantenibilidad: obliga a gestionar excepciones en capas no adecuadas.

#### Solución recomendada
- qué cambiar
  - Validar proveedorId con ParseUUIDPipe o DTO de query estricto.
- por qué
  - Fail-fast en capa HTTP y errores 400 coherentes.
- cómo mejorarlo
  - Introducir ProductPriceHistoryQueryDto con proveedorId opcional UUID.
- cómo reducir riesgos
  - Test e2e: proveedorId invalido debe devolver 400.

#### Prioridad recomendada
- Alta

#### Riesgo de regresión
- Bajo

---

### [PROD-AUD-004] Modelo de estado activo/eliminado inconsistente entre frontend y backend

#### Severidad
- Alta

#### Categoría
- Dominio
- Frontend
- Backend

#### Descripción
La semantica de activo y eliminado no esta alineada en contratos y comentarios. Backend define que eliminados son solo soft-delete; frontend tipa que activo=false se lista en Eliminados; tests e2e de inactivos realmente usan deletedAt.

#### Riesgo real
Aparecen estados imposibles/no visibles (activo=false y deletedAt null), confusion funcional y decisiones incorrectas de negocio basadas en UI.

#### Evidencia
Archivo: backend/smart-economat-backend/src/modules/producto/producto.entity/producto.entity.ts:114
```ts
La pestaña «Eliminados» solo incluye filas con `deleted_at`; inactivos sin borrar no se listan ahí.
```

Archivo: backend/smart-economat-backend/src/modules/producto/service/producto.service.ts:189
```ts
queryBuilder.andWhere('producto.deleted_at IS NOT NULL');
```

Archivo: backend/smart-economat-backend/src/modules/producto/service/producto.service.ts:193
```ts
.andWhere('producto.activo = :productoActivo', { productoActivo: true })
```

Archivo: frontend/smart-economat-frontend/src/services/producto.types.ts:116
```ts
/** false: fuera del catálogo sin soft-delete; se lista en «Eliminados». */
```

Archivo: frontend/smart-economat-frontend/test/e2e/productos-inactivos-tab.spec.ts:45
```ts
return items.filter((p) => Boolean(p.deletedAt));
```

#### Impacto
- Técnico: contrato ambiguo y comportamiento no determinista por estado.
- Negocio: errores en gestion de catalogo/inactivacion.
- UX: pestañas que no reflejan realidad esperada.
- Escalabilidad: la deuda semantica crece con nuevos flujos.
- Mantenibilidad: mas coste de onboarding y debugging.

#### Solución recomendada
- qué cambiar
  - Definir y documentar una semantica unica: activo/inactivo vs eliminado.
- por qué
  - Evita contradicciones de negocio y bugs de visibilidad.
- cómo mejorarlo
  - Alinear DTOs, tipos frontend y reglas de query.
  - Si activo=false debe tener tab dedicada, implementarla explicitamente.
- cómo reducir riesgos
  - Matriz de estados y tests de contrato por combinacion (activo/deletedAt).

#### Prioridad recomendada
- Inmediata

#### Riesgo de regresión
- Alto

---

### [PROD-AUD-005] Riesgo de race condition en carga de listado de productos

#### Severidad
- Alta

#### Categoría
- Frontend
- Estado
- Performance

#### Descripción
La carga usa promesas encadenadas sin cancelacion ni control de version de request. Cambios rapidos de busqueda/filtros/paginacion/tab pueden dejar en UI el resultado de una respuesta antigua.

#### Riesgo real
Usuario ve datos stale, puede editar/eliminar sobre un contexto que ya no corresponde al filtro actual.

#### Evidencia
Archivo: frontend/smart-economat-frontend/src/pages/Productos.tsx:231
```ts
const loadData = useCallback(async () => {
```

Archivo: frontend/smart-economat-frontend/src/pages/Productos.tsx:235
```ts
fetchProductos({ ... })
  .then((productosData) => {
    setData(productosData.data);
```

Archivo: frontend/smart-economat-frontend/src/pages/Productos.tsx (sin AbortController/signal)
```ts
// No hay mecanismo de cancelación ni control de request activa
```

#### Impacto
- Técnico: estado eventual incoherente en UI.
- Negocio: decisiones operativas sobre datos desfasados.
- UX: parpadeo/cambios inesperados de resultados.
- Escalabilidad: empeora con latencia real y mayor concurrencia de usuario.
- Mantenibilidad: bugs intermitentes dificiles de reproducir.

#### Solución recomendada
- qué cambiar
  - Incorporar control de concurrencia (AbortController o requestId incremental).
- por qué
  - Garantiza que solo el ultimo request actualice estado.
- cómo mejorarlo
  - Guardar token de request actual en ref, ignorar respuestas viejas.
- cómo reducir riesgos
  - Tests de race con latencias simuladas y cambio rapido de filtros/tab.

#### Prioridad recomendada
- Alta

#### Riesgo de regresión
- Medio

---

### [PROD-AUD-006] Click en acciones de fila propaga evento y dispara apertura de detalle

#### Severidad
- Media

#### Categoría
- Frontend
- UX
- Estado

#### Descripción
La fila completa es clickable para abrir detalle. En acciones Editar/Eliminar no se detiene la propagacion del click, por lo que puede abrirse el detalle mientras se intenta otra accion.

#### Riesgo real
Flujos simultaneos no intencionados (modal de detalle + modal de edicion/confirmacion), errores de contexto y mala experiencia de usuario.

#### Evidencia
Archivo: frontend/smart-economat-frontend/src/components/ui/DataTable.tsx:716
```ts
onClick={onRowClick ? () => onRowClick(row) : undefined}
```

Archivo: frontend/smart-economat-frontend/src/pages/Productos.tsx:589
```ts
onClick={() => setProductToDelete(row)}
```

Archivo: frontend/smart-economat-frontend/src/pages/Productos.tsx:602
```ts
// Solo restore hace stopPropagation
e.stopPropagation();
```

#### Impacto
- Técnico: colision de handlers de UI.
- Negocio: posibles operaciones equivocadas por confusion de contexto.
- UX: comportamiento sorpresivo y frustrante.
- Escalabilidad: no aplica directamente.
- Mantenibilidad: incrementa incidencias de interfaz.

#### Solución recomendada
- qué cambiar
  - Añadir stopPropagation en Editar/Eliminar (lista y grid si aplica).
- por qué
  - Aisla accion primaria del click de fila.
- cómo mejorarlo
  - Utilidad comun para action buttons dentro de filas clicables.
- cómo reducir riesgos
  - Test UI unitario: click en editar no debe ejecutar onRowClick.

#### Prioridad recomendada
- Alta

#### Riesgo de regresión
- Bajo

---

### [PROD-AUD-007] Limite duro de 100 proveedores en modal de producto

#### Severidad
- Media

#### Categoría
- Frontend
- Escalabilidad

#### Descripción
El formulario de producto carga proveedores con una sola pagina de 100 elementos. En escenarios con catalogo de proveedores mayor, parte del universo queda inaccesible desde UI.

#### Riesgo real
Imposibilidad de asociar proveedores validos, decisiones de compra incompletas y bloqueos funcionales en crecimiento.

#### Evidencia
Archivo: frontend/smart-economat-frontend/src/features/productos/ProductoFormModal.tsx:155
```ts
fetchProveedores(1, 100)
```

#### Impacto
- Técnico: limitacion artificial de datos.
- Negocio: perdida de flexibilidad operativa.
- UX: usuario no encuentra proveedor existente.
- Escalabilidad: cuello de botella directo.
- Mantenibilidad: workaround manual continuo.

#### Solución recomendada
- qué cambiar
  - Sustituir carga fija por buscador remoto paginado.
- por qué
  - Escala con volumen real de proveedores.
- cómo mejorarlo
  - Autocomplete async por termino + pagina incremental.
- cómo reducir riesgos
  - Mantener fallback de pagina inicial + telemetria de no-resultados.

#### Prioridad recomendada
- Media

#### Riesgo de regresión
- Medio

---

### [PROD-AUD-008] Comparativa de proveedores: endpoint backend existe pero frontend no lo consume

#### Severidad
- Media

#### Categoría
- API
- Frontend
- UX

#### Descripción
El backend expone comparacion de coste efectivo por proveedor, pero el frontend de productos no invoca ese endpoint. A la vez, el detalle intenta renderizar campos de comparativa en proveedores del producto base, donde normalmente no existen.

#### Riesgo real
UX incompleta/engañosa: se sugiere inteligencia de comparacion sin datos reales; deuda funcional latente.

#### Evidencia
Archivo: backend/smart-economat-backend/src/modules/producto/controller/producto-proveedor.controller.ts:136
```ts
@Get('comparar/:productoId')
```

Archivo: frontend/smart-economat-frontend/src/pages/Productos.tsx:1094
```ts
{pv.esOptimo && (...)}
```

Archivo: frontend/smart-economat-frontend/src/services/producto.service.ts
```ts
// No existe cliente para /producto-proveedor/comparar/:productoId
```

#### Impacto
- Técnico: codigo de presentacion parcialmente muerto.
- Negocio: decisiones de coste sin herramienta prometida en UI.
- UX: expectativas no cumplidas.
- Escalabilidad: n/a.
- Mantenibilidad: mayor ruido semantico en tipos/componentes.

#### Solución recomendada
- qué cambiar
  - Implementar cliente frontend para endpoint de comparacion o retirar UI dependiente.
- por qué
  - Evitar deuda de funcionalidad fantasma.
- cómo mejorarlo
  - Cargar comparativa bajo demanda al abrir detalle.
- cómo reducir riesgos
  - Feature toggle y test e2e del flujo completo de comparacion.

#### Prioridad recomendada
- Media

#### Riesgo de regresión
- Bajo

---

### [PROD-AUD-009] Normalización de enums en frontend con cast inseguro

#### Severidad
- Media

#### Categoría
- TypeScript
- Frontend
- API

#### Descripción
normalizeUnidadMedida y normalizeAlergeno hacen cast directo tras upperCase, sin validar pertenencia al enum real. El payload puede enviar valores sintacticamente transformados pero semanticamente invalidos.

#### Riesgo real
Errores 400 evitables en backend, peor resiliencia del formulario y mensajes de error tardios.

#### Evidencia
Archivo: frontend/smart-economat-frontend/src/services/producto.types.ts:60
```ts
return value.toUpperCase() as UnidadMedida;
```

Archivo: frontend/smart-economat-frontend/src/services/producto.types.ts:72
```ts
return value.toUpperCase() as BackendAlergeno;
```

Archivo: frontend/smart-economat-frontend/src/features/productos/productoForm.helpers.ts:109
```ts
normalizeAlergeno(...)
```

#### Impacto
- Técnico: tipado fuerte aparente, validacion debil real.
- Negocio: friccion en alta/edicion de productos.
- UX: errores tardios y poco guiados.
- Escalabilidad: mas incidencias con integraciones externas (OFF).
- Mantenibilidad: bug recurrente en frontera FE/BE.

#### Solución recomendada
- qué cambiar
  - Validar contra sets canonicos y devolver undefined real para valores no soportados.
- por qué
  - Prevencion temprana de payload invalido.
- cómo mejorarlo
  - Mapa/guard de tipos runtime + mensaje de campo.
- cómo reducir riesgos
  - Tests unitarios para valores validos/invalidos por enum.

#### Prioridad recomendada
- Media

#### Riesgo de regresión
- Bajo

---

### [PROD-AUD-010] Deriva de contrato en tipo de alérgeno frontend

#### Severidad
- Media

#### Categoría
- API
- TypeScript

#### Descripción
El tipo frontend ProductoAlergeno usa id_producto, mientras backend serializa productoId en entidad. Aunque hoy no rompa flujo principal, es una deriva de contrato que puede romper mapeos futuros.

#### Riesgo real
Fallo silencioso al usar ese campo en nuevas vistas, filtros o transformaciones.

#### Evidencia
Archivo: frontend/smart-economat-frontend/src/services/producto.types.ts:77
```ts
id_producto: string;
```

Archivo: backend/smart-economat-backend/src/modules/producto/producto-alergeno.entity/producto-alergeno.entity.ts:25
```ts
productoId!: string;
```

#### Impacto
- Técnico: incompatibilidad potencial de shape.
- Negocio: defectos futuros en reporting/vistas.
- UX: datos de alergenos potencialmente incompletos.
- Escalabilidad: deuda aumenta con nuevos consumidores.
- Mantenibilidad: mas coste de refactor y contract tests.

#### Solución recomendada
- qué cambiar
  - Unificar tipo frontend con productoId.
- por qué
  - Evita drift semantico entre contratos.
- cómo mejorarlo
  - Centralizar tipos compartidos o generar cliente tipado desde OpenAPI.
- cómo reducir riesgos
  - Contract tests de serializacion de producto con alergenos.

#### Prioridad recomendada
- Alta

#### Riesgo de regresión
- Bajo

---

### [PROD-AUD-011] getProductoById oculta errores de backend devolviendo null

#### Severidad
- Media

#### Categoría
- Frontend
- Resiliencia
- API

#### Descripción
La funcion requestProductoById retorna null ante cualquier HTTP no-OK, sin distinguir 404 de 401/403/500.

#### Riesgo real
Se enmascaran errores reales como si el producto no existiera, afectando decisiones de UI y depuracion.

#### Evidencia
Archivo: frontend/smart-economat-frontend/src/services/producto.service.ts:170
```ts
if (!response.ok) {
  return null;
}
```

#### Impacto
- Técnico: perdida de semantica de error.
- Negocio: acciones incorrectas por falso negativo.
- UX: mensajes ambiguos o inexistentes.
- Escalabilidad: observabilidad degradada.
- Mantenibilidad: diagnostico mas lento.

#### Solución recomendada
- qué cambiar
  - Diferenciar 404 (null) de otros estados (throw ApiError).
- por qué
  - Preserva semantica de negocio y mejora trazabilidad.
- cómo mejorarlo
  - Reusar parseApiResponse/baseFetch con manejo de status especifico.
- cómo reducir riesgos
  - Tests unitarios por codigo de estado.

#### Prioridad recomendada
- Media

#### Riesgo de regresión
- Bajo

---

### [PROD-AUD-012] Cobertura de testing insuficiente en rutas criticas de productos

#### Severidad
- Alta

#### Categoría
- Testing
- QA

#### Descripción
Las suites del modulo pasan, pero hay huecos de cobertura en rutas de mayor riesgo: controlador backend casi sin asserts funcionales y pagina frontend solo valida flujo de scanner.

#### Riesgo real
Regresiones en autorizacion, semantica de estados y acciones de tabla pueden llegar a produccion sin deteccion temprana.

#### Evidencia
Archivo: backend/smart-economat-backend/test/modules/producto/producto.controller.spec.ts:124
```ts
it('should be defined', () => {
```

Archivo: frontend/smart-economat-frontend/test/pages/Productos.test.tsx:163
```ts
it('envía el código escaneado al flujo de búsqueda de Productos', async () => {
```

#### Impacto
- Técnico: baja deteccion preventiva de regresion.
- Negocio: mayor coste de incidentes post-release.
- UX: fallos visibles en interacciones principales.
- Escalabilidad: el riesgo crece con cada nueva feature.
- Mantenibilidad: QA reactivo en vez de preventivo.

#### Solución recomendada
- qué cambiar
  - Añadir tests dirigidos a los hallazgos de alta criticidad.
- por qué
  - Blindar contratos y reglas de dominio.
- cómo mejorarlo
  - Backend: tests de rol/visibilidad, proveedorId invalido, re-alta proveedor soft-deleteado.
  - Frontend: tests de race condition, stopPropagation de acciones, estados activo/deleted.
- cómo reducir riesgos
  - Definir matriz de regresion minima obligatoria para modulo productos.

#### Prioridad recomendada
- Inmediata

#### Riesgo de regresión
- Bajo

---

### [PROD-AUD-013] Logs de depuración en flujo de guardado de productos

#### Severidad
- Baja

#### Categoría
- Frontend
- Observabilidad

#### Descripción
El flujo de guardado/restauracion en pagina de productos mantiene console.log/console.error de depuracion en runtime.

#### Riesgo real
Ruido en consola, posible exposicion de payloads internos en entornos compartidos y menor higiene de observabilidad.

#### Evidencia
Archivo: frontend/smart-economat-frontend/src/pages/Productos.tsx:304
```ts
console.log('[DEBUG] Guardando producto:', formData);
```

Archivo: frontend/smart-economat-frontend/src/pages/Productos.tsx:328
```ts
console.error('[DEBUG] Error al guardar producto:', err);
```

#### Impacto
- Técnico: ruido de logging no estructurado.
- Negocio: n/a directo.
- UX: n/a directo.
- Escalabilidad: mas ruido en soporte y debugging remoto.
- Mantenibilidad: deterioro de disciplina de logging.

#### Solución recomendada
- qué cambiar
  - Retirar logs de debug o pasarlos a logger estructurado condicionado por entorno.
- por qué
  - Mejora señal/ruido y seguridad operativa.
- cómo mejorarlo
  - Reemplazar por telemetry centralizada con niveles.
- cómo reducir riesgos
  - Regla lint para bloquear logs de debug en produccion.

#### Prioridad recomendada
- Media

#### Riesgo de regresión
- Bajo

---

### [PROD-AUD-014] Erosion de tipado estricto con any en backend de productos

#### Severidad
- Baja

#### Categoría
- TypeScript
- Backend

#### Descripción
Persisten castings as any en rutas criticas de sincronizacion de proveedores y en helper de query compartido.

#### Riesgo real
Reduce capacidad del compilador para detectar errores de contrato y abre puerta a bugs de runtime al evolucionar entidades.

#### Evidencia
Archivo: backend/smart-economat-backend/src/modules/producto/service/producto.service.ts:926
```ts
producto: { id: productoId } as any,
```

Archivo: backend/smart-economat-backend/src/modules/producto/service/producto-proveedor.service.ts:149
```ts
where: { productoProveedor: { id: idProductoProveedor } as any },
```

Archivo: backend/smart-economat-backend/src/common/utils/typeorm-query.helper.ts:35
```ts
const where: any = {};
```

#### Impacto
- Técnico: menor seguridad de tipos en refactors.
- Negocio: defectos tardios.
- UX: impacto indirecto.
- Escalabilidad: deuda acumulativa.
- Mantenibilidad: menor fiabilidad del type-check.

#### Solución recomendada
- qué cambiar
  - Sustituir any por tipos parciales concretos y helpers tipados.
- por qué
  - Recuperar garantia de tipado estricto del proyecto.
- cómo mejorarlo
  - Tipos utility para relaciones parciales y where conditions.
- cómo reducir riesgos
  - Activar reglas lint/type-check que bloqueen any nuevo en modulo.

#### Prioridad recomendada
- Media

#### Riesgo de regresión
- Bajo

---

## Inconsistencias Frontend/Backend
- Estado activo/eliminado contradictorio entre tipos frontend y reglas backend.
- Tipo de alergeno desalineado: frontend usa id_producto y backend productoId.
- Campos de comparativa (esOptimo, costeEfectivoUnitario, ahorroAbsolutoPct) presentes en UI/tipos de producto pero sin contrato de carga desde /productos/:id.
- Endpoint de comparativa existe en backend, sin cliente dedicado en frontend.
- En backend search de producto-proveedor conviven marcaEspecifica (tipo declarado) y marca (payload real), generando semantica dual.
- Convencion REST del proyecto exige rutas en plural, pero sub-rutas del modulo usan singular (producto-proveedor, historial-precio).

---

## Riesgos Potenciales Futuros
- Con mayor latencia real, el listado de productos tendra mas incidencias de estado stale por requests concurrentes.
- El crecimiento de proveedores agravara la limitacion de selector a 100 registros.
- Si se incorpora inactivacion funcional real (activo=false), la semantica actual provocara estados invisibles y bugs de soporte.
- La deriva de tipos frontend/backend incrementara errores 400 y regresiones silenciosas al ampliar formularios.
- La combinacion soft-delete + constraints unicas seguira generando conflictos funcionales en relaciones historicas (no solo producto_proveedor).

---

## Deuda Técnica
- deuda crítica
  - Politica de visibilidad por rol no implementada donde se declara.
  - Conflicto estructural soft-delete/unicidad en producto_proveedor.
- deuda importante
  - Inconsistencia de dominio activo/eliminado.
  - Falta de validacion estricta de proveedorId en historial.
  - Race conditions potenciales en carga de listado frontend.
  - Cobertura de tests insuficiente en rutas de riesgo.
- deuda tolerable
  - Logs de debug en runtime.
  - Campos/flujo de comparativa no conectados.
  - Any residuales en piezas clave.

---

## Recomendaciones Estratégicas
- Resolver primero los hallazgos de prioridad Inmediata/Alta antes de cualquier ampliacion funcional del modulo.
- Formalizar un contrato de estado de producto (activo, eliminado, restaurado) y convertirlo en fuente unica para backend, frontend y tests.
- Aplicar una politica de control de concurrencia en UI para cualquier listado con filtros/paginacion.
- Introducir contract tests FE/BE del modulo productos (payloads de alta/edicion, shapes de respuesta, errores esperados).
- Establecer una regla de arquitectura: no se permite softDelete en tablas con unique compuesto sin estrategia de restore/upsert.
- Elevar estandar de pruebas del modulo: no aceptar specs de controlador sin asserts de negocio y seguridad.

---

## Conclusión Final
El modulo productos no esta en estado critico de colapso, pero tampoco esta listo para una operacion de produccion exigente sin intervenciones puntuales de alto impacto. La base es buena y demostrable (validaciones, guards, transacciones, tests en verde), pero hay contradicciones de dominio y riesgos estructurales que pueden explotar en momentos de alta presion operativa.

La prioridad real no es reescribir: es corregir contratos y estados clave para recuperar predictibilidad. Si se ejecutan las correcciones propuestas por prioridad (inmediata/alta primero), el modulo puede pasar a un nivel robusto y mantenible sin romper la logica de negocio existente.
