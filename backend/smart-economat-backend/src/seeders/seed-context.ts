import { execSync } from 'node:child_process';
import { appendFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import AppDataSource from '../config/typeorm.config';
import { Usuario } from '../modules/usuario/usuario.entity/usuario.entity';
import { rolUsuario, UserStatus } from '../modules/usuario/enums/usuario.enums';
import {
  computeSeedBackoffMs,
  hasDataEnvelope,
  HttpSeedRequestError,
  parseSeedResponseBody,
  parseSeedRetryAfterMs,
  seedSafeStringify,
} from './seed-context.http-utils';
import { seedDateIso } from './deterministic.seed-data';

type SeedCredential = {
  email: string;
  password: string;
};

export type SeedContextConfig = {
  apiBaseUrl?: string;
  requestDelayMs?: number;
  requestTimeoutMs?: number;
  maxConcurrency?: number;
  maxRetries?: number;
  backoffBaseMs?: number;
  backoffMaxMs?: number;
  dockerComposeFile?: string;
  dockerServices?: string[];
  authCandidates?: SeedCredential[];
};

export { HttpSeedRequestError } from './seed-context.http-utils';

/**
 * @description Central orchestration context used by all database seeders.
 * Gestiona HTTP authentication, concurrency-limited API requests with retry/backoff logic,
 * Docker infrastructure lifecycle, shared in-memory state between seeder steps,
 * and structured HTTP event logging to a file.
 *
 * Construct once per seeder run, call `login()` to obtain a JWT, then use the
 * `getJson`, `postJson`, `patchJson`, `putJson`, `deleteJson`, and `postMultipart`
 * helpers to drive the REST API. Call `close()` when the run is finished.
 */
export class SeedContext {
  private static readonly DEFAULT_API_BASE_URL = 'http://localhost:3000/api/v1';
  private static readonly DEFAULT_REQUEST_DELAY_MS = 0;
  private static readonly DEFAULT_REQUEST_TIMEOUT_MS = 60000;
  private static readonly DEFAULT_MAX_CONCURRENCY = 32;
  private static readonly DEFAULT_MAX_RETRIES = 2;
  private static readonly DEFAULT_BACKOFF_BASE_MS = 250;
  private static readonly DEFAULT_BACKOFF_MAX_MS = 6000;
  private static readonly DEFAULT_DOCKER_COMPOSE_FILE =
    '../../../../docker-compose.dev.yml';
  private static readonly DEFAULT_DOCKER_SERVICES = ['db', 'redis', 'backend'];
  private static readonly BACKEND_WAIT_LOG_EVERY_ATTEMPTS = 5;
  private static readonly DEFAULT_AUTH_CANDIDATES: SeedCredential[] = [
    {
      email: 'superadmin@smarteconomat.com',
      password: 'SmartEconomat2026!',
    },
    {
      email: 'superadmin@smarteconomat.com',
      password: 'SmartEconomat2026!',
    },
    {
      email: 'superadmin',
      password: 'SmartEconomat2026!',
    },
    {
      email: 'superadmin',
      password: 'SmartEconomat2026!',
    },
    {
      email: 'superAdmin',
      password: 'SmartEconomat2026!',
    },
    {
      email: 'admin@smarteconomat.com',
      password: 'SmartEconomat2026!',
    },
    {
      email: 'admin@smarteconomat.com',
      password: 'SmartEconomat2026!',
    },
    {
      email: 'admin',
      password: 'SmartEconomat2026!',
    },
    {
      email: 'admin',
      password: 'SmartEconomat2026!',
    },
  ];

  /**
   * @description Resuelve a writable directory for the HTTP event log file, trying several
   * candidate paths in order (`__dirname/logs`, `cwd/logs`, `/tmp/...`).
   * Creates the directory if necessary and writes a header line to verify writability.
   * @returns {string} Absolute path to the initialised log file.
   * @throws {Error} If none of the candidate directories can be created or written to.
   */
  private resolveWritableLogFilePath(): string {
    const candidates = [
      resolve(__dirname, './logs'),
      resolve(process.cwd(), 'logs'),
      '/tmp/smart-economat-seed-logs',
    ];
    const header = `=== SEED HTTP LOG START ${this.nextLogTimestamp()} ===\n`;
    let lastError: unknown;

    for (const logsDir of candidates) {
      try {
        mkdirSync(logsDir, { recursive: true });
        const logFilePath = resolve(logsDir, 'seed-http-log.txt');
        writeFileSync(logFilePath, header, 'utf8');
        return logFilePath;
      } catch (error) {
        lastError = error;
      }
    }

    const message = String(
      lastError instanceof Error ? lastError.message : lastError
    );
    throw new Error(
      `[seed] No se pudo inicializar directorio de logs para seeders: ${message}`
    );
  }

  /**
   * @description Crea un nuevo SeedContext and initialises all runtime configuration.
   * Resuelve the writable log file path as part of construction.
   * @param {SeedContextConfig} config - Optional configuration overrides.
   *   Unset or invalid values fall back to their documented defaults.
   */
  constructor(config: SeedContextConfig = {}) {
    this.resolveConfig(config);
    this.logFilePath = this.resolveWritableLogFilePath();
  }

  private token = '';
  private lastResponseStatusCode: number | undefined;
  private readonly store = new Map<string, unknown>();
  private readonly sessions = new Map<string, string>();
  private inFlight = 0;
  private readonly queue: Array<() => void> = [];
  private readonly logFilePath: string;
  private logEventCursor = 0;
  private dockerComposeFile = SeedContext.DEFAULT_DOCKER_COMPOSE_FILE;
  private dockerServices = [...SeedContext.DEFAULT_DOCKER_SERVICES];
  private authCandidates = [...SeedContext.DEFAULT_AUTH_CANDIDATES];
  private bootstrapAdminAttempted = false;

  private requestDelayMs = SeedContext.DEFAULT_REQUEST_DELAY_MS;
  private requestTimeoutMs = SeedContext.DEFAULT_REQUEST_TIMEOUT_MS;
  private maxConcurrency = SeedContext.DEFAULT_MAX_CONCURRENCY;
  private maxRetries = SeedContext.DEFAULT_MAX_RETRIES;
  private backoffBaseMs = SeedContext.DEFAULT_BACKOFF_BASE_MS;
  private backoffMaxMs = SeedContext.DEFAULT_BACKOFF_MAX_MS;

  readonly env = 'development';
  apiBaseUrl = SeedContext.DEFAULT_API_BASE_URL;

  /**
   * @description Normalises `value` to a positive integer, returning `fallback` for any
   * non-finite, non-numeric, or non-positive input.
   * @param {number | undefined} value - Raw numeric value to normalise.
   * @param {number} fallback - Value to use when `value` is invalid or non-positive.
   * @returns {number} A positive integer.
   */
  private ensurePositiveInt(
    value: number | undefined,
    fallback: number
  ): number {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return fallback;
    }

    const normalized = Math.floor(value);
    if (normalized <= 0) {
      return fallback;
    }

    return normalized;
  }

  /**
   * @description Normalises `value` to a non-negative integer, returning `fallback` for any
   * non-finite, non-numeric, or negative input.
   * @param {number | undefined} value - Raw numeric value to normalise.
   * @param {number} fallback - Value to use when `value` is invalid or negative.
   * @returns {number} A non-negative integer (zero is allowed).
   */
  private ensureNonNegativeInt(
    value: number | undefined,
    fallback: number
  ): number {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return fallback;
    }

    const normalized = Math.floor(value);
    if (normalized < 0) {
      return fallback;
    }

    return normalized;
  }

  /**
   * @description Aplica the provided configuration to the instance properties,
   * falling back to defaults for any missing or invalid values.
   * @param {SeedContextConfig} config - Partial configuration object to apply.
   * @returns {void}
   */
  private resolveConfig(config: SeedContextConfig): void {
    this.apiBaseUrl =
      typeof config.apiBaseUrl === 'string' &&
      config.apiBaseUrl.trim().length > 0
        ? config.apiBaseUrl.trim().replace(/\/+$/, '')
        : SeedContext.DEFAULT_API_BASE_URL;

    this.requestDelayMs = this.ensureNonNegativeInt(
      config.requestDelayMs,
      SeedContext.DEFAULT_REQUEST_DELAY_MS
    );
    this.requestTimeoutMs = this.ensurePositiveInt(
      config.requestTimeoutMs,
      SeedContext.DEFAULT_REQUEST_TIMEOUT_MS
    );
    this.maxConcurrency = this.ensurePositiveInt(
      config.maxConcurrency,
      SeedContext.DEFAULT_MAX_CONCURRENCY
    );
    this.maxRetries = this.ensureNonNegativeInt(
      config.maxRetries,
      SeedContext.DEFAULT_MAX_RETRIES
    );
    this.backoffBaseMs = this.ensureNonNegativeInt(
      config.backoffBaseMs,
      SeedContext.DEFAULT_BACKOFF_BASE_MS
    );
    this.backoffMaxMs = this.ensurePositiveInt(
      config.backoffMaxMs,
      SeedContext.DEFAULT_BACKOFF_MAX_MS
    );

    this.dockerComposeFile =
      typeof config.dockerComposeFile === 'string' &&
      config.dockerComposeFile.trim().length > 0
        ? config.dockerComposeFile.trim()
        : SeedContext.DEFAULT_DOCKER_COMPOSE_FILE;

    this.dockerServices =
      Array.isArray(config.dockerServices) && config.dockerServices.length > 0
        ? config.dockerServices
        : SeedContext.DEFAULT_DOCKER_SERVICES;

    this.authCandidates =
      Array.isArray(config.authCandidates) && config.authCandidates.length > 0
        ? config.authCandidates
        : SeedContext.DEFAULT_AUTH_CANDIDATES;
  }

  /**
   * @description Ensures that the required Docker Compose services are running.
   * If the process is already running inside a Docker container (`/.dockerenv` present),
   * this method is a no-op. Otherwise it checks the service status via `docker compose ps`
   * and runs `docker compose up -d` only for services that are not yet running.
   * @returns {Promise<void>}
   */
  async ensureDockerInfra(): Promise<void> {
    const isDocker = existsSync('/.dockerenv');
    if (isDocker) {
      console.log('[seed] Ejecutando en Docker, omitiendo ensureDockerInfra');
      return;
    }

    const composeFile = resolve(__dirname, this.dockerComposeFile);

    try {
      const runningServicesRaw = execSync(
        `docker compose -f "${composeFile}" ps --services --filter status=running`,
        {
          stdio: ['ignore', 'pipe', 'pipe'],
          encoding: 'utf8',
        }
      );

      const runningServices = new Set(
        runningServicesRaw
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => line.length > 0)
      );

      if (
        this.dockerServices.every((service) => runningServices.has(service))
      ) {
        console.log(
          `[seed] Infra Docker ya levantada (${this.dockerServices.join(', ')}), omitiendo docker compose up`
        );
        return;
      }

      const requiredDockerServices = this.dockerServices.filter(
        (service) => service !== 'backend'
      );

      if (
        this.dockerServices.includes('backend') &&
        requiredDockerServices.every((service) => runningServices.has(service))
      ) {
        try {
          const backendResponse = await this.fetchWithTimeout(
            `${this.apiBaseUrl}/auth/login`,
            {
              method: 'OPTIONS',
            }
          );

          if (backendResponse.status >= 200) {
            console.log(
              `[seed] Infra Docker base levantada (${requiredDockerServices.join(', ')}) y backend local accesible, omitiendo docker compose up del backend`
            );
            return;
          }
        } catch (error) {
          void error;
        }
      }
    } catch (error) {
      void error;
    }

    const services = this.dockerServices.join(' ');
    execSync(`docker compose -f "${composeFile}" up -d ${services}`, {
      stdio: 'inherit',
    });
  }

  /**
   * @description Polls the backend health endpoint until it responds with HTTP 2xx
   * or the maximum retry count is reached.
   * @param {number} [retries=60] - Maximum number of polling attempts.
   * @param {number} [delayMs=2000] - Milliseconds to wait between attempts.
   * @returns {Promise<void>} Resuelve when the backend is reachable.
   * @throws {Error} If the backend is still unreachable after all retries.
   */
  async waitForBackend(retries = 60, delayMs = 2000): Promise<void> {
    let lastStatusCode: number | undefined;
    let lastErrorMessage = '';

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const res = await this.fetchWithTimeout(
          `${this.apiBaseUrl}/auth/login`,
          {
            method: 'OPTIONS',
          }
        );
        lastStatusCode = res.status;
        if (res.status >= 200) {
          return;
        }
      } catch {
        lastErrorMessage = 'sin respuesta HTTP';
      }

      if (
        attempt === 1 ||
        attempt === retries ||
        attempt % SeedContext.BACKEND_WAIT_LOG_EVERY_ATTEMPTS === 0
      ) {
        const detail =
          typeof lastStatusCode === 'number'
            ? `status=${lastStatusCode}`
            : `error=${lastErrorMessage || 'sin detalle'}`;
        console.log(
          `[seed] Esperando backend (${attempt}/${retries}) en ${this.apiBaseUrl} (${detail})`
        );
      }

      await new Promise((resolveDelay) => setTimeout(resolveDelay, delayMs));
    }

    const composeFile = resolve(__dirname, this.dockerComposeFile);
    const lastDetail =
      typeof lastStatusCode === 'number'
        ? `status=${lastStatusCode}`
        : `error=${lastErrorMessage || 'sin detalle'}`;

    throw new Error(
      `[seed] Backend no disponible en ${this.apiBaseUrl} tras ${retries} intentos. Ultimo resultado: ${lastDetail}. Revisa logs con: docker compose -f "${composeFile}" logs --tail=120 backend`
    );
  }

  /**
   * @description Normalises potentially incompatible data in the database before seeding.
   * Currently corrects `producto_proveedor` rows where `precio_unitario <= 0`, which would
   * violate application-level constraints. Only runs outside Docker and when the `db` service
   * is managed by this context.
   * @returns {Promise<void>}
   */
  async ensureDatabaseCompatibility(): Promise<void> {
    await Promise.resolve();
    const isDocker = existsSync('/.dockerenv');
    if (isDocker || !this.dockerServices.includes('db')) {
      return;
    }

    const composeFile = resolve(__dirname, this.dockerComposeFile);
    const dbUser = process.env.POSTGRES_USER || 'postgres';
    const dbName = process.env.POSTGRES_DB || 'smart_economat';

    const countCommand =
      `docker compose -f "${composeFile}" exec -T db ` +
      `psql -U "${dbUser}" -d "${dbName}" -t -A ` +
      `-c "SELECT COUNT(*)::int FROM producto_proveedor WHERE precio_unitario IS NOT NULL AND precio_unitario <= 0;"`;

    const normalizeCommand =
      `docker compose -f "${composeFile}" exec -T db ` +
      `psql -U "${dbUser}" -d "${dbName}" -c ` +
      `"UPDATE producto_proveedor SET precio_unitario = NULL WHERE precio_unitario IS NOT NULL AND precio_unitario <= 0;"`;

    try {
      const rawCount = execSync(countCommand, {
        stdio: ['ignore', 'pipe', 'pipe'],
        encoding: 'utf8',
      })
        .trim()
        .replace(/\s+/g, '');
      const invalidCount = Number.parseInt(rawCount, 10);

      if (!Number.isFinite(invalidCount) || invalidCount <= 0) {
        return;
      }

      execSync(normalizeCommand, {
        stdio: ['ignore', 'pipe', 'pipe'],
        encoding: 'utf8',
      });

      console.warn(
        `[seed] Normalizados ${invalidCount} registros incompatibles en producto_proveedor (precio_unitario <= 0) para permitir arranque del backend.`
      );
    } catch (error) {
      void error;
    }
  }

  /**
   * @description Authenticates using the configured credential candidates in order.
   * If all candidates fail a bootstrap admin account is upserted via direct DB access
   * and authentication is retried. Stores the resulting JWT as the active token.
   * @returns {Promise<void>}
   * @throws {Error} If authentication cannot be established after bootstrapping.
   */
  async login(): Promise<void> {
    let lastError: unknown;

    for (const current of this.authCandidates) {
      try {
        const response = await this.request<{ access_token: string }>(
          '/auth/login',
          {
            method: 'POST',
            body: current,
            auth: false,
          }
        );

        const token =
          response?.access_token ||
          (response as any)?.token ||
          (response as any)?.accessToken;

        if (!token) {
          this.logEvent({
            method: 'POST',
            path: '/auth/login',
            payload: current,
            statusCode: 200,
            responseBody: response,
            error: 'Login sin token en respuesta',
          });
          continue;
        }

        this.token = token;
        this.store.set('seedAdminLoginEmail', current.email);
        this.store.set('seedAdminCurrentPassword', current.password);
        return;
      } catch (error) {
        lastError = error;
      }
    }

    await this.ensureBootstrapAdminCredentials();

    for (const current of this.authCandidates) {
      try {
        const response = await this.request<{ access_token: string }>(
          '/auth/login',
          {
            method: 'POST',
            body: current,
            auth: false,
          }
        );

        const token =
          response?.access_token ||
          (response as any)?.token ||
          (response as any)?.accessToken;

        if (!token) {
          continue;
        }

        this.token = token;
        this.store.set('seedAdminLoginEmail', current.email);
        this.store.set('seedAdminCurrentPassword', current.password);
        return;
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error('[seed] No fue posible autenticarse para ejecutar seeders');
  }

  /**
   * @description Creates or updates a super-admin user directly in the database using
   * credentials from environment variables (`SEED_BOOTSTRAP_ADMIN_EMAIL`, etc.) or defaults.
   * Called automatically by `login()` when all credential candidates fail.
   * Guards against duplicate execution with `bootstrapAdminAttempted`.
   * @returns {Promise<void>}
   * @throws {Error} If the database operation fails.
   */
  private async ensureBootstrapAdminCredentials(): Promise<void> {
    if (this.bootstrapAdminAttempted) {
      return;
    }
    this.bootstrapAdminAttempted = true;

    const email =
      process.env.SEED_BOOTSTRAP_ADMIN_EMAIL?.trim() ||
      'superadmin@smarteconomat.com';
    const username =
      process.env.SEED_BOOTSTRAP_ADMIN_USERNAME?.trim() || 'superadmin';
    const password =
      process.env.SEED_BOOTSTRAP_ADMIN_PASSWORD?.trim() || 'SmartEconomat2026!';

    try {
      if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
      }

      const repo = AppDataSource.getRepository(Usuario);
      const existing = await repo
        .createQueryBuilder('usuario')
        .addSelect('usuario.password')
        .where('(usuario.email = :email OR usuario.username = :username)', {
          email,
          username,
        })
        .getOne();

      if (existing) {
        existing.email = existing.email || email;
        existing.username = existing.username || username;
        existing.password = password;
        existing.rol = rolUsuario.SUPER_ADMIN;
        existing.status = UserStatus.ACTIVE;
        existing.activo = true;
        existing.mustChangePassword = false;
        await repo.save(existing);
      } else {
        const created = repo.create({
          nombre: 'Seeder Bootstrap Admin',
          username,
          email,
          password,
          rol: rolUsuario.SUPER_ADMIN,
          status: UserStatus.ACTIVE,
          activo: true,
          mustChangePassword: false,
        });
        await repo.save(created);
      }

      const bootstrapCandidates: SeedCredential[] = [
        { email, password },
        { email: username, password },
      ];

      this.authCandidates = [
        ...bootstrapCandidates,
        ...this.authCandidates.filter(
          (candidate) =>
            !bootstrapCandidates.some(
              (bootstrap) =>
                bootstrap.email === candidate.email &&
                bootstrap.password === candidate.password
            )
        ),
      ];
    } catch (error) {
      const message = String(error instanceof Error ? error.message : error);
      throw new Error(
        `[seed] No se pudo bootstrapear credenciales admin para seeding: ${message}`
      );
    }
  }

  /**
   * @description Devuelve el/la currently active JWT bearer token.
   * @returns {string} The active bearer token string (empty string if not yet authenticated).
   */
  getAccessToken(): string {
    return this.token;
  }

  /**
   * @description Overrides the active JWT bearer token.
   * @param {string} token - New bearer token to set as the default for subsequent requests.
   * @returns {void}
   */
  setAccessToken(token: string): void {
    this.token = token;
  }

  /**
   * @description Stores a named session token for later retrieval.
   * The key is trimmed; empty keys or empty tokens are silently ignored.
   * @param {string} sessionKey - Identifier for the session (p. ej. a username).
   * @param {string} token - JWT bearer token to store under this key.
   * @returns {void}
   */
  setSessionToken(sessionKey: string, token: string): void {
    const normalizedKey = sessionKey.trim();
    if (!normalizedKey || !token) {
      return;
    }
    this.sessions.set(normalizedKey, token);
  }

  /**
   * @description Retrieves a previously stored session token by key.
   * @param {string} sessionKey - Identifier used when the token was stored.
   * @returns {string | undefined} The stored token, or `undefined` if not found.
   */
  getSessionToken(sessionKey: string): string | undefined {
    return this.sessions.get(sessionKey.trim());
  }

  /**
   * @description Returns a stored session token or throws if the key is not found.
   * @param {string} sessionKey - Identifier of the session token to retrieve.
   * @returns {string} The stored token.
   * @throws {Error} If no token has been stored under `sessionKey`.
   */
  requireSessionToken(sessionKey: string): string {
    const token = this.getSessionToken(sessionKey);
    if (!token) {
      throw new Error(`[seed] Session token no encontrado: ${sessionKey}`);
    }
    return token;
  }

  /**
   * @description Devuelve todos los session tokens whose keys start with the given prefix.
   * @param {string} prefix - Key prefix to filter sessions by (trimmed).
   * @returns {string[]} Array of matching token strings (may be empty).
   */
  getSessionTokensByPrefix(prefix: string): string[] {
    const normalizedPrefix = prefix.trim();
    if (!normalizedPrefix) {
      return [];
    }
    const tokens: string[] = [];
    for (const [key, token] of this.sessions.entries()) {
      if (key.startsWith(normalizedPrefix) && token) {
        tokens.push(token);
      }
    }
    return tokens;
  }

  /**
   * @description Logs in with explicit credentials and returns the resulting JWT.
   * Optionally sets the token as the active bearer token and/or stores it under a session key.
   * @param {{ email: string; password: string }} credentials - Login credentials.
   * @param {{ setActiveToken?: boolean; sessionKey?: string }} [options] - Behaviour options.
   *   `setActiveToken` defaults to `true`; `sessionKey` enables named session storage.
   * @returns {Promise<string>} The JWT bearer token returned by the API.
   * @throws {Error} If the login response does not contain a token.
   */
  async loginWithCredentials(
    credentials: {
      email: string;
      password: string;
    },
    options?: { setActiveToken?: boolean; sessionKey?: string }
  ): Promise<string> {
    const response = await this.request<{
      access_token?: string;
      token?: string;
      accessToken?: string;
    }>('/auth/login', {
      method: 'POST',
      body: credentials,
      auth: false,
    });

    const token =
      response?.access_token || response?.token || response?.accessToken;

    if (!token) {
      throw new Error('[seed] Login sin token en respuesta');
    }

    if (options?.setActiveToken !== false) {
      this.token = token;
    }

    if (options?.sessionKey) {
      this.setSessionToken(options.sessionKey, token);
    }

    return token;
  }

  /**
   * @description Devuelve el/la HTTP status code of the most recent API response.
   * @returns {number | undefined} The last status code, or `undefined` if no request has been made.
   */
  getLastResponseStatusCode(): number | undefined {
    return this.lastResponseStatusCode;
  }

  /**
   * @description Stores an arbitrary value in the shared in-memory state map.
   * @param {string} key - Identifier for the stored value.
   * @param {unknown} value - Value to store (any type).
   * @returns {void}
   */
  set(key: string, value: unknown): void {
    this.store.set(key, value);
  }

  /**
   * @description Appends a value to an array stored in the shared state map.
   * If no array exists for the key, a new one is created automatically.
   * @template T - Type of the array elements.
   * @param {string} key - State map key whose value is (or will become) an array.
   * @param {T} value - Item to append to the array.
   * @returns {void}
   */
  appendToStateArray<T>(key: string, value: T): void {
    const current = this.getState<T[]>(key) || [];
    current.push(value);
    this.store.set(key, current);
  }

  /**
   * @description Retrieves a value from the shared in-memory state map.
   * @template T - Expected type of the stored value.
   * @param {string} key - Identifier of the stored value.
   * @returns {T | undefined} The stored value cast to `T`, or `undefined` if not present.
   */
  getState<T>(key: string): T | undefined {
    return this.store.get(key) as T | undefined;
  }

  /**
   * @description Comprueba si a value has been stored in the shared state map.
   * @param {string} key - Identifier to check.
   * @returns {boolean} `true` if the key exists in the state map, `false` otherwise.
   */
  hasState(key: string): boolean {
    return this.store.has(key);
  }

  /**
   * @description Realiza an authenticated GET request and returns the parsed response body.
   * @template T - Expected response type.
   * @param {string} path - API path relative to `apiBaseUrl` (p. ej. `/productos`).
   * @returns {Promise<T>} Parsed response body (unwrapped from the data envelope if present).
   * @throws {HttpSeedRequestError} On non-2xx responses after exhausting retries.
   */
  async getJson<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'GET' });
  }

  /**
   * @description Realiza an authenticated POST request with a JSON body.
   * @template T - Expected response type.
   * @param {string} path - API path relative to `apiBaseUrl`.
   * @param {unknown} body - Request payload to serialize as JSON.
   * @returns {Promise<T>} Parsed response body (unwrapped from the data envelope if present).
   * @throws {HttpSeedRequestError} On non-2xx responses after exhausting retries.
   */
  async postJson<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>(path, { method: 'POST', body });
  }

  /**
   * @description Realiza an authenticated POST request with a `multipart/form-data` body.
   * Useful for file uploads (p. ej. albaran documents). Supports concurrency limiting,
   * configurable retries, and backoff for 429/5xx responses.
   * @template T - Expected response type.
   * @param {string} path - API path relative to `apiBaseUrl`.
   * @param {Record<string, string | Blob>} form - Key-value pairs to include in the FormData.
   * @param {string} [tokenOverride] - Optional JWT to use instead of the active token.
   * @returns {Promise<T>} Parsed response body (unwrapped from the data envelope if present).
   * @throws {Error} On non-retriable errors or after exhausting retries.
   */
  async postMultipart<T>(
    path: string,
    form: Record<string, string | Blob>,
    tokenOverride?: string
  ): Promise<T> {
    return this.withConcurrency(async () => {
      let lastError: unknown;

      for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
        if (attempt === 0) {
          if (this.requestDelayMs > 0) {
            await this.delay(this.requestDelayMs);
          }
        } else {
          await this.delay(this.computeBackoffMs(attempt - 1));
        }

        const formData = new FormData();
        for (const [key, value] of Object.entries(form)) {
          formData.set(key, value);
        }

        const headers: Record<string, string> = {
          Accept: 'application/json',
          'X-Seeding': 'true',
        };
        const activeToken = tokenOverride || this.token;
        if (activeToken) {
          headers.Authorization = `Bearer ${activeToken}`;
        }

        try {
          const res = await this.fetchWithTimeout(`${this.apiBaseUrl}${path}`, {
            method: 'POST',
            headers,
            body: formData,
          });

          this.lastResponseStatusCode = res.status;

          const parsed = await this.parseResponseBody(res);
          this.logEvent({
            method: 'POST',
            path,
            payload: '[multipart/form-data]',
            statusCode: res.status,
            responseBody: parsed,
          });

          if (!res.ok) {
            const message =
              (parsed as any)?.message ||
              (parsed as any)?.error?.message ||
              (parsed as any)?.raw ||
              `HTTP ${res.status}`;

            const retriable =
              res.status === 429 || (res.status >= 500 && res.status <= 599);

            if (!retriable || attempt >= this.maxRetries) {
              throw new Error(
                `[seed] POST ${path} -> ${res.status}: ${String(message)}`
              );
            }

            continue;
          }

          if (hasDataEnvelope(parsed)) {
            return parsed.data as T;
          }

          return parsed as T;
        } catch (error) {
          lastError = error;
          this.logEvent({
            method: 'POST',
            path,
            payload: '[multipart/form-data]',
            error: String(error instanceof Error ? error.message : error),
          });

          if (attempt >= this.maxRetries) {
            break;
          }
        }
      }

      throw lastError instanceof Error
        ? lastError
        : new Error(`[seed] Error no controlado en POST multipart ${path}`);
    });
  }

  /**
   * @description Realiza an authenticated PATCH request with a JSON body.
   * @template T - Expected response type.
   * @param {string} path - API path relative to `apiBaseUrl`.
   * @param {unknown} body - Request payload to serialize as JSON.
   * @returns {Promise<T>} Parsed response body (unwrapped from the data envelope if present).
   * @throws {HttpSeedRequestError} On non-2xx responses after exhausting retries.
   */
  async patchJson<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>(path, { method: 'PATCH', body });
  }

  /**
   * @description Realiza an authenticated PUT request with a JSON body.
   * @template T - Expected response type.
   * @param {string} path - API path relative to `apiBaseUrl`.
   * @param {unknown} body - Request payload to serialize as JSON.
   * @returns {Promise<T>} Parsed response body (unwrapped from the data envelope if present).
   * @throws {HttpSeedRequestError} On non-2xx responses after exhausting retries.
   */
  async putJson<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>(path, { method: 'PUT', body });
  }

  /**
   * @description Realiza an authenticated DELETE request.
   * @template T - Expected response type.
   * @param {string} path - API path relative to `apiBaseUrl`.
   * @returns {Promise<T>} Parsed response body (unwrapped from the data envelope if present).
   * @throws {HttpSeedRequestError} On non-2xx responses after exhausting retries.
   */
  async deleteJson<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'DELETE' });
  }

  /**
   * @description Generic JSON request helper that wraps the private `request` method.
   * Use the typed convenience methods (`getJson`, `postJson`, etc.) when possible.
   * @template T - Expected response type.
   * @param {string} path - API path relative to `apiBaseUrl`.
   * @param {{ method: string; body?: unknown; auth?: boolean; tokenOverride?: string }} options - Request options.
   * @returns {Promise<T>} Parsed response body.
   * @throws {HttpSeedRequestError} On non-2xx responses after exhausting retries.
   */
  async requestJson<T>(
    path: string,
    options: {
      method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
      body?: unknown;
      auth?: boolean;
      tokenOverride?: string;
    }
  ): Promise<T> {
    return this.request<T>(path, options);
  }

  /**
   * @description Executes `task` within the concurrency limiter, queuing it if the
   * in-flight count has reached `maxConcurrency`.
   * @template T - Return type of the task.
   * @param {() => Promise<T>} task - Async task to execute.
   * @returns {Promise<T>} Result of the task.
   */
  async withConcurrency<T>(task: () => Promise<T>): Promise<T> {
    await this.acquireSlot();
    try {
      return await task();
    } finally {
      this.releaseSlot();
    }
  }

  /**
   * @description Returns a promise that resolves after `ms` milliseconds.
   * @param {number} ms - Delay duration in milliseconds.
   * @returns {Promise<void>}
   */
  async delay(ms: number): Promise<void> {
    await new Promise((resolveDelay) => setTimeout(resolveDelay, ms));
  }

  /**
   * @description Writes a closing footer to the HTTP event log file and resolves.
   * Should be called once after all seeder operations are complete.
   * @returns {Promise<void>}
   */
  close(): Promise<void> {
    this.logRaw(`=== SEED HTTP LOG END ${this.nextLogTimestamp()} ===\n\n`);
    return Promise.resolve();
  }

  /**
   * @description No-op NestJS DI compatibility stub. Always returns `undefined` as `T`.
   * @template T - Expected type (unused).
   * @param {unknown} token - Injection token (ignored).
   * @returns {T} Always `undefined`.
   */
  get<T>(token: unknown): T {
    void token;
    return undefined as T;
  }

  /**
   * @description Returns a minimal DataSource-like stub for use in seeder utilities
   * that expect a DataSource interface but should not perform real DB operations.
   * @returns {any} Stub object with no-op `manager`, `createQueryRunner`, and `getRepository`.
   */
  getDataSource(): any {
    return {
      manager: {},
      createQueryRunner: () => ({
        connect: () => Promise.resolve(),
        startTransaction: () => Promise.resolve(),
        commitTransaction: () => Promise.resolve(),
        rollbackTransaction: () => Promise.resolve(),
        release: () => Promise.resolve(),
      }),
      getRepository: () => ({
        find: () => Promise.resolve([]),
        findOne: () => Promise.resolve(null),
        count: () => Promise.resolve(0),
      }),
    };
  }

  /**
   * @description Returns a minimal repository stub for use in seeder utilities.
   * All operations resolve with empty/null values to prevent real DB writes.
   * @template T - Expected repository type.
   * @param {unknown} entity - Entity class (ignored).
   * @returns {T} Stub repository with no-op `find`, `findOne`, `count`, and `save` methods.
   */
  getRepository<T>(entity: unknown): T {
    void entity;
    return {
      find: () => Promise.resolve([]),
      findOne: () => Promise.resolve(null),
      count: () => Promise.resolve(0),
      save: (input: unknown) => Promise.resolve(input),
    } as T;
  }

  /**
   * @description No-op transaction stub. Invokes `callback` with a minimal queryRunner
   * stub that provides a no-op `manager.save`. Real transactions are not executed.
   * @template T - Return type of the callback.
   * @param {(queryRunner: any) => Promise<T>} callback - Transaction body to execute.
   * @returns {Promise<T>} Result of the callback.
   */
  async transaction<T>(callback: (queryRunner: any) => Promise<T>): Promise<T> {
    return callback({
      manager: {
        save: (input: unknown) => Promise.resolve(input),
      },
    });
  }

  /**
   * @description No-op DTO validation stub. Devuelve el/la payload unmodified as `T`.
   * @template T - Expected validated type.
   * @param {unknown} dtoClass - DTO class constructor (ignored).
   * @param {unknown} payload - Payload to return as-is.
   * @returns {Promise<T>} The payload cast to `T`.
   */
  validateDto<T extends object>(
    dtoClass: unknown,
    payload: unknown
  ): Promise<T> {
    void dtoClass;
    return Promise.resolve(payload as T);
  }

  /**
   * @description No-op find stub. Always resolves with an empty array.
   * @template T - Expected entity type.
   * @param {unknown} entity - Entity class (ignored).
   * @param {unknown} [options] - Find options (ignored).
   * @returns {Promise<T[]>} Always resolves with `[]`.
   */
  find<T>(entity: unknown, options?: unknown): Promise<T[]> {
    void entity;
    void options;
    return Promise.resolve([] as T[]);
  }

  /**
   * @description No-op findOne stub. Always resolves with `null`.
   * @template T - Expected entity type.
   * @param {unknown} entity - Entity class (ignored).
   * @param {unknown} options - Find options (ignored).
   * @returns {Promise<T | null>} Always resolves with `null`.
   */
  findOne<T>(entity: unknown, options: unknown): Promise<T | null> {
    void entity;
    void options;
    return Promise.resolve(null);
  }

  /**
   * @description No-op count stub. Always resolves with `0`.
   * @param {unknown} entity - Entity class (ignored).
   * @param {unknown} [where] - Filter options (ignored).
   * @returns {Promise<number>} Always resolves with `0`.
   */
  count(entity: unknown, where?: unknown): Promise<number> {
    void entity;
    void where;
    return Promise.resolve(0);
  }

  /**
   * @description Stub that returns an empty string as the seed actor user ID.
   * @returns {Promise<string>} Always resolves with an empty string.
   */
  getSeedActorUserId(): Promise<string> {
    return Promise.resolve('');
  }

  /**
   * @description Core HTTP request implementation with concurrency limiting, retry/backoff,
   * structured logging, and data-envelope unwrapping.
   * @template T - Expected response type.
   * @param {string} path - API path relative to `apiBaseUrl`.
   * @param {{ method: string; body?: unknown; auth?: boolean; tokenOverride?: string }} options - Request options.
   * @returns {Promise<T>} Parsed and unwrapped response body.
   * @throws {HttpSeedRequestError} On non-retriable or exhausted-retry HTTP errors.
   * @throws {Error} On network or timeout errors after exhausting retries.
   */
  private async request<T>(
    path: string,
    options: {
      method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
      body?: unknown;
      auth?: boolean;
      tokenOverride?: string;
    }
  ): Promise<T> {
    return this.withConcurrency(async () => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Seeding': 'true',
      };

      const activeToken = options.tokenOverride || this.token;
      if (options.auth !== false && activeToken) {
        headers.Authorization = `Bearer ${activeToken}`;
      }

      let lastError: unknown;

      for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
        if (attempt === 0) {
          if (this.requestDelayMs > 0) {
            await this.delay(this.requestDelayMs);
          }
        } else {
          await this.delay(this.computeBackoffMs(attempt - 1));
        }

        try {
          const res = await this.fetchWithTimeout(`${this.apiBaseUrl}${path}`, {
            method: options.method,
            headers,
            body: options.body ? JSON.stringify(options.body) : undefined,
          });

          this.lastResponseStatusCode = res.status;

          const parsed = await this.parseResponseBody(res);

          this.logEvent({
            method: options.method,
            path,
            payload: options.body,
            statusCode: res.status,
            responseBody: parsed,
          });

          if (!res.ok) {
            const message =
              (parsed as any)?.message ||
              (parsed as any)?.error?.message ||
              (parsed as any)?.raw ||
              `HTTP ${res.status}`;

            const retriable =
              res.status === 429 || (res.status >= 500 && res.status <= 599);
            const retryAfterMs = this.parseRetryAfterMs(
              res.headers.get('retry-after')
            );

            throw new HttpSeedRequestError(
              res.status,
              `[seed] ${options.method} ${path} -> ${res.status}: ${String(message)}`,
              retriable,
              retryAfterMs
            );
          }

          if (hasDataEnvelope(parsed)) {
            return parsed.data as T;
          }

          return parsed as T;
        } catch (error) {
          lastError = error;

          this.logEvent({
            method: options.method,
            path,
            payload: options.body,
            statusCode:
              error instanceof HttpSeedRequestError ? error.status : undefined,
            responseBody: null,
            error: String(error instanceof Error ? error.message : error),
          });

          if (error instanceof HttpSeedRequestError) {
            if (!error.retriable || attempt >= this.maxRetries) {
              throw error;
            }

            if (error.retryAfterMs && error.retryAfterMs > 0) {
              await this.delay(error.retryAfterMs);
            }

            continue;
          }

          if (attempt >= this.maxRetries) {
            break;
          }
        }
      }

      throw lastError instanceof Error
        ? lastError
        : new Error(`[seed] Error no controlado en ${options.method} ${path}`);
    });
  }

  /**
   * @description Delegates to `parseSeedResponseBody` to parse the HTTP response.
   * @param {Response} response - Fetch API Response object.
   * @returns {Promise<Record<string, unknown> | string | null>} Parsed body or null.
   */
  private async parseResponseBody(
    response: Response
  ): Promise<Record<string, unknown> | string | null> {
    return parseSeedResponseBody(response);
  }

  /**
   * @description Calcula the exponential back-off delay in milliseconds for a given attempt,
   * capped at `backoffMaxMs` and with a deterministic jitter term.
   * @param {number} attempt - Zero-based retry attempt index.
   * @returns {number} Delay in milliseconds.
   */
  private computeBackoffMs(attempt: number): number {
    return computeSeedBackoffMs(this.backoffBaseMs, this.backoffMaxMs, attempt);
  }

  /**
   * @description Envuelve the native `fetch` with an `AbortController`-based timeout.
   * The timeout duration is controlled by `requestTimeoutMs`.
   * @param {string} url - Full URL to fetch.
   * @param {RequestInit} init - Fetch init options (merged with the abort signal).
   * @returns {Promise<Response>} The fetch Response.
   * @throws {DOMException} If the request times out (abort signal fires).
   */
  private async fetchWithTimeout(
    url: string,
    init: RequestInit
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      this.requestTimeoutMs
    );

    try {
      return await fetch(url, {
        ...init,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * @description Delegates to `parseSeedRetryAfterMs` to interpret the `Retry-After` header.
   * @param {string | null} headerValue - Raw `Retry-After` header value.
   * @returns {number | undefined} Milliseconds to wait, or `undefined` if not parseable.
   */
  private parseRetryAfterMs(headerValue: string | null): number | undefined {
    return parseSeedRetryAfterMs(headerValue);
  }

  /**
   * @description Acquires a concurrency slot. If the in-flight count has reached `maxConcurrency`,
   * the caller is queued until a slot is released.
   * @returns {Promise<void>} Resuelve when a slot is available.
   */
  private async acquireSlot(): Promise<void> {
    if (this.inFlight < this.maxConcurrency) {
      this.inFlight++;
      return;
    }

    await new Promise<void>((resolveNext) => {
      this.queue.push(() => {
        this.inFlight++;
        resolveNext();
      });
    });
  }

  /**
   * @description Releases a concurrency slot and dispatches the next queued task if any.
   * @returns {void}
   */
  private releaseSlot(): void {
    this.inFlight = Math.max(0, this.inFlight - 1);
    const next = this.queue.shift();
    if (next) {
      next();
    }
  }

  /**
   * @description Appends raw text to the HTTP event log file synchronously.
   * @param {string} content - Text content to append.
   * @returns {void}
   */
  private logRaw(content: string): void {
    appendFileSync(this.logFilePath, content, 'utf8');
  }

  /**
   * @description Formatea and appends a structured HTTP event entry to the log file.
   * Each entry includes method, path, payload, status code, response body, and error details.
   * @param {{ method: string; path: string; payload?: unknown; statusCode?: number; responseBody?: unknown; error?: string }} event - Event data to log.
   * @returns {void}
   */
  private logEvent(event: {
    method: string;
    path: string;
    payload?: unknown;
    statusCode?: number;
    responseBody?: unknown;
    error?: string;
  }): void {
    const lines = [
      `[${this.nextLogTimestamp()}] ${event.method} ${event.path}`,
      `payload: ${this.safeStringify(event.payload)}`,
      `status: ${event.statusCode ?? 'N/A'}`,
      `response: ${this.safeStringify(event.responseBody)}`,
      `error: ${event.error || 'none'}`,
      '---',
    ];
    this.logRaw(`${lines.join('\n')}\n`);
  }

  /**
   * @description Delegates to `seedSafeStringify` to convert a value to a log-safe string.
   * @param {unknown} value - Value to stringify.
   * @returns {string} String representation safe for log output.
   */
  private safeStringify(value: unknown): string {
    return seedSafeStringify(value);
  }

  /**
   * @description Returns a deterministic ISO timestamp for the current log event,
   * advancing the internal `logEventCursor` counter with each call.
   * @returns {string} ISO 8601 timestamp string derived from the seed reference date and cursor.
   */
  private nextLogTimestamp(): string {
    const timestamp = seedDateIso(0, this.logEventCursor);
    this.logEventCursor += 1;
    return timestamp;
  }
}
