import { describe, expect, it } from '@jest/globals';

import {
  parseSeedBootstrapOverwriteExistingAdminPassword,
  resolveBootstrapAdminUsersFromEnv,
  resolveMassiveSeedFixedAdminCredentials,
} from 'src/seeders/bootstrap-admin-users.seed';

describe('parseSeedBootstrapOverwriteExistingAdminPassword', () => {
  it('sin variable: nunca sobrescribe (false) salvo orden explícita', () => {
    expect(
      parseSeedBootstrapOverwriteExistingAdminPassword({
        NODE_ENV: 'production',
      })
    ).toBe(false);
    expect(
      parseSeedBootstrapOverwriteExistingAdminPassword({
        NODE_ENV: 'development',
      })
    ).toBe(false);
    expect(
      parseSeedBootstrapOverwriteExistingAdminPassword({ NODE_ENV: 'test' })
    ).toBe(false);
  });

  it('acepta true/1/yes en distintas mayúsculas', () => {
    expect(
      parseSeedBootstrapOverwriteExistingAdminPassword({
        SEED_BOOTSTRAP_OVERWRITE_EXISTING_ADMIN_PASSWORD: 'TRUE',
      })
    ).toBe(true);
    expect(
      parseSeedBootstrapOverwriteExistingAdminPassword({
        SEED_BOOTSTRAP_OVERWRITE_EXISTING_ADMIN_PASSWORD: '1',
      })
    ).toBe(true);
    expect(
      parseSeedBootstrapOverwriteExistingAdminPassword({
        SEED_BOOTSTRAP_OVERWRITE_EXISTING_ADMIN_PASSWORD: ' yes ',
      })
    ).toBe(true);
  });

  it('permite false explícito aunque NODE_ENV no sea production', () => {
    expect(
      parseSeedBootstrapOverwriteExistingAdminPassword({
        NODE_ENV: 'development',
        SEED_BOOTSTRAP_OVERWRITE_EXISTING_ADMIN_PASSWORD: 'false',
      })
    ).toBe(false);
  });
});

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

  it('prioriza SEED_BOOTSTRAP_ADMIN_PASSWORD cuando no hay temporales dedicadas', () => {
    const users = resolveBootstrapAdminUsersFromEnv({
      NODE_ENV: 'development',
      SEED_BOOTSTRAP_ADMIN_PASSWORD: 'clave-compartida-seed',
    });
    expect(users[0]?.tempPassword).toBe('clave-compartida-seed');
    expect(users[1]?.tempPassword).toBe('clave-compartida-seed');

    const fixed = resolveMassiveSeedFixedAdminCredentials({
      NODE_ENV: 'development',
      SEED_BOOTSTRAP_ADMIN_PASSWORD: 'clave-compartida-seed',
    });
    expect(fixed.superAdmin.password).toBe('clave-compartida-seed');
    expect(fixed.admin.password).toBe('clave-compartida-seed');
  });

  it('falla en produccion sin passwords temporales', () => {
    expect(() =>
      resolveBootstrapAdminUsersFromEnv({ NODE_ENV: 'production' })
    ).toThrow(/credenciales temporales/i);
  });
});
