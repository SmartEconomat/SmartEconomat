import { spawnSync, type SpawnSyncReturns } from 'node:child_process';
import { appendFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import AppDataSource from '../config/typeorm.config';
import { Usuario } from '../modules/usuario/usuario.entity/usuario.entity';
import {
  rolUsuario,
  UserStatus,
  UserLanguage,
} from '../modules/usuario/enums/usuario.enums';
import * as bcrypt from 'bcrypt';
import {
  computeSeedBackoffMs,
  hasDataEnvelope,
  HttpSeedRequestError,
  parseSeedResponseBody,
  parseSeedRetryAfterMs,
  seedSafeStringify,
} from './seed-context.http-utils';
import { seedDateIso } from './deterministic.seed-data';
import {
  parseSeedBootstrapOverwriteExistingAdminPassword,
  resolveBootstrapAdminUsersFromEnv,
} from './bootstrap-admin-users.seed';

type SeedCredential = {
  email: string;
  password: string;
};

/** Alias público (SeedContextConfig) para simplificar payloads o props en smart-economat-backend (Nest). */
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
 * Representa seed context en el sistema.
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
   * Resuelve writable log file path a partir del contexto disponible.
   * @returns Valor resultante de la operación.
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
      `[seed] Could not inicializar directorio de logs para seeders: ${message}`
    );
  }

  /**
   * Inicializa la instancia con los colaboradores necesarios para el flujo.
   *
   * @param config Parámetro de entrada para la operación. Opcional.
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
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
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
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
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
   * Resuelve config a partir del contexto disponible.
   *
   * @param config Parámetro de entrada para la operación.
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
   * Invoca `docker compose` con raíz del proyecto y `.env.dev` si existen,
   * para evitar cuelgues y variables vacías al ejecutar desde `backend/smart-economat-backend`.
   */
  private dockerComposeSpawn(
    composeSubcommandArgs: readonly string[],
    timeoutMs: number
  ): SpawnSyncReturns<string> {
    const composePath = resolve(__dirname, this.dockerComposeFile);
    const projectDir = dirname(composePath);
    const envDevPath = join(projectDir, '.env.dev');
    const args = [
      'compose',
      ...(existsSync(envDevPath) ? (['--env-file', envDevPath] as const) : []),
      '--project-directory',
      projectDir,
      '-f',
      composePath,
      ...composeSubcommandArgs,
    ];
    return spawnSync('docker', args, {
      encoding: 'utf8',
      timeout: timeoutMs,
      stdio: ['ignore', 'pipe', 'pipe'],
      maxBuffer: 10 * 1024 * 1024,
    });
  }

  async ensureDockerInfra(): Promise<void> {
    const isDocker = existsSync('/.dockerenv');
    if (isDocker) {
      console.log('[seed] Ejecutando en Docker, omitiendo ensureDockerInfra');
      return;
    }

    try {
      const composePsTimeoutMs = Number.parseInt(
        process.env.SEED_DOCKER_PS_TIMEOUT_MS ?? '60000',
        10
      );
      const psResult = this.dockerComposeSpawn(
        ['ps', '--services', '--filter', 'status=running'],
        Math.max(5_000, composePsTimeoutMs)
      );

      if (psResult.error) {
        throw psResult.error;
      }

      const runningServicesRaw = psResult.stdout || '';

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
          const probeMs = Number.parseInt(
            process.env.SEED_BACKEND_PROBE_TIMEOUT_MS ?? '8000',
            10
          );
          const probeUrl = this.apiBaseUrl.replace(/\/+$/, '');
          const backendResponse = await this.fetchWithTimeoutAt(
            probeUrl,
            { method: 'GET', headers: { Accept: '*/*' } },
            probeMs
          );

          if (backendResponse.status >= 200 && backendResponse.status < 500) {
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

    const services = this.dockerServices;
    const upResult = this.dockerComposeSpawn(
      ['up', '-d', ...services],
      Number.parseInt(process.env.SEED_DOCKER_UP_TIMEOUT_MS ?? '300000', 10)
    );
    if (upResult.error || upResult.status !== 0) {
      console.error(
        `[seed] docker compose up falló: ${upResult.stderr?.slice(0, 1200) || upResult.error || 'sin detalle'}`
      );
      throw new Error(
        '[seed] No se pudo levantar servicios Docker requeridos para el seed'
      );
    }
  }

  /**
   * Ejecuta la lógica de wait for backend dentro del flujo de la aplicación.
   *
   * @param retries Parámetro de entrada para la operación. Opcional.
   * @param delayMs Parámetro de entrada para la operación. Opcional.
   * @returns Valor resultante de la operación.
   */
  async waitForBackend(retries = 60, delayMs = 2000): Promise<void> {
    let lastStatusCode: number | undefined;
    let lastErrorMessage = '';

    const probeTimeoutMs = Number.parseInt(
      process.env.SEED_BACKEND_PROBE_TIMEOUT_MS ?? '8000',
      10
    );
    const probeUrl = this.apiBaseUrl.replace(/\/+$/, '');
    console.log(
      `[seed] Sonda GET ${probeUrl} (timeout ${probeTimeoutMs} ms por intento, máx. ${retries})...`
    );

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const res = await this.fetchWithTimeoutAt(
          probeUrl,
          { method: 'GET', headers: { Accept: '*/*' } },
          probeTimeoutMs
        );
        lastStatusCode = res.status;
        if (res.status >= 200 && res.status < 500) {
          console.log(
            `[seed] Backend respondió (${res.status}) en ${probeUrl}, continuando.`
          );
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

    const lastDetail =
      typeof lastStatusCode === 'number'
        ? `status=${lastStatusCode}`
        : `error=${lastErrorMessage || 'sin detalle'}`;

    const composeHint = resolve(__dirname, this.dockerComposeFile);
    throw new Error(
      `[seed] Backend no disponible en ${this.apiBaseUrl} tras ${retries} intentos. Ultimo resultado: ${lastDetail}. Revisa logs con: docker compose -f "${composeHint}" logs --tail=120 backend`
    );
  }

  /**
   * Garantiza database compatibility antes de continuar el flujo.
   * @returns Valor resultante de la operación.
   */
  /**
   * Garantiza la existencia, coherencia o validez del recurso indicado.
   * @undefined {Promise<void>} Datos efectivos después de ejecutar la operación.
   */
  async ensureDatabaseCompatibility(): Promise<void> {
    await Promise.resolve();
    const isDocker = existsSync('/.dockerenv');
    if (isDocker || !this.dockerServices.includes('db')) {
      return;
    }

    const skipDockerDb = /^1|true|yes$/i.test(
      String(process.env.SEED_SKIP_DOCKER_DB_CHECK || '').trim()
    );
    if (skipDockerDb) {
      console.log(
        '[seed] SEED_SKIP_DOCKER_DB_CHECK está activo: se omite la consulta opcional `docker compose exec db` (evita cuelgues en host).'
      );
      return;
    }

    const execTimeoutMs = Number.parseInt(
      process.env.SEED_DOCKER_EXEC_TIMEOUT_MS ?? '45000',
      10
    );
    console.log(
      `[seed] Comprobación opcional en BD (precio_unitario): docker compose exec db (timeout ${Math.max(1, Math.round(execTimeoutMs / 1000))}s)...`
    );

    const dbUser = process.env.POSTGRES_USER || 'postgres';
    const dbName = process.env.POSTGRES_DB || 'smart_economat';
    const countSql =
      'SELECT COUNT(*)::int FROM producto_proveedor WHERE precio_unitario IS NOT NULL AND precio_unitario <= 0;';

    try {
      const countResult = this.dockerComposeSpawn(
        [
          'exec',
          '-T',
          'db',
          'psql',
          '-U',
          dbUser,
          '-d',
          dbName,
          '-t',
          '-A',
          '-c',
          countSql,
        ],
        Math.max(3_000, execTimeoutMs)
      );

      if (countResult.error) {
        console.warn(
          `[seed] No se ejecutó la comprobación en PostgreSQL (${countResult.error.message}). Se continúa. Si es timeout, usa SEED_SKIP_DOCKER_DB_CHECK=1 o revisa Docker. stderr: ${String(countResult.stderr || '').slice(0, 400)}`
        );
        return;
      }

      if (countResult.status !== 0) {
        console.warn(
          `[seed] psql COUNT omitido (exit ${countResult.status}): ${String(countResult.stderr || '').slice(0, 500)}`
        );
        return;
      }

      const rawCount = (countResult.stdout || '').trim().replace(/\s+/g, '');
      const invalidCount = Number.parseInt(rawCount, 10);

      if (!Number.isFinite(invalidCount) || invalidCount <= 0) {
        return;
      }

      const normSql =
        'UPDATE producto_proveedor SET precio_unitario = NULL WHERE precio_unitario IS NOT NULL AND precio_unitario <= 0;';
      const normResult = this.dockerComposeSpawn(
        ['exec', '-T', 'db', 'psql', '-U', dbUser, '-d', dbName, '-c', normSql],
        Math.max(3_000, execTimeoutMs)
      );

      if (normResult.error || normResult.status !== 0) {
        console.warn(
          `[seed] No se aplicó normalización de precios (exit ${normResult.status}): ${String(normResult.stderr || normResult.error || '').slice(0, 400)}`
        );
        return;
      }

      console.warn(
        `[seed] Normalizados ${invalidCount} registros incompatibles en producto_proveedor (precio_unitario <= 0) para permitir arranque del backend.`
      );
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.warn(
        `[seed] ensureDatabaseCompatibility: excepción ignorada (${msg})`
      );
    }
  }

  /**
   * Ejecuta la lógica de login dentro del flujo de la aplicación.
   * @returns Valor resultante de la operación.
   */
  /**
   * Extrae token JWT de la respuesta de login (plana o envuelta en `data`).
   */
  private extractLoginTokenFromPayload(
    parsed: Record<string, unknown> | string | null
  ): string | null {
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return null;
    }
    const raw = hasDataEnvelope(parsed)
      ? (parsed as { data: unknown }).data
      : parsed;
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      return null;
    }
    const o = raw as Record<string, unknown>;
    const t =
      (typeof o.access_token === 'string' && o.access_token) ||
      (typeof o.token === 'string' && o.token) ||
      (typeof o.accessToken === 'string' && o.accessToken);
    return typeof t === 'string' && t.trim().length > 0 ? t.trim() : null;
  }

  /**
   * POST /auth/login sin `withConcurrency` ni el timeout largo de peticiones del seed (60s),
   * para que el arranque no parezca colgado.
   */
  private async postAuthLoginDirect(
    credentials: SeedCredential,
    timeoutMs: number
  ): Promise<{ ok: boolean; token: string | null; status: number }> {
    const base = this.apiBaseUrl.replace(/\/+$/, '');
    const res = await this.fetchWithTimeoutAt(
      `${base}/auth/login`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-Seeding': 'true',
        },
        body: JSON.stringify(credentials),
      },
      timeoutMs
    );
    let token: string | null = null;
    try {
      const parsed = await this.parseResponseBody(res);
      token = this.extractLoginTokenFromPayload(parsed);
    } catch {
      token = null;
    }
    return { ok: res.ok, token, status: res.status };
  }

  /**
   * Expone "login" en smart-economat-backend (Nest).
   * @undefined {Promise<void>} Datos efectivos después de ejecutar la operación.
   */
  async login(): Promise<void> {
    const loginTimeout = Number.parseInt(
      process.env.SEED_LOGIN_HTTP_TIMEOUT_MS ?? '25000',
      10
    );
    console.log(
      `[seed] Autenticación: POST /auth/login (hasta ${this.authCandidates.length} candidatos, ${loginTimeout} ms por intento; sin cola de concurrencia)...`
    );

    let lastError: unknown;

    const applyToken = (
      current: SeedCredential,
      token: string,
      status: number
    ) => {
      this.token = token;
      this.store.set('seedAdminLoginEmail', current.email);
      this.store.set('seedAdminCurrentPassword', current.password);
      console.log(
        `[seed] Sesión obtenida para ${current.email} (HTTP ${status}).`
      );
    };

    for (const current of this.authCandidates) {
      try {
        const { ok, token, status } = await this.postAuthLoginDirect(
          current,
          loginTimeout
        );
        if (ok && token) {
          applyToken(current, token, status);
          return;
        }
        if (!ok) {
          lastError = new Error(
            `[seed] Login HTTP ${status} para identificador ${current.email}`
          );
        }
      } catch (error) {
        lastError = error;
      }
    }

    console.log(
      '[seed] Ningún candidato HTTP válido; alineando superadmin en PostgreSQL (bootstrap TypeORM)...'
    );
    await this.ensureBootstrapAdminCredentials();

    console.log('[seed] Reintentando POST /auth/login tras bootstrap...');
    for (const current of this.authCandidates) {
      try {
        const { ok, token, status } = await this.postAuthLoginDirect(
          current,
          loginTimeout
        );
        if (ok && token) {
          applyToken(current, token, status);
          return;
        }
        if (!ok) {
          lastError = new Error(
            `[seed] Login HTTP ${status} para identificador ${current.email}`
          );
        }
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error('[seed] No fue posible autenticarse para ejecutar seeders');
  }

  /**
   * Garantiza bootstrap admin credentials antes de continuar el flujo.
   * @returns Valor resultante de la operación.
   */
  private async ensureBootstrapAdminCredentials(): Promise<void> {
    if (this.bootstrapAdminAttempted) {
      return;
    }
    this.bootstrapAdminAttempted = true;

    try {
      if (!AppDataSource.isInitialized) {
        console.log(
          '[seed] Conectando TypeORM a PostgreSQL (bootstrap de admin de seed)...'
        );
        await AppDataSource.initialize();
        console.log('[seed] PostgreSQL disponible vía TypeORM.');
      }

      const repo = AppDataSource.getRepository(Usuario);
      const seedingActive =
        (process.env.IS_SEEDING || '').trim().toLowerCase() === 'true';

      if (seedingActive) {
        const bootstrapDefs = resolveBootstrapAdminUsersFromEnv();
        for (const def of bootstrapDefs) {
          const existingUser = await repo
            .createQueryBuilder('usuario')
            .addSelect('usuario.password')
            .where(
              '(LOWER(usuario.email) = LOWER(:email) OR LOWER(usuario.username) = LOWER(:username))',
              { email: def.email, username: def.username }
            )
            .getOne();

          const defHashedPassword = await bcrypt.hash(def.tempPassword, 10);
          if (existingUser) {
            existingUser.email = def.email;
            existingUser.username = def.username;
            existingUser.password = defHashedPassword;
            existingUser.rol = def.rol;
            existingUser.nombre = def.nombre;
            existingUser.status = UserStatus.ACTIVE;
            existingUser.activo = true;
            existingUser.mustChangePassword = false;
            existingUser.idioma = existingUser.idioma || def.idioma;
            await repo.save(existingUser);
          } else {
            await repo.save(
              repo.create({
                nombre: def.nombre,
                username: def.username,
                email: def.email,
                password: defHashedPassword,
                rol: def.rol,
                status: UserStatus.ACTIVE,
                activo: true,
                mustChangePassword: false,
                idioma: def.idioma,
              })
            );
          }
        }

        const bootstrapCandidates: SeedCredential[] = [];
        for (const def of bootstrapDefs) {
          bootstrapCandidates.push(
            { email: def.email, password: def.tempPassword },
            { email: def.username, password: def.tempPassword }
          );
        }

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
        return;
      }

      const email =
        process.env.SEED_BOOTSTRAP_ADMIN_EMAIL?.trim() ||
        'superadmin@smarteconomat.com';
      const username =
        process.env.SEED_BOOTSTRAP_ADMIN_USERNAME?.trim() || 'superadmin';
      const password =
        process.env.SEED_BOOTSTRAP_ADMIN_PASSWORD?.trim() ||
        'SmartEconomat2026!';

      const existing = await repo
        .createQueryBuilder('usuario')
        .addSelect('usuario.password')
        .where('(usuario.email = :email OR usuario.username = :username)', {
          email,
          username,
        })
        .getOne();

      const hashedPassword = await bcrypt.hash(password, 10);
      if (existing) {
        existing.email = existing.email || email;
        existing.username = existing.username || username;
        if (parseSeedBootstrapOverwriteExistingAdminPassword()) {
          existing.password = hashedPassword;
        }
        existing.rol = rolUsuario.SUPER_ADMIN;
        existing.status = UserStatus.ACTIVE;
        existing.activo = true;
        existing.mustChangePassword = false;
        existing.idioma = existing.idioma || UserLanguage.ES;
        await repo.save(existing);
      } else {
        const created = repo.create({
          nombre: 'Seeder Bootstrap Admin',
          username,
          email,
          password: hashedPassword,
          rol: rolUsuario.SUPER_ADMIN,
          status: UserStatus.ACTIVE,
          activo: true,
          mustChangePassword: false,
          idioma: UserLanguage.ES,
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
        `[seed] Could not bootstrapear credenciales admin para seeding: ${message}`
      );
    }
  }

  /**
   * Obtiene access token.
   * @returns Valor resultante de la operación.
   */
  /**
   * Obtiene valores o vistas materializadas.
   * @undefined {string} Datos efectivos después de ejecutar la operación.
   */
  getAccessToken(): string {
    return this.token;
  }

  /**
   * Ejecuta la lógica de set access token dentro del flujo de la aplicación.
   *
   * @param token Parámetro de entrada para la operación.
   */
  /**
   * Establece referencias mutables internas del componente/servicio.
   * @undefined {string} token - Entrada efectiva esperada por el contrato.
   * @undefined {void} Datos efectivos después de ejecutar la operación.
   */
  setAccessToken(token: string): void {
    this.token = token;
  }

  /**
   * Ejecuta la lógica de set session token dentro del flujo de la aplicación.
   *
   * @param sessionKey Parámetro de entrada para la operación.
   * @param token Parámetro de entrada para la operación.
   */
  /**
   * Establece referencias mutables internas del componente/servicio.
   * @undefined {string} sessionKey - Entrada efectiva esperada por el contrato.
   * @undefined {string} token - Entrada efectiva esperada por el contrato.
   * @undefined {void} Datos efectivos después de ejecutar la operación.
   */
  setSessionToken(sessionKey: string, token: string): void {
    const normalizedKey = sessionKey.trim();
    if (!normalizedKey || !token) {
      return;
    }
    this.sessions.set(normalizedKey, token);
  }

  /**
   * Obtiene session token.
   *
   * @param sessionKey Parámetro de entrada para la operación.
   * @returns Valor resultante de la operación.
   */
  getSessionToken(sessionKey: string): string | undefined {
    return this.sessions.get(sessionKey.trim());
  }

  /**
   * Ejecuta la lógica de require session token dentro del flujo de la aplicación.
   *
   * @param sessionKey Parámetro de entrada para la operación.
   * @returns Valor resultante de la operación.
   */
  requireSessionToken(sessionKey: string): string {
    const token = this.getSessionToken(sessionKey);
    if (!token) {
      throw new Error(`[seed] Session token no encontrado: ${sessionKey}`);
    }
    return token;
  }

  /**
   * Obtiene session tokens by prefix.
   *
   * @param prefix Parámetro de entrada para la operación.
   * @returns Valor resultante de la operación.
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
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Expone "loginWithCredentials" en smart-economat-backend (Nest).
   * @undefined {{ email: string; password: string; }} credentials - Entrada efectiva esperada por el contrato.
   * @undefined {{ setActiveToken?: boolean; sessionKey?: string; } | undefined} options - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<string>} Datos efectivos después de ejecutar la operación.
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
   * Obtiene last response status code.
   * @returns Valor resultante de la operación.
   */
  /**
   * Obtiene valores o vistas materializadas.
   * @undefined {number | undefined} Datos efectivos después de ejecutar la operación.
   */
  getLastResponseStatusCode(): number | undefined {
    return this.lastResponseStatusCode;
  }

  /**
   * Ejecuta la lógica de set dentro del flujo de la aplicación.
   *
   * @param key Parámetro de entrada para la operación.
   * @param value Parámetro de entrada para la operación.
   */
  /**
   * Establece referencias mutables internas del componente/servicio.
   * @undefined {string} key - Entrada efectiva esperada por el contrato.
   * @undefined {unknown} value - Entrada efectiva esperada por el contrato.
   * @undefined {void} Datos efectivos después de ejecutar la operación.
   */
  set(key: string, value: unknown): void {
    this.store.set(key, value);
  }

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Expone "appendToStateArray" en smart-economat-backend (Nest).
   * @undefined {string} key - Entrada efectiva esperada por el contrato.
   * @undefined {T} value - Entrada efectiva esperada por el contrato.
   * @undefined {void} Datos efectivos después de ejecutar la operación.
   */
  appendToStateArray<T>(key: string, value: T): void {
    const current = this.getState<T[]>(key) || [];
    current.push(value);
    this.store.set(key, current);
  }

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Obtiene valores o vistas materializadas.
   * @undefined {string} key - Entrada efectiva esperada por el contrato.
   * @undefined {T | undefined} Datos efectivos después de ejecutar la operación.
   */
  getState<T>(key: string): T | undefined {
    return this.store.get(key) as T | undefined;
  }

  /**
   * Determina si state.
   *
   * @param key Parámetro de entrada para la operación.
   * @returns Valor resultante de la operación.
   */
  hasState(key: string): boolean {
    return this.store.has(key);
  }

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Obtiene valores o vistas materializadas.
   * @undefined {string} path - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<T>} Datos efectivos después de ejecutar la operación.
   */
  async getJson<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'GET' });
  }

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Expone "postJson" en smart-economat-backend (Nest).
   * @undefined {string} path - Entrada efectiva esperada por el contrato.
   * @undefined {unknown} body - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<T>} Datos efectivos después de ejecutar la operación.
   */
  async postJson<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>(path, { method: 'POST', body });
  }

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Expone "postMultipart" en smart-economat-backend (Nest).
   * @undefined {string} path - Entrada efectiva esperada por el contrato.
   * @undefined {Record<string, string | Blob>} form - Entrada efectiva esperada por el contrato.
   * @undefined {string | undefined} tokenOverride - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<T>} Datos efectivos después de ejecutar la operación.
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
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Expone "patchJson" en smart-economat-backend (Nest).
   * @undefined {string} path - Entrada efectiva esperada por el contrato.
   * @undefined {unknown} body - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<T>} Datos efectivos después de ejecutar la operación.
   */
  async patchJson<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>(path, { method: 'PATCH', body });
  }

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Expone "putJson" en smart-economat-backend (Nest).
   * @undefined {string} path - Entrada efectiva esperada por el contrato.
   * @undefined {unknown} body - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<T>} Datos efectivos después de ejecutar la operación.
   */
  async putJson<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>(path, { method: 'PUT', body });
  }

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Elimina o marca entidades siguendo las políticas configuradas.
   * @undefined {string} path - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<T>} Datos efectivos después de ejecutar la operación.
   */
  async deleteJson<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'DELETE' });
  }

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Expone "requestJson" en smart-economat-backend (Nest).
   * @undefined {string} path - Entrada efectiva esperada por el contrato.
   * @undefined {{ method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE"; body?: unknown; auth?: boolean; tokenOverride?: string; }} options - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<T>} Datos efectivos después de ejecutar la operación.
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
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Expone "withConcurrency" en smart-economat-backend (Nest).
   * @undefined {() => Promise<T>} task - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<T>} Datos efectivos después de ejecutar la operación.
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
   * Ejecuta la lógica de delay dentro del flujo de la aplicación.
   *
   * @param ms Parámetro de entrada para la operación.
   * @returns Valor resultante de la operación.
   */
  async delay(ms: number): Promise<void> {
    await new Promise((resolveDelay) => setTimeout(resolveDelay, ms));
  }

  /**
   * Ejecuta la lógica de close dentro del flujo de la aplicación.
   * @returns Valor resultante de la operación.
   */
  /**
   * Expone "close" en smart-economat-backend (Nest).
   * @undefined {Promise<void>} Datos efectivos después de ejecutar la operación.
   */
  close(): Promise<void> {
    this.logRaw(`=== SEED HTTP LOG END ${this.nextLogTimestamp()} ===\n\n`);
    return Promise.resolve();
  }

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Obtiene valores o vistas materializadas.
   * @undefined {unknown} token - Entrada efectiva esperada por el contrato.
   * @undefined {T} Datos efectivos después de ejecutar la operación.
   */
  get<T>(token: unknown): T {
    void token;
    return undefined as T;
  }

  /**
   * Obtiene data source.
   * @returns Valor resultante de la operación.
   */
  /**
   * Obtiene valores o vistas materializadas.
   * @undefined {any} Datos efectivos después de ejecutar la operación.
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
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Obtiene valores o vistas materializadas.
   * @undefined {unknown} entity - Entrada efectiva esperada por el contrato.
   * @undefined {T} Datos efectivos después de ejecutar la operación.
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
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Expone "transaction" en smart-economat-backend (Nest).
   * @undefined {(queryRunner: any) => Promise<T>} callback - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<T>} Datos efectivos después de ejecutar la operación.
   */
  async transaction<T>(callback: (queryRunner: any) => Promise<T>): Promise<T> {
    return callback({
      manager: {
        save: (input: unknown) => Promise.resolve(input),
      },
    });
  }

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Expone "validateDto" en smart-economat-backend (Nest).
   * @undefined {unknown} dtoClass - Entrada efectiva esperada por el contrato.
   * @undefined {unknown} payload - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<T>} Datos efectivos después de ejecutar la operación.
   */
  validateDto<T extends object>(
    dtoClass: unknown,
    payload: unknown
  ): Promise<T> {
    void dtoClass;
    return Promise.resolve(payload as T);
  }

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Expone "find" en smart-economat-backend (Nest).
   * @undefined {unknown} entity - Entrada efectiva esperada por el contrato.
   * @undefined {unknown} options - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<T[]>} Datos efectivos después de ejecutar la operación.
   */
  find<T>(entity: unknown, options?: unknown): Promise<T[]> {
    void entity;
    void options;
    return Promise.resolve([] as T[]);
  }

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Expone "findOne" en smart-economat-backend (Nest).
   * @undefined {unknown} entity - Entrada efectiva esperada por el contrato.
   * @undefined {unknown} options - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<T | null>} Datos efectivos después de ejecutar la operación.
   */
  findOne<T>(entity: unknown, options: unknown): Promise<T | null> {
    void entity;
    void options;
    return Promise.resolve(null);
  }

  /**
   * Ejecuta la lógica de count dentro del flujo de la aplicación.
   *
   * @param entity Parámetro de entrada para la operación.
   * @param where Parámetro de entrada para la operación. Opcional.
   * @returns Valor resultante de la operación.
   */
  count(entity: unknown, where?: unknown): Promise<number> {
    void entity;
    void where;
    return Promise.resolve(0);
  }

  /**
   * Obtiene seed actor user id.
   * @returns Valor resultante de la operación.
   */
  /**
   * Obtiene valores o vistas materializadas.
   * @undefined {Promise<string>} Datos efectivos después de ejecutar la operación.
   */
  getSeedActorUserId(): Promise<string> {
    return Promise.resolve('');
  }

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
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
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  private async parseResponseBody(
    response: Response
  ): Promise<Record<string, unknown> | string | null> {
    return parseSeedResponseBody(response);
  }

  /**
   * Calcula backoff ms según las reglas de negocio.
   *
   * @param attempt Parámetro de entrada para la operación.
   * @returns Valor resultante de la operación.
   */
  private computeBackoffMs(attempt: number): number {
    return computeSeedBackoffMs(this.backoffBaseMs, this.backoffMaxMs, attempt);
  }

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  private async fetchWithTimeoutAt(
    url: string,
    init: RequestInit,
    timeoutMs: number
  ): Promise<Response> {
    const controller = new AbortController();
    const safeMs = Math.max(500, timeoutMs);
    const timeoutId = setTimeout(() => controller.abort(), safeMs);

    try {
      return await fetch(url, {
        ...init,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async fetchWithTimeout(
    url: string,
    init: RequestInit
  ): Promise<Response> {
    return this.fetchWithTimeoutAt(url, init, this.requestTimeoutMs);
  }

  /**
   * Parsea y valida retry after ms.
   *
   * @param headerValue Parámetro de entrada para la operación.
   * @returns Valor resultante de la operación.
   */
  private parseRetryAfterMs(headerValue: string | null): number | undefined {
    return parseSeedRetryAfterMs(headerValue);
  }

  /**
   * Ejecuta la lógica de acquire slot dentro del flujo de la aplicación.
   * @returns Valor resultante de la operación.
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
   * Ejecuta la lógica de release slot dentro del flujo de la aplicación.
   */
  private releaseSlot(): void {
    this.inFlight = Math.max(0, this.inFlight - 1);
    const next = this.queue.shift();
    if (next) {
      next();
    }
  }

  /**
   * Ejecuta la lógica de log raw dentro del flujo de la aplicación.
   *
   * @param content Parámetro de entrada para la operación.
   */
  private logRaw(content: string): void {
    appendFileSync(this.logFilePath, content, 'utf8');
  }

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
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
   * Ejecuta la lógica de safe stringify dentro del flujo de la aplicación.
   *
   * @param value Parámetro de entrada para la operación.
   * @returns Valor resultante de la operación.
   */
  private safeStringify(value: unknown): string {
    return seedSafeStringify(value);
  }

  /**
   * Ejecuta la lógica de next log timestamp dentro del flujo de la aplicación.
   * @returns Valor resultante de la operación.
   */
  private nextLogTimestamp(): string {
    const timestamp = seedDateIso(0, this.logEventCursor);
    this.logEventCursor += 1;
    return timestamp;
  }
}
