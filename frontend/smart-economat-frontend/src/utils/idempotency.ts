const UUID_BYTE_LENGTH = 16;

const fallbackRandomBytes = (length: number): Uint8Array => {
  const bytes = new Uint8Array(length);
  for (let index = 0; index < length; index += 1) {
    bytes[index] = Math.floor(Math.random() * 256);
  }
  return bytes;
};

const getRandomBytes = (length: number): Uint8Array => {
  if (
    typeof globalThis.crypto !== 'undefined' &&
    typeof globalThis.crypto.getRandomValues === 'function'
  ) {
    return globalThis.crypto.getRandomValues(new Uint8Array(length));
  }

  return fallbackRandomBytes(length);
};

const byteToHex = (value: number): string =>
  value.toString(16).padStart(2, '0');

/**
 * Genera una clave de idempotencia en formato UUID.
 * Prioriza randomUUID nativo y aplica fallback con formato UUID v4.
 */
export const generateIdempotencyKey = (): string => {
  if (
    typeof globalThis.crypto !== 'undefined' &&
    typeof globalThis.crypto.randomUUID === 'function'
  ) {
    return globalThis.crypto.randomUUID();
  }

  const bytes = getRandomBytes(UUID_BYTE_LENGTH);

  // Ajusta bits de versión (4) y variante (RFC 4122) para mantener formato UUID válido.
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, byteToHex).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};
