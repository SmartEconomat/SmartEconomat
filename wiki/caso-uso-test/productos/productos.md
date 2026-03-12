# Plan de Pruebas: Módulo de Productos

Este documento detalla los escenarios de prueba técnicos y funcionales para el módulo de Productos, garantizando la integridad del catálogo, la correcta gestión de proveedores, alérgenos y la generación de códigos EAN-13.

---

## 1. Listado de Tests E2E (Integración Completa)

### A. Creación de Producto (POST /api/v1/productos)

1. **E2E-PRO-01-CRE**: Creación exitosa de un producto con datos básicos. Verificar generación automática de `codigoBarras` EAN-13 válido.
2. **E2E-PRO-02-CRE**: Creación exitosa proporcionando un `codigoBarras` manual válido (EAN-13).
3. **E2E-PRO-03-CRE**: Creación completa con **Alérgenos** y **Proveedores** vinculados en la misma transacción.
4. **E2E-PRO-04-CRE-ERR**: Error 400 por código de barras inválido (formato no EAN-13).
5. **E2E-PRO-05-CRE-ERR**: Error 400 por código de barras duplicado.
6. **E2E-PRO-06-CRE-ERR**: Error 400 por campos obligatorios faltantes (`nombre`, `unidad`, `tipo`).
7. **E2E-PRO-07-CRE-TRX**: Verificación de **Atomicidad**: Si falla la vinculación de un proveedor, no se debe crear el producto (Rollback).
8. **E2E-PRO-08-CRE-MOV**: Verificar que se genera un registro en la tabla de **Movimientos** al crear el producto.

### B. Listado y Filtros (GET /api/v1/productos)

9. **E2E-PRO-09-GET**: Listado paginado exitoso. Validar estructura de respuesta (`data`, `total`, `totalPages`).
10. **E2E-PRO-10-GET-SRCH**: Búsqueda por `searchTerm` (nombre) con coincidencia parcial e insensible a mayúsculas/minúsculas.
11. **E2E-PRO-11-GET-EAN**: Filtro exacto por `codigoBarras`.
12. **E2E-PRO-12-GET-CAT**: Filtrado por múltiples categorías simultáneamente.
13. **E2E-PRO-13-GET-ALE**: Filtrado por alérgenos (debe devolver productos que tengan al menos uno de los alérgenos seleccionados).
14. **E2E-PRO-14-GET-STK**: Filtro `minStock`: Devolver solo productos que tengan stock positivo en inventario.
15. **E2E-PRO-15-GET-REL**: Verificar que el listado incluye relaciones cargadas (`proveedores`, `alergenos`).

### C. Detalle y Edición (GET/PATCH /api/v1/productos/:id)

16. **E2E-PRO-16-GET-ID**: Obtener detalle completo de un producto por ID.
17. **E2E-PRO-17-UPD-BAS**: Actualizar campos básicos (nombre, marca) y verificar persistencia.
18. **E2E-PRO-18-UPD-EAN**: Cambiar el código de barras a uno nuevo válido.
19. **E2E-PRO-19-UPD-ALE**: Sincronizar alérgenos: Añadir nuevos y eliminar existentes.
20. **E2E-PRO-20-UPD-PROV**: Sincronizar proveedores:
    - Añadir un nuevo proveedor al producto.
    - Actualizar precio/marca de un proveedor existente.
    - Eliminar un proveedor vinculado (soft delete en `ProductoProveedor`).
21. **E2E-PRO-21-UPD-ERR**: Error 400 al intentar poner un EAN duplicado ocupado por otro producto.

### D. Eliminación (DELETE /api/v1/productos/:id)

22. **E2E-PRO-22-DEL**: Eliminación exitosa de un producto sin stock ni pedidos vinculados.
23. **E2E-PRO-23-DEL-ERR**: Error 404 al intentar eliminar un producto que no existe.
24. **E2E-PRO-24-DEL-MOV**: Verificar registro en el log de movimientos tras la eliminación.
25. **E2E-PRO-25-DEL-RESTRICT**: Impedir eliminación si el producto tiene dependencias activas (ej: líneas de pedido histórico, stock en inventario) si existen reglas de integridad `RESTRICT`.

### E. Utilidades y Otros

26. **E2E-PRO-26-EAN-GEN**: Endpoint específico `GET /generar-ean13`: Verificar que genera códigos válidos y únicos.
27. **E2E-PRO-27-EAN-RETRY**: Verificar lógica de reintentos en generación de EAN si hay colisión.

### F. Seguridad y RBAC

28. **E2E-PRO-28-SEC-401**: Error 401 si no hay token.
29. **E2E-PRO-29-SEC-ROL**: Validar que un usuario sin permiso `productos:crear` recibe 403.
30. **E2E-PRO-30-SEC-DEL**: Solo usuarios con permiso de eliminación pueden borrar productos.

---

## 2. Reglas de Negocio Críticas

- **EAN-13 Mandatorio**: Todo producto debe tener un código de barras de 13 dígitos con dígito de control válido. Si no se provee, el sistema lo genera.
- **Sincronización de Proveedores**: La relación entre Producto y Proveedor almacena el precio unitario y marca específica para ese binomio.
- **Trazabilidad**: Cualquier cambio en el catálogo (creación, edición, borrado) debe quedar registrado en la tabla de movimientos para auditoría.
- **Unicidad de Relaciones**: Un producto no puede estar vinculado dos veces al mismo proveedor de forma activa.

---

## 3. Stress y Edge Cases

- **Búsqueda Masiva**: Realizar búsquedas con filtros complejos en un catálogo de +10,000 productos.
- **Múltiples Alérgenos**: Producto con la lista completa de alérgenos (+14).
- **Formatos de Imagen**: (Si aplica) Validación de subida de fotos (tamaño, tipo de archivo).
- **Caracteres Especiales**: Nombres de producto con tildes, símbolos o longitudes extremas.
