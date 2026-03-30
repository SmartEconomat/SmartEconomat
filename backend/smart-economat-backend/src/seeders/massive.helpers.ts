import { faker } from '@faker-js/faker';
import { SeedContext } from './seed-context';
import AppDataSource from '../config/typeorm.config';
import { Usuario } from '../modules/usuario/usuario.entity/usuario.entity';
import { UserStatus } from '../modules/usuario/enums/usuario.enums';
import { Endpoint, EnumCoverage, HttpMethod } from './massive.types';
import {
  ADMIN_FOCUS_ENDPOINT_KEYS,
  ALERGEN_VALUES,
  ALT_SEED_PASSWORD,
  DEFAULT_ADMIN_EMAIL,
  DEFAULT_SEED_PASSWORD,
  DEFAULT_TARGET_SUCCESS_PER_ENDPOINT,
  MAX_SUCCESS_PER_ENDPOINT,
  MOVIMIENTO_MANUAL_TYPES,
  MOVIMIENTO_TYPES,
  PAGINATED_PATHS,
  PRODUCT_TYPES,
  PRODUCT_UNITS,
  PUBLIC_PATH_PREFIXES,
  RECEPCION_ESTADO_PRODUCTO,
  RECEPCION_ESTADO_VISUAL,
  RECETA_DIFICULTAD,
  RECETA_UNIDADES,
  RESOLUCION_TIPOS,
  MERMA_MOTIVOS,
  INCIDENCIA_TIPOS,
  SPECIAL_TARGETS,
  USER_ROLES,
  USER_STATUSES,
} from './massive.config';

export function normalizePath(path: string): string {
  const withSlash = path.startsWith('/') ? path : `/${path}`;
  return withSlash.replace(/\/+/, '/').replace(/\/$/, '') || '/';
}

export function getStateArray(context: SeedContext, key: string): string[] {
  return context.getState<string[]>(key) || [];
}

export function setStateArray(
  context: SeedContext,
  key: string,
  values: string[]
): void {
  context.set(key, values);
}

export function pushStateValue(
  context: SeedContext,
  key: string,
  value: unknown
): void {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return;
  }

  const current = getStateArray(context, key);
  if (!current.includes(value)) {
    current.push(value);
    setStateArray(context, key, current);
  }
}

export function removeStateValue(
  context: SeedContext,
  key: string,
  value: string
): void {
  const current = getStateArray(context, key);
  if (current.length === 0) {
    return;
  }

  setStateArray(
    context,
    key,
    current.filter((item) => item !== value)
  );
}

export function consumeStateValue(
  context: SeedContext,
  key: string,
  fallback = ''
): string {
  const current = getStateArray(context, key);
  while (current.length > 0) {
    const candidate = current.shift();
    if (candidate && candidate.trim().length > 0) {
      setStateArray(context, key, current);
      return candidate;
    }
  }

  setStateArray(context, key, current);
  return fallback;
}

export function consumeRequiredStateValue(
  context: SeedContext,
  key: string
): string {
  const value = consumeStateValue(context, key, '');
  if (!value) {
    throw new Error(
      `[seed-massive] No hay IDs disponibles en estado "${key}" para consumir`
    );
  }
  return value;
}

export function pickStateValue(
  context: SeedContext,
  key: string,
  iteration: number,
  fallback = '',
  offset = 0
): string {
  const values = getStateArray(context, key);
  if (values.length === 0) {
    return fallback;
  }

  const idx = (iteration + offset) % values.length;
  return values[idx] || fallback;
}

export function pickRequiredStateValue(
  context: SeedContext,
  key: string,
  iteration: number,
  offset = 0
): string {
  const value = pickStateValue(context, key, iteration, '', offset);
  if (!value) {
    throw new Error(
      `[seed-massive] No hay IDs disponibles en estado "${key}" para seleccionar`
    );
  }
  return value;
}

export function getRequiredStateString(
  context: SeedContext,
  key: string
): string {
  const value = context.getState<string>(key);
  if (!value || value.trim().length === 0) {
    throw new Error(`[seed-massive] Falta valor requerido en estado "${key}"`);
  }
  return value;
}

export function normalizeIdentityValue(value: unknown): string {
  if (typeof value !== 'string') {
    return '';
  }
  return value.trim().toLowerCase();
}

export function findUserIdInResponseByIdentity(
  response: unknown,
  identity: { email?: string; username?: string }
): string | null {
  const expectedEmail = normalizeIdentityValue(identity.email);
  const expectedUsername = normalizeIdentityValue(identity.username);

  for (const entity of toEntityArray(response)) {
    const nestedUser = isRecord(entity.user) ? entity.user : null;

    const emailCandidates = [
      normalizeIdentityValue(entity.email),
      normalizeIdentityValue(entity.userEmail),
      normalizeIdentityValue(nestedUser?.email),
    ];

    const usernameCandidates = [
      normalizeIdentityValue(entity.username),
      normalizeIdentityValue(entity.userUsername),
      normalizeIdentityValue(nestedUser?.username),
    ];

    const emailMatches =
      expectedEmail.length > 0 && emailCandidates.includes(expectedEmail);
    const usernameMatches =
      expectedUsername.length > 0 &&
      usernameCandidates.includes(expectedUsername);

    if (!emailMatches && !usernameMatches) {
      continue;
    }

    const candidateIds = [entity.id, entity.userId, nestedUser?.id];
    for (const id of candidateIds) {
      if (typeof id === 'string' && id.trim().length > 0) {
        return id;
      }
    }
  }

  return null;
}

export function findProfesorIdByUserId(
  response: unknown,
  userId: string
): string | null {
  for (const entity of toEntityArray(response)) {
    if (typeof entity.id !== 'string' || entity.id.trim().length === 0) {
      continue;
    }

    if (entity.userId === userId) {
      return entity.id;
    }

    const nestedUser = isRecord(entity.user) ? entity.user : null;
    if (nestedUser?.id === userId) {
      return entity.id;
    }
  }

  return null;
}

export function extractClassCodeFromResponse(response: unknown): string | null {
  for (const entity of toEntityArray(response)) {
    const classCode = entity.codigoClase || entity.codigoSlot;
    if (typeof classCode === 'string' && classCode.trim().length > 0) {
      return classCode;
    }
  }

  return null;
}

export async function activateUserByIdentity(
  context: SeedContext,
  adminToken: string,
  identity: { email?: string; username?: string }
): Promise<string> {
  const activateUserInRepository = async (userId: string): Promise<void> => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    await AppDataSource.getRepository(Usuario).update(
      { id: userId } as any,
      {
        status: UserStatus.ACTIVE,
        activo: true,
        mustChangePassword: false,
      } as any
    );
  };

  context.setAccessToken(adminToken);

  for (let page = 1; page <= 8; page++) {
    const usersResponse = await context.requestJson<unknown>(
      `/usuarios?limit=50&page=${page}&sortBy=createdAt&order=DESC`,
      {
        method: 'GET',
      }
    );

    collectStateFromResponse(context, '/usuarios', usersResponse);

    const userId = findUserIdInResponseByIdentity(usersResponse, identity);
    if (!userId) {
      continue;
    }

    await activateUserInRepository(userId);

    return userId;
  }

  const identityLabel = identity.email || identity.username || 'desconocido';
  throw new Error(
    `[seed-massive] No se pudo localizar usuario para activar (${identityLabel})`
  );
}

export async function setUserRoleForSeed(
  context: SeedContext,
  adminToken: string,
  userId: string,
  role: string
): Promise<void> {
  context.setAccessToken(adminToken);

  await context.requestJson<unknown>(`/usuarios/${userId}/rol`, {
    method: 'PATCH',
    body: {
      rol: role,
    },
  });
}

export function pickByCursor<T>(context: SeedContext, values: readonly T[]): T {
  const cursor = context.getState<number>('seedEnumCursor') || 0;
  context.set('seedEnumCursor', cursor + 1);
  return values[cursor % values.length];
}

export function createEnumCoverage(): EnumCoverage {
  return {
    userRoles: new Set<string>(),
    userStatuses: new Set<string>(),
    productUnits: new Set<string>(),
    productTypes: new Set<string>(),
    allergens: new Set<string>(),
    movimientoTypes: new Set<string>(),
    movimientoManualTypes: new Set<string>(),
    recetaDificultad: new Set<string>(),
    recetaUnidades: new Set<string>(),
    incidenciaTipos: new Set<string>(),
    incidenciaResoluciones: new Set<string>(),
    mermaMotivos: new Set<string>(),
    recepcionEstadoVisual: new Set<string>(),
    recepcionEstadoProducto: new Set<string>(),
  };
}

export function markEnum(
  coverage: EnumCoverage,
  key: keyof EnumCoverage,
  value: string
): void {
  coverage[key].add(value);
}

export function ensureEnumCoverageComplete(coverage: EnumCoverage): string[] {
  const requirements: Array<{
    key: keyof EnumCoverage;
    values: readonly string[];
  }> = [
    { key: 'userRoles', values: USER_ROLES },
    { key: 'userStatuses', values: USER_STATUSES },
    { key: 'productUnits', values: PRODUCT_UNITS },
    { key: 'productTypes', values: PRODUCT_TYPES },
    { key: 'allergens', values: ALERGEN_VALUES },
    { key: 'movimientoTypes', values: MOVIMIENTO_TYPES },
    { key: 'movimientoManualTypes', values: MOVIMIENTO_MANUAL_TYPES },
    { key: 'recetaDificultad', values: RECETA_DIFICULTAD },
    { key: 'recetaUnidades', values: RECETA_UNIDADES },
    { key: 'incidenciaTipos', values: INCIDENCIA_TIPOS },
    { key: 'incidenciaResoluciones', values: RESOLUCION_TIPOS },
    { key: 'mermaMotivos', values: MERMA_MOTIVOS },
    { key: 'recepcionEstadoVisual', values: RECEPCION_ESTADO_VISUAL },
    { key: 'recepcionEstadoProducto', values: RECEPCION_ESTADO_PRODUCTO },
  ];

  const missing: string[] = [];
  for (const requirement of requirements) {
    for (const expected of requirement.values) {
      if (!coverage[requirement.key].has(expected)) {
        missing.push(`${requirement.key}:${expected}`);
      }
    }
  }

  return missing;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

export function toEntityArray(
  response: unknown
): Array<Record<string, unknown>> {
  const entities: Array<Record<string, unknown>> = [];

  const collect = (value: unknown): void => {
    if (Array.isArray(value)) {
      for (const item of value) {
        collect(item);
      }
      return;
    }

    if (!isRecord(value)) {
      return;
    }

    entities.push(value);

    for (const key of [
      'data',
      'items',
      'rows',
      'results',
      'lineas',
      'pedidoProductos',
      'productos',
      'proveedores',
      'alumnos',
      'ingredientes',
    ]) {
      const nested = value[key];
      if (Array.isArray(nested) || isRecord(nested)) {
        collect(nested);
      }
    }
  };

  collect(response);
  return entities;
}

export function extractResourceId(response: unknown): string | undefined {
  for (const entity of toEntityArray(response)) {
    if (typeof entity.id === 'string') {
      return entity.id;
    }
  }
  return undefined;
}

export function extractFilename(value: unknown): string | null {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return null;
  }

  const cleaned = value.split('?')[0].trim();
  const parts = cleaned.split('/').filter(Boolean);
  return parts.length > 0 ? parts[parts.length - 1] || null : null;
}

export function collectStateFromResponse(
  context: SeedContext,
  resolvedPath: string,
  response: unknown
): void {
  const entities = toEntityArray(response);

  for (const entity of entities) {
    const id = entity.id;

    if (resolvedPath.startsWith('/admin/roles'))
      pushStateValue(context, 'roleIds', id);
    if (resolvedPath.startsWith('/admin/permissions'))
      pushStateValue(context, 'permissionIds', id);

    if (resolvedPath.startsWith('/usuarios'))
      pushStateValue(context, 'usuarioIds', id);
    if (resolvedPath.startsWith('/proveedor'))
      pushStateValue(context, 'proveedorIds', id);
    if (resolvedPath.startsWith('/productos'))
      pushStateValue(context, 'productoIds', id);
    if (resolvedPath.startsWith('/producto-proveedor'))
      pushStateValue(context, 'productoProveedorIds', id);
    if (
      typeof entity.id === 'string' &&
      typeof entity.proveedorId === 'string'
    ) {
      pushStateValue(
        context,
        'productoProveedorToProveedorPairs',
        `${entity.id}|${entity.proveedorId}`
      );
    }
    if (resolvedPath.startsWith('/historial-precio'))
      pushStateValue(context, 'historialPrecioIds', id);
    if (resolvedPath.startsWith('/ubicacion'))
      pushStateValue(context, 'ubicacionIds', id);
    if (resolvedPath.startsWith('/inventario'))
      pushStateValue(context, 'inventarioIds', id);
    if (resolvedPath.startsWith('/pedido-usuarios'))
      pushStateValue(context, 'pedidoUsuarioIds', id);
    if (resolvedPath.startsWith('/purchase-batches'))
      pushStateValue(context, 'purchaseBatchIds', id);
    if (resolvedPath.startsWith('/pedidos'))
      pushStateValue(context, 'pedidoIds', id);
    if (resolvedPath.startsWith('/recepciones'))
      pushStateValue(context, 'recepcionIds', id);
    if (resolvedPath.startsWith('/recepcion-productos'))
      pushStateValue(context, 'recepcionProductoIds', id);
    if (resolvedPath.startsWith('/albaranes'))
      pushStateValue(context, 'albaranIds', id);
    if (resolvedPath.startsWith('/incidencias-resueltas'))
      pushStateValue(context, 'incidenciaResueltaIds', id);
    if (resolvedPath.startsWith('/incidencias'))
      pushStateValue(context, 'incidenciaIds', id);
    if (resolvedPath.startsWith('/movimientos'))
      pushStateValue(context, 'movimientoIds', id);
    if (resolvedPath.startsWith('/recetas'))
      pushStateValue(context, 'recetaIds', id);
    if (resolvedPath.startsWith('/preparaciones'))
      pushStateValue(context, 'preparacionIds', id);
    if (resolvedPath.startsWith('/merma'))
      pushStateValue(context, 'mermaIds', id);
    if (resolvedPath.startsWith('/profesores/admin-slots'))
      pushStateValue(context, 'profesorAdminSlotIds', id);
    if (resolvedPath.startsWith('/profesores/slots'))
      pushStateValue(context, 'profesorSlotIds', id);
    if (resolvedPath.startsWith('/profesores/all-profesores')) {
      pushStateValue(context, 'profesorIds', id);
      pushStateValue(context, 'usuarioIds', entity.userId);
    }

    pushStateValue(context, 'usuarioIds', entity.userId);
    pushStateValue(context, 'pedidoProductoIds', entity.idPedidoProducto);
    pushStateValue(context, 'seedClassCodes', entity.codigoClase);
    pushStateValue(context, 'seedClassCodes', entity.codigoSlot);
    pushStateValue(context, 'seedProfesorCials', entity.cial);

    if (
      typeof entity.aula === 'string' &&
      typeof entity.numeroClase === 'number'
    ) {
      pushStateValue(
        context,
        'seedAulaClasePairs',
        `${entity.aula}|${entity.numeroClase}`
      );
    }

    const alergenoProductoId =
      typeof entity.idProducto === 'string'
        ? entity.idProducto
        : typeof entity.productoId === 'string'
          ? entity.productoId
          : '';

    if (alergenoProductoId && typeof entity.alergeno === 'string') {
      pushStateValue(
        context,
        'productoAlergenoPairs',
        `${alergenoProductoId}|${entity.alergeno}`
      );
    }

    if (typeof entity.id === 'string' && Array.isArray(entity.alergenos)) {
      for (const item of entity.alergenos) {
        if (typeof item === 'string' && item.trim().length > 0) {
          pushStateValue(
            context,
            'productoAlergenoPairs',
            `${entity.id}|${item}`
          );
        }
      }
    }

    if (Array.isArray(entity.proveedores)) {
      for (const pp of entity.proveedores) {
        if (isRecord(pp)) {
          pushStateValue(context, 'productoProveedorIds', pp.id);
          pushStateValue(context, 'proveedorIds', pp.proveedorId);
          if (typeof pp.id === 'string' && typeof pp.proveedorId === 'string') {
            pushStateValue(
              context,
              'productoProveedorToProveedorPairs',
              `${pp.id}|${pp.proveedorId}`
            );
          }
          pushStateValue(context, 'productoConProveedorIds', entity.id);
        }
      }
    }

    for (const lineCollection of [
      entity.lineas,
      entity.pedidoProductos,
      entity.productos,
    ]) {
      if (!Array.isArray(lineCollection)) {
        continue;
      }
      for (const line of lineCollection) {
        if (isRecord(line)) {
          pushStateValue(context, 'pedidoProductoIds', line.id);
          pushStateValue(context, 'pedidoProductoIds', line.idPedidoProducto);
        }
      }
    }

    const estado = entity.estado;
    if (typeof estado === 'string' && typeof entity.id === 'string') {
      if (resolvedPath.startsWith('/pedidos')) {
        if (estado === 'pendiente')
          pushStateValue(context, 'pedidoPendienteIds', entity.id);
      }
      if (resolvedPath.startsWith('/pedido-usuarios')) {
        if (estado === 'pendiente')
          pushStateValue(context, 'pedidoUsuarioPendienteIds', entity.id);
      }
      if (resolvedPath.startsWith('/purchase-batches')) {
        if (estado === 'pendiente')
          pushStateValue(context, 'purchaseBatchPendienteIds', entity.id);
      }
      if (resolvedPath.startsWith('/preparaciones')) {
        if (estado === 'PENDIENTE')
          pushStateValue(context, 'preparacionPendienteIds', entity.id);
        if (estado === 'EN_PROCESO')
          pushStateValue(context, 'preparacionEnProcesoIds', entity.id);
      }
    }

    if (
      resolvedPath.startsWith('/incidencias') &&
      typeof entity.id === 'string'
    ) {
      if (entity.resuelta !== true) {
        pushStateValue(context, 'incidenciaPendienteIds', entity.id);
      }
    }

    if (resolvedPath.startsWith('/produccion')) {
      pushStateValue(context, 'produccionLoteIds', entity.id);
    }

    if (resolvedPath === '/archivos/upload') {
      pushStateValue(context, 'archivoIds', entity.id);
      const filename =
        extractFilename(entity.url) ||
        extractFilename(entity.urlOptimized) ||
        extractFilename(entity.nombre);
      pushStateValue(context, 'archivoFilenames', filename);
    }

    if (resolvedPath === '/albaranes/upload-documento') {
      const filename =
        extractFilename(entity.documentoUrl) ||
        extractFilename(entity.urlDocumento) ||
        extractFilename(entity.url);
      pushStateValue(context, 'albaranDocumentFilenames', filename);
    }
  }
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
  if (explicitTarget !== undefined) {
    if (explicitTarget <= 0) {
      return 0;
    }

    return Math.min(MAX_SUCCESS_PER_ENDPOINT, Math.max(1, explicitTarget));
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

export function resolvePermissionPath(
  context: SeedContext,
  path: string,
  method: HttpMethod,
  iteration: number
): string | null {
  const isAdditional = path.includes('/permisos-adicionales/:permisoId');
  const isExcluded = path.includes('/permisos-excluidos/:permisoId');
  if (!isAdditional && !isExcluded) {
    return null;
  }

  const pairKey = isAdditional
    ? 'usuarioPermisoAdicionalPairs'
    : 'usuarioPermisoExcluidoPairs';

  if (method === 'DELETE') {
    const pair = consumeStateValue(context, pairKey, '');
    if (pair) {
      const [userId, permisoId] = pair.split('|');
      if (userId && permisoId) {
        return path.replace(':id', userId).replace(':permisoId', permisoId);
      }
    }
  }

  const userId = pickRequiredStateValue(context, 'usuarioIds', iteration);
  const permisoId = pickRequiredStateValue(context, 'permissionIds', iteration);
  return path.replace(':id', userId).replace(':permisoId', permisoId);
}

export function resolveAlergenoDeletePath(
  context: SeedContext,
  path: string,
  iteration: number
): string | null {
  if (path !== '/producto-alergenos/:idProducto/:alergeno') {
    return null;
  }

  const pair = consumeStateValue(context, 'productoAlergenoPairs', '');
  if (pair) {
    const [idProducto, alergeno] = pair.split('|');
    if (idProducto && alergeno) {
      return path
        .replace(':idProducto', idProducto)
        .replace(':alergeno', alergeno);
    }
  }

  return path
    .replace(
      ':idProducto',
      pickRequiredStateValue(context, 'productoIds', iteration)
    )
    .replace(':alergeno', ALERGEN_VALUES[iteration % ALERGEN_VALUES.length]);
}

export function pickIdForRoute(
  context: SeedContext,
  path: string,
  method: HttpMethod,
  iteration: number
): string {
  const consume = method === 'DELETE';

  const pick = (key: string): string => {
    if (consume) {
      return consumeRequiredStateValue(context, key);
    }
    return pickRequiredStateValue(context, key, iteration);
  };

  if (path.startsWith('/admin/users')) {
    const adminRouteTargetIds = getStateArray(
      context,
      'seedAdminRouteTargetUserIds'
    );
    if (adminRouteTargetIds.length > 0) {
      return adminRouteTargetIds[iteration % adminRouteTargetIds.length];
    }
    return pick('usuarioIds');
  }
  if (path.startsWith('/usuarios')) {
    const mutableUserIds = getStateArray(context, 'seedMutableUserIds');
    if (mutableUserIds.length > 0) {
      if (consume) {
        const consumed = consumeStateValue(context, 'seedMutableUserIds', '');
        if (consumed) {
          pushStateValue(context, 'seedMutableUserIds', consumed);
          return consumed;
        }
      }

      return mutableUserIds[iteration % mutableUserIds.length];
    }

    return pick('usuarioIds');
  }
  if (path.startsWith('/profesores/admin-slots'))
    return pick('profesorAdminSlotIds');
  if (path.startsWith('/profesores/slots')) return pick('profesorSlotIds');
  if (path.startsWith('/profesores/alumnos')) return pick('alumnoIds');
  if (path.startsWith('/proveedor')) {
    const createdProveedorIds = getStateArray(
      context,
      'seedCreatedProveedorIds'
    );
    if (createdProveedorIds.length > 0) {
      return createdProveedorIds[iteration % createdProveedorIds.length];
    }
    return pick('proveedorIds');
  }
  if (path.startsWith('/productos')) {
    const createdProductoIds = getStateArray(context, 'seedCreatedProductoIds');
    if (createdProductoIds.length > 0) {
      return createdProductoIds[iteration % createdProductoIds.length];
    }
    return pick('productoIds');
  }
  if (path.startsWith('/producto-proveedor')) {
    const createdProductoProveedorIds = getStateArray(
      context,
      'seedCreatedProductoProveedorIds'
    );
    if (createdProductoProveedorIds.length > 0) {
      return createdProductoProveedorIds[
        iteration % createdProductoProveedorIds.length
      ];
    }
    return pick('productoProveedorIds');
  }
  if (path.startsWith('/producto-alergenos')) {
    const createdProductoIds = getStateArray(context, 'seedCreatedProductoIds');
    if (createdProductoIds.length > 0) {
      return createdProductoIds[iteration % createdProductoIds.length];
    }
    return pick('productoIds');
  }
  if (path.startsWith('/historial-precio')) return pick('historialPrecioIds');
  if (path.startsWith('/ubicacion')) return pick('ubicacionIds');
  if (path.startsWith('/inventario')) return pick('inventarioIds');
  if (path.startsWith('/pedido-usuarios')) {
    if (path.endsWith('/aceptar'))
      return consumeRequiredStateValue(context, 'pedidoUsuarioPendienteIds');
    if (path.endsWith('/cancelar'))
      return consumeRequiredStateValue(context, 'pedidoUsuarioPendienteIds');
    return pick('pedidoUsuarioIds');
  }
  if (path.startsWith('/purchase-batches')) {
    if (path.endsWith('/aceptar')) {
      const createdPendings = getStateArray(
        context,
        'seedCreatedPurchaseBatchPendienteIds'
      );
      if (createdPendings.length > 0) {
        return consumeRequiredStateValue(
          context,
          'seedCreatedPurchaseBatchPendienteIds'
        );
      }
      return consumeRequiredStateValue(context, 'purchaseBatchPendienteIds');
    }
    if (path.endsWith('/cancelar')) {
      const createdPendings = getStateArray(
        context,
        'seedCreatedPurchaseBatchPendienteIds'
      );
      if (createdPendings.length > 0) {
        return consumeRequiredStateValue(
          context,
          'seedCreatedPurchaseBatchPendienteIds'
        );
      }
      return consumeRequiredStateValue(context, 'purchaseBatchPendienteIds');
    }
    return pick('purchaseBatchIds');
  }
  if (path.startsWith('/pedidos')) {
    if (path.endsWith('/aceptar')) {
      const createdPendings = getStateArray(
        context,
        'seedCreatedPedidoPendienteIds'
      );
      if (createdPendings.length > 0) {
        return consumeRequiredStateValue(
          context,
          'seedCreatedPedidoPendienteIds'
        );
      }
      return consumeRequiredStateValue(context, 'pedidoPendienteIds');
    }
    if (path.endsWith('/cancelar')) {
      const createdPendings = getStateArray(
        context,
        'seedCreatedPedidoPendienteIds'
      );
      if (createdPendings.length > 0) {
        return consumeRequiredStateValue(
          context,
          'seedCreatedPedidoPendienteIds'
        );
      }
      return consumeRequiredStateValue(context, 'pedidoPendienteIds');
    }
    if (path.endsWith('/fecha-entrega')) return pick('pedidoIds');
    return pick('pedidoIds');
  }
  if (path.startsWith('/recepciones')) return pick('recepcionIds');
  if (path.startsWith('/recepcion-productos'))
    return pick('recepcionProductoIds');
  if (path.startsWith('/albaranes')) return pick('albaranIds');
  if (path.startsWith('/incidencias-resueltas'))
    return pick('incidenciaResueltaIds');
  if (path.startsWith('/incidencias')) {
    if (path.endsWith('/resolver'))
      return consumeRequiredStateValue(context, 'incidenciaPendienteIds');
    return pick('incidenciaIds');
  }
  if (path.startsWith('/movimientos')) return pick('movimientoIds');
  if (path.startsWith('/recetas')) {
    const createdRecetaIds = getStateArray(context, 'seedCreatedRecetaIds');
    if (createdRecetaIds.length > 0) {
      return createdRecetaIds[iteration % createdRecetaIds.length];
    }
    return pick('recetaIds');
  }
  if (path.startsWith('/produccion/lote')) return pick('produccionLoteIds');
  if (path.startsWith('/produccion')) return pick('produccionLoteIds');
  if (path.startsWith('/preparaciones')) {
    if (path.endsWith('/iniciar'))
      return consumeRequiredStateValue(context, 'preparacionPendienteIds');
    if (path.endsWith('/finalizar'))
      return consumeRequiredStateValue(context, 'preparacionEnProcesoIds');
    if (path.endsWith('/cancelar'))
      return consumeRequiredStateValue(context, 'preparacionPendienteIds');
    return pick('preparacionIds');
  }
  if (path.startsWith('/merma')) return pick('mermaIds');

  throw new Error(`[seed-massive] No hay selector de ID para ruta ${path}`);
}

export function resolvePathParams(
  context: SeedContext,
  endpoint: Endpoint,
  iteration: number
): string {
  const path = endpoint.path;

  const permissionPath = resolvePermissionPath(
    context,
    path,
    endpoint.method,
    iteration
  );
  if (permissionPath) {
    return permissionPath;
  }

  const alergenoDeletePath = resolveAlergenoDeletePath(
    context,
    path,
    iteration
  );
  if (alergenoDeletePath) {
    return alergenoDeletePath;
  }

  let resolved = path;

  let aulaValue = '';
  let claseValue = '';
  if (resolved.includes(':aula') || resolved.includes(':clase')) {
    const aulaClasePairs = getStateArray(context, 'seedAulaClasePairs');
    if (aulaClasePairs.length === 0) {
      throw new Error(
        `[seed-massive] No hay pares aula|clase para resolver ruta ${resolved}`
      );
    }
    const pair = aulaClasePairs[iteration % aulaClasePairs.length] || '';
    const [aula, clase] = pair.split('|');
    if (!aula || !clase) {
      throw new Error(
        `[seed-massive] Par aula|clase inválido: "${pair}" para ruta ${resolved}`
      );
    }
    aulaValue = aula;
    claseValue = clase;
  }

  if (resolved.includes(':idProducto')) {
    resolved = resolved.replace(
      ':idProducto',
      pickRequiredStateValue(context, 'productoIds', iteration)
    );
  }
  if (resolved.includes(':productoId')) {
    const candidate =
      pickStateValue(context, 'productoConProveedorIds', iteration, '') ||
      pickRequiredStateValue(context, 'productoIds', iteration);
    resolved = resolved.replace(':productoId', candidate);
  }
  if (resolved.includes(':permisoId')) {
    resolved = resolved.replace(
      ':permisoId',
      pickRequiredStateValue(context, 'permissionIds', iteration)
    );
  }
  if (resolved.includes(':filename')) {
    const selectedFilename = resolved.startsWith('/albaranes/documento/')
      ? pickRequiredStateValue(context, 'albaranDocumentFilenames', iteration)
      : pickRequiredStateValue(context, 'archivoFilenames', iteration);

    resolved = resolved.replace(':filename', selectedFilename);
  }
  if (resolved.includes(':codigoClase')) {
    resolved = resolved.replace(
      ':codigoClase',
      pickRequiredStateValue(context, 'seedClassCodes', iteration)
    );
  }
  if (resolved.includes(':aula')) {
    resolved = resolved.replace(':aula', encodeURIComponent(aulaValue));
  }
  if (resolved.includes(':clase')) {
    resolved = resolved.replace(':clase', claseValue);
  }
  if (resolved.includes(':alergeno')) {
    const alergeno = ALERGEN_VALUES[iteration % ALERGEN_VALUES.length];
    resolved = resolved.replace(':alergeno', alergeno);
  }
  if (resolved.includes(':id')) {
    resolved = resolved.replace(
      ':id',
      pickIdForRoute(context, path, endpoint.method, iteration)
    );
  }

  return resolved;
}

export function buildGetPath(
  context: SeedContext,
  resolvedPath: string,
  iteration: number
): string {
  if (resolvedPath === '/movimientos/historial') {
    const entityId = pickRequiredStateValue(
      context,
      'productoProveedorIds',
      iteration
    );
    const type = MOVIMIENTO_TYPES[iteration % MOVIMIENTO_TYPES.length];
    return `${resolvedPath}?entityId=${entityId}&type=${type}&page=1&limit=20`;
  }

  if (resolvedPath === '/recepciones/reporte-pdf') {
    const recepcionId = pickRequiredStateValue(
      context,
      'recepcionIds',
      iteration
    );
    return `${resolvedPath}?tipo=recepcion&recepcionId=${recepcionId}`;
  }

  if (
    resolvedPath.startsWith('/pedido-usuarios/') &&
    resolvedPath.endsWith('/pdf')
  ) {
    return `${resolvedPath}?incluirCancelados=true&paginaPorProveedor=false`;
  }

  if (
    resolvedPath.startsWith('/purchase-batches/') &&
    resolvedPath.endsWith('/pdf')
  ) {
    return `${resolvedPath}?incluirCancelados=true&paginaPorProveedor=false`;
  }

  if (resolvedPath === '/recetas/export/pdf') {
    const recetaIds = getStateArray(context, 'recetaIds').slice(0, 3);
    if (recetaIds.length > 0) {
      return `${resolvedPath}?ids=${recetaIds.join(',')}`;
    }
  }

  if (resolvedPath === '/producto-proveedor/search') {
    return `${resolvedPath}?q=seed&limit=20&offset=0`;
  }

  if (supportsPagination(resolvedPath)) {
    return `${resolvedPath}${resolvedPath.includes('?') ? '&' : '?'}limit=25&page=1`;
  }

  return resolvedPath;
}

export function buildBody(
  context: SeedContext,
  endpoint: Endpoint,
  resolvedPath: string,
  iteration: number,
  coverage: EnumCoverage
): Record<string, unknown> {
  const templatePath = endpoint.path;
  const runTag = context.getState<string>('seedRunTag') || 'seed';
  const suffix = `${Date.now()}_${iteration}_${faker.string.alphanumeric(4)}`;

  const roleValue = USER_ROLES[iteration % USER_ROLES.length];
  const statusValue = USER_STATUSES[iteration % USER_STATUSES.length];
  const unidadProducto = PRODUCT_UNITS[iteration % PRODUCT_UNITS.length];
  const tipoProducto = PRODUCT_TYPES[iteration % PRODUCT_TYPES.length];
  const alergeno = ALERGEN_VALUES[iteration % ALERGEN_VALUES.length];
  const movimientoTipo = MOVIMIENTO_TYPES[iteration % MOVIMIENTO_TYPES.length];
  const manualTipo =
    MOVIMIENTO_MANUAL_TYPES[iteration % MOVIMIENTO_MANUAL_TYPES.length];
  const recetaDificultad =
    RECETA_DIFICULTAD[iteration % RECETA_DIFICULTAD.length];
  const recetaUnidad = RECETA_UNIDADES[iteration % RECETA_UNIDADES.length];
  const incidenciaTipo = INCIDENCIA_TIPOS[iteration % INCIDENCIA_TIPOS.length];
  const resolucionTipo = RESOLUCION_TIPOS[iteration % RESOLUCION_TIPOS.length];
  const mermaMotivo = MERMA_MOTIVOS[iteration % MERMA_MOTIVOS.length];
  const estadoVisual =
    RECEPCION_ESTADO_VISUAL[iteration % RECEPCION_ESTADO_VISUAL.length];
  const estadoProducto =
    RECEPCION_ESTADO_PRODUCTO[iteration % RECEPCION_ESTADO_PRODUCTO.length];

  markEnum(coverage, 'userRoles', roleValue);
  markEnum(coverage, 'userStatuses', statusValue);
  markEnum(coverage, 'productUnits', unidadProducto);
  markEnum(coverage, 'productTypes', tipoProducto);
  markEnum(coverage, 'allergens', alergeno);
  markEnum(coverage, 'movimientoTypes', movimientoTipo);
  markEnum(coverage, 'movimientoManualTypes', manualTipo);
  markEnum(coverage, 'recetaDificultad', recetaDificultad);
  markEnum(coverage, 'recetaUnidades', recetaUnidad);
  markEnum(coverage, 'incidenciaTipos', incidenciaTipo);
  markEnum(coverage, 'incidenciaResoluciones', resolucionTipo);
  markEnum(coverage, 'mermaMotivos', mermaMotivo);
  markEnum(coverage, 'recepcionEstadoVisual', estadoVisual);
  markEnum(coverage, 'recepcionEstadoProducto', estadoProducto);

  const proveedorId =
    pickStateValue(context, 'seedCreatedProveedorIds', iteration, '') ||
    pickStateValue(context, 'proveedorIds', iteration);
  const productoId =
    pickStateValue(context, 'seedCreatedProductoIds', iteration, '') ||
    pickStateValue(context, 'productoIds', iteration);
  const productoProveedorId =
    pickStateValue(context, 'seedCreatedProductoProveedorIds', iteration, '') ||
    pickStateValue(context, 'productoProveedorIds', iteration);
  const recetaId =
    pickStateValue(context, 'seedCreatedRecetaIds', iteration, '') ||
    pickStateValue(context, 'recetaIds', iteration);
  const pedidoId = pickStateValue(context, 'pedidoIds', iteration);
  const inventarioId = pickStateValue(context, 'inventarioIds', iteration);
  const recepcionId = pickStateValue(context, 'recepcionIds', iteration);
  const ubicacionId = pickStateValue(context, 'ubicacionIds', iteration);
  const pedidoProductoId = pickStateValue(
    context,
    'pedidoProductoIds',
    iteration
  );
  const usuarioId = pickStateValue(context, 'usuarioIds', iteration);
  const roleId = pickStateValue(context, 'roleIds', iteration);
  const permissionId = pickStateValue(context, 'permissionIds', iteration);
  const pickRequired = (key: string, offset = 0): string =>
    pickRequiredStateValue(context, key, iteration, offset);

  if (
    resolvedPath === '/admin/profesores' ||
    resolvedPath === '/profesores/register'
  ) {
    return {
      username: `prof_${suffix}`,
      email: `prof.${suffix}@smarteconomat.local`,
      password: DEFAULT_SEED_PASSWORD,
      cial: `CIAL${faker.string.numeric(6)}`,
    };
  }

  if (templatePath === '/admin/users/:id/activate') {
    return { active: true };
  }

  if (templatePath === '/admin/users/:id/role') {
    const requiredRoleId = roleId || pickRequired('roleIds');
    const selectedPermissionId =
      permissionId || pickStateValue(context, 'permissionIds', iteration, '');
    return {
      roleId: requiredRoleId,
      permisosAdicionalesIds: selectedPermissionId
        ? [selectedPermissionId]
        : [],
      permisosExcluidosIds: [],
    };
  }

  if (resolvedPath === '/auth/register') {
    return {
      username: `reg_${suffix}`,
      email: `register.${suffix}@smarteconomat.local`,
      password: DEFAULT_SEED_PASSWORD,
      rol: 'ALUMNO',
    };
  }

  if (resolvedPath === '/auth/login') {
    const loginEmail =
      context.getState<string>('seedAdminLoginEmail') || DEFAULT_ADMIN_EMAIL;
    const loginPassword =
      context.getState<string>('seedAdminCurrentPassword') ||
      DEFAULT_SEED_PASSWORD;
    return {
      email: loginEmail,
      password: loginPassword,
    };
  }

  if (resolvedPath === '/auth/forgot-password') {
    return {
      email: getRequiredStateString(context, 'seedResetActorEmail'),
    };
  }

  if (resolvedPath === '/auth/reset-password') {
    return {
      token: getRequiredStateString(context, 'seedResetPasswordToken'),
      newPassword: ALT_SEED_PASSWORD,
    };
  }

  if (resolvedPath === '/auth/change-password') {
    const currentPassword = getRequiredStateString(
      context,
      'seedPasswordActorCurrentPassword'
    );
    const newPassword =
      currentPassword === DEFAULT_SEED_PASSWORD
        ? ALT_SEED_PASSWORD
        : DEFAULT_SEED_PASSWORD;
    context.set('seedPasswordActorNextPassword', newPassword);
    return {
      currentPassword,
      newPassword,
    };
  }

  if (resolvedPath === '/alumnos/register') {
    const createdClassCodes = getStateArray(context, 'seedCreatedClassCodes');
    const codigoClase =
      createdClassCodes.length > 0
        ? createdClassCodes[iteration % createdClassCodes.length]
        : pickRequired('seedClassCodes');

    return {
      username: `alumno_${suffix}`,
      password: DEFAULT_SEED_PASSWORD,
      codigoClase,
    };
  }

  if (resolvedPath === '/alumnos/change-profesor') {
    return {
      cialNuevoProfesor: pickRequired('seedProfesorCials', 1),
      nuevaAula: `Aula Seed ${runTag}`,
      nuevoNumeroClase: 1,
    };
  }

  if (
    resolvedPath === '/profesores/slots' ||
    resolvedPath === '/profesores/admin-slots'
  ) {
    return {
      aula: `Aula Seed ${runTag}`,
      numeroClase: 100 + iteration,
      capacidad: faker.number.int({ min: 15, max: 40 }),
      ...(resolvedPath === '/profesores/admin-slots'
        ? { profesorId: pickRequired('profesorIds') }
        : {}),
    };
  }

  if (
    templatePath === '/profesores/slots/:id' ||
    templatePath === '/profesores/admin-slots/:id'
  ) {
    return {
      capacidad: faker.number.int({ min: 10, max: 45 }),
    };
  }

  if (resolvedPath === '/usuarios/perfil/password') {
    const currentPassword = getRequiredStateString(
      context,
      'seedPasswordActorCurrentPassword'
    );
    const newPassword =
      currentPassword === DEFAULT_SEED_PASSWORD
        ? ALT_SEED_PASSWORD
        : DEFAULT_SEED_PASSWORD;
    context.set('seedPasswordActorNextPassword', newPassword);
    return {
      oldPassword: currentPassword,
      newPassword,
    };
  }

  if (resolvedPath === '/usuarios/perfil') {
    return { nombre: faker.person.fullName() };
  }

  if (templatePath === '/usuarios/:id' && endpoint.method === 'PATCH') {
    return { nombre: faker.person.fullName() };
  }

  if (resolvedPath.startsWith('/usuarios/admin')) {
    return {
      nombre: faker.person.fullName(),
      username: `admin_${suffix}`,
      email: `admin.${suffix}@smarteconomat.local`,
      password: DEFAULT_SEED_PASSWORD,
      rol: roleValue,
    };
  }

  if (resolvedPath.startsWith('/usuarios')) {
    if (resolvedPath.endsWith('/activar')) {
      return { status: statusValue };
    }
    if (resolvedPath.endsWith('/rol')) {
      return { rol: roleValue };
    }
    if (resolvedPath.endsWith('/password')) {
      return { password: DEFAULT_SEED_PASSWORD };
    }
    if (resolvedPath.endsWith('/admin')) {
      return {
        activo: iteration % 2 === 0,
        rol: roleValue,
      };
    }

    return {
      username: `user_${suffix}`,
      email: `user.${suffix}@smarteconomat.local`,
      password: DEFAULT_SEED_PASSWORD,
      nombre: faker.person.fullName(),
      rol: roleValue,
      status: statusValue,
    };
  }

  if (resolvedPath.startsWith('/proveedor')) {
    return {
      nombre: `Proveedor ${suffix}`,
      contacto: faker.person.fullName(),
      telefono: `+34${faker.string.numeric(9)}`,
      email: `proveedor.${suffix}@smarteconomat.local`,
      direccion: faker.location.streetAddress(),
      nif: `SEED${faker.string.numeric(8)}`,
    };
  }

  if (resolvedPath.startsWith('/productos')) {
    if (endpoint.method === 'PATCH') {
      return {
        nombre: faker.commerce.productName(),
        marca: faker.company.name(),
        descripcion: faker.commerce.productDescription(),
        unidad: unidadProducto,
        tipo: tipoProducto,
        contenido: Number(
          faker.number.float({ min: 0.3, max: 25, fractionDigits: 2 })
        ),
      };
    }

    return {
      nombre: faker.commerce.productName(),
      marca: faker.company.name(),
      descripcion: faker.commerce.productDescription(),
      codigoBarras: `SEED-${suffix}`,
      unidad: unidadProducto,
      tipo: tipoProducto,
      contenido: Number(
        faker.number.float({ min: 0.3, max: 25, fractionDigits: 2 })
      ),
      alergenos: [alergeno],
      proveedores: [
        {
          proveedorId,
          precioUnitario: Number(
            faker.number.float({ min: 0.8, max: 25, fractionDigits: 2 })
          ),
          marcaEspecifica: faker.company.name(),
          codigoBarras: `PROV-${suffix}`,
        },
      ],
    };
  }

  if (resolvedPath.startsWith('/producto-proveedor')) {
    if (resolvedPath.endsWith('/precio')) {
      return {
        nuevoPrecio: Number(
          faker.number.float({ min: 0.8, max: 35, fractionDigits: 2 })
        ),
      };
    }

    if (resolvedPath.endsWith('/merma')) {
      return {
        nuevaMerma: Number(
          faker.number.float({ min: 0, max: 15, fractionDigits: 2 })
        ),
      };
    }
  }

  if (resolvedPath === '/producto-alergenos') {
    const createdProducts = getStateArray(context, 'seedCreatedProductoIds');
    const allProducts =
      createdProducts.length > 0
        ? createdProducts
        : getStateArray(context, 'productoIds');
    const existingPairs = new Set(
      getStateArray(context, 'productoAlergenoPairs')
    );

    for (let p = 0; p < allProducts.length; p++) {
      const candidateProductId =
        allProducts[(iteration + p) % allProducts.length];
      if (!candidateProductId) {
        continue;
      }

      for (const candidateAlergeno of ALERGEN_VALUES) {
        const pairKey = `${candidateProductId}|${candidateAlergeno}`;
        if (!existingPairs.has(pairKey)) {
          return {
            idProducto: candidateProductId,
            alergeno: candidateAlergeno,
          };
        }
      }
    }

    return {
      idProducto: productoId,
      alergeno,
    };
  }

  if (
    resolvedPath.startsWith('/producto-alergenos') &&
    endpoint.method === 'PATCH'
  ) {
    return {
      alergenos: [
        alergeno,
        ALERGEN_VALUES[(iteration + 1) % ALERGEN_VALUES.length],
      ],
    };
  }

  if (resolvedPath.startsWith('/historial-precio')) {
    return {
      productoProveedorId,
      precio: Number(
        faker.number.float({ min: 0.8, max: 30, fractionDigits: 2 })
      ),
      fecha: new Date().toISOString(),
    };
  }

  if (resolvedPath === '/pedido/draft') {
    return {
      payload: {
        nombre: `Draft pedido ${suffix}`,
        nota: faker.lorem.sentence(),
        lineas: [
          {
            productoProveedorId,
            cantidad: Number(
              faker.number.float({ min: 0.5, max: 5, fractionDigits: 2 })
            ),
          },
        ],
      },
    };
  }

  if (resolvedPath === '/pedido/draft/finalize') {
    return {};
  }

  if (resolvedPath === '/recepcion/draft') {
    return {
      payload: {
        nombre: `Draft recepcion ${suffix}`,
        nota: faker.lorem.sentence(),
      },
    };
  }

  if (resolvedPath === '/pedidos/from-recipes') {
    const recetaIds = (
      getStateArray(context, 'seedCreatedRecetaIds').length > 0
        ? getStateArray(context, 'seedCreatedRecetaIds')
        : getStateArray(context, 'recetaIds')
    ).slice(0, 3);
    return {
      recetaIds,
      observaciones: faker.lorem.sentence(),
    };
  }

  if (
    resolvedPath === '/pedidos' ||
    resolvedPath === '/pedido-usuarios' ||
    resolvedPath === '/purchase-batches'
  ) {
    let lineProductoProveedorId = productoProveedorId;

    if (resolvedPath === '/pedidos' && proveedorId) {
      const createdPairs = getStateArray(
        context,
        'seedCreatedProductoProveedorToProveedorPairs'
      );
      const pairs =
        createdPairs.length > 0
          ? createdPairs
          : getStateArray(context, 'productoProveedorToProveedorPairs');
      const matchingProductoProveedorIds = pairs
        .map((pair) => pair.split('|'))
        .filter(
          (parts) => parts.length === 2 && parts[1] === proveedorId && parts[0]
        )
        .map((parts) => parts[0]);

      if (matchingProductoProveedorIds.length > 0) {
        lineProductoProveedorId =
          matchingProductoProveedorIds[
            iteration % matchingProductoProveedorIds.length
          ];
      }
    }

    const line = {
      productoProveedorId: lineProductoProveedorId,
      cantidad: Number(
        faker.number.float({ min: 0.5, max: 8, fractionDigits: 2 })
      ),
    };

    if (resolvedPath === '/pedidos') {
      return {
        proveedorId,
        observaciones: `Generado por seed ${suffix}`,
        lineas: [line],
      };
    }

    return {
      observaciones: `Generado por seed ${suffix}`,
      lineas: [line],
    };
  }

  if (templatePath === '/pedidos/:id/fecha-entrega') {
    return {
      observaciones: `No-op seed ${suffix}`,
    };
  }

  if (resolvedPath === '/purchase-batches/consolidate') {
    return {
      pedidoIds: getStateArray(context, 'pedidoPendienteIds').slice(0, 5),
      pedidoUsuarioIds: getStateArray(
        context,
        'pedidoUsuarioPendienteIds'
      ).slice(0, 5),
      observaciones: faker.lorem.sentence(),
    };
  }

  if (resolvedPath === '/purchase-batches/from-missing-stock') {
    return {
      items: [
        {
          recetaId,
          cantidad: Number(
            faker.number.float({ min: 1, max: 3, fractionDigits: 2 })
          ),
        },
      ],
      observaciones: faker.lorem.sentence(),
    };
  }

  if (resolvedPath === '/purchase-batches/from-recipes') {
    return {
      recetaIds: (getStateArray(context, 'seedCreatedRecetaIds').length > 0
        ? getStateArray(context, 'seedCreatedRecetaIds')
        : getStateArray(context, 'recetaIds')
      ).slice(0, 3),
      observaciones: faker.lorem.sentence(),
    };
  }

  if (resolvedPath.endsWith('/cancelar')) {
    return { motivoCancelacion: faker.lorem.sentence() };
  }

  if (resolvedPath === '/recepciones') {
    const unidadNuevo = PRODUCT_UNITS[(iteration + 1) % PRODUCT_UNITS.length];
    const tipoNuevo = PRODUCT_TYPES[(iteration + 1) % PRODUCT_TYPES.length];

    markEnum(coverage, 'productUnits', unidadNuevo);
    markEnum(coverage, 'productTypes', tipoNuevo);

    return {
      pedidoIds: [pedidoId],
      nAlbaran: `ALB-${faker.string.alphanumeric(8).toUpperCase()}`,
      observaciones: faker.lorem.sentence(),

      productos: [],
      productosNuevos: [
        {
          pendienteCreacion: true,
          codigoBarras: `NUEVO-${suffix}`,
          nombre: faker.commerce.productName(),
          marca: faker.company.name(),
          unidad: unidadNuevo,
          tipo: tipoNuevo,
          contenido: Number(
            faker.number.float({ min: 0.3, max: 10, fractionDigits: 2 })
          ),
          cantidadRecibida: Number(
            faker.number.float({ min: 0.5, max: 4, fractionDigits: 2 })
          ),
          observaciones: faker.lorem.sentence(),
        },
      ],
    };
  }

  if (resolvedPath.startsWith('/recepcion-productos')) {
    return {
      idRecepcion: recepcionId,
      idPedidoProducto: pedidoProductoId,
      cantidadRecibida: Number(
        faker.number.float({ min: 0.5, max: 6, fractionDigits: 2 })
      ),
      estadoProducto,
      observaciones: faker.lorem.sentence(),
    };
  }

  if (resolvedPath === '/inventario/ajustes-manuales') {
    const baseAjuste = faker.number.int({ min: 1, max: 7 });
    const ajuste =
      manualTipo === 'salida_ajuste'
        ? -baseAjuste
        : manualTipo === 'entrada'
          ? baseAjuste
          : iteration % 2 === 0
            ? baseAjuste
            : -baseAjuste;

    return {
      inventarioId,
      tipo: manualTipo,
      ajuste,
      motivo: 'Ajuste seed masivo',
      observaciones: faker.lorem.sentence(),
    };
  }

  if (resolvedPath.startsWith('/inventario')) {
    return {
      productoProveedorId,
      ubicacionId,
      cantidadActual: faker.number.int({ min: 20, max: 260 }),
      cantidadMinima: faker.number.int({ min: 3, max: 20 }),
      cantidadMaxima: faker.number.int({ min: 300, max: 800 }),
    };
  }

  if (resolvedPath === '/recetas/duplicate') {
    return {
      sourceId: recetaId,
      newName: `Receta duplicada ${suffix}`,
    };
  }

  if (resolvedPath === '/recetas') {
    return {
      nombre: `Receta ${suffix}`,
      instrucciones: faker.lorem.sentences(2),
      tiempoEstimadoMinutos: faker.number.int({ min: 10, max: 120 }),
      dificultad: recetaDificultad,
      rendimiento: Number(
        faker.number.float({ min: 0.5, max: 6, fractionDigits: 2 })
      ),
      unidadResultado: recetaUnidad,
      ingredientes: [
        {
          productoId,
          cantidad: Number(
            faker.number.float({ min: 0.1, max: 2.5, fractionDigits: 2 })
          ),
          unidad: recetaUnidad,
          mermaAplicada: faker.number.int({ min: 0, max: 10 }),
          proveedorFavoritoId: proveedorId,
        },
      ],
    };
  }

  if (templatePath === '/recetas/:id' && endpoint.method === 'PATCH') {
    return {
      nombre: `Receta editada ${suffix}`,
      instrucciones: faker.lorem.sentences(2),
      tiempoEstimadoMinutos: faker.number.int({ min: 10, max: 120 }),
      dificultad: recetaDificultad,
      rendimiento: Number(
        faker.number.float({ min: 0.5, max: 6, fractionDigits: 2 })
      ),
      unidadResultado: recetaUnidad,
    };
  }

  if (resolvedPath.endsWith('/cocinar')) {
    return { cantidad: faker.number.int({ min: 1, max: 6 }) };
  }

  if (resolvedPath === '/produccion/ejecutar') {
    return {
      recetaId,
      cantidadProducida: Number(
        faker.number.float({ min: 0.5, max: 3, fractionDigits: 2 })
      ),
      ubicacionDestinoId: ubicacionId,
    };
  }

  if (resolvedPath === '/produccion/validar') {
    return {
      items: [
        {
          recetaId,
          cantidad: Number(
            faker.number.float({ min: 0.5, max: 2, fractionDigits: 2 })
          ),
        },
      ],
    };
  }

  if (
    resolvedPath.startsWith('/produccion/lote/') &&
    resolvedPath.endsWith('/consumir')
  ) {
    return {
      tipo: iteration % 2 === 0 ? 'raciones' : 'cantidad',
      valor: Number(faker.number.float({ min: 1, max: 3, fractionDigits: 1 })),
    };
  }

  if (resolvedPath.startsWith('/preparaciones')) {
    if (endpoint.method === 'PATCH' && resolvedPath.endsWith('/finalizar')) {
      return { ubicacionDestinoId: ubicacionId };
    }
    if (endpoint.method === 'PATCH') {
      return {};
    }

    return {
      recetaId,
      cantidadAProducir: Number(
        faker.number.float({ min: 0.5, max: 4, fractionDigits: 2 })
      ),
      ubicacionDestinoId: ubicacionId,
      observaciones: faker.lorem.sentence(),
    };
  }

  if (resolvedPath.startsWith('/ubicacion')) {
    return {
      nombre: `UBI-${suffix}`,
      descripcion: faker.lorem.sentence(),
    };
  }

  if (resolvedPath === '/incidencias/reportar') {
    return {
      recepcionId,
      tipo: incidenciaTipo,
    };
  }

  if (resolvedPath === '/incidencias') {
    return {
      recepcionId,
      pedidoId,
      observacionesRecepcion: faker.lorem.sentence(),
    };
  }

  if (
    resolvedPath.startsWith('/incidencias') &&
    resolvedPath.endsWith('/resolver')
  ) {
    if (endpoint.method === 'PATCH') {
      return {
        usuarioId,
        observacionesResolucion: faker.lorem.sentence(),
      };
    }

    return {
      accion: resolucionTipo,
      observaciones: faker.lorem.sentence(),
    };
  }

  if (resolvedPath.startsWith('/incidencias-resueltas')) {
    return {
      idIncidencia: pickStateValue(context, 'incidenciaIds', iteration),
      idUsuarioResolutor: usuarioId,
      tipoResolucion: resolucionTipo,
      observaciones: faker.lorem.sentence(),
    };
  }

  if (resolvedPath.startsWith('/merma')) {
    return {
      productoId,
      cantidad: Number(
        faker.number.float({ min: 0.2, max: 4, fractionDigits: 2 })
      ),
      motivo: mermaMotivo,
      notas: faker.lorem.sentence(),
    };
  }

  if (resolvedPath.startsWith('/movimientos')) {
    return {
      tipo: movimientoTipo,
      cantidad: faker.number.int({ min: 1, max: 12 }),
      entidadTipo: 'ProductoProveedor',
      entidadId: productoProveedorId,
      descripcion: faker.lorem.sentence(),
      inventario: inventarioId,
      productoProveedor: productoProveedorId,
      usuario: usuarioId,
    };
  }

  if (resolvedPath.startsWith('/albaranes')) {
    return {
      nAlbaran: `ALB-${faker.string.alphanumeric(8).toUpperCase()}`,
      concordancia: iteration % 2 === 0,
      fecha: new Date().toISOString(),
    };
  }

  return {
    nombre: `Seed ${suffix}`,
    descripcion: faker.lorem.sentence(),
  };
}
