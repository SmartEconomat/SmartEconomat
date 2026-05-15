import { afterEach, describe, expect, it, vi } from 'vitest';
import { generateIdempotencyKey } from '../../src/utils/idempotency';

describe('idempotency helper', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('usa crypto.randomUUID cuando esta disponible', () => {
    const expected = '01961496-cc99-7d4d-89f8-e7ac15e809f0';
    const randomUUID = vi.fn(() => expected);

    vi.stubGlobal('crypto', {
      randomUUID,
    } as unknown as Crypto);

    expect(generateIdempotencyKey()).toBe(expected);
    expect(randomUUID).toHaveBeenCalledTimes(1);
  });

  it('genera UUID v4 valido cuando randomUUID no existe', () => {
    vi.stubGlobal('crypto', {
      getRandomValues: (array: Uint8Array) => {
        array.set(
          Uint8Array.from(Array.from({ length: array.length }, (_, i) => i + 1))
        );
        return array;
      },
    } as unknown as Crypto);

    const value = generateIdempotencyKey();

    expect(value).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
    );
  });
});
