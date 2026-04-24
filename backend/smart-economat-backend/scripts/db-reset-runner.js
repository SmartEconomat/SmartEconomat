#!/usr/bin/env node

const { existsSync } = require('node:fs');
const { resolve } = require('node:path');
const { spawnSync } = require('node:child_process');

function runCommand(command, args) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    env: process.env,
  });

  if (result.error) {
    throw result.error;
  }

  if (typeof result.status === 'number' && result.status !== 0) {
    process.exit(result.status);
  }
}

function runTsReset(cwd) {
  const tsNodeBin = resolve(cwd, 'node_modules/.bin/ts-node');
  const typeormCliPath = resolve(cwd, 'node_modules/typeorm/cli.js');
  const typeormConfigPath = 'src/config/typeorm.config.ts';

  runCommand(tsNodeBin, [
    '-r',
    'tsconfig-paths/register',
    typeormCliPath,
    'schema:drop',
    '-d',
    typeormConfigPath,
  ]);

  runCommand(tsNodeBin, [
    '-r',
    'tsconfig-paths/register',
    typeormCliPath,
    'schema:sync',
    '-d',
    typeormConfigPath,
  ]);
}

async function runDistReset(cwd) {
  const configPath = resolve(cwd, 'dist/config/typeorm.config.js');
  const appDataSource = require(configPath).default;

  await appDataSource.initialize();

  try {
    await appDataSource.dropDatabase();
    await appDataSource.synchronize();
    console.log(
      '[db-reset-runner] schema:drop + schema:sync ejecutados en dist'
    );
  } finally {
    if (appDataSource.isInitialized) {
      await appDataSource.destroy();
    }
  }
}

async function runDbReset() {
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'development';
  }

  const cwd = process.cwd();
  const tsNodeBin = resolve(cwd, 'node_modules/.bin/ts-node');
  const typeormCliPath = resolve(cwd, 'node_modules/typeorm/cli.js');
  const tsConfigPath = resolve(cwd, 'src/config/typeorm.config.ts');
  const distConfigPath = resolve(cwd, 'dist/config/typeorm.config.js');

  if (
    existsSync(tsNodeBin) &&
    existsSync(typeormCliPath) &&
    existsSync(tsConfigPath)
  ) {
    runTsReset(cwd);
    return;
  }

  if (existsSync(distConfigPath)) {
    await runDistReset(cwd);
    return;
  }

  console.error(
    '[db-reset-runner] No se encontro forma de resetear BD (ni CLI TS ni config dist).'
  );
  process.exit(1);
}

runDbReset().catch((error) => {
  console.error('[db-reset-runner] Error inesperado:', error);
  process.exit(1);
});
