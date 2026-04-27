import { SEED_REFERENCE_DATE } from './deterministic.seed-data';

/**
 * Documentación en español.
 */
export class HttpSeedRequestError extends Error {
  /**
   * Documentación en español.
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
 * Documentación en español.
 */
export function hasDataEnvelope(value: unknown): value is { data: unknown } {
  return !!value && typeof value === 'object' && 'data' in value;
}

/**
 * Documentación en español.
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
 * Documentación en español.
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
 * Documentación en español.
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
 * Documentación en español.
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
