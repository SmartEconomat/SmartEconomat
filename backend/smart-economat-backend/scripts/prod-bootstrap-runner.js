#!/usr/bin/env node

const { existsSync } = require('node:fs');
const { resolve } = require('node:path');

const MAX_INIT_ATTEMPTS = 30;
const RETRY_DELAY_MS = 2000;

function sleep(ms) {
  return new Promise((resolvePromise) => {
    setTimeout(resolvePromise, ms);
  });
}

function parseBooleanEnv(value, defaultValue) {
  if (typeof value !== 'string') {
    return defaultValue;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === 'true' || normalized === '1' || normalized === 'yes') {
    return true;
  }

  if (normalized === 'false' || normalized === '0' || normalized === 'no') {
    return false;
  }

  return defaultValue;
}

function getDistDataSource(cwd) {
  const configPath = resolve(cwd, 'dist/config/typeorm.config.js');

  if (!existsSync(configPath)) {
    throw new Error(
      `[prod-bootstrap-runner] No se encontro config dist en ${configPath}`
    );
  }

  const loaded = require(configPath);
  const dataSource = loaded.default || loaded.AppDataSource;

  if (!dataSource || typeof dataSource.initialize !== 'function') {
    throw new Error(
      '[prod-bootstrap-runner] DataSource invalido en dist/config/typeorm.config.js'
    );
  }

  return dataSource;
}

async function initializeWithRetry(dataSource) {
  let lastError;

  for (let attempt = 1; attempt <= MAX_INIT_ATTEMPTS; attempt++) {
    try {
      await dataSource.initialize();
      return;
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      console.warn(
        `[prod-bootstrap-runner] Intento ${attempt}/${MAX_INIT_ATTEMPTS} sin conexion a DB: ${message}`
      );
      await sleep(RETRY_DELAY_MS);
    }
  }

  throw lastError;
}

async function runMigrationsIfEnabled(dataSource) {
  const migrationsEnabled = parseBooleanEnv(
    process.env.STARTUP_RUN_MIGRATIONS,
    true
  );

  if (!migrationsEnabled) {
    console.warn(
      '[prod-bootstrap-runner] STARTUP_RUN_MIGRATIONS=false, se omite migration run al arranque.'
    );
    return;
  }

  const executedMigrations = await dataSource.runMigrations({
    transaction: 'all',
  });

  if (executedMigrations.length === 0) {
    console.log('[prod-bootstrap-runner] No hay migraciones pendientes.');
    return;
  }

  const migrationNames = executedMigrations
    .map((migration) => migration.name)
    .join(', ');
  console.log(
    `[prod-bootstrap-runner] Migraciones aplicadas correctamente: ${migrationNames}`
  );
}

async function runBootstrap() {
  const cwd = process.cwd();
  const dataSource = getDistDataSource(cwd);

  await initializeWithRetry(dataSource);

  try {
    await runMigrationsIfEnabled(dataSource);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

runBootstrap().catch((error) => {
  console.error('[prod-bootstrap-runner] Error inesperado:', error);
  process.exit(1);
});
