# Auditoría Técnica Completa

## Resumen Ejecutivo
- estado general del proyecto: El módulo de producción tiene una base sólida en contratos DTO, guards y tipado, pero presenta riesgos funcionales y de consistencia operativa en flujos críticos de consumo y reintentos HTTP.
- nivel de riesgo: Alto.
- principales problemas: Reintentos automáticos en operaciones no idempotentes, flujo de UI que bloquea el consumo incremental, desalineación inventario-lotes al consumir, y permisos frontend insuficientemente alineados con backend.
- principales fortalezas: Validación estricta en backend, guardado transaccional en producción, control de permisos en controladores y mejoras recientes en robustez de unidades/merma.
- criticidad general: Alta para operación en producción; se recomienda corrección prioritaria antes de escalar carga y concurrencia.

## Métricas Generales
- arquitectura: Buena
- mantenibilidad: Aceptable
- escalabilidad: Aceptable
- seguridad: Buena
- performance: Aceptable
- coherencia de dominio: Aceptable
- tipado: Buena
- resiliencia: Deficiente
- claridad del código: Buena

## Hallazgos

### [PROD-001] Reintentos automáticos en mutaciones no idempotentes

#### Severidad
- Crítica

#### Categoría
- Backend
- Frontend
- Estado
- API

#### Descripción
El cliente HTTP central reintenta por defecto peticiones ante errores transitorios incluso cuando son operaciones de escritura no idempotentes. Esto afecta directamente a ejecución de producción, consumo de lotes y registro de merma en producción.

#### Riesgo real
Una operación puede ejecutarse dos veces si la primera mutación fue aplicada pero la respuesta falló en red o fue transitoriamente 5xx. Resultado: doble descuento, doble lote, doble merma o doble movimiento, con impacto directo en stock y trazabilidad.

#### Evidencia
- [frontend/smart-economat-frontend/src/services/api.service.ts](frontend/smart-economat-frontend/src/services/api.service.ts#L519)
- [frontend/smart-economat-frontend/src/services/api.service.ts](frontend/smart-economat-frontend/src/services/api.service.ts#L549)
- [frontend/smart-economat-frontend/src/services/api.service.ts](frontend/smart-economat-frontend/src/services/api.service.ts#L571)
- [frontend/smart-economat-frontend/src/services/produccion.service.ts](frontend/smart-economat-frontend/src/services/produccion.service.ts#L150)
- [frontend/smart-economat-frontend/src/services/produccion.service.ts](frontend/smart-economat-frontend/src/services/produccion.service.ts#L175)
- [frontend/smart-economat-frontend/src/services/merma.service.ts](frontend/smart-economat-frontend/src/services/merma.service.ts#L103)
- [backend/smart-economat-backend/src/modules/merma/dto/create-merma-produccion.dto.ts](backend/smart-economat-backend/src/modules/merma/dto/create-merma-produccion.dto.ts#L64)

#### Impacto
- Técnico: inconsistencias de inventario y movimientos.
- Negocio: costes y merma inflados por duplicidad.
- UX: resultados no deterministas tras fallos temporales.
- Escalabilidad: empeora bajo latencia o degradación parcial.
- Mantenibilidad: debugging complejo por efectos no repetibles.

#### Solución recomendada
- Desactivar reintento por defecto para métodos mutadores POST, PATCH, PUT, DELETE.
- Mantener reintentos solo para GET/HEAD o cuando exista idempotencia explícita.
- Introducir idempotency key obligatoria en ejecutar producción y consumir porciones, no solo opcional en merma.
- Registrar idempotency key en backend con restricción de unicidad por operación.

#### Prioridad recomendada
- Inmediata

#### Riesgo de regresión
- Alto

---

### [PROD-002] Flujo de pestañas impide consumo incremental de lotes aún disponibles

#### Severidad
- Alta

#### Categoría
- Frontend
- Backend
- Dominio
- UX

#### Descripción
La UI separa lotes en sin consumo y consumido. Tras un primer consumo parcial, el lote se mueve a consumido aunque sigue en estado disponible, pero la acción de consumir solo existe en la pestaña sin consumo.

#### Riesgo real
Un lote con porciones restantes puede quedar operativamente bloqueado para consumo adicional desde la UI, forzando procesos manuales o dejando stock lógico sin consumir.

#### Evidencia
- [frontend/smart-economat-frontend/src/pages/Preparaciones.tsx](frontend/smart-economat-frontend/src/pages/Preparaciones.tsx#L251)
- [frontend/smart-economat-frontend/src/pages/Preparaciones.tsx](frontend/smart-economat-frontend/src/pages/Preparaciones.tsx#L673)
- [backend/smart-economat-backend/src/modules/receta/service/produccion.service.ts](backend/smart-economat-backend/src/modules/receta/service/produccion.service.ts#L457)
- [backend/smart-economat-backend/src/modules/receta/service/produccion.service.ts](backend/smart-economat-backend/src/modules/receta/service/produccion.service.ts#L588)

#### Impacto
- Técnico: flujo funcional roto.
- Negocio: consumo incompleto de producción preparada.
- UX: interfaz contradice estado real del lote.
- Escalabilidad: aumenta fricción operativa en volumen.
- Mantenibilidad: genera incidencias funcionales difíciles de rastrear.

#### Solución recomendada
- Redefinir tabs por semántica de estado real: disponibles (estado disponible) y agotadas (estado agotado).
- O permitir acción consumir también en pestaña consumido cuando estado sea disponible.
- Alinear filtros backend para que no oculten disponibles parcialmente consumidos.

#### Prioridad recomendada
- Inmediata

#### Riesgo de regresión
- Medio

---

### [PROD-003] El consumo de porciones no ajusta inventario del producto elaborado

#### Severidad
- Alta

#### Categoría
- Backend
- Dominio
- Estado

#### Descripción
Al ejecutar producción se crea inventario de resultado y movimiento de entrada. Al consumir porciones solo se actualiza el lote, sin reflejar salida de inventario del producto elaborado ni movimiento correspondiente.

#### Riesgo real
El inventario consolidado puede sobreestimar stock disponible del producto final. Esto rompe exactitud en operaciones posteriores y analítica.

#### Evidencia
- [backend/smart-economat-backend/src/modules/receta/service/produccion.service.ts](backend/smart-economat-backend/src/modules/receta/service/produccion.service.ts#L344)
- [backend/smart-economat-backend/src/modules/receta/service/produccion.service.ts](backend/smart-economat-backend/src/modules/receta/service/produccion.service.ts#L356)
- [backend/smart-economat-backend/src/modules/receta/service/produccion.service.ts](backend/smart-economat-backend/src/modules/receta/service/produccion.service.ts#L541)
- [backend/smart-economat-backend/src/modules/receta/service/produccion.service.ts](backend/smart-economat-backend/src/modules/receta/service/produccion.service.ts#L594)

#### Impacto
- Técnico: inconsistencia lote-inventario.
- Negocio: decisiones de compra y planificación erróneas.
- UX: usuarios ven stock que no refleja consumo real.
- Escalabilidad: divergencia acumulativa con mayor volumen.
- Mantenibilidad: conciliación manual creciente.

#### Solución recomendada
- En consumir porciones, descontar inventario de producto elaborado en la misma transacción.
- Crear movimiento explícito de salida por consumo.
- Definir regla de conversión porciones a cantidad física de forma única y auditable.

#### Prioridad recomendada
- Alta

#### Riesgo de regresión
- Alto

---

### [PROD-004] Permisos en frontend no alineados con acciones sensibles de producción

#### Severidad
- Alta

#### Categoría
- Seguridad
- Frontend
- UX

#### Descripción
La ruta de preparaciones se expone con permiso de listado de recetas, pero desde esa vista se muestran acciones de consumir y reportar merma sin chequeo de permisos en cliente.

#### Riesgo real
Usuarios sin permiso de cocina o merma ven acciones que luego fallan en backend con 403. Esto no rompe autorización del servidor, pero sí degrada UX y expone superficie de acción no autorizada.

#### Evidencia
- [frontend/smart-economat-frontend/src/utils/config/menuConfig.tsx](frontend/smart-economat-frontend/src/utils/config/menuConfig.tsx#L136)
- [frontend/smart-economat-frontend/src/utils/config/menuConfig.tsx](frontend/smart-economat-frontend/src/utils/config/menuConfig.tsx#L144)
- [frontend/smart-economat-frontend/src/pages/Preparaciones.tsx](frontend/smart-economat-frontend/src/pages/Preparaciones.tsx#L673)
- [backend/smart-economat-backend/src/modules/receta/controller/produccion.controller.ts](backend/smart-economat-backend/src/modules/receta/controller/produccion.controller.ts#L105)
- [backend/smart-economat-backend/src/modules/merma/controller/merma.controller.ts](backend/smart-economat-backend/src/modules/merma/controller/merma.controller.ts#L77)

#### Impacto
- Técnico: errores 403 recurrentes evitables.
- Negocio: fricción operativa y tickets de soporte.
- UX: interfaz engañosa respecto a capacidades reales.
- Escalabilidad: mayor ruido de errores en producción.
- Mantenibilidad: lógica de permisos dispersa e implícita.

#### Solución recomendada
- Añadir usePermission en Preparaciones para consumir y reportar merma.
- Ajustar permiso de entrada a la ruta según política de negocio real.
- Mantener backend como última barrera, pero no única capa visible.

#### Prioridad recomendada
- Alta

#### Riesgo de regresión
- Bajo

---

### [PROD-005] Ordenación engañosa en Preparaciones por claves no soportadas

#### Severidad
- Media

#### Categoría
- Frontend
- Backend
- API

#### Descripción
La tabla permite ordenar por recetaId y usuarioId desde frontend, pero backend no las acepta como campos válidos para producción y cae a orden por fechaProduccion.

#### Riesgo real
La UI puede mostrar indicador de orden aplicado cuando realmente backend ordena por otra columna. Se rompe predictibilidad y confianza en la tabla.

#### Evidencia
- [frontend/smart-economat-frontend/src/pages/Preparaciones.tsx](frontend/smart-economat-frontend/src/pages/Preparaciones.tsx#L605)
- [frontend/smart-economat-frontend/src/pages/Preparaciones.tsx](frontend/smart-economat-frontend/src/pages/Preparaciones.tsx#L634)
- [backend/smart-economat-backend/src/common/constants/sortable-fields.constants.ts](backend/smart-economat-backend/src/common/constants/sortable-fields.constants.ts#L24)
- [backend/smart-economat-backend/src/modules/receta/service/produccion.service.ts](backend/smart-economat-backend/src/modules/receta/service/produccion.service.ts#L446)

#### Impacto
- Técnico: contrato de ordenación ambiguo.
- Negocio: análisis operativo menos confiable.
- UX: feedback de orden incoherente.
- Escalabilidad: errores de interpretación al crecer registros.
- Mantenibilidad: deuda de contrato FE/BE.

#### Solución recomendada
- O bien soportar orden por receta y usuario en backend con joins explícitos.
- O bien eliminar sortKey no soportadas en frontend.
- Documentar sortBy permitido de forma compartida y tipada.

#### Prioridad recomendada
- Media

#### Riesgo de regresión
- Bajo

---

### [PROD-006] Riesgo de race condition en carga de tablas por falta de cancelación

#### Severidad
- Media

#### Categoría
- Frontend
- Estado
- Performance

#### Descripción
Recetas y Preparaciones disparan cargas asíncronas en cambios de query sin AbortController ni control de secuencia de respuesta para las peticiones de listado.

#### Riesgo real
Respuestas antiguas pueden sobrescribir estado más reciente cuando hay tecleo, paginación y orden simultáneos, mostrando datos stale.

#### Evidencia
- [frontend/smart-economat-frontend/src/pages/Recetas.tsx](frontend/smart-economat-frontend/src/pages/Recetas.tsx#L369)
- [frontend/smart-economat-frontend/src/pages/Recetas.tsx](frontend/smart-economat-frontend/src/pages/Recetas.tsx#L382)
- [frontend/smart-economat-frontend/src/pages/Preparaciones.tsx](frontend/smart-economat-frontend/src/pages/Preparaciones.tsx#L248)
- [frontend/smart-economat-frontend/src/pages/Preparaciones.tsx](frontend/smart-economat-frontend/src/pages/Preparaciones.tsx#L274)

#### Impacto
- Técnico: estado no determinista.
- Negocio: decisiones sobre datos desfasados.
- UX: parpadeos y resultados que cambian sin intención.
- Escalabilidad: más visible con latencias altas.
- Mantenibilidad: bugs intermitentes complejos.

#### Solución recomendada
- Implementar AbortController por solicitud de listado.
- Añadir guard de requestId para aceptar solo última respuesta.
- Encapsular patrón en hook reutilizable de fetch paginado.

#### Prioridad recomendada
- Media

#### Riesgo de regresión
- Medio

---

### [PROD-007] Validación de stock en modal de cocinado conserva estado stale tras errores

#### Severidad
- Media

#### Categoría
- Frontend
- Estado
- UX

#### Descripción
En edición de cantidad a producir, un valor inválido se normaliza a 0, se sigue llamando validarStock y los errores solo se loguean sin limpiar stockValidation previo.

#### Riesgo real
El modal puede mostrar stock válido de una validación anterior mientras los inputs actuales son inválidos o la validación actual falla.

#### Evidencia
- [frontend/smart-economat-frontend/src/pages/Recetas.tsx](frontend/smart-economat-frontend/src/pages/Recetas.tsx#L1666)
- [frontend/smart-economat-frontend/src/pages/Recetas.tsx](frontend/smart-economat-frontend/src/pages/Recetas.tsx#L1670)
- [frontend/smart-economat-frontend/src/pages/Recetas.tsx](frontend/smart-economat-frontend/src/pages/Recetas.tsx#L580)
- [frontend/smart-economat-frontend/src/pages/Recetas.tsx](frontend/smart-economat-frontend/src/pages/Recetas.tsx#L590)

#### Impacto
- Técnico: estado derivado desactualizado.
- Negocio: riesgo de operar con señal falsa de disponibilidad.
- UX: feedback contradictorio.
- Escalabilidad: más 400 silenciosos y ruido en consola.
- Mantenibilidad: mayor complejidad de depuración.

#### Solución recomendada
- No disparar validarStock si alguna cantidad es <= 0 o no válida.
- Limpiar stockValidation ante error de validación remota.
- Mostrar error de validación al usuario en lugar de console.error silencioso.

#### Prioridad recomendada
- Media

#### Riesgo de regresión
- Bajo

---

### [PROD-008] Regla de mermaAplicada desalineada entre frontend y backend

#### Severidad
- Media

#### Categoría
- Frontend
- Backend
- API
- Validación

#### Descripción
Backend limita mermaAplicada a 99, mientras frontend solo valida que sea >= 0. El usuario puede cargar un valor que el backend rechaza.

#### Riesgo real
Errores 400 evitables en creación/edición de receta con mala experiencia en formularios y pérdida de confianza.

#### Evidencia
- [backend/smart-economat-backend/src/modules/receta/dto/add-ingrediente.dto.ts](backend/smart-economat-backend/src/modules/receta/dto/add-ingrediente.dto.ts#L35)
- [frontend/smart-economat-frontend/src/features/recetas/recetaForm.helpers.ts](frontend/smart-economat-frontend/src/features/recetas/recetaForm.helpers.ts#L129)
- [frontend/smart-economat-frontend/src/features/recetas/recetaForm.helpers.ts](frontend/smart-economat-frontend/src/features/recetas/recetaForm.helpers.ts#L130)

#### Impacto
- Técnico: desalineación contractual FE/BE.
- Negocio: más intentos fallidos en flujo de edición.
- UX: validación tardía y frustración.
- Escalabilidad: tickets recurrentes de formulario.
- Mantenibilidad: reglas duplicadas no sincronizadas.

#### Solución recomendada
- Aplicar límite máximo en frontend igual al contrato backend.
- Exponer constraints compartidos en capa de tipos/validadores.

#### Prioridad recomendada
- Media

#### Riesgo de regresión
- Bajo

---

### [PROD-009] Selección de proveedor de producto elaborado no determinística

#### Severidad
- Media

#### Categoría
- Dominio
- Backend
- Arquitectura

#### Descripción
La creación de producción selecciona un ProductoProveedor sin orden ni criterio explícito, y la garantía de proveedor interno sale temprano si ya existe cualquier enlace de proveedor.

#### Riesgo real
El inventario del producto elaborado puede vincularse a un proveedor no deseado, introduciendo inconsistencia en coste y trazabilidad del elaborado.

#### Evidencia
- [backend/smart-economat-backend/src/modules/receta/service/produccion.service.ts](backend/smart-economat-backend/src/modules/receta/service/produccion.service.ts#L166)
- [backend/smart-economat-backend/src/modules/receta/repository/receta.repository.ts](backend/smart-economat-backend/src/modules/receta/repository/receta.repository.ts#L531)
- [backend/smart-economat-backend/src/modules/receta/repository/receta.repository.ts](backend/smart-economat-backend/src/modules/receta/repository/receta.repository.ts#L535)

#### Impacto
- Técnico: asignación no determinista.
- Negocio: métricas de coste por proveedor distorsionadas.
- UX: comportamientos difíciles de explicar al usuario.
- Escalabilidad: deriva de datos al aumentar integraciones.
- Mantenibilidad: reglas implícitas difíciles de sostener.

#### Solución recomendada
- Definir criterio explícito para proveedor de elaborados (preferente interno).
- Garantizar y validar enlace interno de forma estricta para tipo elaborado.
- Añadir test de regresión para selección determinista.

#### Prioridad recomendada
- Media

#### Riesgo de regresión
- Medio

---

### [PROD-010] Fixtures e2e de producción contradicen el contrato DTO actual

#### Severidad
- Baja

#### Categoría
- Testing
- QA

#### Descripción
Existen tests e2e del módulo producción/merma que crean recetas con tiempo estimado 5, mientras el DTO exige mínimo 10. Esto indica desalineación de fixtures respecto al contrato vigente.

#### Riesgo real
La suite puede ser inestable o no representar correctamente las reglas reales, reduciendo capacidad de detección de regresiones funcionales.

#### Evidencia
- [backend/smart-economat-backend/src/modules/receta/dto/create-receta.dto.ts](backend/smart-economat-backend/src/modules/receta/dto/create-receta.dto.ts#L36)
- [backend/smart-economat-backend/test/e2e/produccion.e2e-spec.ts](backend/smart-economat-backend/test/e2e/produccion.e2e-spec.ts#L103)
- [backend/smart-economat-backend/test/e2e/merma-produccion.e2e-spec.ts](backend/smart-economat-backend/test/e2e/merma-produccion.e2e-spec.ts#L97)

#### Impacto
- Técnico: confianza reducida en tests de integración.
- Negocio: riesgo de liberar cambios con falso positivo de cobertura.
- UX: bugs reales no detectados a tiempo.
- Escalabilidad: deuda creciente en QA.
- Mantenibilidad: coste de mantenimiento de suite.

#### Solución recomendada
- Actualizar fixtures para cumplir el contrato DTO vigente.
- Añadir tests de validación explícita de límites de tiempo.
- Incluir esta revisión en checklist de mantenimiento de e2e.

#### Prioridad recomendada
- Media

#### Riesgo de regresión
- Bajo

---

## Inconsistencias Frontend/Backend

- El frontend reintenta mutaciones automáticamente, pero el backend no garantiza idempotencia para ejecutar producción ni consumir porciones.
- La UI de preparaciones filtra por sin_consumo y consumido, mientras backend mantiene estado disponible hasta agotar; la semántica visual no representa correctamente disponibilidad real.
- Las acciones consumir y reportar merma se muestran en UI sin chequeo de permisos equivalente a los requeridos por backend.
- El frontend permite ordenar por recetaId y usuarioId en preparaciones, pero backend no lo soporta en contrato de ordenación de producción.
- El frontend permite mermaAplicada sin tope superior, backend exige máximo 99.
- Las pruebas e2e de producción usan payloads que contradicen el contrato DTO de creación de recetas.

---

## Riesgos Potenciales Futuros

- Duplicación silenciosa de operaciones ante degradación de red o picos 5xx por estrategia de reintento en mutaciones.
- Divergencia acumulada entre porciones y stock físico del producto elaborado por falta de consumo inventariable.
- Bloqueo operativo progresivo en lotes parcialmente consumidos si el flujo de pestañas no se corrige.
- Crecimiento de tickets por 403 evitables y acciones visibles no autorizadas en UI.
- Degradación de confianza en reportes por ordenaciones aparentes no aplicadas realmente en backend.
- Aumento de bugs intermitentes por carreras de estado en listados con mayor latencia.

---

## Deuda Técnica

- deuda crítica
- Reintentos no idempotentes en operaciones de escritura.
- Desacople entre consumo de porciones y inventario de producto elaborado.

- deuda importante
- Semántica de tabs de preparaciones desalineada con estados de lote.
- Contrato de ordenación parcial entre frontend y backend.
- Chequeo de permisos incompleto en acciones sensibles de UI.
- Validación de formulario no alineada con restricciones backend.

- deuda tolerable
- Fixtures e2e desactualizados respecto a DTO.
- Regla implícita y no determinista de proveedor para producto elaborado.

---

## Recomendaciones Estratégicas

- Corregir primero resiliencia transaccional: idempotencia y política de reintentos por método HTTP.
- Alinear modelo de estado operativo de preparaciones con reglas de negocio del lote para eliminar estados imposibles en UI.
- Cerrar brecha lote-inventario en consumo para garantizar consistencia contable y logística.
- Unificar contrato de ordenación y validación con fuentes compartidas de constraints frontend/backend.
- Fortalecer QA del módulo producción con casos de concurrencia, reintentos y regresión de permisos.

---

## Conclusión Final

El módulo de producción no está en estado crítico de colapso, pero sí en una zona de riesgo alto para operación real bajo carga y errores de red. La base técnica es competente y el backend está razonablemente protegido, pero existen inconsistencias funcionales y de resiliencia que pueden generar impactos costosos en inventario, trazabilidad y experiencia operativa.

La prioridad no es reescribir: es endurecer idempotencia, corregir el flujo de consumo de lotes, alinear permisos y cerrar la coherencia inventario-lote. Con esas correcciones, el módulo quedaría en un estado robusto y predecible para producción.