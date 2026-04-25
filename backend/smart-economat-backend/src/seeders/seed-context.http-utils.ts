import { SEED_REFERENCE_DATE } from './deterministic.seed-data';

/**
 * @description Custom error class for HTTP failures that occur during seeder HTTP requests.
 * Carries the HTTP status code, a retriable flag, and an optional `Retry-After` delay
 * so that the SeedContext retry loop can make informed back-off decisions.
 */
export class HttpSeedRequestError extends Error {
  /**
   * @description Creates a new HttpSeedRequestError.
   * @param {number} status - HTTP response status code (e.g. 429, 500).
   * @param {string} message - Human-readable error message.
   * @param {boolean} retriable - Whether the request should be retried.
   * @param {number} [retryAfterMs] - Optional milliseconds to wait before retrying (from `Retry-After` header).
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
 * @description Type guard that checks whether a parsed API response is wrapped in a
 * `{ data: ... }` envelope as returned by the SmartEconomat `TransformInterceptor`.
 * @param {unknown} value - Parsed response body to check.
 * @returns {value is { data: unknown }} `true` if the value has a `data` property.
 */
export function hasDataEnvelope(value: unknown): value is { data: unknown } {
  return !!value && typeof value === 'object' && 'data' in value;
}

/**
 * @description Reads and parses the body of a Fetch API Response based on its `Content-Type`.
 * - `application/json` → parsed JSON object.
 * - `application/pdf` or Office `xlsx` → `{ raw: 'binary:<bytes>' }` summary.
 * - Other content types → raw text string.
 * - Empty or missing content type → `null`.
 * @param {Response} response - Fetch API Response whose body has not yet been consumed.
 * @returns {Promise<Record<string, unknown> | string | null>} Parsed body representation.
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
 * @description Computes the back-off delay in milliseconds for a given retry attempt
 * using exponential back-off with a deterministic jitter term.
 * The result is capped at `backoffMaxMs`.
 * @param {number} backoffBaseMs - Base delay in milliseconds (used as the multiplier for `2^attempt`).
 * @param {number} backoffMaxMs - Maximum allowed delay in milliseconds.
 * @param {number} attempt - Zero-based retry attempt index.
 * @returns {number} Computed back-off delay in milliseconds.
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
 * @description Parses the value of a `Retry-After` HTTP response header into milliseconds.
 * Accepts both a numeric seconds value (e.g. `"30"`) and an HTTP-date string
 * (e.g. `"Wed, 21 Oct 2026 07:28:00 GMT"`). Returns `undefined` for unparseable values.
 * @param {string | null} headerValue - Raw `Retry-After` header value, or `null` if absent.
 * @returns {number | undefined} Non-negative milliseconds to wait, or `undefined` if not parseable.
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
 * @description Converts an arbitrary value to a string safe for log output.
 * - `undefined` → `'undefined'`.
 * - Strings are returned as-is.
 * - All other values are JSON-serialized; unserializable values yield `'[unserializable]'`.
 * @param {unknown} value - Value to stringify.
 * @returns {string} A string representation of the value.
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
