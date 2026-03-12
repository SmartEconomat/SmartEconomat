# Plan de Pruebas: Módulo de Pedidos

Este documento detalla los escenarios de prueba necesarios para garantizar una cobertura del 100% de los casos de uso del módulo de Pedidos, incluyendo la lógica de cálculo de costes, gestión de estados, seguridad e integridad referencial.

---

## 1. Listado de Tests E2E (Integración Completa)

### A. Creación y Cálculo de Costes (POST /api/v1/pedidos)

1. **E2E-PED-01-CRE**: Creación exitosa con múltiples productos. Validar que `costeTotal` = SUM(cantidad \* precioUnitario).
2. **E2E-PED-02-CRE-STP**: Verificación de **Snapshot**: Confirmar que el precio de `ProductoProveedor` se copia a la línea de pedido y no cambia si el proveedor altera su tarifa después.
3. **E2E-PED-03-CRE-TRX**: Verificación de **Atomicidad**: Error provocado en la última línea debe resultar en NINGÚN pedido creado (Rollback).
4. **E2E-PED-04-CRE-ERR**: Error 404 cuando el `productoProveedorId` no existe.
5. **E2E-PED-05-CRE-ERR**: Error 400 cuando el producto no pertenece al `proveedorId` seleccionado.
6. **E2E-PED-06-CRE-ERR**: Error 409 (Conflict) si el producto no tiene un precio pactado configurado.
7. **E2E-PED-07-CRE-VAL**: Error 400 si `fechaEntrega` es en el pasado o formato inválido.
8. **E2E-PED-08-CRE-VAL**: Error 400 si `lineas` es un array vacío.

### B. Listado y Consulta (GET)

9. **E2E-PED-09-GET**: Listado paginado con metadatos de usuario y proveedor.
10. **E2E-PED-10-GET-DET**: Obtener detalle de pedido con desglose de productos y observaciones de cada línea.
11. **E2E-PED-11-GET-ERR**: Error 404 para ID inexistente.

### C. Ciclo de Vida y Transiciones de Estado (PATCH)

12. **E2E-PED-12-UPD-LIN**: Actualizar líneas de un pedido (añadir/quitar productos) y verificar el nuevo `costeTotal`.
13. **E2E-PED-13-UPD-FENT**: Actualizar solo la fecha de entrega mediante el endpoint específico.
14. **E2E-PED-14-CAN-OK**: Cancelar pedido en estado `PENDIENTE` con motivo obligatorio.
15. **E2E-PED-15-CAN-ERR**: Error 400 al intentar cancelar un pedido en estado `RECIBIDO` o `EN_PROCESO`.
16. **E2E-PED-16-MOV**: Verificar que al crear o cancelar un pedido, se registra el evento en la tabla de **Movimientos** (`MovimientoHelper`).

### D. Eliminación (DELETE /api/v1/pedidos/:id)

17. **E2E-PED-17-DEL-OK**: Eliminar físicamente un pedido en estado `PENDIENTE` o `CANCELADO`.
18. **E2E-PED-18-DEL-ERR**: Error 400 al intentar eliminar un pedido que ya está `EN_PROCESO` o `RECIBIDO` (Protección de trazabilidad).
19. **E2E-PED-19-CAS**: Verificar que al borrar el pedido las líneas de `PedidoProducto` se eliminan o restringen según FK.

### E. Seguridad y RBAC

20. **E2E-PED-20-SEC**: Error 401 si no hay token.
21. **E2E-PED-21-SEC-ROL**: Validar que un usuario sin permiso `pedidos:crear` (ej. Alumno) recibe un 403 Forbidden.
22. **E2E-PED-22-SEC-OWN**: (Si aplica) Verificar que un usuario no puede ver/editar pedidos de otro departamento sin permisos globales.

---

## 2. Reglas de Negocio Críticas

- ** Snapshot de Precio**: El precio pactado se congela al crear el pedido.
- **Validación Cruzada**: Cada línea de producto debe ser validada contra el ID del proveedor de la cabecera.
- **Inmutabilidad Post-Recepción**: Un pedido `RECIBIDO` no puede ser editado ni cancelado.
- **Motivo de Cancelación**: Es un campo textual obligatorio para cambiar el estado a `CANCELADO`.

---

## 3. Stress y Edge Cases

- **Pedido masivo**: +100 líneas diferentes.
- **Precisión en Decimales**: Validar que `cantidad: 0.005` y `precio: 1.2345` calculan el subtotal sin errores de redondeo.
- **Concurrencia**: Dos usuarios editando el mismo pedido al mismo tiempo.
