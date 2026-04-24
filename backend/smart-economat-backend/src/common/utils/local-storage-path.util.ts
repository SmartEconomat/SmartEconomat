import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

/** @description Default primary upload directory, relative to the process working directory. */
const DEFAULT_PRIMARY_PATH = './uploads';

/** @description Fallback upload directory used when the primary path is not writable. */
const DEFAULT_FALLBACK_PATH = './uploads_runtime';

/**
 * @description Checks whether a directory can be used for file storage. Attempts to
 * create the directory (including parents) and verifies write + execute permissions.
 * Also tries to set `0o775` permissions on the directory, silently ignoring any
 * permission-change errors (e.g. when running as a non-owner).
 * @param directory - The absolute or relative directory path to test.
 * @returns `true` if the directory is writable and executable; `false` otherwise.
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
 * @description Resolves the first writable local storage path from a prioritised list
 * of candidates: the caller-supplied `configuredPath`, then `./uploads`, then
 * `./uploads_runtime`, and finally a path inside the OS temporary directory.
 * Each candidate is tested with {@link canUseDirectory} before being accepted.
 * @param configuredPath - Optional preferred storage path (e.g. from an environment variable).
 *   Whitespace-only strings are ignored and the default primary path is used instead.
 * @returns The first writable directory path found in the candidate list.
 * @throws {Error} If none of the candidate paths are writable.
 * @example
 * const uploadDir = resolveWritableLocalStoragePath(process.env.UPLOAD_PATH);
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
