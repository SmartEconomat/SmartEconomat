## Plan: Merma robusta, auditable y escalable

Diseño recomendado: mantener merma como evento de dominio append-only (independiente del documento operativo), con un único motor transaccional de ajuste de stock + movimiento, tipología explícita extensible, idempotencia fuerte y read-model analítico para KPIs auditables. La integración con producción debe reportar merma de ingrediente ligada al lote/preparación sin mutar estados históricos.

**Steps**
1. Fase 1 - Alineación de contratos y modelo de dominio (base no breaking)
2. Definir una tipología canónica de merma orientada a origen operativo (RECEPCION, PRODUCCION, CADUCIDAD, ROTURA, INVENTARIO) separada del motivo narrativo actual.
3. Mantener compatibilidad con contratos existentes: la API actual de merma se conserva y la nueva semántica se introduce de forma aditiva (sin eliminar ni reinterpretar de forma breaking los valores existentes).
4. Definir un contexto de trazabilidad de origen (referencia operativa) para enlazar merma con recepción, lote de producción, caducidad u ajuste de inventario sin acoplar ni editar documentos históricos.
5. Fase 2 - Unificación del mecanismo de impacto en stock
6. Extraer/normalizar un servicio de aplicación de ajustes de stock reutilizable por merma, de forma que todo descuento por merma pase por el mismo pipeline transaccional de inventario + movimiento.
7. Reutilizar el patrón existente de bloqueo pesimista, FEFO y método de dominio de inventario para evitar stock negativo y carreras concurrentes.
8. Garantizar atomicidad: registro de merma + ajustes de inventario + movimientos en una sola transacción.
9. Implementar idempotencia de comando de merma para evitar dobles aplicaciones por reintentos (cliente, red o UI).
10. Fase 3 - Integración de merma desde producción (ingrediente)
11. Incorporar caso de uso “reportar merma de producción” ligado al contexto de lote/preparación e ingrediente de receta.
12. Validar coherencia de contexto antes de ajustar stock: el ingrediente reportado debe pertenecer a la receta/lote objetivo.
13. Ejecutar el ajuste usando el mismo motor central de stock (no flujo paralelo), registrando movimiento de merma con contexto de origen producción.
14. Mantener invariantes históricas: no reabrir ni alterar estados consolidados de preparación/lote/pedido/recepción; solo anexar evento de merma derivado.
15. Fase 4 - Analítica operativa y auditoría de extremo a extremo
16. Diseñar read-model de métricas sobre merma + movimiento + contexto operativo para agregaciones por ventana temporal, origen y entidad operativa.
17. Definir denominadores por contexto para porcentaje de merma y asegurar consistencia del cálculo: porcentaje = (cantidad perdida / cantidad de referencia) * 100.
18. Extender estadísticas de merma en forma aditiva para KPI por proveedor y por receta/lote, preservando contratos existentes.
19. Preparar exportabilidad/auditoría: cada merma debe reconstruirse con actor, momento, origen, impacto en stock y rastro de movimiento asociado.
20. Fase 5 - Endurecimiento técnico y rollout
21. Añadir validaciones de concurrencia e idempotencia en capa de servicio y persistencia.
22. Añadir pruebas unitarias, de concurrencia e integración E2E para rutas críticas de merma (incluida producción).
23. Ejecutar build/lint/tests del alcance y validar flujos manuales de auditoría y KPIs.
24. Aplicar despliegue progresivo (feature flag o activación por endpoint) para minimizar riesgo operativo.

**Relevant files**
- /home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/merma/service/merma.service.ts — flujo actual de merma transaccional, FEFO y creación de movimientos.
- /home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/merma/controller/merma.controller.ts — contratos de entrada/salida de merma para extensión no breaking.
- /home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/merma/dto/create-merma.dto.ts — punto de extensión aditiva para idempotencia y contexto operativo.
- /home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/merma/enums/merma.enums.ts — tipología/motivos actuales a evolucionar de forma retrocompatible.
- /home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/merma/merma.entity/merma.entity.ts — agregado de evento merma y trazabilidad base.
- /home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/inventario/service/inventario.service.ts — patrón de ajuste manual, locking y validaciones de stock.
- /home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/inventario/inventario.entity/inventario.entity.ts — método de dominio ajustarCantidad e invariantes de stock.
- /home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/movimiento/movimiento.entity/movimiento.entity.ts — ledger auditable y traza polimórfica por entidad origen.
- /home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/movimiento/repository/movimiento.repository.ts — filtros y consultas base para trazabilidad/KPIs.
- /home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/common/helpers/movimiento.helper.ts — punto central para no duplicar creación de movimientos.
- /home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/receta/service/produccion.service.ts — consumo de ingredientes y movimientos de producción; punto de integración para merma de ingrediente.
- /home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/receta/controller/produccion.controller.ts — superficie de integración API para reportar merma desde producción.
- /home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/preparacion/service/preparacion.service.ts — cierre de preparación y vínculo con ejecución de producción.
- /home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/dashboard/service/dashboard.service.ts — patrón actual de agregación temporal para métricas.
- /home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/export/service/export.service.ts — patrón de export y filtros reutilizable para KPI auditables.
- /home/psych/projects/SmartEconomat/frontend/smart-economat-frontend/src/services/merma.service.ts — cliente API de merma para extensiones aditivas.
- /home/psych/projects/SmartEconomat/frontend/smart-economat-frontend/src/services/merma.types.ts — tipado frontend alineado al contrato backend.
- /home/psych/projects/SmartEconomat/frontend/smart-economat-frontend/src/services/produccion.service.ts — integración de UI de producción con reporte de merma.
- /home/psych/projects/SmartEconomat/frontend/smart-economat-frontend/src/pages/Preparaciones.tsx — punto UX para “reportar merma” desde lote/preparación.
- /home/psych/projects/SmartEconomat/frontend/smart-economat-frontend/src/pages/Mermas.tsx — historial/alta de mermas y evolución de KPIs.

**Verification**
1. Build backend: npm run build en backend/smart-economat-backend.
2. Lint backend/frontend en módulos tocados.
3. Unit tests existentes de inventario/producción y nuevas pruebas de merma (servicio de aplicación e idempotencia).
4. E2E: inventario + producción + merma, validando: una merma = un único impacto de stock aunque se reintente el mismo comando.
5. Pruebas de concurrencia: requests paralelos de merma sobre mismo inventario/lote para verificar no stock negativo ni doble descuento.
6. Prueba de trazabilidad: reconstruir una merma de producción desde evento origen hasta movimiento/inventario/actor/fecha sin ambigüedad.
7. Prueba de métricas: validar agregados y fórmula de porcentaje con ventanas temporales y filtros por origen/proveedor/receta-lote.

**Decisions**
- Incluye: diseño de dominio, reglas de consistencia, integración técnica backend/frontend, plan de pruebas y riesgos.
- Excluye: rediseño de procesos operativos de pedidos/recepciones/producción y cambios breaking de contratos existentes.
- Estrategia de compatibilidad: cambios aditivos, manteniendo endpoints y contratos actuales como base.
- Regla de oro: merma no altera documentos históricos; solo genera eventos de ajuste derivados y auditables.

**Riesgos y mitigaciones**
- Riesgo: doble aplicación por reintentos. Mitigación: idempotencia de comando + validación en persistencia.
- Riesgo: carrera concurrente y stock negativo. Mitigación: lock pesimista + invariantes de dominio + transacciones atómicas.
- Riesgo: deriva semántica entre motivo y tipología. Mitigación: taxonomía canónica de origen + adaptador retrocompatible.
- Riesgo: métricas no auditables por falta de contexto. Mitigación: contexto operativo obligatorio en lectura analítica y traza completa evento-movimiento.
- Riesgo: impacto en módulos existentes. Mitigación: integración por servicio central y despliegue progresivo.

**Further Considerations**
1. Recomendación de arquitectura: mantener API canónica en merma y exponer desde producción solo como fachada que delega al mismo caso de uso.
2. Recomendación de performance: empezar con agregaciones por query builder e introducir proyecciones/materializaciones solo si la carga lo justifica.
3. Recomendación de gobernanza: versionar reglas de KPI para que cambios de fórmula no rompan comparativos históricos.