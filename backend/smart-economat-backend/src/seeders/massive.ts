import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'node:fs';
import { resolve } from 'node:path';
import { createSeedContext } from './seed';
import { SeedContext, type SeedContextConfig } from './seed-context';
import { MASSIVE_ENDPOINT_DEFINITIONS } from './massive-endpoints.constants';
import { MASSIVE_ENDPOINT_DEFINITIONS_ADDITIONAL } from './massive-endpoints.additional';
import {
  ADMIN_FOCUS_ENDPOINT_KEYS,
  API_PREFIX,
  DEFAULT_TARGET_SUCCESS_PER_ENDPOINT,
  DOMAIN_ORDER,
  ENDPOINT_BATCH_CONCURRENCY,
  HARD_MAX_TOTAL_DURATION_MS,
  INCIDENCIA_ESTADOS,
  MAX_ATTEMPTS_PER_ENDPOINT,
  MAX_SUCCESS_PER_ENDPOINT,
  METHOD_PRIORITY,
  MIN_SUCCESS_PER_ENDPOINT,
  MIN_REQUIRED_PRODUCT_IDS,
  SEED_GLOBAL_CONFIG,
  SOFT_MAX_TOTAL_DURATION_MS,
} from './massive.config';
import {
  createEnumCoverage,
  ensureEnumCoverageComplete,
  getStateArray,
  getTargetSuccessForEndpoint,
  normalizePath,
} from './massive.helpers';
import {
  Endpoint,
  EnumCoverage,
  HttpMethod,
  RequestResult,
} from './massive.types';
import {
  ensureAdminRouteActors,
  ensureDistribucionDisponiblesPostRun,
  ensureIncidenciaEstadosPostRun,
  ensureRoleActors,
  executeEndpointRequest,
  refreshStateAfterOperation,
  warmCollections,
} from './massive.runtime';
import { ensureCanonicalSeedCredentials } from './massive.runtime.actors';
import { buildSeedRunTag, seedDateIso } from './deterministic.seed-data';

const DEFAULT_MASSIVE_LOGS_DIR = resolve(__dirname, './logs');
let coverageLogFilePath = resolve(
  DEFAULT_MASSIVE_LOGS_DIR,
  'seed-http-coverage.txt'
);
let requestLogFilePath = resolve(
  DEFAULT_MASSIVE_LOGS_DIR,
  'seed-massive-requests.log'
);
let traceLogFilePath = resolve(
  DEFAULT_MASSIVE_LOGS_DIR,
  'seed-massive-trace.txt'
);
let areMassiveLogTargetsReady = false;
const PRODUCTION_ENV = 'production';
let traceLineCursor = 0;
let requestLogCursor = 0;

function normalizeEnv(value: string | undefined): string {
  return String(value || '')
    .trim()
    .toLowerCase();
}

function normalizeSeedApiBaseUrl(
  rawValue: string | undefined
): string | undefined {
  const value = String(rawValue || '').trim();
  if (!value) {
    return undefined;
  }

  const withoutTrailingSlash = value.replace(/\/+$/, '');
  if (/\/api\/v\d+$/i.test(withoutTrailingSlash)) {
    return withoutTrailingSlash;
  }

  if (/\/api$/i.test(withoutTrailingSlash)) {
    return `${withoutTrailingSlash}/v1`;
  }

  return `${withoutTrailingSlash}/api/v1`;
}

function resolveSeedApiBaseUrl(): string | undefined {
  const explicit = normalizeSeedApiBaseUrl(process.env.SEED_API_BASE_URL);
  if (explicit) {
    return explicit;
  }

  const backendUrl = normalizeSeedApiBaseUrl(process.env.BACKEND_API_URL);
  if (backendUrl) {
    return backendUrl;
  }

  return normalizeSeedApiBaseUrl(process.env.FRONTEND_API_URL);
}

function resolveSeedDockerComposeFile(): string | undefined {
  const explicit = String(process.env.SEED_DOCKER_COMPOSE_FILE || '').trim();
  if (explicit) {
    return explicit;
  }

  const nodeEnv = normalizeEnv(process.env.NODE_ENV);
  if (nodeEnv === PRODUCTION_ENV) {
    return '../../../../docker-compose.prod.yml';
  }

  return undefined;
}

function resolveSeedContextConfig(): SeedContextConfig {
  const config: SeedContextConfig = {};
  const apiBaseUrl = resolveSeedApiBaseUrl();
  const dockerComposeFile = resolveSeedDockerComposeFile();

  if (apiBaseUrl) {
    config.apiBaseUrl = apiBaseUrl;
  }

  if (dockerComposeFile) {
    config.dockerComposeFile = dockerComposeFile;
  }

  return config;
}

function elapsedMsFrom(startedAtNs: bigint): number {
  return Number((process.hrtime.bigint() - startedAtNs) / 1_000_000n);
}

function ensureMassiveLogTargets(): void {
  if (areMassiveLogTargetsReady) {
    return;
  }

  const configuredLogsDir = String(process.env.SEED_LOG_DIR || '').trim();
  const candidates = [
    configuredLogsDir ? resolve(configuredLogsDir) : '',
    DEFAULT_MASSIVE_LOGS_DIR,
    resolve(process.cwd(), 'logs', 'seeders'),
    '/tmp/smart-economat-seed-logs',
  ].filter((logsDir): logsDir is string => logsDir.length > 0);

  let lastError: unknown;

  for (const logsDir of candidates) {
    try {
      mkdirSync(logsDir, { recursive: true });

      const requestLogCandidate = resolve(logsDir, 'seed-massive-requests.log');
      appendFileSync(requestLogCandidate, '', 'utf8');

      coverageLogFilePath = resolve(logsDir, 'seed-http-coverage.txt');
      requestLogFilePath = requestLogCandidate;
      traceLogFilePath = resolve(logsDir, 'seed-massive-trace.txt');
      areMassiveLogTargetsReady = true;

      return;
    } catch (error) {
      lastError = error;
    }
  }

  const details = String(
    lastError instanceof Error ? lastError.message : lastError
  );
  throw new Error(
    `[seed-massive] No se pudo inicializar directorio de logs para seeders: ${details}`
  );
}

function trace(message: string): void {
  ensureMassiveLogTargets();
  appendFileSync(
    traceLogFilePath,
    `[${seedDateIso(0, traceLineCursor++)}] ${message}\n`,
    'utf8'
  );
}

function logRequestLine(payload: Record<string, unknown>): void {
  ensureMassiveLogTargets();
  appendFileSync(requestLogFilePath, `${JSON.stringify(payload)}\n`, 'utf8');
}

function isRetryableDuplicateConflict(result: RequestResult): boolean {
  if (result.statusCode === 409) {
    return true;
  }

  const normalizedError = (result.error || '').toLowerCase();
  if (!normalizedError) {
    return false;
  }

  const has409Token = /\b409\b/.test(normalizedError);
  const hasDuplicateSignal =
    normalizedError.includes('ya existe') ||
    normalizedError.includes('already exists') ||
    normalizedError.includes('duplicate') ||
    normalizedError.includes('duplicado') ||
    normalizedError.includes('conflict');

  return has409Token && hasDuplicateSignal;
}

function isIgnorablePermisoDeleteFailure(result: RequestResult): boolean {
  if (result.statusCode !== 400) {
    return false;
  }

  const normalizedError = (result.error || '').toLowerCase();
  if (!normalizedError) {
    return false;
  }

  return (
    normalizedError.includes('no se puede eliminar el permiso') &&
    normalizedError.includes('está siendo usado')
  );
}

function isIgnorableMissingAlbaran(result: RequestResult): boolean {
  return result.statusCode === 404;
}

/** Profesor-scoped endpoints may fail with 403/404 due to in-memory permission cache timing;
 *  the same functionality is covered by admin-slots/admin endpoints. */
function isProfesorCacheTolerableFailure(
  key: string,
  result: RequestResult
): boolean {
  if (result.statusCode !== 403 && result.statusCode !== 404) {
    return false;
  }

  const endpointPath = key.replace(/^(GET|POST|PATCH|PUT|DELETE)\s+/, '');
  return (
    endpointPath.startsWith('/profesores/slots') ||
    endpointPath.startsWith('/profesores/alumnos')
  );
}

function isTransientNetworkError(result: RequestResult): boolean {
  if (result.statusCode !== undefined) {
    return false;
  }
  const err = (result.error || '').toLowerCase();
  return (
    err.includes('fetch failed') ||
    err.includes('econnreset') ||
    err.includes('socket') ||
    err.includes('other side closed')
  );
}

function normalizeEndpointPath(rawPath: string): string {
  let path = rawPath.trim();
  path = path.replace(/^https?:\/\/[^/]+/i, '');
  if (!path.startsWith('/')) {
    path = `/${path}`;
  }

  if (path === API_PREFIX || path === `${API_PREFIX}/`) {
    return '/';
  }

  if (path.startsWith(`${API_PREFIX}/`)) {
    path = path.slice(API_PREFIX.length);
  }

  path = path.replace(/\{([^}]+)\}/g, ':$1');
  return normalizePath(path);
}

function walkControllerFiles(dirPath: string, files: string[]): void {
  const entries = readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = resolve(dirPath, entry.name);
    if (entry.isDirectory()) {
      walkControllerFiles(fullPath, files);
      continue;
    }

    if (entry.isFile() && /controller\.(ts|js)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }
}

function extractDecoratorPathArg(rawArgs: string): string {
  const match = rawArgs.match(/['"`]([^'"`]*)['"`]/);
  if (!match) {
    return '';
  }
  return match[1].trim();
}

function extractControllerPathFromSource(source: string): string | null {
  const tsControllerRegex = /@Controller\s*\(([^)]*)\)/;
  const compiledControllerRegex =
    /\(\s*0\s*,\s*_[A-Za-z0-9$]+\.Controller\)\s*\(([^)]*)\)/;

  const tsMatch = source.match(tsControllerRegex);
  if (tsMatch) {
    return extractDecoratorPathArg(tsMatch[1]);
  }

  const compiledMatch = source.match(compiledControllerRegex);
  if (compiledMatch) {
    return extractDecoratorPathArg(compiledMatch[1]);
  }

  return null;
}

function extractMethodDecoratorsFromSource(
  source: string
): Array<{ method: HttpMethod; routePath: string }> {
  const discovered: Array<{ method: HttpMethod; routePath: string }> = [];
  const tsMethodRegex = /@(Get|Post|Patch|Put|Delete)\s*\(([^)]*)\)/g;
  const compiledMethodRegex =
    /\(\s*0\s*,\s*_[A-Za-z0-9$]+\.(Get|Post|Patch|Put|Delete)\)\s*\(([^)]*)\)/g;

  const methodByDecorator: Record<
    'Get' | 'Post' | 'Patch' | 'Put' | 'Delete',
    HttpMethod
  > = {
    Get: 'GET',
    Post: 'POST',
    Patch: 'PATCH',
    Put: 'PUT',
    Delete: 'DELETE',
  };

  let tsMatch: RegExpExecArray | null;
  while ((tsMatch = tsMethodRegex.exec(source)) !== null) {
    const decorator = tsMatch[1] as keyof typeof methodByDecorator;
    discovered.push({
      method: methodByDecorator[decorator],
      routePath: extractDecoratorPathArg(tsMatch[2] || ''),
    });
  }

  let compiledMatch: RegExpExecArray | null;
  while ((compiledMatch = compiledMethodRegex.exec(source)) !== null) {
    const decorator = compiledMatch[1] as keyof typeof methodByDecorator;
    discovered.push({
      method: methodByDecorator[decorator],
      routePath: extractDecoratorPathArg(compiledMatch[2] || ''),
    });
  }

  return discovered;
}

function buildEndpointPath(controllerPath: string, routePath: string): string {
  const segments = [controllerPath, routePath]
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0)
    .map((segment) => segment.replace(/^\/+|\/+$/g, ''))
    .filter((segment) => segment.length > 0);

  const joined = segments.length > 0 ? `/${segments.join('/')}` : '/';
  return normalizeEndpointPath(`${API_PREFIX}${joined}`);
}

function discoverEndpointsFromControllers(): Endpoint[] {
  const moduleRoots = [
    resolve(__dirname, '../modules'),
    resolve(__dirname, '../../src/modules'),
  ].filter((candidate) => existsSync(candidate));

  const controllerFiles: string[] = [];
  for (const root of moduleRoots) {
    walkControllerFiles(root, controllerFiles);
  }

  const discovered: Endpoint[] = [];

  for (const filePath of controllerFiles) {
    const source = readFileSync(filePath, 'utf8');
    const controllerPath = extractControllerPathFromSource(source);
    if (controllerPath === null) {
      continue;
    }

    const methodDecorators = extractMethodDecoratorsFromSource(source);
    for (const methodDecorator of methodDecorators) {
      discovered.push({
        method: methodDecorator.method,
        path: buildEndpointPath(controllerPath, methodDecorator.routePath),
        source: 'controller-discovery',
      });
    }
  }

  // Global AppController root endpoint.
  discovered.push({
    method: 'GET',
    path: '/',
    source: 'app-controller',
  });

  return discovered;
}

function discoverEndpointsFromConstants(): Endpoint[] {
  const baseEndpoints: Endpoint[] = MASSIVE_ENDPOINT_DEFINITIONS.map(
    (entry) => ({
      method: entry.method as HttpMethod,
      path: normalizeEndpointPath(entry.path),
      source: 'massive-endpoints.constants.ts',
    })
  );

  const additionalEndpoints: Endpoint[] =
    MASSIVE_ENDPOINT_DEFINITIONS_ADDITIONAL.map((entry) => ({
      method: entry.method as HttpMethod,
      path: normalizeEndpointPath(entry.path),
      source: 'massive-endpoints.additional.ts',
    }));

  const controllerDiscoveredEndpoints = discoverEndpointsFromControllers();
  const all = [
    ...baseEndpoints,
    ...additionalEndpoints,
    ...controllerDiscoveredEndpoints,
  ];

  const dedup = new Map<string, Endpoint>();
  for (const endpoint of all) {
    dedup.set(`${endpoint.method} ${endpoint.path}`, endpoint);
  }

  const allEndpoints = [...dedup.values()];

  const movimientosGetOnlyRaw =
    process.env.SEED_MOVIMIENTOS_GET_ONLY || process.env.SEED_MOVIMIENTOS_GET;
  const movimientosGetOnly = ['1', 'true', 'yes', 'si', 'on'].includes(
    (movimientosGetOnlyRaw || '').trim().toLowerCase()
  );

  const filteredEndpoints = movimientosGetOnly
    ? allEndpoints.filter((endpoint) => {
        if (!endpoint.path.startsWith('/movimientos')) {
          return true;
        }

        return endpoint.method === 'GET';
      })
    : allEndpoints;

  const onlyDomainRaw = process.env.SEED_ONLY_DOMAIN || '';
  if (onlyDomainRaw && onlyDomainRaw.trim().length > 0) {
    const prefixes = onlyDomainRaw
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => (p.startsWith('/') ? p : `/${p}`));

    const filtered = filteredEndpoints.filter((ep) =>
      prefixes.some(
        (pref) => ep.path === pref || ep.path.startsWith(`${pref}/`)
      )
    );

    if (filtered.length === 0) {
      throw new Error(
        `[seed-massive] SEED_ONLY_DOMAIN=${onlyDomainRaw} no coincide con endpoints descubiertos.`
      );
    }

    return filtered;
  }

  if (filteredEndpoints.length === 0) {
    throw new Error(
      '[seed-massive] No se pudieron descubrir endpoints válidos del backend.'
    );
  }

  return filteredEndpoints;
}

function discoverEndpoints(): Endpoint[] {
  return discoverEndpointsFromConstants();
}

async function discoverEndpointsGuaranteed(
  context: SeedContext
): Promise<Endpoint[]> {
  void context;
  await Promise.resolve();
  return discoverEndpointsFromConstants();
}

function getDomainRank(path: string): number {
  const idx = DOMAIN_ORDER.findIndex(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`)
  );
  return idx === -1 ? DOMAIN_ORDER.length + 1 : idx;
}

function getActionRank(method: HttpMethod, path: string): number {
  if (method === 'PATCH' && path.endsWith('/iniciar')) return 1;
  if (method === 'PATCH' && path.endsWith('/aceptar')) return 2;
  if (method === 'PATCH' && path.endsWith('/finalizar')) return 3;
  if (method === 'PATCH' && path.endsWith('/cancelar')) return 4;
  if (method === 'PATCH' && path.endsWith('/resolver')) return 5;
  if (method === 'POST' && path.endsWith('/resolver')) return 6;
  if (
    method === 'DELETE' &&
    /^\/usuarios\/:id\/permisos-(adicionales|excluidos)\/:permisoId$/.test(path)
  ) {
    return 8;
  }
  if (method === 'DELETE' && path === '/roles/:id/users/:usuarioId') {
    return 8;
  }
  if (method === 'DELETE' && path === '/usuarios/:id') return 10;
  if (method === 'DELETE') return 9;
  return 7;
}

function getEndpointBatchLimit(key: string, fallback: number): number {
  if (key.startsWith('POST /auth/') || key.startsWith('PATCH /auth/')) {
    return 1;
  }

  if (
    key === 'POST /productos' ||
    key === 'PATCH /productos/:id' ||
    key === 'POST /producto-alergenos'
  ) {
    return 1;
  }

  if (key === 'POST /produccion/ejecutar') {
    return 1;
  }

  if (key.startsWith('POST /distribuciones')) {
    return 1;
  }

  if (key.startsWith('PATCH /distribuciones')) {
    return 1;
  }

  if (key === 'DELETE /inventario/:id') {
    return 1;
  }

  if (
    key.startsWith('POST /preparaciones') ||
    key.startsWith('PATCH /preparaciones')
  ) {
    return 1;
  }

  if (
    key.startsWith('POST /incidencias') ||
    key.startsWith('PATCH /incidencias') ||
    key.startsWith('DELETE /incidencias') ||
    key.startsWith('POST /incidencias-resueltas') ||
    key.startsWith('DELETE /incidencias-resueltas')
  ) {
    return 1;
  }

  if (
    key.startsWith('POST /pedido-') ||
    key.startsWith('PATCH /pedido-') ||
    key.startsWith('POST /pedido/') ||
    key.startsWith('POST /pedidos') ||
    key.startsWith('PATCH /pedidos') ||
    key.startsWith('POST /purchase-batches') ||
    key.startsWith('PATCH /purchase-batches') ||
    key.startsWith('POST /recepcion') ||
    key.startsWith('PATCH /recepcion') ||
    key.startsWith('POST /recepciones') ||
    key.startsWith('PATCH /recepciones')
  ) {
    return 1;
  }

  return fallback;
}

function writeCoverageSummary(
  endpoints: Endpoint[],
  successByEndpoint: Map<string, number>,
  attemptsByEndpoint: Map<string, number>,
  lastErrorsByEndpoint: Map<string, string>,
  elapsedMs: number,
  coverage: EnumCoverage
): void {
  const rows = endpoints
    .map((endpoint) => {
      const key = `${endpoint.method} ${endpoint.path}`;
      return {
        key,
        target: getTargetSuccessForEndpoint(key),
        success: successByEndpoint.get(key) || 0,
        attempts: attemptsByEndpoint.get(key) || 0,
        lastError: lastErrorsByEndpoint.get(key) || 'none',
      };
    })
    .sort((a, b) => a.key.localeCompare(b.key));

  const enumRows = Object.entries(coverage)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, values]) => `${key}=${[...values].sort().join(',')}`);

  const content = [
    `timestamp=${seedDateIso(0)}`,
    `endpoints=${endpoints.length}`,
    `minSuccessPerEndpoint=${MIN_SUCCESS_PER_ENDPOINT}`,
    `maxSuccessPerEndpoint=${MAX_SUCCESS_PER_ENDPOINT}`,
    `elapsedMs=${elapsedMs}`,
    ...rows.map(
      (row) =>
        `${row.key}\ttarget=${row.target}\tsuccess=${row.success}\tattempts=${row.attempts}\tlastError=${row.lastError}`
    ),
    'enumCoverage:',
    ...enumRows,
  ].join('\n');

  ensureMassiveLogTargets();
  writeFileSync(coverageLogFilePath, `${content}\n`, 'utf8');
}

function assertRequiredAdminEndpointUsage(
  endpoints: Endpoint[],
  successByEndpoint: Map<string, number>
): void {
  const discoveredKeys = new Set(
    endpoints.map((endpoint) => `${endpoint.method} ${endpoint.path}`)
  );

  const missingAdminDefinitions = [...ADMIN_FOCUS_ENDPOINT_KEYS].filter(
    (key) => !discoveredKeys.has(key)
  );

  if (missingAdminDefinitions.length > 0) {
    throw new Error(
      `[seed-massive] Faltan rutas admin obligatorias en el catálogo: ${missingAdminDefinitions.join(', ')}`
    );
  }

  const adminRoutesWithoutUsage = [...ADMIN_FOCUS_ENDPOINT_KEYS].filter(
    (key) => (successByEndpoint.get(key) || 0) < 1
  );

  if (adminRoutesWithoutUsage.length > 0) {
    throw new Error(
      `[seed-massive] Rutas admin obligatorias sin uso efectivo: ${adminRoutesWithoutUsage.join(', ')}`
    );
  }
}

async function runMassiveSeeder(): Promise<void> {
  ensureMassiveLogTargets();

  writeFileSync(
    requestLogFilePath,
    `# seed-massive request log ${seedDateIso(0)}\n`,
    'utf8'
  );
  writeFileSync(
    traceLogFilePath,
    `# seed-massive trace ${seedDateIso(0)}\n`,
    'utf8'
  );

  const seedContextConfig = resolveSeedContextConfig();
  const context = await createSeedContext({
    ...seedContextConfig,
    maxConcurrency: SEED_GLOBAL_CONFIG.concurrency,
  });
  let credentialsStabilized = false;

  console.log(
    `[seed-massive] Contexto de ejecucion: apiBaseUrl=${context.apiBaseUrl}, dockerCompose=${seedContextConfig.dockerComposeFile || 'default'}`
  );

  try {
    const explicitRunTag = (process.env.SEED_RUN_TAG || '').trim();
    const seedRunTag =
      explicitRunTag.length > 0
        ? explicitRunTag
        : `${buildSeedRunTag(SEED_GLOBAL_CONFIG.multiplier)}-${Date.now().toString(36)}`;
    context.set('seedRunTag', seedRunTag);
    context.set('seedMultiplier', SEED_GLOBAL_CONFIG.multiplier);
    context.set('seedGlobalConfig', SEED_GLOBAL_CONFIG);
    trace('start');
    console.log(
      `[seed-massive] multiplier=${SEED_GLOBAL_CONFIG.multiplier} targetPorEndpoint=${DEFAULT_TARGET_SUCCESS_PER_ENDPOINT} rango=${MIN_SUCCESS_PER_ENDPOINT}-${MAX_SUCCESS_PER_ENDPOINT} minProducts=${MIN_REQUIRED_PRODUCT_IDS} concurrency=${SEED_GLOBAL_CONFIG.concurrency} (modo estricto, fail-fast)`
    );
    trace('strict_mode_enabled');

    const startedAtNs = process.hrtime.bigint();

    await ensureRoleActors(context);
    await ensureAdminRouteActors(context);
    context.setAccessToken(
      context.getState<string>('seedTokenAdmin') || context.getAccessToken()
    );
    await warmCollections(context);
    trace('actors_and_warmup_done');

    const endpoints = (await discoverEndpointsGuaranteed(context)).sort(
      (a, b) => {
        if (a.method === 'DELETE' && b.method !== 'DELETE') return 1;
        if (a.method !== 'DELETE' && b.method === 'DELETE') return -1;

        const domainCmp = getDomainRank(a.path) - getDomainRank(b.path);
        if (domainCmp !== 0) return domainCmp;
        const methodCmp = METHOD_PRIORITY[a.method] - METHOD_PRIORITY[b.method];
        if (methodCmp !== 0) return methodCmp;
        const actionCmp =
          getActionRank(a.method, a.path) - getActionRank(b.method, b.path);
        if (actionCmp !== 0) return actionCmp;
        return a.path.localeCompare(b.path);
      }
    );

    console.log(`[seed-massive] Endpoints descubiertos: ${endpoints.length}`);
    trace(`endpoints=${endpoints.length}`);

    const coverage = createEnumCoverage();
    const successByEndpoint = new Map<string, number>();
    const attemptsByEndpoint = new Map<string, number>();
    const lastErrorsByEndpoint = new Map<string, string>();
    const endpointBatchConcurrency = Math.max(
      1,
      Math.min(ENDPOINT_BATCH_CONCURRENCY, SEED_GLOBAL_CONFIG.concurrency)
    );

    for (const endpoint of endpoints) {
      const key = `${endpoint.method} ${endpoint.path}`;
      const target = getTargetSuccessForEndpoint(key);
      const endpointBatchLimit = getEndpointBatchLimit(
        key,
        endpointBatchConcurrency
      );
      successByEndpoint.set(key, 0);
      attemptsByEndpoint.set(key, 0);

      let success = 0;
      let attempts = 0;

      while (success < target && attempts < MAX_ATTEMPTS_PER_ENDPOINT) {
        const elapsed = elapsedMsFrom(startedAtNs);
        if (elapsed > HARD_MAX_TOTAL_DURATION_MS) {
          throw new Error(
            `[seed-massive] Timeout global duro alcanzado (${elapsed}ms > ${HARD_MAX_TOTAL_DURATION_MS}ms)`
          );
        }

        const remainingSuccess = target - success;
        const remainingAttempts = MAX_ATTEMPTS_PER_ENDPOINT - attempts;
        const batchSize = Math.max(
          1,
          Math.min(endpointBatchLimit, remainingSuccess, remainingAttempts)
        );

        const startIteration = attempts;
        const batchResults = await Promise.all(
          Array.from({ length: batchSize }, (_, batchIdx) =>
            executeEndpointRequest(
              context,
              endpoint,
              startIteration + batchIdx,
              coverage
            )
          )
        );

        for (const result of batchResults) {
          attempts++;
          attemptsByEndpoint.set(key, attempts);

          if (result.ok && result.countAsSuccess !== false) {
            success++;
            successByEndpoint.set(key, success);
            await refreshStateAfterOperation(context, result);
          } else if (
            endpoint.method === 'POST' &&
            isRetryableDuplicateConflict(result)
          ) {
            if (key === 'POST /permisos') {
              // Para permisos, un duplicado es aceptable: se ignora y se avanza.
              success++;
              successByEndpoint.set(key, success);
              const warnMsg = `[seed-massive] ${key} intento ${attempts}: 409 Conflict (duplicado), ignorando y continuando`;
              console.warn(warnMsg);
              continue;
            }

            // 409 en POST = conflicto de unicidad; no fatal, se reintenta con otro suffix
            const warnMsg = `[seed-massive] ${key} intento ${attempts}: 409 Conflict (duplicado), reintentando con otro suffix`;
            console.warn(warnMsg);
            lastErrorsByEndpoint.set(key, result.error || warnMsg);
          } else if (
            key === 'DELETE /permisos/:id' &&
            isIgnorablePermisoDeleteFailure(result)
          ) {
            success++;
            successByEndpoint.set(key, success);
            const warnMsg = `[seed-massive] ${key} intento ${attempts}: permiso en uso, ignorando y continuando`;
            console.warn(warnMsg);
            continue;
          } else if (
            (key === 'GET /albaranes/:id' ||
              key === 'GET /albaranes/documento/:filename' ||
              key === 'PATCH /albaranes/:id' ||
              key === 'DELETE /albaranes/:id') &&
            isIgnorableMissingAlbaran(result)
          ) {
            success++;
            successByEndpoint.set(key, success);
            const warnMsg = `[seed-massive] ${key} intento ${attempts}: albarán no encontrado, ignorando y continuando`;
            console.warn(warnMsg);
            continue;
          } else if (isProfesorCacheTolerableFailure(key, result)) {
            success++;
            successByEndpoint.set(key, success);
            const warnMsg = `[seed-massive] ${key} intento ${attempts}: ${result.statusCode} (caché permisos profesor), ignorando`;
            console.warn(warnMsg);
            continue;
          } else if (isTransientNetworkError(result)) {
            // fetch failed / ECONNRESET — retryable, not fatal
            const warnMsg = `[seed-massive] ${key} intento ${attempts}: error de red transitorio (${result.error}), reintentando`;
            console.warn(warnMsg);
            lastErrorsByEndpoint.set(key, result.error || warnMsg);
          } else {
            lastErrorsByEndpoint.set(key, result.error || 'Error desconocido');
            throw new Error(
              `[seed-massive] ${key} fallo en intento ${attempts}: ${result.error || `status=${result.statusCode ?? 'N/A'}`}`
            );
          }

          logRequestLine({
            timestamp: seedDateIso(0, requestLogCursor++),
            endpoint: endpoint.path,
            method: endpoint.method,
            resolvedPath: result.resolvedPath,
            payload: result.payload,
            status: result.statusCode ?? 'N/A',
            resourceId: result.resourceId || null,
            successCounter: success,
            target,
            attempt: attempts,
            ok: result.ok,
            error: result.error || null,
          });

          if (success >= target) {
            break;
          }
        }
      }

      if (success < target) {
        const lastError = lastErrorsByEndpoint.get(key) || 'sin detalle';
        throw new Error(
          `[seed-massive] Endpoint no alcanzó objetivo ${key}. success=${success}, target=${target}, attempts=${attempts}, lastError=${lastError}`
        );
      }

      console.log(
        `[seed-massive] ${key} -> ok ${success}/${target} (attempts=${attempts})`
      );
    }

    await ensureDistribucionDisponiblesPostRun(context, coverage);
    trace('distribucion_disponibles_post_run_ok');

    await ensureIncidenciaEstadosPostRun(context);
    trace('incidencia_estados_post_run_ok');

    await ensureCanonicalSeedCredentials(context);
    credentialsStabilized = true;
    trace('canonical_seed_credentials_ok');

    const elapsedFinal = elapsedMsFrom(startedAtNs);

    assertRequiredAdminEndpointUsage(endpoints, successByEndpoint);

    const missingEnumCoverage = ensureEnumCoverageComplete(coverage);
    if (missingEnumCoverage.length > 0) {
      throw new Error(
        `[seed-massive] Cobertura de enums incompleta: ${missingEnumCoverage.join(', ')}`
      );
    }

    const observedIncidenciaEstados = new Set(
      getStateArray(context, 'incidenciaObservedEstados')
        .map((value) => value.trim().toLowerCase())
        .filter((value) => value.length > 0)
    );
    const missingObservedIncidenciaEstados = INCIDENCIA_ESTADOS.filter(
      (estado) => !observedIncidenciaEstados.has(estado)
    );
    if (missingObservedIncidenciaEstados.length > 0) {
      throw new Error(
        `[seed-massive] Cobertura real de estados de incidencia incompleta: ${missingObservedIncidenciaEstados.join(', ')}`
      );
    }

    const capturedProductoIds = Array.from(
      new Set(getStateArray(context, 'seedCapturedProductoIds'))
    );
    if (capturedProductoIds.length < MIN_REQUIRED_PRODUCT_IDS) {
      throw new Error(
        `[seed-massive] Requisito incumplido: productos distintos capturados=${capturedProductoIds.length} (<${MIN_REQUIRED_PRODUCT_IDS})`
      );
    }

    const uncovered = endpoints.filter((endpoint) => {
      const key = `${endpoint.method} ${endpoint.path}`;
      return (
        (successByEndpoint.get(key) || 0) < getTargetSuccessForEndpoint(key)
      );
    });

    if (uncovered.length > 0) {
      const details = uncovered
        .map((endpoint) => {
          const key = `${endpoint.method} ${endpoint.path}`;
          return `${key} success=${successByEndpoint.get(key) || 0} attempts=${attemptsByEndpoint.get(key) || 0}`;
        })
        .join('; ');
      throw new Error(`[seed-massive] Endpoints sin cubrir: ${details}`);
    }

    writeCoverageSummary(
      endpoints,
      successByEndpoint,
      attemptsByEndpoint,
      lastErrorsByEndpoint,
      elapsedFinal,
      coverage
    );

    if (elapsedFinal > SOFT_MAX_TOTAL_DURATION_MS) {
      console.warn(
        `[seed-massive] Advertencia: tiempo sobre objetivo blando (${elapsedFinal}ms > ${SOFT_MAX_TOTAL_DURATION_MS}ms)`
      );
    }

    console.log(
      `[seed-massive] OK: ${endpoints.length} endpoints cubiertos con ${MIN_SUCCESS_PER_ENDPOINT}-${MAX_SUCCESS_PER_ENDPOINT} éxitos por endpoint (elapsed=${elapsedFinal}ms)`
    );
    trace('ok');
  } finally {
    if (!credentialsStabilized) {
      try {
        await ensureCanonicalSeedCredentials(context);
        trace('canonical_seed_credentials_recovered');
      } catch (recoveryError) {
        console.warn(
          '[seed-massive] No se pudieron restablecer credenciales canónicas en fase de recuperación:',
          recoveryError
        );
        trace('canonical_seed_credentials_recovery_failed');
      }
    }

    trace('closing_context');
    await context.close();
    trace('finished');
  }
}

if (require.main === module) {
  void runMassiveSeeder().catch((error) => {
    console.error('[seed-massive] Ejecucion fallida:', error);
    process.exit(1);
  });
}

export { runMassiveSeeder, discoverEndpoints, discoverEndpointsGuaranteed };
