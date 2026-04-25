import {
  assertSchemaReadyForAlignment,
  parseBooleanEnv,
} from '../../scripts/prod-bootstrap-guards.js';

describe('parseBooleanEnv', () => {
  it('returns default when value is not a string', () => {
    expect(parseBooleanEnv(undefined, true)).toBe(true);
    expect(parseBooleanEnv(undefined, false)).toBe(false);
  });

  it('parses true-like strings', () => {
    expect(parseBooleanEnv('true', false)).toBe(true);
    expect(parseBooleanEnv('TRUE', false)).toBe(true);
    expect(parseBooleanEnv('1', false)).toBe(true);
    expect(parseBooleanEnv('yes', false)).toBe(true);
  });

  it('parses false-like strings', () => {
    expect(parseBooleanEnv('false', true)).toBe(false);
    expect(parseBooleanEnv('0', true)).toBe(false);
    expect(parseBooleanEnv('no', true)).toBe(false);
  });

  it('returns default for unknown strings', () => {
    expect(parseBooleanEnv('maybe', true)).toBe(true);
    expect(parseBooleanEnv('', false)).toBe(false);
  });
});

describe('assertSchemaReadyForAlignment', () => {
  const originalEnv = process.env.STARTUP_RUN_MIGRATIONS;

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.STARTUP_RUN_MIGRATIONS;
    } else {
      process.env.STARTUP_RUN_MIGRATIONS = originalEnv;
    }
  });

  it('resolves when purchase_batch exists', async () => {
    const dataSource = {
      query: jest.fn().mockResolvedValue([{ exists: true }]),
    };

    await expect(
      assertSchemaReadyForAlignment(
        dataSource as unknown as import('typeorm').DataSource
      )
    ).resolves.toBeUndefined();

    expect(dataSource.query).toHaveBeenCalledTimes(1);
    expect(String(dataSource.query.mock.calls[0][0])).toContain(
      'purchase_batch'
    );
  });

  it('throws actionable error when table missing and migrations disabled', async () => {
    process.env.STARTUP_RUN_MIGRATIONS = 'false';
    const dataSource = {
      query: jest.fn().mockResolvedValue([{ exists: false }]),
    };

    await expect(
      assertSchemaReadyForAlignment(
        dataSource as unknown as import('typeorm').DataSource
      )
    ).rejects.toThrow(/purchase_batch/);

    await expect(
      assertSchemaReadyForAlignment(
        dataSource as unknown as import('typeorm').DataSource
      )
    ).rejects.toThrow(/STARTUP_RUN_MIGRATIONS=false/);
  });

  it('throws different hint when table missing but migrations expected to run', async () => {
    delete process.env.STARTUP_RUN_MIGRATIONS;
    const dataSource = {
      query: jest.fn().mockResolvedValue([{ exists: false }]),
    };

    await expect(
      assertSchemaReadyForAlignment(
        dataSource as unknown as import('typeorm').DataSource
      )
    ).rejects.toThrow(/tabla migrations/);
  });
});
