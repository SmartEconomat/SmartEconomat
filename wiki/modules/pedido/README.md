# Módulo: Pedido

Documentación relativa al nuevo modelo de pedidos, donde se separan:

- `PedidoUsuario`: pedido de negocio visible para usuario.
- `Pedido`: pedido interno operativo por proveedor.
- `PurchaseBatch`: consolidación administrativa de compras.

## Documentos

- [Automatización de fechas y estados](./automatizacion-fechas-estados.md)
- [Pedidos desde recetas](./pedidos-desde-recetas.md) — Consolidación de ingredientes y generación de un pedido interno desde recetas.

## Notas

Incluye prácticas recomendadas y ejemplos de integración con Recepción y Compras para evitar inconsistencias entre agregados visibles, pedidos internos y lotes de compra.

## Resumen operativo

### `PedidoUsuario`
- Se crea desde borradores y desde la UI principal de pedidos.
- Tiene `numeroGlobal` como numeración de negocio.
- Puede contener múltiples proveedores sin que el usuario vea varias filas separadas.

### `Pedido`
- Se genera automáticamente al persistir un `PedidoUsuario`.
- Mantiene la trazabilidad real con recepciones, incidencias, PDF de recepción y movimientos.

### `PurchaseBatch`
- Solo se usa cuando negocio o administración consolida varios `PedidoUsuario` en una compra semanal.
- No sustituye al pedido de negocio ni aparece como entidad principal en “Mis pedidos”.
