## Plan: Restaurar Bajo Stock en Inventario y Campana

Corregir el flujo de bajo stock en frontend sin tocar contratos backend: el icono de estado en Inventario debe reflejar productos bajo mínimo de forma fiable y el centro de notificaciones (campana) debe incluir alertas de stock bajo además de caducidad. La estrategia recomendada es unificar la lógica de bajo stock en frontend usando datos por lote (o endpoint de alertas cuando aplique), evitar recálculos agregados que generen falsos negativos y cubrir con tests de servicios.

**Steps**
1. Fase 1 - Alineación funcional de bajo stock en Inventario (bloqueante)
2. Revisar y ajustar la agregación en frontend para que Inventario por producto marque bajoStock cuando exista al menos un lote del producto con cantidadActual < cantidadMinima; evitar sobrescribir ese estado con una comparación agregada final que puede ocultar alertas reales. Depende de ninguna otra tarea.
3. Ajustar el filtrado del listado agregado para no ocultar productos con stock total 0 si están en bajo stock, preservando su visibilidad en la tabla de Inventario. Depende del paso 2.
4. Mantener intacto el contrato backend de /inventario y /alertas/stock; no introducir cambios de DTOs ni endpoints en esta intervención. En paralelo con el paso 2.
5. Fase 2 - Notificación de campana para bajo stock (depende de Fase 1)
6. Extender el servicio de notificaciones para incluir una notificación de Productos bajo mínimo usando la fuente de datos de alertas de stock (reutilizando servicio de inventario), además de las notificaciones de caducidad ya existentes. Depende del paso 2.
7. Definir reglas de conteo y texto: priorizar consistencia con dashboard (conteo por alertas activas), construir descripción legible con preview limitado y mantener prioridad urgente para bajo stock. Depende del paso 6.
8. Verificar que Home y NotificationCenter no requieren cambios estructurales, ya que ambos consumen fetchAppNotifications con includeInventoryAlerts; solo validar comportamiento tras actualizar el servicio. En paralelo con el paso 7.
9. Fase 3 - Pruebas y validación (depende de Fases 1 y 2)
10. Añadir tests unitarios frontend para la lógica de agregarInventarioPorProducto cubriendo: producto con múltiples lotes, caso con lote bajo stock, caso con stock total 0, y no regresión en proveedores/ubicaciones agregadas. Depende del paso 2.
11. Añadir/ajustar tests unitarios frontend del servicio de notificaciones para validar que includeInventoryAlerts devuelve alerta de bajo stock en campana y mantiene alertas de caducidad coexistiendo correctamente. Depende del paso 6.
12. Ejecutar validación técnica del alcance: lint y tests frontend relevantes, seguido de build frontend para asegurar ausencia de regresiones de tipado y bundling. Depende de pasos 10 y 11.
13. Ejecutar validación manual guiada: producto bajo mínimo visible con icono en Inventario y notificación visible en campana con navegación a /inventario. Depende del paso 12.

**Relevant files**
- /home/psych/projects/SmartEconomat/frontend/smart-economat-frontend/src/services/inventario.service.ts — corregir cálculo/propagación de bajoStock en agregarInventarioPorProducto.
- /home/psych/projects/SmartEconomat/frontend/smart-economat-frontend/src/pages/Inventario.tsx — validar consumo de row.bajoStock e impacto visual del estado.
- /home/psych/projects/SmartEconomat/frontend/smart-economat-frontend/src/services/notifications.service.ts — integrar notificación de bajo stock en getInventoryNotifications/fetchAppNotifications.
- /home/psych/projects/SmartEconomat/frontend/smart-economat-frontend/src/components/common/Notification/NotificationCenter.tsx — solo verificación funcional de consumo.
- /home/psych/projects/SmartEconomat/frontend/smart-economat-frontend/src/pages/Home.tsx — solo verificación funcional del contador de notificaciones.
- /home/psych/projects/SmartEconomat/frontend/smart-economat-frontend/src/services/inventario.types.ts — validar tipado de estructuras usadas por alertas/aggregación.
- /home/psych/projects/SmartEconomat/frontend/smart-economat-frontend/src/services/inventario.service.test.ts — nuevo o ampliado para cubrir bajoStock agregado.
- /home/psych/projects/SmartEconomat/frontend/smart-economat-frontend/src/services/notifications.service.test.ts — nuevo para cobertura de campana con bajo stock.

**Verification**
1. Ejecutar tests unitarios frontend del alcance de servicios de inventario/notificaciones.
2. Ejecutar lint frontend para confirmar que no se introducen errores críticos.
3. Ejecutar build frontend para validar compilación TypeScript y bundle.
4. QA manual en UI:
5. Abrir Inventario con un producto por debajo de mínimo y comprobar icono/estado Bajo stock.
6. Abrir campana de notificaciones y comprobar aparición de alerta de bajo stock con conteo y texto correctos.
7. Verificar que caducidad y bajo stock coexisten sin duplicidades ni pérdida de notificaciones previas.

**Decisions**
- Alcance confirmado por usuario: incluir notificación en centro de notificaciones (campana), no solo en tabla.
- Backend se mantiene como fuente de verdad y no se modifican contratos públicos en esta intervención.
- Incluido: fixes frontend Inventario + notificaciones + tests de servicios.
- Excluido: rediseño de dashboard, cambios de permisos, cambios de API backend.

**Further Considerations**
1. Si se detecta diferencia entre conteo por alerta (lote) y conteo por producto único en UX, definir criterio único en una tarea posterior para alinear dashboard, campana y modal resumen.
2. Si aparecen productos duplicados por nombre en alertas, priorizar una mejora futura de tipado/identificación estable en payload de alertas para deduplicación determinista.
