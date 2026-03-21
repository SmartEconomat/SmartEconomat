import { describe, expect, it, vi } from 'vitest';
import { getJwtPayload, isJwtUsable } from '../../../src/utils/auth/jwtUtils';

const createToken = (payload: Record<string, unknown>) => {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.signature`;
};

describe('jwtUtils', () => {
  it('returns payload for a well-formed token', () => {
    const token = createToken({ sub: 'user-1', exp: 9999999999 });

    expect(getJwtPayload(token)).toMatchObject({ sub: 'user-1' });
  });

  it('rejects expired tokens', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-01T00:00:00Z'));

    const expiredToken = createToken({ exp: 1735689599 });

    expect(isJwtUsable(expiredToken)).toBe(false);

    vi.useRealTimers();
  });

  it('rejects malformed tokens', () => {
    expect(isJwtUsable('not-a-jwt')).toBe(false);
  });
});
