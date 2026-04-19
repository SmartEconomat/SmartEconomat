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

  async ensureDatabaseCompatibility(): Promise<void> {
    await Promise.resolve();
    const isDocker = existsSync('/.dockerenv');
    if (isDocker || !this.dockerServices.includes('db')) {
      return;
    }

    const composeFile = resolve(__dirname, this.dockerComposeFile);
    const dbUser =
      process.env.POSTGRES_USER || process.env.DB_USERNAME || 'postgres';
    const dbName =
      process.env.POSTGRES_DB ||
      process.env.DB_DATABASE ||
      process.env.DB_NAME ||
      'smart_economat';

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

  getAccessToken(): string {
    return this.token;
  }

  setAccessToken(token: string): void {
    this.token = token;
  }

  setSessionToken(sessionKey: string, token: string): void {
    const normalizedKey = sessionKey.trim();
    if (!normalizedKey || !token) {
      return;
    }
    this.sessions.set(normalizedKey, token);
  }

  getSessionToken(sessionKey: string): string | undefined {
    return this.sessions.get(sessionKey.trim());
  }

  requireSessionToken(sessionKey: string): string {
    const token = this.getSessionToken(sessionKey);
    if (!token) {
      throw new Error(`[seed] Session token no encontrado: ${sessionKey}`);
    }
    return token;
  }

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

  getLastResponseStatusCode(): number | undefined {
    return this.lastResponseStatusCode;
  }

  set(key: string, value: unknown): void {
    this.store.set(key, value);
  }

  appendToStateArray<T>(key: string, value: T): void {
    const current = this.getState<T[]>(key) || [];
    current.push(value);
    this.store.set(key, current);
  }

  getState<T>(key: string): T | undefined {
    return this.store.get(key) as T | undefined;
  }

  hasState(key: string): boolean {
    return this.store.has(key);
  }

  async getJson<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'GET' });
  }

  async postJson<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>(path, { method: 'POST', body });
  }

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

  async patchJson<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>(path, { method: 'PATCH', body });
  }

  async putJson<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>(path, { method: 'PUT', body });
  }

  async deleteJson<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'DELETE' });
  }

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

  async withConcurrency<T>(task: () => Promise<T>): Promise<T> {
    await this.acquireSlot();
    try {
      return await task();
    } finally {
      this.releaseSlot();
    }
  }

  async delay(ms: number): Promise<void> {
    await new Promise((resolveDelay) => setTimeout(resolveDelay, ms));
  }

  close(): Promise<void> {
    this.logRaw(`=== SEED HTTP LOG END ${this.nextLogTimestamp()} ===\n\n`);
    return Promise.resolve();
  }

  get<T>(token: unknown): T {
    void token;
    return undefined as T;
  }

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

  getRepository<T>(entity: unknown): T {
    void entity;
    return {
      find: () => Promise.resolve([]),
      findOne: () => Promise.resolve(null),
      count: () => Promise.resolve(0),
      save: (input: unknown) => Promise.resolve(input),
    } as T;
  }

  async transaction<T>(callback: (queryRunner: any) => Promise<T>): Promise<T> {
    return callback({
      manager: {
        save: (input: unknown) => Promise.resolve(input),
      },
    });
  }

  validateDto<T extends object>(
    dtoClass: unknown,
    payload: unknown
  ): Promise<T> {
    void dtoClass;
    return Promise.resolve(payload as T);
  }

  find<T>(entity: unknown, options?: unknown): Promise<T[]> {
    void entity;
    void options;
    return Promise.resolve([] as T[]);
  }

  findOne<T>(entity: unknown, options: unknown): Promise<T | null> {
    void entity;
    void options;
    return Promise.resolve(null);
  }

  count(entity: unknown, where?: unknown): Promise<number> {
    void entity;
    void where;
    return Promise.resolve(0);
  }

  getSeedActorUserId(): Promise<string> {
    return Promise.resolve('');
  }

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

  private async parseResponseBody(
    response: Response
  ): Promise<Record<string, unknown> | string | null> {
    return parseSeedResponseBody(response);
  }

  private computeBackoffMs(attempt: number): number {
    return computeSeedBackoffMs(this.backoffBaseMs, this.backoffMaxMs, attempt);
  }

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

  private parseRetryAfterMs(headerValue: string | null): number | undefined {
    return parseSeedRetryAfterMs(headerValue);
  }

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

  private releaseSlot(): void {
    this.inFlight = Math.max(0, this.inFlight - 1);
    const next = this.queue.shift();
    if (next) {
      next();
    }
  }

  private logRaw(content: string): void {
    appendFileSync(this.logFilePath, content, 'utf8');
  }

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

  private safeStringify(value: unknown): string {
    return seedSafeStringify(value);
  }

  private nextLogTimestamp(): string {
    const timestamp = seedDateIso(0, this.logEventCursor);
    this.logEventCursor += 1;
    return timestamp;
  }
}
