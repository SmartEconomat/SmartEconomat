- Backend `PaginationQueryDto` en productos valida `limit` con `@Max(50)`; valores como `100` o `1000` devuelven `400 Bad Request`.
- En frontend, normalizar siempre `page>=1` y `limit<=50` en `src/services/producto.service.ts`.
- Para obtener listados completos de productos, usar `fetchAllProductos()` (paginación interna por lotes de 50) en vez de pedir un `limit` alto en una sola request.
- En `SummaryModal`, evitar fallback `stockActual || 0`/`stockMinimo || 0`: si no hay dato numérico debe mostrarse `N/D`, y cuando el valor real sea 0 formatear como `0,00`.

