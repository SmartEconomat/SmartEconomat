const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const prettier = require('prettier');
const { ESLint } = require('eslint');
const { processFiles } = require('./remove-comments');

const repoRoot = path.resolve(__dirname, '../../../..');
const backendRoot = path.resolve(__dirname, '../..');
const backendPrefix = path
  .relative(repoRoot, backendRoot)
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
    const absoluteFile = path.join(backendRoot, relativeFile);
    const fileInfo = await prettier.getFileInfo(absoluteFile, {
      ignorePath: path.join(backendRoot, '.prettierignore'),
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
    cwd: backendRoot,
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
  const backendRepoFiles = stagedRepoFiles.filter((file) =>
    file.startsWith(`${backendPrefix}/`)
  );

  if (backendRepoFiles.length === 0) {
    console.log('  - staged quality: no backend staged files');
    return;
  }

  const backendRelativeFiles = backendRepoFiles
    .map((file) => file.slice(backendPrefix.length + 1))
    .filter((file) => fs.existsSync(path.join(backendRoot, file)));

  const codeFiles = backendRelativeFiles.filter((file) =>
    /\.(ts|js)$/i.test(file)
  );
  const formatFiles = backendRelativeFiles.filter((file) =>
    /\.(ts|js|json|md)$/i.test(file)
  );

  console.log(
    `  - staged quality: ${backendRelativeFiles.length} backend files`
  );

  if (codeFiles.length > 0) {
    console.log(`  - remove-comments: ${codeFiles.length} files`);
    if (isDryRun) {
      console.log(`[dry-run] remove-comments: ${codeFiles.join(', ')}`);
    } else {
      processFiles(codeFiles);
    }
  }

  if (formatFiles.length > 0) {
    await runPrettier(formatFiles);
  }

  if (codeFiles.length > 0) {
    await runEslint(codeFiles);
  }

  console.log(`  - git add: ${backendRepoFiles.length} files`);
  run('git', ['add', '--', ...backendRepoFiles], repoRoot, 'git add');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
