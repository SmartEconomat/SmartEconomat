import { execSync } from 'child_process';
import { existsSync, renameSync, unlinkSync } from 'fs';
import { join } from 'path';

const rootDir = process.cwd();
const filesToDelete = ['erdiadb.json', 'index.html', 'mermaid.html'];
const outputDir = join(rootDir, 'tools/erd');
const sourcePngFile = join(rootDir, 'smart-economat-backend.png');
const sourceSvgFile = join(rootDir, 'smart-economat-backend.svg');
const destPngFile = join(outputDir, 'erd.png');
const destSvgFile = join(outputDir, 'erd.svg');
const viewportWidth = Number(process.env.ERD_VIEWPORT_WIDTH ?? 8192);
const viewportHeight = Number(process.env.ERD_VIEWPORT_HEIGHT ?? 4608);
const diagramWidth = process.env.ERD_WIDTH ?? `${viewportWidth}px`;

function runErdia(imageFormat: 'png' | 'svg'): void {
  const command = [
    'npx erdia build',
    '-d tools/erd/erd-datasource.ts',
    '--format image',
    `--image-format ${imageFormat}`,
    '--background-color white',
    `--viewport-width ${viewportWidth}`,
    `--viewport-height ${viewportHeight}`,
    `--width ${diagramWidth}`,
    '--puppeteer-config tools/erd/puppeteer-config.json',
    '--prettier-config tools/erd/puppeteer-config.json',
  ].join(' ');

  execSync(command, {
    stdio: 'inherit',
    env: { ...process.env, NODE_OPTIONS: '-r ts-node/register' },
  });
}

function moveIfExists(sourceFile: string, destFile: string): void {
  if (!existsSync(sourceFile)) {
    return;
  }

  if (existsSync(destFile)) {
    unlinkSync(destFile);
  }

  renameSync(sourceFile, destFile);
  console.log(`ERD generated at: ${destFile}`);
}

try {
  console.log(
    `Generating high quality ERD (${diagramWidth}, viewport ${viewportWidth}x${viewportHeight})...`
  );

  runErdia('svg');
  moveIfExists(sourceSvgFile, destSvgFile);

  runErdia('png');
  moveIfExists(sourcePngFile, destPngFile);

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
