import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

/**
 * Documentación en español.
 */
const DEFAULT_PRIMARY_PATH = './uploads';

/**
 * Documentación en español.
 */
const DEFAULT_FALLBACK_PATH = './uploads_runtime';

/**
 * Documentación en español.
 */
function canUseDirectory(directory: string): boolean {
  try {
    fs.mkdirSync(directory, { recursive: true });

    try {
      fs.chmodSync(directory, 0o775);
    } catch (error) {
      void error;
    }

    fs.accessSync(directory, fs.constants.W_OK | fs.constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Documentación en español.
 */
export function resolveWritableLocalStoragePath(
  configuredPath?: string
): string {
  const normalizedConfigured = configuredPath?.trim();

  const candidates = [
    normalizedConfigured && normalizedConfigured.length > 0
      ? normalizedConfigured
      : DEFAULT_PRIMARY_PATH,
    DEFAULT_FALLBACK_PATH,
    path.join(os.tmpdir(), 'smart-economat-uploads'),
  ];

  for (const candidate of candidates) {
    if (canUseDirectory(candidate)) {
      return candidate;
    }
  }

  throw new Error(
    `No writable local storage path found. Tried: ${candidates.join(', ')}`
  );
}
