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

function runScript(scriptName, index, total) {
  console.log(`  - [${index}/${total}] npm run ${scriptName}`);

  const result = spawnSync('npm', ['run', scriptName], {
    cwd: frontendRoot,
    stdio: 'inherit',
    env: process.env,
  });

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

function main() {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const scripts = Object.keys(packageJson.scripts ?? {})
    .filter(isRunnableTestScript)
    .sort(sortScripts);

  if (scripts.length === 0) {
    console.log('  - No runnable frontend test scripts found');
    return;
  }

  scripts.forEach((scriptName, index) => {
    runScript(scriptName, index + 1, scripts.length);
  });
}

main();
