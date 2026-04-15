/**
 * @module AppVersionHelper
 * Resolves the running application version from `package.json` or the npm
 * lifecycle environment variable `npm_package_version`.
 *
 * Resolution order:
 * 1. `process.env.npm_package_version` (set automatically when launched via npm scripts)
 * 2. The `version` field read from `package.json` at the current working directory
 * 3. Fallback literal `'1.0.0'` if the file cannot be read or parsed
 */

import { readFileSync } from 'fs';
import { join } from 'path';

/** Intermediate mutable variable used during module initialisation. */
let version = '1.0.0';

try {
  const packageJsonPath = join(process.cwd(), 'package.json');
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
  version = packageJson.version || '1.0.0';
} catch {
  version = '1.0.0';
}

/**
 * The resolved application version string.
 *
 * Populated from `npm_package_version` if available (preferred when running via
 * npm scripts), otherwise from the `version` field in `package.json`, and falls
 * back to `'1.0.0'` if neither source is accessible.
 *
 * @constant {string}
 */
export const APP_VERSION = process.env.npm_package_version || version;
