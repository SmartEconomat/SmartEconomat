import type { EntityManager } from 'typeorm';

const PURCHASE_BATCH_SERIE_INICIAL = 100000;
const PURCHASE_BATCH_NUMERO_SEQUENCE = 'purchase_batch_numero_global_seq';
const PURCHASE_BATCH_NUMERO_LOCK_KEY = 98432158;

async function reserveNextPurchaseBatchNumeroWithSequence(
  manager: Pick<EntityManager, 'query'>
): Promise<string> {
  await manager.query('SELECT pg_advisory_lock($1)', [
    PURCHASE_BATCH_NUMERO_LOCK_KEY,
  ]);

  try {
    await manager.query(
      `CREATE SEQUENCE IF NOT EXISTS "${PURCHASE_BATCH_NUMERO_SEQUENCE}" START WITH ${PURCHASE_BATCH_SERIE_INICIAL}`
    );

    const currentMaxResult = await manager.query(
      'SELECT COALESCE(MAX("numero_global"::bigint), $1) AS "max" FROM "purchase_batch"',
      [PURCHASE_BATCH_SERIE_INICIAL - 1]
    );

    const currentMax = Number(
      currentMaxResult?.[0]?.max ?? PURCHASE_BATCH_SERIE_INICIAL - 1
    );

    await manager.query(
      `SELECT setval($1, GREATEST($2, (SELECT last_value FROM "${PURCHASE_BATCH_NUMERO_SEQUENCE}")), true)`,
      [PURCHASE_BATCH_NUMERO_SEQUENCE, currentMax]
    );

    const nextValueResult = await manager.query(
      'SELECT nextval($1) AS "value"',
      [PURCHASE_BATCH_NUMERO_SEQUENCE]
    );

    const nextValue = Number(
      nextValueResult?.[0]?.value ?? PURCHASE_BATCH_SERIE_INICIAL
    );

    return String(Math.max(nextValue, PURCHASE_BATCH_SERIE_INICIAL));
  } finally {
    await manager.query('SELECT pg_advisory_unlock($1)', [
      PURCHASE_BATCH_NUMERO_LOCK_KEY,
    ]);
  }
}

/**
 * Expone "reserveNextPurchaseBatchNumero" en smart-economat-backend (Nest).
 * @undefined {Pick<EntityManager, "query">} manager - Entrada efectiva esperada por el contrato.
 * @undefined {Promise<string>} Datos efectivos después de ejecutar la operación.
 */
export async function reserveNextPurchaseBatchNumero(
  manager: Pick<EntityManager, 'query'>
): Promise<string> {
  try {
    return await reserveNextPurchaseBatchNumeroWithSequence(manager);
  } catch (error) {
    void error;
  }

  const result = await manager.query(
    'SELECT COALESCE(MAX("numero_global"), $1) AS "max" FROM "purchase_batch"',
    [PURCHASE_BATCH_SERIE_INICIAL - 1]
  );

  const currentMax = Number(
    result?.[0]?.max ?? PURCHASE_BATCH_SERIE_INICIAL - 1
  );

  return String(Math.max(currentMax + 1, PURCHASE_BATCH_SERIE_INICIAL));
}

/**
 * Expone "formatPurchaseBatchReferencia" en smart-economat-backend (Nest).
 * @undefined {string} numero - Entrada efectiva esperada por el contrato.
 * @undefined {string} Datos efectivos después de ejecutar la operación.
 */
export const formatPurchaseBatchReferencia = (numero: string): string => {
  const numeroTexto = String(numero).trim();
  return `LC-${numeroTexto.padStart(6, '0')}`;
};

export { PURCHASE_BATCH_SERIE_INICIAL };
