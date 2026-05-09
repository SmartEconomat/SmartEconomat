# Consolidación de pedidos: estados internos permitidos

En `PurchaseBatchService.createBatchFromPedidoUsuarioIds`, la **consolidación** (`mode === 'consolidate'`) permite pedidos internos en `EstadoPedido.PENDIENTE_DE_APROBACION` o `EstadoPedido.POR_RECEPCIONAR`, siempre sin `batchId` y sin filas en `recepcionesPedido`. La **aprobación unitaria** (`mode === 'approve'`) sigue exigiendo solo `PENDIENTE_DE_APROBACION`.

Los tests de `purchase-batch.service.spec.ts` simulan `QueryRunner.isTransactionActive` para que el `catch` llame a `rollbackTransaction` igual que en TypeORM.
