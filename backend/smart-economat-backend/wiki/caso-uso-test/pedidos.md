# Plan de Pruebas: Módulo de Pedidos

Este documento detalla los escenarios de prueba necesarios para garantizar una cobertura del 100% de los casos de uso del módulo de Pedidos, incluyendo la lógica de cálculo de costes, gestión de estados, seguridad e integridad referencial.

---

## 1. Listado de Tests E2E (Integración Completa)

Se deben implementar los siguientes tests usando `supertest` y una base de datos de pruebas (pg-mem o similar).

### A. Creación (POST /api/v1/pedidos)

1. **E2E-PED-01-CRE**: Creación exitosa con múltiples productos y cálculo automático de `costeTotal`.
2. **E2E-PED-02-CRE**: Error 400 cuando falta el campo `proveedorId`.
3. **E2E-PED-03-CRE**: Error 400 cuando la lista de `lineas` está vacía.
4. **E2E-PED-04-CRE**: Error 404 cuando el `proveedorId` es un UUID válido pero no existe en BD.
5. **E2E-PED-05-CRE**: Error 404 cuando uno de los `productoProveedorId` no existe.
6. **E2E-PED-06-CRE**: Error 400 cuando un producto de la lista pertenece a un proveedor distinto al del pedido.
7. **E2E-PED-07-CRE**: Error 409 (Conflict) cuando un producto no tiene un precio pactado nulo/indefinido en la tabla de proveedores.
8. **E2E-PED-08-CRE**: Verificación de **Atomicidad**: Si falla la inserción de la última línea, verificar que no se haya creado la cabecera del pedido (Rollback).
9. **E2E-PED-09-CRE**: Verificación de **Snapshot**: Comprobar que el `precioUnitario` guardado en `PedidoProducto` es idéntico al de `ProductoProveedor` al momento de la compra.
10. **E2E-PED-10-CRE**: Error 400 si la `fechaEntrega` es anterior a la fecha actual.

### B. Listado y Consulta (GET)

11. **E2E-PED-11-GET**: Listado paginado exitoso (validar campos `total`, `page`, `data`).
12. **E2E-PED-12-GET**: Obtener detalle de pedido por ID con todas sus relaciones (`proveedor`, `pedidoProductos`, `producto`).
13. **E2E-PED-13-GET**: Error 404 al consultar un pedido que no existe.

### C. Actualización y Edición (PATCH /api/v1/pedidos/:id)

14. **E2E-PED-14-UPD**: Actualizar fecha de entrega exitosamente.
15. **E2E-PED-15-UPD**: Reemplazo de líneas: Eliminar una línea existente, añadir una nueva y verificar que el `costeTotal` se recalcula correctamente.
16. **E2E-PED-16-UPD**: Cambiar la cantidad de una línea existente y verificar la actualización automática del coste total en la cabecera.
17. **E2E-PED-17-UPD**: Error 400 al intentar actualizar un pedido con productos que no pertenecen a su proveedor.
18. **E2E-PED-18-UPD**: Error 404 al intentar actualizar un pedido inexistente.
19. **E2E-PED-19-FENT**: Endpoint específico `PATCH /fecha-entrega`: Validación de formato de fecha ISO.

### D. Flujos de Estado y Cancelación

20. **E2E-PED-20-CAN**: Cancelar pedido exitosamente (Estado `PENDIENTE` -> `CANCELADO`) y verificar que se guarda el `motivoCancelacion`.
21. **E2E-PED-21-CAN**: Error 400 al intentar cancelar un pedido que ya está en estado `RECIBIDO`.
22. **E2E-PED-22-MOV**: Verificar que al crear/cancelar un pedido, se genera automáticamente un registro en la tabla de **Movimientos** mediante `MovimientoHelper`.

### E. Eliminación (DELETE /api/v1/pedidos/:id)

23. **E2E-PED-23-DEL**: Eliminación exitosa de un pedido en estado `PENDIENTE`.
24. **E2E-PED-24-DEL**: Error 400 al intentar eliminar un pedido en estado `RECIBIDO` o `EN_PROCESO`.
25. **E2E-PED-25-DEL**: Verificación de **Cascada**: Al borrar el pedido, comprobar que sus líneas en `PedidoProducto` también han sido eliminadas.

### F. Seguridad y RBAC

26. **E2E-PED-26-SEC**: Error 401 al intentar acceder a cualquier endpoint sin token JWT.
27. **E2E-PED-27-SEC**: Error 403 cuando un usuario con rol `ALUMNO` intenta crear o editar un pedido.
28. **E2E-PED-28-SEC**: Éxito cuando un usuario con rol `PROFESOR` o `ADMIN` realiza operaciones autorizadas.

---

## 2. Casos de Uso y Reglas de Negocio a Validar

### Creación con Cálculo de Costes

- **Entrada**: Lista de `productoProveedorId` y `cantidad`.
- **Lógica**:
  1. El sistema busca cada producto en la tabla `producto_proveedor`.
  2. Valida que el `proveedorId` del producto coincide con el del pedido.
  3. Recupera el `precioUnitario` vigente.
  4. Crea el `PedidoProducto` ("snapshot") con ese precio.
  5. Suma todos los subtotales.
- **Validación**: El `costeTotal` final en el `Pedido` debe ser exactamente igual a la suma de `cantidad * precio_unitario` de todas sus líneas.

### Restricciones de Estado

- Un pedido `RECIBIDO` es **inmutable** en cuanto a sus productos y cantidades para no romper la trazabilidad del inventario y finanzas.
- Un pedido solo puede ser eliminado físicamente si no ha sido procesado (`PENDIENTE` o `CANCELADO`).

### Integridad Referencial

- No se puede borrar un `ProductoProveedor` si tiene pedidos vinculados (`RESTRICT` en la entidad).
- No se puede borrar un `Proveedor` si tiene pedidos históricos pendientes de recibir.

---

## 3. Pruebas de Carga y Límites (Stress/Edge Cases)

- **Carga Masiva**: Crear un pedido con 200 líneas de productos diferentes.
- **Precisión Decimal**: Validar cálculos con precios de 4 decimales (ej: 0.0035) y cantidades grandes para evitar errores de coma flotante.
- **Nombres Largos**: Validar que las observaciones (text) aceptan descripciones largas sin truncamiento inesperado.
