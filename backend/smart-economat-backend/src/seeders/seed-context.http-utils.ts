export class HttpSeedRequestError extends Error {
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

export function hasDataEnvelope(value: unknown): value is { data: unknown } {
  return !!value && typeof value === 'object' && 'data' in value;
}

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

export function computeSeedBackoffMs(
  backoffBaseMs: number,
  backoffMaxMs: number,
  attempt: number
): number {
  const exponential = backoffBaseMs * 2 ** attempt;
  const jitter = Math.floor(Math.random() * backoffBaseMs);
  return Math.min(backoffMaxMs, exponential + jitter);
}

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

  return Math.max(0, targetTime - Date.now());
}

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
