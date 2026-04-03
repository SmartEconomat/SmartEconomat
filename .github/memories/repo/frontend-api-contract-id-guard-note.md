# Frontend API contract guard (ids)

- Se añadió validación global en `baseFetch` para bloquear requests con ids inválidos en path/query/body JSON (`null`, `undefined`, `NaN` o string vacía).
- Esto evita una gran parte de `400 Bad Request` causados por payloads con `...Id` nulos o vacíos y rutas con placeholders no resueltos.
- Además se endurecieron payloads de pedidos rápidos y normalización de líneas de pedido para no propagar `productoProveedorId`/`proveedorId` vacíos.
