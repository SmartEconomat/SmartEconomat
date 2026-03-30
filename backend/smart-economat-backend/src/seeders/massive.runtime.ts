import { faker } from '@faker-js/faker';
import * as crypto from 'crypto';
import { SeedContext, HttpSeedRequestError } from './seed-context';
import { DEFAULT_SEED_PASSWORD } from './massive.config';
import AppDataSource from '../config/typeorm.config';
import { Rol } from '../modules/roles/rol.entity/rol.entity';
import { Usuario } from '../modules/usuario/usuario.entity/usuario.entity';
import { rolUsuario, UserStatus } from '../modules/usuario/enums/usuario.enums';
import { Permiso } from '../modules/permisos/permiso.entity/permiso.entity';
import {
  Endpoint,
  EnumCoverage,
  HttpMethod,
  RequestResult,
} from './massive.types';
import {
  activateUserByIdentity,
  buildBody,
  buildGetPath,
  chooseTokenForPath,
  collectStateFromResponse,
  extractClassCodeFromResponse,
  extractResourceId,
  findProfesorIdByUserId,
  getRequiredStateString,
  getStateArray,
  isAdminFocusEndpoint,
  isPublicPath,
  normalizePath,
  pickStateValue,
  pushStateValue,
  removeStateValue,
  resolvePathParams,
  setUserRoleForSeed,
  toEntityArray,
} from './massive.helpers';

async function ensureRepositoryReady(): Promise<void> {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
}

async function getRoleEntity(roleName: rolUsuario): Promise<Rol | null> {
  await ensureRepositoryReady();
  return AppDataSource.getRepository(Rol).findOne({
    where: { nombre: roleName },
  });
}

async function upsertSeedUserViaRepository(params: {
  username: string;
  email: string;
  password: string;
  role: rolUsuario;
  nombre: string;
}): Promise<Usuario> {
  await ensureRepositoryReady();
  const userRepo = AppDataSource.getRepository(Usuario);

  const roleEntity = await getRoleEntity(params.role);
  const existing = await userRepo.findOne({
    where: { username: params.username } as any,
  });

  if (!existing) {
    const created = new Usuario();
    created.username = params.username;
    created.email = params.email;
    created.password = params.password;
    created.rol = params.role;
    created.nombre = params.nombre;
    created.status = UserStatus.ACTIVE;
    created.activo = true;
    created.mustChangePassword = false;
    created.roles = roleEntity ? [roleEntity] : [];
    return userRepo.save(created as any) as Promise<Usuario>;
  }

  existing.email = params.email;
  existing.password = params.password;
  existing.rol = params.role;
  existing.nombre = params.nombre;
  existing.status = UserStatus.ACTIVE;
  existing.activo = true;
  existing.mustChangePassword = false;
  if (roleEntity) {
    existing.roles = [roleEntity];
  }

  return userRepo.save(existing);
}

async function ensureUserAdditionalPermission(
  userId: string,
  permisoCodigo: string
): Promise<void> {
  await ensureRepositoryReady();

  const permisoRepo = AppDataSource.getRepository(Permiso);
  const userRepo = AppDataSource.getRepository(Usuario);

  const permiso = await permisoRepo.findOne({
    where: { codigo: permisoCodigo },
  });
  let ensuredPermiso = permiso;
  if (!ensuredPermiso) {
    const createdPermiso = permisoRepo.create({
      codigo: permisoCodigo,
      nombre: `Seed ${permisoCodigo}`,
      descripcion: `Permiso bootstrap creado por seed masivo para habilitar ${permisoCodigo}`,
      modulo: permisoCodigo.split(':')[0] || 'seed',
      accion: permisoCodigo.split(':')[1] || 'accion',
      activo: true,
    } as any);
    ensuredPermiso = (await permisoRepo.save(createdPermiso as any)) as Permiso;
  }

  const user = await userRepo.findOne({
    where: { id: userId } as any,
    relations: { permisosAdicionales: true } as any,
  });

  if (!user) {
    throw new Error(
      `[seed-massive] Usuario no encontrado para asignar permiso: ${userId}`
    );
  }

  const currentPermissions = Array.isArray((user as any).permisosAdicionales)
    ? ((user as any).permisosAdicionales as Permiso[])
    : [];

  if (currentPermissions.some((item) => item.id === ensuredPermiso.id)) {
    return;
  }

  (user as any).permisosAdicionales = [...currentPermissions, ensuredPermiso];
  await userRepo.save(user as any);
}

export async function warmAdminState(context: SeedContext): Promise<void> {
  for (const path of ['/admin/roles', '/admin/permissions']) {
    const response = await context.requestJson<unknown>(path, {
      method: 'GET',
    });
    collectStateFromResponse(context, path, response);
  }
}

export async function warmCollections(context: SeedContext): Promise<void> {
  const requests: Array<{ path: string; method: HttpMethod }> = [
    { path: '/usuarios?limit=50&page=1', method: 'GET' },
    { path: '/profesores/all-profesores', method: 'GET' },
    { path: '/profesores/all-slots', method: 'GET' },
    { path: '/proveedor?limit=50&page=1', method: 'GET' },
    { path: '/productos?limit=50&page=1', method: 'GET' },
    { path: '/producto-proveedor/search?limit=50&offset=0', method: 'GET' },
    { path: '/historial-precio?order=DESC', method: 'GET' },
    { path: '/ubicacion?limit=50&page=1', method: 'GET' },
    { path: '/inventario?limit=50&page=1', method: 'GET' },
    { path: '/pedidos?limit=50&page=1', method: 'GET' },
    { path: '/pedido-usuarios?limit=50&page=1', method: 'GET' },
    { path: '/purchase-batches', method: 'GET' },
    { path: '/recepciones?limit=50&page=1', method: 'GET' },
    { path: '/recepcion-productos?limit=50&page=1', method: 'GET' },
    { path: '/albaranes?limit=50&page=1', method: 'GET' },
    { path: '/incidencias?limit=50&page=1', method: 'GET' },
    { path: '/incidencias-resueltas?limit=50&page=1', method: 'GET' },
    { path: '/movimientos?limit=50&page=1', method: 'GET' },
    { path: '/recetas?limit=50&page=1', method: 'GET' },
    { path: '/preparaciones?limit=50&page=1', method: 'GET' },
    { path: '/produccion?limit=50&page=1', method: 'GET' },
    { path: '/merma?limit=50&page=1', method: 'GET' },
    { path: '/archivos?limit=50&page=1', method: 'GET' },
  ];

  for (const request of requests) {
    const response = await context.requestJson<unknown>(request.path, {
      method: request.method,
    });
    collectStateFromResponse(
      context,
      normalizePath(request.path.split('?')[0]),
      response
    );
  }
}

export async function ensurePasswordActor(context: SeedContext): Promise<void> {
  const actorUsername = `seed_pwd_${Date.now()}_${faker.string.alphanumeric(4)}`;

  const actorEmail = `${actorUsername}@smarteconomat.local`;

  const actor = await upsertSeedUserViaRepository({
    username: actorUsername,
    email: actorEmail,
    password: DEFAULT_SEED_PASSWORD,
    role: rolUsuario.SUPER_ADMIN,
    nombre: `Seed Password Actor ${actorUsername}`,
  });

  const adminToken = context.getState<string>('seedTokenAdmin');
  if (!adminToken) {
    throw new Error(
      '[seed-massive] Falta seedTokenAdmin para activar actor de cambio de password'
    );
  }

  const actorUserId = actor.id;
  pushStateValue(context, 'seedProtectedUserIds', actorUserId);

  await setUserRoleForSeed(context, adminToken, actorUserId, 'SUPER_ADMIN');

  const token = await context.loginWithCredentials({
    email: actorEmail,
    password: DEFAULT_SEED_PASSWORD,
  });

  context.set('seedPasswordActorEmail', actorEmail);
  context.set('seedPasswordActorCurrentPassword', DEFAULT_SEED_PASSWORD);
  context.set('seedTokenPasswordActor', token);
}

export async function ensureResetActor(context: SeedContext): Promise<void> {
  const actorUsername = `seed_reset_${Date.now()}_${faker.string.alphanumeric(4)}`;
  const actorEmail = `${actorUsername}@smarteconomat.local`;

  const adminToken = context.getState<string>('seedTokenAdmin');
  if (!adminToken) {
    throw new Error(
      '[seed-massive] Falta seedTokenAdmin para activar actor de reset'
    );
  }

  const actor = await upsertSeedUserViaRepository({
    username: actorUsername,
    email: actorEmail,
    password: DEFAULT_SEED_PASSWORD,
    role: rolUsuario.SUPER_ADMIN,
    nombre: `Reset Actor ${actorUsername}`,
  });

  const actorUserId = actor.id;
  pushStateValue(context, 'seedProtectedUserIds', actorUserId);

  await setUserRoleForSeed(context, adminToken, actorUserId, 'SUPER_ADMIN');

  const rawToken = `seed_token_${faker.string.alphanumeric(10)}`;
  const hashedTokenValue = crypto
    .createHash('sha256')
    .update(rawToken)
    .digest('hex');

  const userRepo = AppDataSource.getRepository(Usuario);
  await userRepo.update(actorUserId, {
    resetPasswordOtp: hashedTokenValue,
    resetPasswordOtpExpires: new Date(Date.now() + 3600000),
  } as any);

  console.log(`[seed-massive] Setting seedResetPasswordToken to ${rawToken}`);
  context.set('seedResetActorEmail', actorEmail);
  context.set('seedResetActorUserId', actorUserId);
  context.set('seedResetPasswordToken', rawToken);
}

function resolveCountInRange(
  envName: string,
  min: number,
  max: number
): number {
  const raw = process.env[envName];
  const fallback = faker.number.int({ min, max });
  if (!raw) {
    return fallback;
  }

  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed)) {
    return fallback;
  }

  return Math.max(min, Math.min(max, parsed));
}

export async function ensureRoleActors(context: SeedContext): Promise<void> {
  const superAdminToken = context.getAccessToken();
  context.set('seedTokenSuperAdmin', superAdminToken);
  context.set('seedTokenAdmin', superAdminToken);
  context.setSessionToken('superadmin:0', superAdminToken);

  await warmAdminState(context);

  const runTag = `${Date.now()}_${faker.string.alphanumeric(5).toLowerCase()}`;
  const adminCount = resolveCountInRange('SEED_ADMIN_COUNT', 2, 3);
  const profesorCount = resolveCountInRange('SEED_PROFESOR_COUNT', 3, 5);
  const alumnoCount = resolveCountInRange('SEED_ALUMNO_COUNT', 10, 30);

  type AdminActor = { userId: string; email: string; token: string };
  type ProfesorActor = {
    userId: string;
    profesorId: string;
    email: string;
    token: string;
    classCode: string;
    cial: string;
  };

  const adminActors: AdminActor[] = [];

  for (let i = 0; i < adminCount; i++) {
    const username = `seed_admin_${runTag}_${i}`;
    const email = `${username}@smarteconomat.local`;

    const adminUser = await upsertSeedUserViaRepository({
      username,
      email,
      password: DEFAULT_SEED_PASSWORD,
      role: rolUsuario.ADMINISTRADOR,
      nombre: `Seed Admin ${i}`,
    });
    const userId = adminUser.id;

    const token = await context.loginWithCredentials(
      {
        email,
        password: DEFAULT_SEED_PASSWORD,
      },
      {
        setActiveToken: false,
        sessionKey: `admin:${i}`,
      }
    );

    pushStateValue(context, 'seedAdminUserIds', userId);
    pushStateValue(context, 'seedAdminTokens', token);
    pushStateValue(context, 'usuarioIds', userId);
    pushStateValue(context, 'seedProtectedUserIds', userId);
    adminActors.push({ userId, email, token });
  }

  if (adminActors.length === 0) {
    throw new Error('[seed-massive] No se pudieron crear actores Admin');
  }

  context.set('seedTokenAdminRoutesAdmin', adminActors[0].token);

  const profesorActors: ProfesorActor[] = [];
  for (let i = 0; i < profesorCount; i++) {
    const creatorAdmin = adminActors[i % adminActors.length];
    const username = `seed_prof_${runTag}_${i}`;
    const email = `${username}@smarteconomat.local`;
    const cial = `CIAL${faker.string.numeric(6)}`;

    await context.requestJson('/admin/profesores', {
      method: 'POST',
      body: {
        username,
        email,
        password: DEFAULT_SEED_PASSWORD,
        cial,
      },
      tokenOverride: creatorAdmin.token,
    });

    const profesorUserId = await activateUserByIdentity(
      context,
      superAdminToken,
      {
        email,
        username,
      }
    );

    await ensureUserAdditionalPermission(
      profesorUserId,
      'profesor:gestionar_slots'
    );

    const profesorToken = await context.loginWithCredentials(
      {
        email,
        password: DEFAULT_SEED_PASSWORD,
      },
      {
        setActiveToken: false,
        sessionKey: `profesor:${i}`,
      }
    );

    const profesoresResponse = await context.requestJson<unknown>(
      '/profesores/all-profesores',
      {
        method: 'GET',
        tokenOverride: superAdminToken,
      }
    );
    collectStateFromResponse(
      context,
      '/profesores/all-profesores',
      profesoresResponse
    );

    const profesorId = findProfesorIdByUserId(
      profesoresResponse,
      profesorUserId
    );
    if (!profesorId) {
      throw new Error(
        `[seed-massive] No se encontró profesor para userId=${profesorUserId}`
      );
    }

    const slotResponse = await context.requestJson<unknown>(
      '/profesores/admin-slots',
      {
        method: 'POST',
        body: {
          aula: `Aula Seed ${i}`,
          numeroClase: 2000 + i,
          capacidad: 40,
          profesorId,
        },
        tokenOverride: superAdminToken,
      }
    );
    collectStateFromResponse(context, '/profesores/admin-slots', slotResponse);

    const classCode = extractClassCodeFromResponse(slotResponse);
    if (!classCode) {
      throw new Error(
        `[seed-massive] No se pudo extraer codigoClase del profesor ${email}`
      );
    }

    pushStateValue(context, 'seedClassCodes', classCode);
    pushStateValue(context, 'seedCreatedClassCodes', classCode);
    pushStateValue(context, 'seedProfesorCials', cial);
    pushStateValue(context, 'seedProfesorTokens', profesorToken);
    pushStateValue(context, 'seedProfesorUserIds', profesorUserId);
    pushStateValue(context, 'seedProtectedUserIds', profesorUserId);

    profesorActors.push({
      userId: profesorUserId,
      profesorId,
      email,
      token: profesorToken,
      classCode,
      cial,
    });
  }

  if (profesorActors.length === 0) {
    throw new Error('[seed-massive] No se pudieron crear actores Profesor');
  }

  context.set('seedTokenProfesor', profesorActors[0].token);
  context.set('seedTokenAdminRoutesProfesor', profesorActors[0].token);

  const profesorAlumnoCount = new Map<string, number>();
  const alumnoTokens: string[] = [];

  for (let i = 0; i < alumnoCount; i++) {
    const profesorActor = profesorActors[i % profesorActors.length];
    const username = `seed_alumno_${runTag}_${i}`;

    await context.requestJson('/alumnos/register', {
      method: 'POST',
      body: {
        username,
        password: DEFAULT_SEED_PASSWORD,
        codigoClase: profesorActor.classCode,
      },
      auth: false,
    });

    const alumnoUserId = await activateUserByIdentity(
      context,
      superAdminToken,
      {
        username,
      }
    );

    const alumnoToken = await context.loginWithCredentials(
      {
        email: username,
        password: DEFAULT_SEED_PASSWORD,
      },
      {
        setActiveToken: false,
        sessionKey: `alumno:${i}`,
      }
    );

    alumnoTokens.push(alumnoToken);
    pushStateValue(context, 'seedAlumnoTokens', alumnoToken);
    pushStateValue(context, 'seedAlumnoUserIds', alumnoUserId);
    pushStateValue(context, 'usuarioIds', alumnoUserId);
    pushStateValue(context, 'seedProtectedUserIds', alumnoUserId);

    const currentCount = profesorAlumnoCount.get(profesorActor.profesorId) || 0;
    profesorAlumnoCount.set(profesorActor.profesorId, currentCount + 1);
  }

  context.set('seedTokenAlumno', alumnoTokens[0] || '');

  const profesoresSinAlumnos = profesorActors.filter(
    (profesorActor) =>
      (profesorAlumnoCount.get(profesorActor.profesorId) || 0) < 2
  );
  if (profesoresSinAlumnos.length > 0) {
    throw new Error(
      `[seed-massive] Profesores sin alumnos suficientes: ${profesoresSinAlumnos.map((actor) => actor.email).join(', ')}`
    );
  }

  context.set('seedAdminCount', adminActors.length);
  context.set('seedProfesorCount', profesorActors.length);
  context.set('seedAlumnoCount', alumnoTokens.length);

  await ensurePasswordActor(context);
  await ensureResetActor(context);

  context.set('seedTokenAdminRoutesSuper', superAdminToken);
  context.setAccessToken(superAdminToken);
}

export async function ensureAdminRouteActors(
  context: SeedContext
): Promise<void> {
  const superAdminToken = context.getState<string>('seedTokenSuperAdmin');
  if (!superAdminToken) {
    throw new Error(
      '[seed-massive] Falta seedTokenSuperAdmin para preparar actores de rutas admin'
    );
  }
  await warmAdminState(context);

  const adminToken =
    getStateArray(context, 'seedAdminTokens')[0] ||
    context.getSessionToken('admin:0') ||
    superAdminToken;
  const profesorToken =
    getStateArray(context, 'seedProfesorTokens')[0] ||
    context.getSessionToken('profesor:0') ||
    superAdminToken;
  const runTag = `${Date.now()}_${faker.string.alphanumeric(6).toLowerCase()}`;

  const targetUserIds: string[] = [];
  const desiredTargetUsers = resolveCountInRange(
    'SEED_ADMIN_TARGET_USER_COUNT',
    10,
    20
  );
  for (let i = 0; i < desiredTargetUsers; i++) {
    const username = `seed_admin_target_${runTag}_${i}`;
    const email = `${username}@smarteconomat.local`;

    const targetUser = await upsertSeedUserViaRepository({
      username,
      email,
      password: DEFAULT_SEED_PASSWORD,
      role: rolUsuario.ALUMNO,
      nombre: `Seed Admin Target ${i}`,
    });
    const userId = targetUser.id;
    if (!userId) {
      throw new Error(
        `[seed-massive] No se pudo resolver ID de usuario objetivo admin (${username})`
      );
    }

    targetUserIds.push(userId);
    pushStateValue(context, 'usuarioIds', userId);
    pushStateValue(context, 'seedMutableUserIds', userId);
  }

  context.set('seedTokenAdminRoutesSuper', superAdminToken);
  context.set('seedTokenAdminRoutesAdmin', adminToken);
  context.set('seedTokenAdminRoutesProfesor', profesorToken);
  context.set('seedAdminRouteTargetUserIds', targetUserIds);

  context.setAccessToken(superAdminToken);
}

export function adminRouteActorByIteration(
  iteration: number
): 'superadmin' | 'admin' {
  const mod = iteration % 2;
  if (mod === 0) return 'superadmin';
  return 'admin';
}

export function expectedStatusForAdminRouteRequest(
  endpoint: Endpoint,
  _actor: 'superadmin' | 'admin'
): number[] {
  if (endpoint.method === 'POST') {
    return [200, 201];
  }

  return [200];
}

export async function executeAdminFocusEndpointRequest(
  context: SeedContext,
  endpoint: Endpoint,
  resolvedPath: string,
  iteration: number,
  coverage: EnumCoverage
): Promise<RequestResult> {
  const key = `${endpoint.method} ${endpoint.path}`;
  const actor = adminRouteActorByIteration(iteration);

  const tokenByActor = {
    superadmin: context.getState<string>('seedTokenAdminRoutesSuper'),
    admin: context.getState<string>('seedTokenAdminRoutesAdmin'),
  };

  const actorToken = tokenByActor[actor];
  if (!actorToken) {
    return {
      ok: false,
      key,
      endpoint,
      resolvedPath,
      error: `[seed-massive] Falta token para actor ${actor} en rutas admin`,
    };
  }

  const previousToken = context.getAccessToken();
  context.setAccessToken(actorToken);

  const expectedStatusCodes = expectedStatusForAdminRouteRequest(
    endpoint,
    actor
  );

  const requestPath =
    endpoint.method === 'GET'
      ? buildGetPath(context, resolvedPath, iteration)
      : resolvedPath;

  const requestPayload =
    endpoint.method === 'GET' ||
    endpoint.method === 'DELETE' ||
    endpoint.path === '/admin/users/:id/force-reset'
      ? undefined
      : buildBody(context, endpoint, resolvedPath, iteration, coverage);

  try {
    const response = await context.requestJson<unknown>(requestPath, {
      method: endpoint.method,
      body: requestPayload,
      auth: true,
    });

    const statusCode =
      context.getLastResponseStatusCode() ||
      (endpoint.method === 'POST' ? 201 : 200);

    if (!expectedStatusCodes.includes(statusCode)) {
      return {
        ok: false,
        countAsSuccess: false,
        key,
        endpoint,
        resolvedPath,
        payload: requestPayload,
        response,
        statusCode,
        error: `[seed-massive] ${key} actor=${actor} status inesperado ${statusCode}, esperado=${expectedStatusCodes.join(',')}`,
      };
    }

    if (statusCode >= 200 && statusCode < 300) {
      collectStateFromResponse(context, resolvedPath, response);
    }

    return {
      ok: true,
      countAsSuccess: statusCode >= 200 && statusCode < 300,
      key,
      endpoint,
      resolvedPath,
      payload: requestPayload,
      response,
      statusCode,
      resourceId: extractResourceId(response),
    };
  } catch (error) {
    const statusCode = context.getLastResponseStatusCode();
    if (
      typeof statusCode === 'number' &&
      expectedStatusCodes.includes(statusCode)
    ) {
      return {
        ok: true,
        countAsSuccess: statusCode >= 200 && statusCode < 300,
        key,
        endpoint,
        resolvedPath,
        payload: requestPayload,
        statusCode,
      };
    }

    const errorMessage = String(error instanceof Error ? error.message : error);
    return {
      ok: false,
      key,
      endpoint,
      resolvedPath,
      payload: requestPayload,
      statusCode,
      error: `[seed-massive] ${key} actor=${actor} fallo: ${errorMessage}`,
    };
  } finally {
    context.setAccessToken(previousToken);
  }
}

export async function refreshStateAfterOperation(
  context: SeedContext,
  result: RequestResult
): Promise<void> {
  const path = result.resolvedPath;
  if (!result.ok) {
    return;
  }

  if (
    path === '/proveedor' &&
    result.endpoint.method === 'POST' &&
    result.resourceId
  ) {
    pushStateValue(context, 'seedCreatedProveedorIds', result.resourceId);
  }

  if (
    path === '/productos' &&
    result.endpoint.method === 'POST' &&
    result.resourceId
  ) {
    pushStateValue(context, 'seedCreatedProductoIds', result.resourceId);

    const requestPayload =
      result.payload && typeof result.payload === 'object'
        ? (result.payload as Record<string, unknown>)
        : null;
    const payloadAlergenos = requestPayload
      ? requestPayload.alergenos
      : undefined;
    if (Array.isArray(payloadAlergenos)) {
      for (const alergeno of payloadAlergenos) {
        if (typeof alergeno === 'string' && alergeno.trim().length > 0) {
          pushStateValue(
            context,
            'productoAlergenoPairs',
            `${result.resourceId}|${alergeno}`
          );
        }
      }
    }

    for (const entity of toEntityArray(result.response)) {
      const proveedores = Array.isArray((entity as any).proveedores)
        ? ((entity as any).proveedores as Array<Record<string, unknown>>)
        : [];

      for (const proveedor of proveedores) {
        const productoProveedorId =
          typeof proveedor.id === 'string' ? proveedor.id : '';
        const proveedorId =
          typeof proveedor.proveedorId === 'string'
            ? proveedor.proveedorId
            : '';

        if (!productoProveedorId || !proveedorId) {
          continue;
        }

        pushStateValue(
          context,
          'seedCreatedProductoProveedorIds',
          productoProveedorId
        );
        pushStateValue(
          context,
          'seedCreatedProductoProveedorToProveedorPairs',
          `${productoProveedorId}|${proveedorId}`
        );
      }
    }
  }

  if (
    path === '/recetas' &&
    result.endpoint.method === 'POST' &&
    result.resourceId
  ) {
    pushStateValue(context, 'seedCreatedRecetaIds', result.resourceId);
  }

  if (
    path === '/pedidos' &&
    result.endpoint.method === 'POST' &&
    result.resourceId
  ) {
    pushStateValue(context, 'seedCreatedPedidoPendienteIds', result.resourceId);
  }

  if (
    path === '/purchase-batches' &&
    result.endpoint.method === 'POST' &&
    result.resourceId
  ) {
    pushStateValue(
      context,
      'seedCreatedPurchaseBatchPendienteIds',
      result.resourceId
    );
  }

  if (path.includes('/permisos-adicionales/')) {
    const match = path.match(
      /^\/usuarios\/([^/]+)\/permisos-adicionales\/([^/]+)$/
    );
    if (match) {
      const pair = `${match[1]}|${match[2]}`;
      if (result.endpoint.method === 'POST') {
        pushStateValue(context, 'usuarioPermisoAdicionalPairs', pair);
      }
      if (result.endpoint.method === 'DELETE') {
        removeStateValue(context, 'usuarioPermisoAdicionalPairs', pair);
      }
    }
  }

  if (path.includes('/permisos-excluidos/')) {
    const match = path.match(
      /^\/usuarios\/([^/]+)\/permisos-excluidos\/([^/]+)$/
    );
    if (match) {
      const pair = `${match[1]}|${match[2]}`;
      if (result.endpoint.method === 'POST') {
        pushStateValue(context, 'usuarioPermisoExcluidoPairs', pair);
      }
      if (result.endpoint.method === 'DELETE') {
        removeStateValue(context, 'usuarioPermisoExcluidoPairs', pair);
      }
    }
  }

  if (path.startsWith('/pedido-usuarios/') && path.endsWith('/aceptar')) {
    const id = path.split('/')[2];
    if (id) {
      removeStateValue(context, 'pedidoUsuarioPendienteIds', id);
    }
  }
  if (path.startsWith('/pedido-usuarios/') && path.endsWith('/cancelar')) {
    const id = path.split('/')[2];
    if (id) {
      removeStateValue(context, 'pedidoUsuarioPendienteIds', id);
    }
  }
  if (path.startsWith('/purchase-batches/') && path.endsWith('/aceptar')) {
    const id = path.split('/')[2];
    if (id) {
      removeStateValue(context, 'purchaseBatchPendienteIds', id);
      removeStateValue(context, 'seedCreatedPurchaseBatchPendienteIds', id);
    }
  }
  if (path.startsWith('/purchase-batches/') && path.endsWith('/cancelar')) {
    const id = path.split('/')[2];
    if (id) {
      removeStateValue(context, 'purchaseBatchPendienteIds', id);
      removeStateValue(context, 'seedCreatedPurchaseBatchPendienteIds', id);
    }
  }
  if (path.startsWith('/pedidos/') && path.endsWith('/aceptar')) {
    const id = path.split('/')[2];
    if (id) {
      removeStateValue(context, 'pedidoPendienteIds', id);
      removeStateValue(context, 'seedCreatedPedidoPendienteIds', id);
    }
  }
  if (path.startsWith('/pedidos/') && path.endsWith('/cancelar')) {
    const id = path.split('/')[2];
    if (id) {
      removeStateValue(context, 'pedidoPendienteIds', id);
      removeStateValue(context, 'seedCreatedPedidoPendienteIds', id);
    }
  }
  if (path.startsWith('/incidencias/') && path.endsWith('/resolver')) {
    const id = path.split('/')[2];
    if (id) {
      removeStateValue(context, 'incidenciaPendienteIds', id);
    }
  }

  if (path.startsWith('/preparaciones/') && path.endsWith('/iniciar')) {
    const id = path.split('/')[2];
    if (id) {
      removeStateValue(context, 'preparacionPendienteIds', id);
      pushStateValue(context, 'preparacionEnProcesoIds', id);
    }
  }
  if (path.startsWith('/preparaciones/') && path.endsWith('/finalizar')) {
    const id = path.split('/')[2];
    if (id) {
      removeStateValue(context, 'preparacionEnProcesoIds', id);
    }
  }
  if (path.startsWith('/preparaciones/') && path.endsWith('/cancelar')) {
    const id = path.split('/')[2];
    if (id) {
      removeStateValue(context, 'preparacionPendienteIds', id);
    }
  }

  if (path === '/auth/forgot-password') {
    const rawToken = `seed_token_${faker.string.alphanumeric(10)}`;
    const hashedTokenValue = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    const actorUserId = context.getState<string>('seedResetActorUserId');
    if (actorUserId) {
      const userRepo = AppDataSource.getRepository(Usuario);
      await userRepo.update(actorUserId, {
        resetPasswordOtp: hashedTokenValue,
        resetPasswordOtpExpires: new Date(Date.now() + 3600000),
      } as any);
      context.set('seedResetPasswordToken', rawToken);
      console.log(
        `[seed-massive] Re-seeded seedResetPasswordToken to ${rawToken} after forgot-password`
      );
    } else {
      context.set('seedResetPasswordToken', '');
    }
  }

  if (
    path === '/auth/change-password' ||
    path === '/usuarios/perfil/password'
  ) {
    const next = context.getState<string>('seedPasswordActorNextPassword');
    if (next) {
      context.set('seedPasswordActorCurrentPassword', next);
      context.set('seedPasswordActorNextPassword', '');

      const email = getRequiredStateString(context, 'seedPasswordActorEmail');
      const token = await context.loginWithCredentials({
        email,
        password: next,
      });
      context.set('seedTokenPasswordActor', token);
    }
  }

  if (path === '/auth/reset-password') {
    const rawToken = `seed_token_${faker.string.alphanumeric(10)}`;
    const hashedTokenValue = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    const actorUserId = context.getState<string>('seedResetActorUserId');
    if (actorUserId) {
      const userRepo = AppDataSource.getRepository(Usuario);
      await userRepo.update(actorUserId, {
        resetPasswordOtp: hashedTokenValue,
        resetPasswordOtpExpires: new Date(Date.now() + 3600000),
      } as any);
      context.set('seedResetPasswordToken', rawToken);
      console.log(
        `[seed-massive] Re-seeded seedResetPasswordToken to ${rawToken} after reset-password`
      );
    } else {
      context.set('seedResetPasswordToken', '');
    }
  }
}

export async function executeEndpointRequest(
  context: SeedContext,
  endpoint: Endpoint,
  iteration: number,
  coverage: EnumCoverage
): Promise<RequestResult> {
  const key = `${endpoint.method} ${endpoint.path}`;

  let resolvedPath = endpoint.path;
  try {
    resolvedPath = resolvePathParams(context, endpoint, iteration);
  } catch (error) {
    return {
      ok: false,
      key,
      endpoint,
      resolvedPath: endpoint.path,
      error: `resolvePathParams failed: ${String(error instanceof Error ? error.message : error)}`,
    };
  }

  if (isAdminFocusEndpoint(endpoint)) {
    return executeAdminFocusEndpointRequest(
      context,
      endpoint,
      resolvedPath,
      iteration,
      coverage
    );
  }

  const requiresAuth = !isPublicPath(resolvedPath);
  const previousToken = context.getAccessToken();

  if (requiresAuth) {
    context.setAccessToken(chooseTokenForPath(context, resolvedPath));
  }

  let requestPayload: unknown;

  try {
    const requestPath =
      endpoint.method === 'GET'
        ? buildGetPath(context, resolvedPath, iteration)
        : resolvedPath;

    if (endpoint.method === 'POST' && resolvedPath === '/recepciones') {
      const existingPedidos = getStateArray(context, 'pedidoIds');
      if (existingPedidos.length === 0) {
        const pedidoEndpoint: Endpoint = {
          method: 'POST',
          path: '/pedidos',
        } as Endpoint;
        const pedidoBody = buildBody(
          context,
          pedidoEndpoint,
          '/pedidos',
          iteration,
          coverage
        );
        try {
          const pedidoResp = await context.requestJson('/pedidos', {
            method: 'POST',
            body: pedidoBody,
          });
          collectStateFromResponse(context, '/pedidos', pedidoResp);
          const createdId = extractResourceId(pedidoResp);
          if (createdId) {
            pushStateValue(context, 'seedCreatedPedidoPendienteIds', createdId);
          }
        } catch (err) {
          const errMsg = String(err instanceof Error ? err.message : err);
          return {
            ok: false,
            key,
            endpoint,
            resolvedPath,
            payload: pedidoBody,
            error: `[seed-massive] PRECREATE /pedidos fallo: ${errMsg}`,
          } as RequestResult;
        }
      }
    }

    requestPayload =
      endpoint.method === 'GET' || endpoint.method === 'DELETE'
        ? undefined
        : buildBody(context, endpoint, resolvedPath, iteration, coverage);

    if (
      endpoint.method === 'POST' &&
      resolvedPath === '/albaranes/upload-documento'
    ) {
      const recepcionId = pickStateValue(
        context,
        'recepcionIds',
        iteration,
        ''
      );
      const response = await context.postMultipart<unknown>(
        '/albaranes/upload-documento',
        {
          file: new Blob(['seed-document'], { type: 'application/pdf' }),
          numeroReferencia: `ALB-SEED-${Date.now()}-${iteration}`,
          ...(recepcionId ? { recepcionId } : {}),
          observaciones: 'Documento generado por seeder masivo',
        }
      );

      collectStateFromResponse(context, resolvedPath, response);
      const statusCode = context.getLastResponseStatusCode() || 201;
      return {
        ok: statusCode >= 200 && statusCode < 300,
        key,
        endpoint,
        resolvedPath,
        payload: '[multipart/form-data]',
        response,
        statusCode,
        resourceId: extractResourceId(response),
      };
    }

    if (endpoint.method === 'POST' && resolvedPath === '/archivos/upload') {
      const response = await context.postMultipart<unknown>(
        '/archivos/upload',
        {
          file: new Blob([`seed-file-${Date.now()}-${iteration}`], {
            type: 'text/plain',
          }),
        }
      );

      collectStateFromResponse(context, resolvedPath, response);
      const statusCode = context.getLastResponseStatusCode() || 201;
      return {
        ok: statusCode >= 200 && statusCode < 300,
        key,
        endpoint,
        resolvedPath,
        payload: '[multipart/form-data]',
        response,
        statusCode,
        resourceId: extractResourceId(response),
      };
    }

    if (endpoint.method === 'POST' && resolvedPath === '/auth/logout') {
      const loginEmail =
        context.getState<string>('seedAdminLoginEmail') ||
        context.getState<string>('seedAdminLoginUsername') ||
        'admin@smarteconomat.com';
      const loginPassword =
        context.getState<string>('seedAdminCurrentPassword') ||
        'SmartEconomat2026!';

      const transientToken = await context.loginWithCredentials(
        {
          email: loginEmail,
          password: loginPassword,
        },
        { setActiveToken: false }
      );

      const response = await context.requestJson<unknown>('/auth/logout', {
        method: 'POST',
        auth: true,
        tokenOverride: transientToken,
      });

      const statusCode = context.getLastResponseStatusCode() || 200;
      return {
        ok: statusCode >= 200 && statusCode < 300,
        key,
        endpoint,
        resolvedPath,
        payload: '[logout-with-transient-token]',
        response,
        statusCode,
      };
    }

    const response = await context.requestJson<unknown>(requestPath, {
      method: endpoint.method,
      body: requestPayload,
      auth: requiresAuth,
    });

    collectStateFromResponse(context, resolvedPath, response);

    const statusCode = context.getLastResponseStatusCode() || 200;
    const isSuccess = statusCode >= 200 && statusCode < 300;
    return {
      ok: isSuccess,
      countAsSuccess: isSuccess,
      key,
      endpoint,
      resolvedPath,
      payload: requestPayload,
      response,
      statusCode,
      resourceId: extractResourceId(response),
    };
  } catch (error) {
    const statusCode =
      error instanceof HttpSeedRequestError
        ? error.status
        : context.getLastResponseStatusCode();

    const isAcceptableConflict = false;

    if (isAcceptableConflict) {
      return {
        ok: true,
        countAsSuccess: false,
        key,
        endpoint,
        resolvedPath,
        payload: requestPayload,
        statusCode,
        error: String(error instanceof Error ? error.message : error),
      };
    }

    return {
      ok: false,
      key,
      endpoint,
      resolvedPath,
      payload: requestPayload,
      error: String(error instanceof Error ? error.message : error),
      statusCode,
    };
  } finally {
    context.setAccessToken(previousToken);
  }
}
