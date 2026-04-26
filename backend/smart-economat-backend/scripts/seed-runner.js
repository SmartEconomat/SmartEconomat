#!/usr/bin/env node

const { existsSync } = require('node:fs');
const { resolve } = require('node:path');
const { spawnSync } = require('node:child_process');

/** Ruta al CLI JS de ts-node (spawn directo de .cmd vía npx falla con EINVAL en Windows + Node reciente). */
function resolveTsNodeBinJs(cwd) {
  return resolve(cwd, 'node_modules/ts-node/dist/bin.js');
}

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

function runSeed() {
  const cwd = process.cwd();
  const tsCliPath = resolve(cwd, 'src/seeders/seed.cli.ts');
  const distCliPath = resolve(cwd, 'dist/seeders/seed.cli.js');
  const passthroughArgs = process.argv.slice(2);

  const tsNodeBinJs = resolveTsNodeBinJs(cwd);
  if (existsSync(tsCliPath) && existsSync(tsNodeBinJs)) {
    runCommand(process.execPath, [
      tsNodeBinJs,
      '-r',
      'tsconfig-paths/register',
      '-r',
      'dotenv/config',
      tsCliPath,
      ...passthroughArgs,
    ]);
    return;
  }

  if (existsSync(tsCliPath)) {
    console.error(
      '[seed-runner] Falta ts-node. Ejecuta npm install en smart-economat-backend.'
    );
    process.exit(1);
  }

  if (existsSync(distCliPath)) {
    runCommand(process.execPath, [distCliPath, ...passthroughArgs]);
    return;
  }

  console.error(
    '[seed-runner] No se encontro entrypoint de seeder (ni TS ni dist).'
  );
  process.exit(1);
}

runSeed();
