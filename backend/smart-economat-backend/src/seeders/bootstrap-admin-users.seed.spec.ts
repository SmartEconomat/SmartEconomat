import { describe, expect, it } from '@jest/globals';

import { resolveBootstrapAdminUsersFromEnv } from './bootstrap-admin-users.seed';

describe('resolveBootstrapAdminUsersFromEnv', () => {
  it('resuelve admin y superadmin por defecto en desarrollo', () => {
    const users = resolveBootstrapAdminUsersFromEnv({
      NODE_ENV: 'development',
    });

    expect(users).toHaveLength(2);
    expect(users[0]?.username).toBe('superadmin');
    expect(users[1]?.username).toBe('admin');
    expect(users[0]?.tempPassword).toMatch(/^[A-Za-z0-9_-]{24}$/);
    expect(users[1]?.tempPassword).toMatch(/^[A-Za-z0-9_-]{24}$/);
  });

  it('falla en produccion sin passwords temporales', () => {
    expect(() =>
      resolveBootstrapAdminUsersFromEnv({ NODE_ENV: 'production' })
    ).toThrow(/credenciales temporales/i);
  });
});
