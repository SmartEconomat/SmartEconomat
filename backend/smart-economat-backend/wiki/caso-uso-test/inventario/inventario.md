# Plan de Pruebas: Módulo de Inventario

Este documento detalla los escenarios de prueba técnicos y funcionales para el módulo de Inventario, asegurando el control preciso de existencias, la gestión de alertas de caducidad y stock bajo, y la integridad de los movimientos de almacén.

---

## 1. Listado de Tests E2E (Integración Completa)

### A. Creación de Item de Inventario (POST /api/v1/inventario)

1. **E2E-INV-01-CRE**: Creación exitosa de un lote de stock vinculado a un `productoProveedorId` y una `ubicacionId`.
2. **E2E-INV-02-CRE-VAL**: Error 400 si la `cantidadActual` es negativa.
3. **E2E-INV-03-CRE-ERR-NF**: Error 404 si el `productoProveedorId` no existen.
4. **E2E-INV-04-CRE-ERR-NF**: Error 400 si la `ubicacionId` no existe.
5. **E2E-INV-05-CRE-MOV**: Verificar que al crear el item, se genera automáticamente un movimiento de tipo `ENTRADA` vinculado al usuario.

### B. Listado y Consulta (GET /api/v1/inventario)

6. **E2E-INV-06-GET**: Listado completo de existencias con carga de relaciones (`producto`, `proveedor`, `ubicacion`).
7. **E2E-INV-07-GET-DET**: Obtener detalle de un lote específico por ID.
8. **E2E-INV-08-GET-ALER-STK**: Consultar `GET /api/v1/inventario/alertas/stock` y verificar que solo devuelve items por debajo de su `cantidadMinima`.
9. **E2E-INV-09-GET-ALER-CAD**: Consultar `GET /api/v1/inventario/alertas/caducidad` y verificar que devuelve items próximos a caducar (semanas/mes config).

### C. Actualización e Inventario Físico (PATCH /api/v1/inventario/:id)

10. **E2E-INV-10-UPD-ADJ**: Ajustar la `cantidadActual` manualmente (ej. por rotura o conteo).
11. **E2E-INV-11-UPD-MOV**: Verificar que al aumentar la cantidad, se genera un movimiento `ENTRADA` por la diferencia.
12. **E2E-INV-12-UPD-MOV**: Verificar que al disminuir la cantidad, se genera un movimiento `SALIDA` por la diferencia.
13. **E2E-INV-13-UPD-UBI**: Cambiar la ubicación de un lote y verificar persistencia.
14. **E2E-INV-14-UPD-VAL**: Error 400 si el ajuste resulta en una cantidad negativa.

### D. Eliminación y Bajas (DELETE /api/v1/inventario/:id)

15. **E2E-INV-15-DEL-OK**: Eliminación lógica (`softDelete`) de un lote de stock.
16. **E2E-INV-16-DEL-MOV**: Verificar que al eliminar, se genera un movimiento de `SALIDA` por el total de la cantidad que había.
17. **E2E-INV-17-DEL-ERR**: Error 404 para ID inexistente.

### E. Seguridad y RBAC

18. **E2E-INV-18-SEC-401**: Error 401 si no hay token JWT.
19. **E2E-INV-19-SEC-ROL**: Validar que un usuario sin permiso `inventario:editar` no puede realizar ajustes.
20. **E2E-INV-20-SEC-ALER**: Verificar que profesores y administradores pueden ver alertas de stock.

---

## 2. Reglas de Negocio Críticas

- **Trazabilidad Obligatoria**: Cualquier cambio en la `cantidadActual` (ya sea vía Recepción o ajuste manual) DEBE disparar un registro en el histórico de movimientos.
- **Sistemas de Alerta**: El sistema identifica automáticamente mermas potenciales mediante las fechas de caducidad.
- **Integridad de Ubicación**: Un item de inventario siempre debe estar asociado a una ubicación física válida.
- **Diferenciación por Lotes**: Un mismo producto de un mismo proveedor puede tener múltiples entradas en inventario si pertenecen a lotes/fechas de caducidad distintas.

---

## 3. Stress y Edge Cases

- **Stock a Cero**: Verificar que el item permanece en el listado (o se oculta según filtro) cuando la cantidad llega exactamente a 0.
- **Ajustes Concurrentes**: Dos usuarios intentando ajustar el mismo lote simultáneamente.
- **Cálculo de Totales**: Validar que la suma total de stock de un producto coincide con la suma de todos sus lotes individuales.
- **Fechas Límite**: Items que caducan exactamente "hoy".
