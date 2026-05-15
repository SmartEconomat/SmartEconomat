import { Logger } from '@nestjs/common';
import type { EntityManager } from 'typeorm';

const PEDIDO_PROVEEDOR_SERIE_INICIAL = 200000;
const PEDIDO_NUMERO_SEQUENCE = 'pedido_numero_global_seq';
const PEDIDO_NUMERO_LOCK_KEY = 98432157;

const logger = new Logger('PedidoNumero');

/**
 * pg-mem (e2e/unit) no implementa pg_advisory_lock; en NODE_ENV=test omitimos
 * los bloqueos — la suite corre en un único proceso sin concurrencia real.
 */
async function withPedidoNumeroAdvisoryLock<T>(
  manager: Pick<EntityManager, 'query'>,
  fn: () => Promise<T>
): Promise<T> {
  if (process.env.NODE_ENV === 'test') {
    return fn();
  }
  await manager.query('SELECT pg_advisory_lock($1)', [PEDIDO_NUMERO_LOCK_KEY]);
  try {
    return await fn();
  } finally {
    await manager.query('SELECT pg_advisory_unlock($1)', [
      PEDIDO_NUMERO_LOCK_KEY,
    ]);
  }
}

async function reserveNextPedidoProveedorNumeroWithSequence(
  manager: Pick<EntityManager, 'query'>
): Promise<string> {
  return withPedidoNumeroAdvisoryLock(manager, async () => {
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
  });
}

async function reserveNextPedidoProveedorNumeroFallbackLocked(
  manager: Pick<EntityManager, 'query'>
): Promise<string> {
  return withPedidoNumeroAdvisoryLock(manager, async () => {
    const result = await manager.query(
      'SELECT COALESCE(MAX("numero_global"::bigint), $1) AS "max" FROM "pedido"',
      [PEDIDO_PROVEEDOR_SERIE_INICIAL - 1]
    );

    const currentMax = Number(
      result?.[0]?.max ?? PEDIDO_PROVEEDOR_SERIE_INICIAL - 1
    );

    return String(Math.max(currentMax + 1, PEDIDO_PROVEEDOR_SERIE_INICIAL));
  });
}

/**
 * Reserva el siguiente número global correlativo para pedido a proveedor.
 */
export async function reserveNextPedidoProveedorNumero(
  manager: Pick<EntityManager, 'query'>
): Promise<string> {
  try {
    return await reserveNextPedidoProveedorNumeroWithSequence(manager);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    logger.warn(
      `Secuencia de numeración de pedidos falló; usando MAX+1 con bloqueo: ${message}`
    );
    return reserveNextPedidoProveedorNumeroFallbackLocked(manager);
  }
}

export { PEDIDO_PROVEEDOR_SERIE_INICIAL };
