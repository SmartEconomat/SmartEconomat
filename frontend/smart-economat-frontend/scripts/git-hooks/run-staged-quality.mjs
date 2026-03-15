/* global console, process */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ESLint } from 'eslint';
import prettier from 'prettier';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../../..');
const frontendRoot = path.resolve(__dirname, '../..');
const frontendPrefix = path
  .relative(repoRoot, frontendRoot)
  .split(path.sep)
  .join('/');
const isDryRun = process.argv.includes('--dry-run');

function normalizePath(filePath) {
  return filePath.replace(/\\/g, '/');
}

function run(command, args, cwd, label) {
  const printable = [command, ...args].join(' ');

  if (isDryRun) {
    console.log(`[dry-run] ${label}: ${printable}`);
    return;
  }

  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
    env: process.env,
  });

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

function getStagedFiles() {
  const result = spawnSync(
    'git',
    ['diff', '--cached', '--name-only', '--diff-filter=ACMR'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
      env: process.env,
    }
  );

  if (result.status !== 0) {
    process.stderr.write(result.stderr || 'Error reading staged files.\n');
    process.exit(result.status || 1);
  }

  return result.stdout
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map(normalizePath);
}

async function runPrettier(files) {
  if (files.length === 0) {
    return;
  }

  console.log(`  - prettier --write: ${files.length} files`);

  for (const relativeFile of files) {
    const absoluteFile = path.join(frontendRoot, relativeFile);
    const fileInfo = await prettier.getFileInfo(absoluteFile, {
      ignorePath: path.join(frontendRoot, '.prettierignore'),
    });

    if (fileInfo.ignored || fileInfo.inferredParser == null) {
      continue;
    }

    if (isDryRun) {
      console.log(`[dry-run] prettier --write: ${relativeFile}`);
      continue;
    }

    const source = fs.readFileSync(absoluteFile, 'utf8');
    const resolvedConfig = (await prettier.resolveConfig(absoluteFile)) || {};
    const formatted = await prettier.format(source, {
      ...resolvedConfig,
      filepath: absoluteFile,
    });

    if (formatted !== source) {
      fs.writeFileSync(absoluteFile, formatted, 'utf8');
    }
  }
}

async function runEslint(files) {
  if (files.length === 0) {
    return;
  }

  if (isDryRun) {
    console.log(`[dry-run] eslint --fix: ${files.join(', ')}`);
    return;
  }

  const eslint = new ESLint({
    cwd: frontendRoot,
    fix: true,
  });

  const lintableFiles = [];
  for (const file of files) {
    if (!(await eslint.isPathIgnored(file))) {
      lintableFiles.push(file);
    }
  }

  if (lintableFiles.length === 0) {
    console.log('  - eslint --fix: no lintable files');
    return;
  }

  console.log(`  - eslint --fix: ${lintableFiles.length} files`);

  const results = await eslint.lintFiles(lintableFiles);
  await ESLint.outputFixes(results);

  const formatter = await eslint.loadFormatter('stylish');
  const output = formatter.format(results);
  if (output.trim()) {
    process.stdout.write(output);
  }

  const hasErrors = results.some((result) => result.errorCount > 0);
  if (hasErrors) {
    process.exit(1);
  }
}

async function main() {
  const stagedRepoFiles = getStagedFiles();
  const frontendRepoFiles = stagedRepoFiles.filter((file) =>
    file.startsWith(`${frontendPrefix}/`)
  );

  if (frontendRepoFiles.length === 0) {
    console.log('  - staged quality: no frontend staged files');
    return;
  }

  const frontendRelativeFiles = frontendRepoFiles
    .map((file) => file.slice(frontendPrefix.length + 1))
    .filter((file) => fs.existsSync(path.join(frontendRoot, file)));

  const codeFiles = frontendRelativeFiles.filter((file) =>
    /\.(ts|tsx|js|jsx)$/i.test(file)
  );
  const formatFiles = frontendRelativeFiles.filter((file) =>
    /\.(ts|tsx|js|jsx|json|md|css|scss|html)$/i.test(file)
  );

  console.log(
    `  - staged quality: ${frontendRelativeFiles.length} frontend files`
  );

  if (formatFiles.length > 0) {
    await runPrettier(formatFiles);
  }

  if (codeFiles.length > 0) {
    await runEslint(codeFiles);
  }

  console.log(`  - git add: ${frontendRepoFiles.length} files`);
  run('git', ['add', '--', ...frontendRepoFiles], repoRoot, 'git add');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
