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

function runSeed() {
  const cwd = process.cwd();
  const tsNodeBin = resolve(cwd, 'node_modules/.bin/ts-node');
  const tsCliPath = resolve(cwd, 'src/seeders/seed.cli.ts');
  const distCliPath = resolve(cwd, 'dist/seeders/seed.cli.js');
  const passthroughArgs = process.argv.slice(2);

  if (existsSync(tsNodeBin) && existsSync(tsCliPath)) {
    runCommand(tsNodeBin, [
      '-r',
      'tsconfig-paths/register',
      '-r',
      'dotenv/config',
      tsCliPath,
      ...passthroughArgs,
    ]);
    return;
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
