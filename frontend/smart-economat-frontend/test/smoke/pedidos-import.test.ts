import { describe, it, expect } from 'vitest';

describe('smoke: import Pedidos page', () => {
  it('imports src/pages/Pedidos without hanging', async () => {
    await import('../../src/pages/Pedidos');
    expect(true).toBe(true);
  }, 120_000);
});
