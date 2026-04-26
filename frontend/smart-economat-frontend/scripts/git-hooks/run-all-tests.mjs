/* global console, process */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(__dirname, '../..');
const packageJsonPath = path.join(frontendRoot, 'package.json');

function isRunnableTestScript(scriptName) {
  if (!/^test(?::.+)?$/i.test(scriptName)) {
    return false;
  }

  return !/:(watch|ui|debug|dev)$/i.test(scriptName);
}

/** Playwright E2E abre el servidor del reporte y bloquea el commit; se omite con SKIP_E2E_IN_HOOKS=1 (pre-commit). */
function isExcludedFromGitHook(scriptName) {
  if (process.env.SKIP_E2E_IN_HOOKS !== '1') {
    return false;
  }
  return /e2e/i.test(scriptName);
}

function sortScripts(a, b) {
  const priority = new Map([
    ['test', 0],
    ['test:unit', 1],
    ['test:component', 2],
    ['test:integration', 3],
    ['test:e2e', 4],
    ['test:coverage', 99],
  ]);

  return (
    (priority.get(a) ?? 50) - (priority.get(b) ?? 50) || a.localeCompare(b)
  );
}

function filterRedundantScripts(scripts) {
  const uniqueScripts = new Set(scripts);

  if (uniqueScripts.has('test') && uniqueScripts.has('test:coverage')) {
    uniqueScripts.delete('test:coverage');
  }

  return Array.from(uniqueScripts).sort(sortScripts);
}

function runScript(scriptName, index, total) {
  console.log(`  - [${index}/${total}] npm run ${scriptName}`);

  const testEnv = {
    ...process.env,
    NODE_ENV: 'test',
  };

  const result = spawnSync('npm', ['run', scriptName], {
    cwd: frontendRoot,
    stdio: 'inherit',
    env: testEnv,
    shell: true,
  });

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

function main() {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const allRunnable = Object.keys(packageJson.scripts ?? {}).filter(
    isRunnableTestScript
  );
  const skippedE2e = allRunnable.filter(isExcludedFromGitHook);
  const scripts = filterRedundantScripts(
    allRunnable.filter((name) => !isExcludedFromGitHook(name))
  );

  if (skippedE2e.length > 0) {
    console.log(
      `  ⏭️ Omitidos en hook (E2E/Playwright): ${skippedE2e.join(', ')}`
    );
  }

  if (scripts.length === 0) {
    console.log('  - No runnable frontend test scripts found');
    return;
  }

  scripts.forEach((scriptName, index) => {
    runScript(scriptName, index + 1, scripts.length);
  });
}

main();
