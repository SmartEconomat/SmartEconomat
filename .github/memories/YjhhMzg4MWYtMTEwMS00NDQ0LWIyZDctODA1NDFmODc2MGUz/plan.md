## Plan: Refactor Pedidos Compras

Refactor breaking y orientado a dominio para dejar `PedidoUsuario` como agregado raíz visible, `Pedido` como entidad interna por proveedor y `PurchaseBatch` como única compra real. La estrategia recomendada es: fijar primero la nueva máquina de estados y los contratos públicos, migrar base de datos y servicios backend, después reescribir el read model/frontend para que la UI de Pedidos trabaje solo con `PedidoUsuario`, y finalmente actualizar recepción, incidencias, seeders y pruebas para cerrar el circuito.

**Fases**
1. Fase 1: Rediseño de dominio y matriz de estados. Definir de forma explícita los estados y transiciones válidas de cada nivel antes de tocar código. Recomendación:
   1. `PedidoUsuario`: `borrador`, `pendiente`, `aprobado`, `cancelado`, `consolidado`.
   2. `Pedido`: `pendiente`, `enviado_proveedor`, `en_proceso`, `recepcionado`, `cancelado`.
   3. `PurchaseBatch`: `pendiente`, `en_proceso`, `completado`, `cancelado`.
   4. `PedidoUsuario` se edita solo mientras esté en `borrador|pendiente` y no tenga compra asociada.
   5. Aprobar un `PedidoUsuario` crea un `PurchaseBatch` de un solo agregado raíz y mueve sus `Pedido` hijos a `enviado_proveedor`; el root pasa a `aprobado`.
   6. Consolidar semanalmente crea un `PurchaseBatch` con varios `PedidoUsuario`; cada root pasa a `consolidado` y sus `Pedido` hijos a `enviado_proveedor`.
   7. La recepción mueve `Pedido` a `en_proceso` y luego `recepcionado`; `PurchaseBatch` deriva su estado desde los pedidos internos. `PedidoUsuario` deriva entre `aprobado|consolidado|cancelado` según batch y progreso real.
   *bloquea todas las fases siguientes*
2. Fase 2: Normalización de enums, entidades y migraciones backend. Crear enums separados y migrar datos actuales.
   1. Crear `EstadoPedidoUsuario` y redefinir `EstadoPedido` y `EstadoLote` con los valores nuevos exactos.
   2. Actualizar entidades `PedidoUsuario`, `Pedido` y `PurchaseBatch` para que cada una use solo su enum propio.
   3. Crear migraciones SQL/TypeORM para nuevos tipos enum y backfill de datos existentes.
   4. Mapping recomendado de backfill:
      1. `pedido_usuario.pendiente_de_aprobacion -> pendiente`.
      2. `pedido_usuario.cancelado -> cancelado`.
      3. `pedido_usuario` con `batch_id` único por root -> `aprobado`.
      4. `pedido_usuario` dentro de batch semanal/multi-root -> `consolidado`.
      5. `pedido.pendiente_de_aprobacion -> pendiente`.
      6. `pedido.por_recepcionar -> enviado_proveedor`.
      7. `pedido.parcial|incidencia -> en_proceso`.
      8. `pedido.recepcionado -> recepcionado`.
      9. `pedido.cancelado -> cancelado`.
      10. `purchase_batch.pendiente -> pendiente`.
      11. `purchase_batch.parcial|incidencia -> en_proceso`.
      12. `purchase_batch.completado -> completado`.
      13. `purchase_batch.cancelado -> cancelado`.
   5. Actualizar métodos de cálculo derivados para batch/root y eliminar asignaciones manuales incompatibles con el cálculo canónico.
   *depende de 1*
3. Fase 3: Refactor del backend de agregados y contratos públicos.
   1. `PedidoUsuarioService.create()` debe seguir siendo el punto canónico de creación visible. Debe crear el root y generar `Pedido` hijos por proveedor, pero nunca crear `PurchaseBatch`.
   2. `PedidoService` debe quedar como servicio interno/operativo de pedidos por proveedor. Mantener endpoints solo para usos internos, recepción o administración; quitarlo del flujo principal de UI.
   3. `PurchaseBatchService.consolidateExistingOrders()` debe aceptar solo `pedidoUsuarioIds`; eliminar alias ambiguos con `pedidoIds` o dejarlos fuera del contrato breaking.
   4. Reemplazar la aprobación actual de `PedidoUsuario` por una operación que cree un `PurchaseBatch` con un solo root y asigne `batchId` a los `Pedido` internos.
   5. Retirar o redefinir `PATCH /purchase-batches/:id/aceptar`: la creación por aprobación/consolidación ya es el compromiso de compra. Si se mantiene, renombrarlo a una transición operativa coherente con el nuevo modelo.
   6. La cancelación de `PedidoUsuario` debe permitirse solo antes de batch. Una vez batched, la cancelación debe delegar a la compra o bloquearse si forma parte de una compra multi-root.
   7. La edición de `PedidoUsuario` debe ser el único punto de edición visible. `Pedido` no se edita desde UI y `PurchaseBatch` solo se edita si sigue pendiente y no tiene recepciones.
   8. Normalizar controladores y DTOs:
      1. `/pedido-usuarios` = create/list/detail/update/approve/cancel como API principal de Pedidos.
      2. `/purchase-batches` = list/detail/cancel/update/consolidate como API principal de Compras.
      3. `/pedidos` = API interna/operativa, no fuente del read model principal.
   *depende de 2; 3.2, 3.3 y 3.8 pueden solaparse parcialmente*
4. Fase 4: Flujos especiales y módulos vecinos.
   1. Refactorizar `from-missing-stock` y `from-recipes` para que ya no creen `PurchaseBatch` directamente. Deben crear `PedidoUsuario` de sistema o pasar por un caso de uso que genere primero el root y luego, si corresponde, lo apruebe/consolide.
   2. Actualizar recepción para operar con los nuevos estados internos de `Pedido` (`enviado_proveedor`, `en_proceso`, `recepcionado`) y propagar solo a `PurchaseBatch` y `PedidoUsuario` mediante sincronización derivada.
   3. Actualizar incidencias para que la existencia de incidencia no obligue a conservar un estado `incidencia` en las tres capas; la incidencia vive en su módulo y el pedido/lote permanecen en `en_proceso` hasta resolución o recepción completa.
   4. Actualizar dashboard, PDF reports, seeders y helpers que hoy dependen de `PENDIENTE_DE_APROBACION`, `POR_RECEPCIONAR`, `PARCIAL` o `INCIDENCIA`.
   *depende de 3; 4.2 y 4.4 pueden ir en paralelo*
5. Fase 5: Reescritura del read model frontend.
   1. La UI de Pedidos debe cargar exclusivamente `PedidoUsuario` en tabs de pedidos. Eliminar `mapPedidoUsuarioToPedidoRow()` y cualquier conversión a `Pedido` visible.
   2. La UI de Compras debe cargar exclusivamente `PurchaseBatch`.
   3. Eliminar `aggregateType`, `isAggregatedBatchPedido()`, `consolidateOwnPedidos()` y toda la síntesis de filas falsas basada en `batchId`.
   4. Separar servicios frontend por concepto o, como mínimo, separar claramente las secciones `pedido-usuarios` y `purchase-batches` en el cliente HTTP.
   5. `usePedidosData()` debe devolver `PedidoUsuario[]` para tabs 0/1 y `PurchaseBatch[]` para tab 2; dejar de usar `Pedido[]` como tipo mixto de pantalla.
   6. `usePedidoActions()` debe separar acciones de root y compra:
      1. aprobar pedido visible = crear batch de uno vía endpoint de `PedidoUsuario`.
      2. consolidar semana = crear `PurchaseBatch` con `pedidoUsuarioIds`.
      3. aprobar compra deja de ser un alias de `PedidoUsuario`.
      4. cancelar root y cancelar compra deben seguir reglas distintas.
   7. `PedidoDetailDrawer` debe pasar a mostrar `PedidoUsuario`, no `Pedido` interno. El detalle de compra mostrará los `Pedido` internos con su estado operativo real.
   8. Dividir componentes con unions ambiguas (`PurchaseBatch | PedidoUsuario`) en variantes específicas o hacerlos discriminados con tipos estrictos.
   *depende de 3; 5.1, 5.4 y 5.6 pueden arrancar en paralelo una vez fijados contratos*
6. Fase 6: Ajuste de UX y copy.
   1. Pestaña Pedidos: solo `PedidoUsuario`, con número global y estado del root.
   2. Pestaña Compras: solo `PurchaseBatch`, con totales y detalle de pedidos internos.
   3. En el detalle de compra, mostrar cada `Pedido` interno sin deduplicar por `PedidoUsuario` y con referencia separada al pedido visible.
   4. Eliminar textos que llamen “pedido” a una compra o “compra” a un `PedidoUsuario`.
   5. Unificar los flujos de borrador para que el usuario entienda que está construyendo un `PedidoUsuario`, no una compra; si se materializa `BORRADOR` en dominio, actualizar también el módulo de drafts.
   *depende de 5*
7. Fase 7: Pruebas y verificación.
   1. Backend unit:
      1. `PedidoUsuarioService` create/update/approve/cancel/sync.
      2. `PurchaseBatchService` consolidate/cancel/findOne/sync.
      3. `PedidoService` solo para operaciones internas que sigan vigentes.
   2. Backend integration/e2e:
      1. crear `PedidoUsuario` multi-proveedor.
      2. aprobar un `PedidoUsuario` y comprobar batch de uno.
      3. consolidar varios `PedidoUsuario` y comprobar batch multi-root.
      4. iniciar recepción y comprobar propagación de estados.
      5. cancelar root pendiente, cancelar compra pendiente y bloqueo tras recepción.
   3. Frontend tests:
      1. hooks `usePedidosData` y `usePedidoActions`.
      2. `Pedidos.tsx`, `PedidosWeeklyBoard`, `PurchasesWeeklyBoard`.
      3. detalle de compra y detalle de pedido visible.
   4. Validación técnica:
      1. `cd /home/psych/projects/SmartEconomat/backend/smart-economat-backend && npm run build`
      2. `cd /home/psych/projects/SmartEconomat/backend/smart-economat-backend && npm run lint`
      3. `cd /home/psych/projects/SmartEconomat/backend/smart-economat-backend && npm test -- --runInBand`
      4. `cd /home/psych/projects/SmartEconomat/frontend/smart-economat-frontend && npm run build`
      5. `cd /home/psych/projects/SmartEconomat/frontend/smart-economat-frontend && npm run lint`
      6. `cd /home/psych/projects/SmartEconomat/frontend/smart-economat-frontend && npm run test`
      7. ejecutar E2E/seeders afectados si siguen siendo parte del flujo objetivo.
   5. Validación manual:
      1. crear pedido visible con líneas de 2-3 proveedores.
      2. editar/cancelar antes de aprobar.
      3. aprobar uno y revisar compra de un solo root.
      4. consolidar varios roots en compra semanal.
      5. abrir detalle de compra y comprobar pedidos internos/refs.
      6. iniciar recepción y validar transición de estados.
   *depende de todas las fases previas*

**Relevant files**
- `/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/pedido/pedido-usuario.entity/pedido-usuario.entity.ts` — separar el enum y fijar el agregado raíz visible.
- `/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/pedido/pedido.entity/pedido.entity.ts` — redefinir el ciclo interno por proveedor.
- `/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/pedido/purchase-batch.entity/purchase-batch.entity.ts` — recalcular estado del lote con los nuevos estados internos.
- `/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/pedido/enums/estado-pedido.enum.ts` — nuevo estado interno de `Pedido`.
- `/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/pedido/enums/estado-lote.enum.ts` — nuevo estado de compra.
- `/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/pedido/enums/estado-pedido-usuario.enum.ts` — nuevo enum del root visible.
- `/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/pedido/service/pedido-usuario.service.ts` — create/update/approve/cancel/sync del agregado raíz.
- `/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/pedido/service/pedido.service.ts` — acotar a casos internos por proveedor.
- `/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/pedido/service/purchase-batch.service.ts` — consolidación y batch de uno, sin IDs ambiguos.
- `/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/pedido/repository/pedido.repository.ts` — limitarlo al modelo interno y a usos operativos.
- `/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/pedido/controller/pedido-usuario.controller.ts` — contrato principal de Pedidos.
- `/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/pedido/controller/purchase-batch.controller.ts` — contrato principal de Compras y de consolidación.
- `/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/pedido/controller/pedido.controller.ts` — mantener solo operaciones internas necesarias.
- `/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/pedido/dto/pedido-usuario.dto.ts` — DTOs del root visible.
- `/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/pedido/dto/create-purchase-batch.dto.ts` — DTOs de compra y consolidación con `pedidoUsuarioIds` canónicos.
- `/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/recepcion/service/recepcion-stock.service.ts` — transiciones operativas desde recepción.
- `/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/recepcion/service/pdf-report.service.ts` — estados y etiquetado en reportes.
- `/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/dashboard/service/dashboard.service.ts` — métricas y contadores por estado.
- `/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/seeders/**` — seeders y utilidades que dependen de enums actuales.
- `/home/psych/projects/SmartEconomat/frontend/smart-economat-frontend/src/services/pedido.service.ts` — hoy mezcla tres conceptos; hay que separarlo o segmentarlo claramente.
- `/home/psych/projects/SmartEconomat/frontend/smart-economat-frontend/src/services/pedido.types.ts` — hoy mezcla `Pedido`, `PedidoUsuario` y `PurchaseBatch` en el read model.
- `/home/psych/projects/SmartEconomat/frontend/smart-economat-frontend/src/features/pedidos/hooks/usePedidosData.ts` — fuente de datos principal de la UI.
- `/home/psych/projects/SmartEconomat/frontend/smart-economat-frontend/src/features/pedidos/hooks/usePedidoActions.ts` — approve/cancel/edit/consolidate hoy mezclados.
- `/home/psych/projects/SmartEconomat/frontend/smart-economat-frontend/src/features/pedidos/utils/pedidoOwnOrders.ts` — eliminar agregados sintéticos.
- `/home/psych/projects/SmartEconomat/frontend/smart-economat-frontend/src/features/pedidos/utils/pedidoColumns.tsx` — acciones y render condicionado por agregados falsos.
- `/home/psych/projects/SmartEconomat/frontend/smart-economat-frontend/src/pages/Pedidos.tsx` — orquestación principal de tabs, diálogos y acciones.
- `/home/psych/projects/SmartEconomat/frontend/smart-economat-frontend/src/features/pedidos/components/PedidosWeeklyBoard.tsx` — consolidación semanal sobre IDs del root visible.
- `/home/psych/projects/SmartEconomat/frontend/smart-economat-frontend/src/features/pedidos/components/PurchasesWeeklyBoard.tsx` — vista pura de `PurchaseBatch`.
- `/home/psych/projects/SmartEconomat/frontend/smart-economat-frontend/src/features/pedidos/components/PurchaseBatchDetailModal.tsx` — detalle de compra sin union con `PedidoUsuario`.
- `/home/psych/projects/SmartEconomat/frontend/smart-economat-frontend/src/components/ui/BatchPedidoLineasViewer.tsx` — detalle interno de pedidos por proveedor y referencias al root visible.
- `/home/psych/projects/SmartEconomat/frontend/smart-economat-frontend/src/features/pedidos/components/PedidoDetailDrawer.tsx` — convertir a detalle de `PedidoUsuario`.
- `/home/psych/projects/SmartEconomat/frontend/smart-economat-frontend/src/features/pedidos/components/PedidosPageHeader.tsx` — copy y acciones de `PedidoUsuario`.
- `/home/psych/projects/SmartEconomat/frontend/smart-economat-frontend/src/hooks/usePedidoDraft.ts` y `/home/psych/projects/SmartEconomat/frontend/smart-economat-frontend/src/services/pedidoDraft.service.ts` — alinear borradores con el nuevo root visible.
- `/home/psych/projects/SmartEconomat/frontend/smart-economat-frontend/test/features/pedidos/**` y `/home/psych/projects/SmartEconomat/frontend/smart-economat-frontend/test/pages/Pedidos.test.tsx` — actualizar pruebas de hooks y página.

**Verification**
1. Validar primero las migraciones y builds backend para garantizar que no quedan imports/estados legacy colgando.
2. Ejecutar las suites unitarias y E2E de `pedido`, `pedido-usuario`, `purchase-batch`, `recepcion` e `incidencia` con foco en propagación de estados.
3. Ejecutar build, lint y test del frontend y luego verificar manualmente los tres flujos críticos: crear/editar pedido visible, aprobar individualmente y consolidar semanalmente.
4. Comprobar que ya no existen rutas de UI ni hooks que traten `Pedido` como entidad visible principal ni `PedidoUsuario` como compra.

**Decisions**
- Se asume ruptura controlada permitida en endpoints, enums y migraciones.
- Se asume adopción exacta del modelo de estados nuevo, con migración/backfill de datos existentes.
- `PedidoUsuario` pasa a ser la única fuente del read model de Pedidos en frontend.
- `PurchaseBatch` pasa a ser la única compra real y deja de crearse fuera de aprobación/consolidación.
- `Pedido` queda como entidad interna por proveedor, visible solo dentro del detalle operativo de compras/recepción.

**Scope boundaries**
- Incluido: módulos de pedido, pedido-usuario, purchase-batch, recepción, incidencias, dashboard, seeders, UI Pedidos/Compras, drafts y tests afectados por el cambio de modelo.
- Excluido: módulos no relacionados con el flujo de pedidos/compras salvo los que dependan directamente de los enums o reportes resultantes.

**Further Considerations**
1. El cambio de estados elimina `parcial` e `incidencia` como estados de alto nivel; la recomendación es absorber ambos en `en_proceso` y dejar el detalle de incidencias en su propio módulo para evitar volver a mezclar semánticas.
2. El endpoint `POST /purchase-batches` directo deja de encajar con el modelo objetivo; la recomendación es retirarlo del flujo público y reutilizar sus capacidades internas detrás de la aprobación de `PedidoUsuario` y de la consolidación semanal.
3. Si se quiere que `borrador` sea literal en dominio y no solo en autosave, conviene incluir en la misma fase la convergencia entre `pedido_draft` y `PedidoUsuario`; si se prefiere reducir riesgo, se puede mantener `pedido_draft` como almacenamiento técnico temporal y hacer esa convergencia en una segunda iteración.