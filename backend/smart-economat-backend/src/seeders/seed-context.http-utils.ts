import { SEED_REFERENCE_DATE } from './deterministic.seed-data';

/**
 * Representa http seed request error en el sistema.
 */
export class HttpSeedRequestError extends Error {
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  constructor(
    public readonly status: number,
    message: string,
    public readonly retriable: boolean,
    public readonly retryAfterMs?: number
  ) {
    super(message);
    this.name = 'HttpSeedRequestError';
  }
}

/**
 * Determina si data envelope.
 *
 * @param value Parámetro de entrada para la operación.
 * @returns Valor resultante de la operación.
 */
export function hasDataEnvelope(value: unknown): value is { data: unknown } {
  return !!value && typeof value === 'object' && 'data' in value;
}

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
/**
 * Interpreta y normaliza datos de entrada o texto estructurado.
 * @undefined {Response} response - Entrada efectiva esperada por el contrato.
 * @undefined {Promise<string | Record<string, unknown> | null>} Datos efectivos después de ejecutar la operación.
 */
export async function parseSeedResponseBody(
  response: Response
): Promise<Record<string, unknown> | string | null> {
  const contentType = response.headers.get('content-type') || '';

  if (!contentType) {
    return null;
  }

  if (contentType.includes('application/json')) {
    const text = await response.text();
    return text ? (JSON.parse(text) as Record<string, unknown>) : null;
  }

  if (
    contentType.includes('application/pdf') ||
    contentType.includes(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
  ) {
    const buffer = await response.arrayBuffer();
    return { raw: `binary:${buffer.byteLength}` };
  }

  const text = await response.text();
  return text || null;
}

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
/**
 * Expone "computeSeedBackoffMs" en smart-economat-backend (Nest).
 * @undefined {number} backoffBaseMs - Entrada efectiva esperada por el contrato.
 * @undefined {number} backoffMaxMs - Entrada efectiva esperada por el contrato.
 * @undefined {number} attempt - Entrada efectiva esperada por el contrato.
 * @undefined {number} Datos efectivos después de ejecutar la operación.
 */
export function computeSeedBackoffMs(
  backoffBaseMs: number,
  backoffMaxMs: number,
  attempt: number
): number {
  const exponential = backoffBaseMs * 2 ** attempt;
  const safeBase = Math.max(1, backoffBaseMs);
  const jitter = (attempt * 97) % safeBase;
  return Math.min(backoffMaxMs, exponential + jitter);
}

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
/**
 * Interpreta y normaliza datos de entrada o texto estructurado.
 * @undefined {string | null} headerValue - Entrada efectiva esperada por el contrato.
 * @undefined {number | undefined} Datos efectivos después de ejecutar la operación.
 */
export function parseSeedRetryAfterMs(
  headerValue: string | null
): number | undefined {
  if (!headerValue) {
    return undefined;
  }

  const seconds = Number(headerValue);
  if (!Number.isNaN(seconds) && Number.isFinite(seconds)) {
    return Math.max(0, Math.floor(seconds * 1000));
  }

  const targetTime = Date.parse(headerValue);
  if (Number.isNaN(targetTime)) {
    return undefined;
  }

  return Math.max(0, targetTime - SEED_REFERENCE_DATE.getTime());
}

/**
 * Ejecuta la lógica de seed safe stringify dentro del flujo de la aplicación.
 *
 * @param value Parámetro de entrada para la operación.
 * @returns Valor resultante de la operación.
 */
export function seedSafeStringify(value: unknown): string {
  if (value === undefined) {
    return 'undefined';
  }

  if (typeof value === 'string') {
    return value;
  }

  try {
    const json = JSON.stringify(value);
    return json ?? '[unserializable]';
  } catch {
    return '[unserializable]';
  }
}
