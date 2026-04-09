# How-to: Usar transacciones seguras (DataSource y QueryRunner)

## Cuándo usar
Cuando una operación modifica varias tablas y debe ser atómica.

## Opción A: `dataSource.transaction`
```ts
return this.dataSource.transaction(async (manager) => {
  const pedido = manager.create(Pedido, dto);
  await manager.save(pedido);
  // más operaciones dependientes
  return pedido;
});
```

## Opción B: QueryRunner manual
```ts
const qr = this.dataSource.createQueryRunner();
await qr.connect();
await qr.startTransaction();
try {
  // operaciones con qr.manager
  await qr.commitTransaction();
} catch (e) {
  await qr.rollbackTransaction();
  throw e;
} finally {
  await qr.release();
}
```

## Reglas
- No mezclar manager transaccional con repositorio global en la misma operación.
- Siempre liberar QueryRunner en `finally`.
- Diseñar rollback idempotente.
