# Plan de Pruebas: Módulo de Dashboard

Este documento detalla los escenarios de prueba para el Dashboard principal, encargado de consolidar métricas de almacén, valoraciones económicas y alertas críticas en tiempo real.

---

## 1. Listado de Tests E2E (Integración Completa)

### A. Obtención de Estadísticas (GET /api/v1/dashboard/stats)

1. **E2E-DSH-01-VAL**: Verificar el cálculo del **Valor Total del Inventario**. Validar que coincide con la suma de `cantidad_actual * precio_unitario` de todos los lotes.
2. **E2E-DSH-02-STK**: Verificar el contador de **Items bajo Stock**. Solo deben contarse lotes con `cantidad_actual < cantidad_minima`.
3. **E2E-DSH-03-EXP**: Verificar la lógica de **Alertas de Caducidad**:
   - `porCaducar`: Lotes con vencimiento en los próximos 7 días exactos.
   - `caducados`: Lotes con vencimiento anterior a la fecha actual.
4. **E2E-DSH-04-PED**: Verificar métricas de **Pedidos**:
   - `pendientes`: Suma de pedidos en estado PENDIENTE, EN_PROCESO e INCIDENCIA.
   - `completadosHoy`: Pedidos recibidos con fecha de entrega igual al día de hoy.
5. **E2E-DSH-05-COST**: Verificar el **Coste Total Pendiente**: Suma de `coste_total` de todos los pedidos no recibidos.
6. **E2E-DSH-06-PROD**: Verificar indicadores de crecimiento: `totalProductos` y `productosEsteMes`.
7. **E2E-DSH-07-MOV**: Verificar la lista de **Movimientos Recientes**: Debe mostrar los últimos 5 movimientos ordenados por fecha descendente, incluyendo el nombre del usuario y el nombre del producto (si aplica).

### B. Rendimiento y Seguridad

8. **E2E-DSH-08-PERF**: Validar que la consulta de estadísticas se ejecuta en menos de 500ms incluso con +5000 registros de inventario (Uso de `QueryBuilder` optimizado).
9. **E2E-DSH-09-SEC-401**: Error 401 si no hay token.
10. **E2E-DSH-10-SEC-ROL**: Validar que el Dashboard es accesible para todos los roles, pero algunos datos sensibles (como valoraciones económicas) podrían estar restringidos según el permiso de usuario.

---

## 2. Reglas de Negocio Críticas

- **Consistencia Temporal**: Las métricas "de hoy" deben reiniciarse a las 00:00:00 del servidor.
- **Manejo de Nulos**: El valor del inventario no debe fallar si hay productos sin precio (deben computar como 0).
- **Traducción de Alertas**: Los logs y mensajes del dashboard deben seguir la configuración de idioma del `I18nHelper`.

---

## 3. Stress y Edge Cases

- **Dashboard Vacío**: Primera ejecución del sistema sin ningún dato (Verificar que devuelve ceros y arrays vacíos, no errores 500).
- **Lotes sin Fecha**: Verificar que el contador de caducidad ignora items sin `fechaCaducidad`.
- **Transiciones de Pedido**: Cambiar un pedido a `RECIBIDO` y verificar que el dashboard se actualiza instantáneamente (decremento en pendientes, incremento en completados hoy).
- **Múltiples Proveedores**: Producto con stock de dos proveedores distintos; el dashboard debe sumar correctamente ambos valores unitarios para el total.
