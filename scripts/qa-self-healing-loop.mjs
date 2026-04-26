#!/usr/bin/env node
/* global console, process */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

const phases = [
  {
    id: 'backend',
    cwd: path.join(repoRoot, 'backend', 'smart-economat-backend'),
    commands: ['npm run build', 'npm run lint', 'npm run test:e2e'],
  },
  {
    id: 'frontend',
    cwd: path.join(repoRoot, 'frontend', 'smart-economat-frontend'),
    commands: ['npm run build', 'npm run lint', 'npm run test', 'npm run test:e2e'],
  },
  {
    id: 'installer',
    cwd: path.join(repoRoot, 'ElectronInstaller'),
    commands: ['npm run build:app', 'npm run lint', 'npm run test', 'npm run test:e2e'],
  },
];

const loopCount = Number(process.env.QA_LOOP_COUNT ?? '1');
const continueOnError = process.env.QA_CONTINUE_ON_ERROR === 'true';

function runCommand(command, cwd) {
  const result = spawnSync(command, {
    cwd,
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      NODE_ENV: 'test',
      CI: process.env.CI ?? '1',
    },
  });

  return result.status ?? 1;
}

function main() {
  if (!Number.isFinite(loopCount) || loopCount <= 0) {
    console.error('QA_LOOP_COUNT debe ser un entero positivo');
    process.exit(1);
  }

  for (let i = 1; i <= loopCount; i += 1) {
    console.log(`\n=== QA LOOP ${i}/${loopCount} ===`);
    for (const phase of phases) {
      console.log(`\n[${phase.id}]`);
      for (const command of phase.commands) {
        console.log(`> ${command}`);
        const exitCode = runCommand(command, phase.cwd);
        if (exitCode !== 0) {
          console.error(
            `Fallo en ${phase.id} con comando "${command}" (exit ${exitCode})`,
          );
          if (!continueOnError) {
            process.exit(exitCode);
          }
        }
      }
    }
  }
}

main();
