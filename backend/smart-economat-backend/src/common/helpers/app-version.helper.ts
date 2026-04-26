/**
 * Documentación en español.
 */

import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Documentación en español.
 */
let version = '1.0.0';

try {
  const packageJsonPath = join(process.cwd(), 'package.json');
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
  version = packageJson.version || '1.0.0';
} catch {
  version = '1.0.0';
}

/**
 * Documentación en español.
 */
export const APP_VERSION = process.env.npm_package_version || version;
