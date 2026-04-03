## Plan: PMP automático y botón histórico por proveedor

Ajustar el cálculo del PMP para que quede alineado con tu criterio de negocio (recalcular solo en recepciones y conservar el último PMP cuando no hay stock), y añadir en Productos un botón por proveedor que filtre el histórico de precios de ese proveedor dentro del modal actual, sin crear endpoints nuevos ni romper contratos existentes.

**Steps**
1. Fase 1 - Endurecer cálculo de PMP en backend
2. Revisar y ajustar la lógica de ProductoService para que Producto.pmp no se reemplace por promedio simple cuando stockTotal = 0; debe conservar el último PMP persistido. Este paso depende de tu decisión funcional ya confirmada.
3. Mantener el trigger de recálculo únicamente en flujos de recepción (no en mermas/ajustes ni en edición manual de precio), verificando que no se añadan nuevos puntos de recálculo fuera de recepción.
4. Añadir cobertura de tests unitarios para validar: cálculo ponderado con stock existente + nueva recepción, y comportamiento de conservación del último PMP cuando el stock agregado del producto sea 0.
5. Añadir o reforzar test en recepción para confirmar que actualizarPMP se sigue invocando con cantidad recibida y precio de la línea de pedido.
6. Fase 2 - UX en frontend para histórico por proveedor (paralelo con paso 4)
7. En el detalle de Productos, agregar un botón de historial en cada tarjeta de proveedor dentro de Proveedores asociados.
8. Implementar la acción del botón para establecer historyProviderFilter con el proveedor pulsado y llevar el foco/scroll a la sección de Histórico de precios del mismo modal.
9. Reutilizar el servicio existente fetchHistorialPrecios(productoId, proveedorId?) y el endpoint actual, sin cambios de contrato backend.
10. Fase 3 - Verificación técnica
11. Ejecutar validaciones backend (build + tests relevantes de producto/recepción) y verificar ausencia de regresiones de contrato.
12. Ejecutar validación frontend (build/lint/tests relevantes si aplica) y validar manualmente la UX del botón y la actualización del historial filtrado.

**Relevant files**
- /home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/producto/service/producto.service.ts — Ajuste de fallback en recalcularPmpProducto y conservación del último PMP.
- /home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/recepcion/service/recepcion-stock.service.ts — Verificación de que el recálculo se mantiene solo en recepción y con datos correctos.
- /home/psych/projects/SmartEconomat/backend/smart-economat-backend/test/modules/producto/producto.service.spec.ts — Nuevas pruebas de fórmula PMP y caso stock = 0.
- /home/psych/projects/SmartEconomat/backend/smart-economat-backend/test/modules/recepcion/recepcion-stock.service.spec.ts — Prueba/ajuste de invocación actualizarPMP con cantidad y precio de pedido.
- /home/psych/projects/SmartEconomat/frontend/smart-economat-frontend/src/pages/Productos.tsx — Botón por proveedor y navegación a histórico filtrado.
- /home/psych/projects/SmartEconomat/frontend/smart-economat-frontend/src/services/producto.service.ts — Reutilización del método existente (sin cambio de contrato, salvo ajuste menor si se detecta necesidad).

**Verification**
1. Backend: ejecutar tarea backend-build-validation.
2. Backend: ejecutar tests de producto/recepción afectados (incluyendo producto.service.spec.ts y recepcion-stock.service.spec.ts).
3. Frontend: ejecutar build del frontend y lint/test del alcance afectado según disponibilidad.
4. Manual: abrir Productos, entrar a detalle de un producto con varios proveedores, pulsar botón de histórico en cada proveedor y confirmar que el filtro cambia y la tabla muestra solo ese proveedor.
5. Manual: validar que el PMP mostrado en producto no cae a promedio simple cuando no hay stock y que sigue recalculándose tras una recepción válida.

**Decisions**
- Recalcular PMP solo al recepcionar mercancía.
- Cuando stock total = 0, conservar último PMP conocido del producto.
- Botón de histórico por proveedor dentro del modal actual, aplicando filtro por proveedor.

**Scope boundaries**
- Incluido: lógica de PMP de producto en backend + UX de botón histórico por proveedor en Productos + pruebas del alcance.
- Excluido: nuevos endpoints de histórico, cambios en contratos API públicos, recálculo PMP por mermas/ajustes o por edición manual de precio de proveedor.