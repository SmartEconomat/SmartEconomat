# Plan de Pruebas: Módulo de Proveedores

Este documento detalla los escenarios de prueba técnicos y funcionales para el módulo de Proveedores, asegurando la integridad de los datos maestros, la gestión de contactos y la protección de relaciones comerciales.

---

## 1. Listado de Tests E2E (Integración Completa)

### A. Creación de Proveedor (POST /api/v1/proveedores)

1. **E2E-PROV-01-CRE**: Creación exitosa con todos los campos (nombre, nif, contacto, email, teléfono, dirección).
2. **E2E-PROV-02-CRE-MIN**: Creación exitosa omitiendo campos opcionales.
3. **E2E-PROV-03-CRE-ERR-NOM**: Error 400 por nombre duplicado.
4. **E2E-PROV-04-CRE-ERR-NIF**: Error 400 por NIF duplicado.
5. **E2E-PROV-05-CRE-ERR-VAL**: Error 400 por email con formato inválido.
6. **E2E-PROV-06-CRE-VAL**: Verificar que el NIF se guarda normalizado (mayúsculas/sin espacios si aplica).

### B. Listado y Filtros (GET /api/v1/proveedores)

7. **E2E-PROV-07-GET**: Listado paginado exitoso. Validar campos `total`, `page`, `limit`.
8. **E2E-PROV-08-GET-SRCH**: Búsqueda por `searchTerm` que coincida con el nombre.
9. **E2E-PROV-09-GET-SRCH**: Búsqueda por `searchTerm` que coincida con el NIF.
10. **E2E-PROV-10-GET-SRCH**: Búsqueda por `searchTerm` que coincida con el contacto o email.
11. **E2E-PROV-11-GET-REL**: Verificar que el listado carga la relación de `productos` asociados.

### C. Detalle y Edición (PATCH /api/v1/proveedores/:id)

12. **E2E-PROV-12-GET-ID**: Obtener detalle de un proveedor por ID.
13. **E2E-PROV-13-UPD-BAS**: Actualizar el nombre y verificar persistencia.
14. **E2E-PROV-14-UPD-NIF**: Actualizar el NIF y verificar que no colisiona con otros.
15. **E2E-PROV-15-UPD-ERR**: Error 400 al intentar actualizar el nombre a uno ya existente en otro proveedor.
16. **E2E-PROV-16-UPD-ERR**: Error 404 para ID inexistente.

### D. Eliminación (DELETE /api/v1/proveedores/:id)

17. **E2E-PROV-17-DEL-OK**: Eliminar un proveedor sin productos ni pedidos vinculados.
18. **E2E-PROV-18-DEL-ERR-PROD**: Error 400 al intentar eliminar un proveedor que tiene productos registrados.
19. **E2E-PROV-19-DEL-ERR-PED**: Error 400 al intentar eliminar un proveedor que tiene pedidos históricos.
20. **E2E-PROV-20-DEL-ERR-NF**: Error 404 al intentar borrar un proveedor inexistente.

### E. Seguridad y RBAC

21. **E2E-PROV-21-SEC-401**: Error 401 si no hay token JWT.
22. **E2E-PROV-22-SEC-ROL**: Validar que un usuario sin los permisos adecuados recibe un 403.
23. **E2E-PROV-23-SEC-ADMIN**: Solo el administrador puede eliminar proveedores.

---

## 2. Reglas de Negocio Críticas

- **Unicidad de Identidad**: Tanto el nombre comercial como el NIF deben ser únicos en todo el sistema.
- **Protección de Datos Históricos**: No se permite la eliminación física de un proveedor si existe algún rastro de actividad (pedidos o productos). Esto garantiza la integridad de los informes financieros.
- **Normalización**: (Opcional) El sistema debería recortar espacios en blanco y estandarizar formatos de teléfono y NIF.

---

## 3. Stress y Edge Cases

- **Proveedores Masivos**: Listado con carga de relaciones para +500 proveedores.
- **Nombres Muy Largos**: Validar que el campo nombre soporta longitudes extremas sin errores de BD.
- **NIF Extranjero**: (Si aplica) Validar que el campo NIF acepta formatos internacionales.
- **Emails Corporativos**: Validar emails con múltiples puntos o dominios complejos.
