- En el detalle frontend de compras, la tabla de "Pedidos a proveedor involucrados" debe mostrar cada `Pedido` interno con su estado real (`pedido.estado`) y sin deduplicar por `pedidoUsuario`.
- Para cruzar esa tabla con la pestaña Pedidos, `BatchPedidoLineasViewer` debe mostrar además una referencia separada al pedido visible (`pedido.pedidoUsuario.numeroGlobal` cuando exista), sin mezclar ambos conceptos en una sola columna.
- El ID técnico corto de un `Pedido` interno no debe reducirse solo al primer bloque UUID v7 en esa tabla, porque varios pedidos creados juntos pueden compartir prefijo y parecer duplicados.
- `BatchPedidoLineasViewer` ya no debe inferir el tipo por shape del objeto; pásale siempre un discriminador explícito (`pedido_usuario` o `purchase_batch`).
- `Recetas` debe generar pedidos visibles vía `/pedido-usuarios/from-recipes` y `/pedido-usuarios/from-missing-stock`; los endpoints `/purchase-batches/from-*` quedan solo para compatibilidad y no para la UI canónica.

