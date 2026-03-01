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
    'npx erdia build -d tools/erd/erd-datasource.ts --format image --image-format png --background-color white --viewport-width 3840 --viewport-height 2160 --width 3840px --puppeteer-config tools/erd/puppeteer-config.json',
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
