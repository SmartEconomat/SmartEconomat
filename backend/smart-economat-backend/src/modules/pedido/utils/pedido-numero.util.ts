import type { EntityManager } from 'typeorm';

const PEDIDO_PROVEEDOR_SERIE_INICIAL = 200000;
const PEDIDO_NUMERO_SEQUENCE = 'pedido_numero_global_seq';
const PEDIDO_NUMERO_LOCK_KEY = 98432157;

async function reserveNextPedidoProveedorNumeroWithSequence(
  manager: Pick<EntityManager, 'query'>
): Promise<string> {
  await manager.query('SELECT pg_advisory_lock($1)', [PEDIDO_NUMERO_LOCK_KEY]);

  try {
    await manager.query(
      `CREATE SEQUENCE IF NOT EXISTS "${PEDIDO_NUMERO_SEQUENCE}" START WITH ${PEDIDO_PROVEEDOR_SERIE_INICIAL}`
    );

    const currentMaxResult = await manager.query(
      'SELECT COALESCE(MAX("numero_global"::bigint), $1) AS "max" FROM "pedido"',
      [PEDIDO_PROVEEDOR_SERIE_INICIAL - 1]
    );

    const currentMax = Number(
      currentMaxResult?.[0]?.max ?? PEDIDO_PROVEEDOR_SERIE_INICIAL - 1
    );

    await manager.query(
      `SELECT setval($1, GREATEST($2, (SELECT last_value FROM "${PEDIDO_NUMERO_SEQUENCE}")), true)`,
      [PEDIDO_NUMERO_SEQUENCE, currentMax]
    );

    const nextValueResult = await manager.query(
      'SELECT nextval($1) AS "value"',
      [PEDIDO_NUMERO_SEQUENCE]
    );

    const nextValue = Number(
      nextValueResult?.[0]?.value ?? PEDIDO_PROVEEDOR_SERIE_INICIAL
    );

    return String(Math.max(nextValue, PEDIDO_PROVEEDOR_SERIE_INICIAL));
  } finally {
    await manager.query('SELECT pg_advisory_unlock($1)', [
      PEDIDO_NUMERO_LOCK_KEY,
    ]);
  }
}

/**
 * Expone "reserveNextPedidoProveedorNumero" en smart-economat-backend (Nest).
 * @undefined {Pick<EntityManager, "query">} manager - Entrada efectiva esperada por el contrato.
 * @undefined {Promise<string>} Datos efectivos después de ejecutar la operación.
 */
export async function reserveNextPedidoProveedorNumero(
  manager: Pick<EntityManager, 'query'>
): Promise<string> {
  try {
    return await reserveNextPedidoProveedorNumeroWithSequence(manager);
  } catch (error) {
    void error;
  }

  const result = await manager.query(
    'SELECT COALESCE(MAX("numero_global"), $1) AS "max" FROM "pedido"',
    [PEDIDO_PROVEEDOR_SERIE_INICIAL - 1]
  );

  const currentMax = Number(
    result?.[0]?.max ?? PEDIDO_PROVEEDOR_SERIE_INICIAL - 1
  );

  return String(Math.max(currentMax + 1, PEDIDO_PROVEEDOR_SERIE_INICIAL));
}

export { PEDIDO_PROVEEDOR_SERIE_INICIAL };
