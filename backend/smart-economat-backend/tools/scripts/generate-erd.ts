import { execSync } from 'child_process';
import { existsSync, renameSync, unlinkSync } from 'fs';
import { join } from 'path';

const rootDir = process.cwd();
const filesToDelete = ['erdiadb.json', 'index.html', 'mermaid.html'];
const sourceFile = join(rootDir, 'smart-economat-backend.png');
const destFile = join(rootDir, 'tools/erd/erd.png');

try {
  console.log('Generating ERD...');
  execSync(
    'npx erdia build -d tools/erd/erd-datasource.ts --format image --image-format png --background-color white --viewport-width 8192 --viewport-height 4096 --width 8192px --puppeteer-config tools/erd/puppeteer-config.json --prettier-config tools/erd/puppeteer-config.json',
    {
      stdio: 'inherit',
      env: { ...process.env, NODE_OPTIONS: '-r ts-node/register' },
    }
  );

  if (existsSync(sourceFile)) {
    renameSync(sourceFile, destFile);
    console.log(`ERD generated at: ${destFile}`);
  }

  filesToDelete.forEach((file) => {
    const filePath = join(rootDir, file);
    if (existsSync(filePath)) {
      unlinkSync(filePath);
    }
  });
} catch (error) {
  console.error('Error generating ERD:', error);
  process.exit(1);
}
