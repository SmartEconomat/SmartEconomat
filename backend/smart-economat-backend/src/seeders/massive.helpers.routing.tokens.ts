import { SeedContext } from './seed-context';
import { Endpoint } from './massive.types';
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
  if (explicitTarget !== undefined) {
    return Math.min(
      MAX_SUCCESS_PER_ENDPOINT,
      Math.max(MIN_SUCCESS_PER_ENDPOINT, explicitTarget)
    );
  }
  return DEFAULT_TARGET_SUCCESS_PER_ENDPOINT;
}

export function isAdminFocusEndpoint(endpoint: Endpoint): boolean {
  return ADMIN_FOCUS_ENDPOINT_KEYS.has(`${endpoint.method} ${endpoint.path}`);
}

export function chooseTokenForPath(context: SeedContext, path: string): string {
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

  if (
    path === '/auth/change-password' ||
    path === '/usuarios/perfil/password'
  ) {
    return requireToken('seedTokenPasswordActor');
  }

  if (
    path === '/profesores/slots' ||
    path.startsWith('/profesores/slots/') ||
    path === '/profesores/alumnos' ||
    path.startsWith('/profesores/alumnos/')
  ) {
    return requireToken('seedTokenProfesor');
  }

  if (path === '/alumnos/change-profesor') {
    return pickFromPool(
      alumnoTokens,
      'seedTokenCursorAlumno',
      requireToken('seedTokenAlumno')
    );
  }

  if (path === '/auth/profile' || path.startsWith('/usuarios/perfil')) {
    const rolePool = [
      superAdminToken,
      ...adminTokens,
      ...profesorTokens,
      ...alumnoTokens,
    ].filter((token) => Boolean(token));
    return pickFromPool(rolePool, 'seedTokenCursorRolePool', superAdminToken);
  }

  if (path.startsWith('/admin')) {
    const adminPool = [superAdminToken, ...adminTokens].filter((token) =>
      Boolean(token)
    );
    return pickFromPool(adminPool, 'seedTokenCursorAdminPool', superAdminToken);
  }

  if (path.startsWith('/usuarios')) {
    return superAdminToken;
  }

  return superAdminToken;
}
