- `PurchaseBatch` debe derivar `estado` desde `pedidos` con la misma semántica backend (`PENDIENTE` solo si todos `PENDIENTE_DE_APROBACION`, `COMPLETADO` solo si todos están en estados finales `RECEPCIONADO|CANCELADO|INCIDENCIA`, resto `PARCIAL`).
- `PurchaseBatchService.findAll()` y `findOne()` ahora reconcilian y persisten estados stale al leer lotes.
- El frontend de compras normaliza `PurchaseBatch.estado` en `pedido.service.ts` y solo permite iniciar recepción con pedidos `POR_RECEPCIONAR`.
- `mapPurchaseBatchToRecepcionDraft()` debe filtrar solo pedidos recepcionables; `PARCIAL` no es válido para iniciar recepción según `recepcion-stock.service`.
- `POST /purchase-batches` debe crear un `PurchaseBatch` real; `POST /purchase-batches/from-recipes` reparte ingredientes por proveedor (o usa `proveedorId` si se fuerza mono-proveedor), mientras `POST /pedidos/from-recipes` solo es válido como pedido de un único proveedor.

