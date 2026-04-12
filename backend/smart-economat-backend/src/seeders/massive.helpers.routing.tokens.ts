import { SeedContext } from './seed-context';
import { Endpoint, HttpMethod } from './massive.types';
import {
  ADMIN_FOCUS_ENDPOINT_KEYS,
  DEFAULT_TARGET_SUCCESS_PER_ENDPOINT,
  MAX_SUCCESS_PER_ENDPOINT,
  MIN_SUCCESS_PER_ENDPOINT,
  PAGINATED_PATHS,
  PUBLIC_PATH_PREFIXES,
  SPECIAL_TARGETS,
} from './massive.config';
import { getStateArray } from './massive.state';

const SHARED_READER_PREFIXES = [
  '/dashboard',
  '/productos',
  '/recetas',
  '/proveedor',
  '/inventario/alertas',
  '/merma',
] as const;

const PROFESOR_OPERATION_PREFIXES = [
  '/pedidos',
  '/pedido-usuarios',
  '/purchase-batches',
  '/recepciones',
  '/recepcion-productos',
  '/incidencias',
  '/incidencias-resueltas',
  '/albaranes',
  '/preparaciones',
  '/produccion',
  '/archivos',
] as const;

function matchesAnyPrefix(path: string, prefixes: readonly string[]): boolean {
  return prefixes.some((prefix) => path.startsWith(prefix));
}

export function isPublicPath(path: string): boolean {
  return PUBLIC_PATH_PREFIXES.some((prefix) =>
    prefix === '/' ? path === '/' : path.startsWith(prefix)
  );
}

export function supportsPagination(path: string): boolean {
  return PAGINATED_PATHS.has(path);
}

export function getTargetSuccessForEndpoint(key: string): number {
  const explicitTarget = SPECIAL_TARGETS.get(key);
  const isRecepcionesOrDistribuciones =
    key.includes('/recepciones') || key.includes('/distribuciones');

  const scaleTargetForHeavyFlows = (target: number): number => {
    if (!isRecepcionesOrDistribuciones) {
      return target;
    }

    return Math.max(1, Math.ceil(target / 4));
  };

  if (explicitTarget !== undefined) {
    if (explicitTarget <= 0) {
      return 0;
    }

    const normalizedTarget = Math.min(
      MAX_SUCCESS_PER_ENDPOINT,
      Math.max(MIN_SUCCESS_PER_ENDPOINT, explicitTarget)
    );

    return scaleTargetForHeavyFlows(normalizedTarget);
  }

  return scaleTargetForHeavyFlows(DEFAULT_TARGET_SUCCESS_PER_ENDPOINT);
}

export function isAdminFocusEndpoint(endpoint: Endpoint): boolean {
  return ADMIN_FOCUS_ENDPOINT_KEYS.has(`${endpoint.method} ${endpoint.path}`);
}

export function chooseTokenForPath(
  context: SeedContext,
  path: string,
  method?: HttpMethod
): string {
  const superAdminToken =
    context.getState<string>('seedTokenSuperAdmin') ||
    context.getState<string>('seedTokenAdmin') ||
    context.getAccessToken();
  const adminTokens =
    context.getSessionTokensByPrefix('admin:').length > 0
      ? context.getSessionTokensByPrefix('admin:')
      : getStateArray(context, 'seedAdminTokens');
  const profesorTokens =
    context.getSessionTokensByPrefix('profesor:').length > 0
      ? context.getSessionTokensByPrefix('profesor:')
      : getStateArray(context, 'seedProfesorTokens');
  const alumnoTokens =
    context.getSessionTokensByPrefix('alumno:').length > 0
      ? context.getSessionTokensByPrefix('alumno:')
      : getStateArray(context, 'seedAlumnoTokens');

  const requireToken = (key: string): string => {
    const token = context.getState<string>(key);
    if (!token) {
      throw new Error(
        `[seed-massive] Falta token requerido en estado: ${key} (ruta=${path})`
      );
    }
    return token;
  };

  const pickFromPool = (
    values: string[],
    cursorKey: string,
    fallback: string
  ): string => {
    if (values.length === 0) {
      return fallback;
    }
    const cursor = context.getState<number>(cursorKey) || 0;
    context.set(cursorKey, cursor + 1);
    return values[cursor % values.length] || fallback;
  };

  const adminPool = [superAdminToken, ...adminTokens].filter((token) =>
    Boolean(token)
  );
  const profesorPool = [
    ...profesorTokens,
    context.getState<string>('seedTokenProfesor') || '',
  ].filter((token) => Boolean(token));
  const alumnoPool = [
    ...alumnoTokens,
    context.getState<string>('seedTokenAlumno') || '',
  ].filter((token) => Boolean(token));
  const adminFallbackToken = adminPool[0] || superAdminToken;

  const pickAdminPool = (): string => superAdminToken;
  const pickRealAdminPool = (): string => superAdminToken;
  const pickProfesorPool = (): string =>
    pickFromPool(
      profesorPool,
      'seedTokenCursorProfesorPool',
      adminFallbackToken
    );
  const pickAlumnoPool = (): string =>
    pickFromPool(
      alumnoPool,
      'seedTokenCursorAlumno',
      requireToken('seedTokenAlumno')
    );
  const pickReaderPool = (): string => superAdminToken;
  const pickOperationalPool = (): string => superAdminToken;

  if (
    path === '/auth/change-password' ||
    path === '/usuarios/perfil/password'
  ) {
    return requireToken('seedTokenPasswordActor');
  }

  if (path.startsWith('/profesores/slots/')) {
    if (method === 'PATCH') {
      return (
        context.getState<string>('seedTokenProfesor') || adminFallbackToken
      );
    }

    const segments = path.split('/');
    const slotId = segments[3] || '';
    const mapJson = context.getState<string>('seedSlotToProfesorIndex') || '{}';
    const slotOwnerMap: Record<string, number> = JSON.parse(mapJson);
    const pIdx = slotOwnerMap[slotId];
    if (pIdx !== undefined) {
      const token = context.getState<string>(
        `seedProfesorTokenByIndex:${pIdx}`
      );
      if (token) {
        return token;
      }
    }
    return context.getState<string>('seedTokenProfesor') || adminFallbackToken;
  }

  if (path === '/profesores/slots') {
    return pickProfesorPool();
  }

  if (path.startsWith('/profesores/alumnos/')) {
    const segments = path.split('/');
    const alumnoId = segments[3] || '';
    const mapJson =
      context.getState<string>('seedAlumnoToProfesorIndex') || '{}';
    const alumnoOwnerMap: Record<string, number> = JSON.parse(mapJson);
    const pIdx = alumnoOwnerMap[alumnoId];
    if (pIdx !== undefined) {
      const token = context.getState<string>(
        `seedProfesorTokenByIndex:${pIdx}`
      );
      if (token) return token;
    }
    return context.getState<string>('seedTokenProfesor') || adminFallbackToken;
  }

  if (path === '/profesores/alumnos') {
    return pickProfesorPool();
  }

  if (path === '/alumnos/change-profesor') {
    return (
      context.getState<string>('seedTokenAlumnoTransfer') ||
      requireToken('seedTokenAlumno')
    );
  }

  if (method === 'PATCH' && path.startsWith('/alumnos/')) {
    return pickAlumnoPool();
  }

  if (path === '/auth/profile' || path.startsWith('/usuarios/perfil')) {
    return pickReaderPool();
  }

  if (path.startsWith('/admin')) {
    return pickAdminPool();
  }

  if (path.startsWith('/usuarios')) {
    return pickAdminPool();
  }

  if (path === '/archivos/upload') {
    return pickRealAdminPool();
  }

  if (method === 'DELETE' && path.startsWith('/archivos/')) {
    return pickRealAdminPool();
  }

  if (path === '/productos/generar-ean13') {
    return pickAdminPool();
  }

  if (path === '/recepciones' && method === 'POST') {
    return pickAdminPool();
  }

  if (
    method === 'PATCH' &&
    (path.includes('/restaurar') || path.includes('/restore'))
  ) {
    return pickAdminPool();
  }

  if (path === '/merma/stats' || path === '/merma/kpis') {
    return pickOperationalPool();
  }

  if (method === 'GET' && path.startsWith('/proveedor/')) {
    return pickOperationalPool();
  }

  if (
    method === 'GET' &&
    (matchesAnyPrefix(path, SHARED_READER_PREFIXES) ||
      path === '/auth/profile' ||
      path.startsWith('/usuarios/perfil'))
  ) {
    return pickReaderPool();
  }

  if (
    path === '/incidencias/reportar' ||
    matchesAnyPrefix(path, PROFESOR_OPERATION_PREFIXES) ||
    path.startsWith('/profesores/slots') ||
    path.endsWith('/cocinar')
  ) {
    if (method === 'DELETE') {
      return pickAdminPool();
    }
    return pickOperationalPool();
  }

  return pickAdminPool();
}
