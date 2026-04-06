# Proveedor pagination limit

- Backend `PaginationQueryDto` valida `limit` con `@Max(50)`.
- Llamadas frontend a `/proveedor` con `limit > 50` devuelven `400 Bad Request`.
- Solución aplicada: normalizar `limit` en `fetchProveedores` y, si se necesitan todos los proveedores, paginar en frontend por páginas de 50.
