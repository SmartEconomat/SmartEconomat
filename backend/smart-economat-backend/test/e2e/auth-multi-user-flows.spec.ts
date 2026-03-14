import { existsSync } from 'node:fs';
import { join } from 'node:path';

describe('Auth multi-user flows suite registration', () => {
  it('keeps the real multi-user e2e suite discoverable', () => {
    const realSuitePath = join(__dirname, 'auth-multi-user-flows.e2e-spec.ts');

    expect(existsSync(realSuitePath)).toBe(true);
  });
});
