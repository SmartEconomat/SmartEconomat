import { SeedContext } from './seed-context';
import { INCIDENCIA_ESTADOS, SEED_GLOBAL_CONFIG } from './massive.config';
import {
  fetchOpenFoodFactsProducts,
  offProductToCreateProductoPayload,
  uploadOpenFoodFactsProductImage,
} from './openfoodfacts.seed';
import { extractActiveEntityIds } from './massive.helpers.common';
import {
  DETERMINISTIC_PERSON_NAMES,
  DETERMINISTIC_PROVIDER_PROFILES,
  DETERMINISTIC_SHORT_NOTES,
  buildSeedRunTag,
  deterministicBool,
  deterministicCode,
  deterministicInt,
  pickDeterministic,
  seedDateIso,
} from './deterministic.seed-data';
import {
  TipoProducto,
  UnidadMedida,
} from '../modules/producto/enums/producto.enums';

type SeederTask = (context: SeedContext) => Promise<void>;
type SeedRecord = Record<string, unknown>;
type SeedEntity = SeedRecord & { id?: string };
type SeedUserEntity = SeedEntity & { email?: string };
type SeedProfesorEntity = SeedEntity & { user?: SeedRecord };
type SeedProveedorEntity = SeedEntity & { nif?: string };
type SeedProductoEntity = SeedEntity & { codigoBarras?: string };
type SeedUbicacionEntity = SeedEntity & { nombre?: string };
type SeedAulaEntity = SeedRecord & { aula?: string };
type SeedClaseEntity = SeedRecord & { numeroClase?: number };
type SeedProduccionLoteEntity = SeedEntity & {
  porcionesRestantes?: number;
};

function isSeedRecord(value: unknown): value is SeedRecord {
  return typeof value === 'object' && value !== null;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function getStringField(record: SeedRecord, key: string): string | undefined {
  const value = record[key];
  return isNonEmptyString(value) ? value : undefined;
}

function getNestedStringField(
  record: SeedRecord,
  parentKey: string,
  childKey: string
): string | undefined {
  const nestedValue = record[parentKey];
  if (!isSeedRecord(nestedValue)) {
    return undefined;
  }

  return getStringField(nestedValue, childKey);
}

function getProfesorUsername(record: SeedRecord): string | undefined {
  return (
    getStringField(record, 'username') ||
    getNestedStringField(record, 'user', 'username')
  );
}

function getProfesorEmail(record: SeedRecord): string | undefined {
  return (
    getStringField(record, 'email') ||
    getNestedStringField(record, 'user', 'email')
  );
}

function getNumberField(record: SeedRecord, key: string): number | undefined {
  const value = record[key];
  return typeof value === 'number' && Number.isFinite(value)
    ? value
    : undefined;
}

function getEntityId(entity: SeedRecord): string | undefined {
  return getStringField(entity, 'id');
}

function getVolumeMultiplier(context: SeedContext): number {
  const fromState = context.getState<number>('seedMultiplier');
  if (typeof fromState === 'number' && Number.isFinite(fromState)) {
    return Math.max(1, Math.floor(fromState));
  }
  return Math.max(1, Math.floor(SEED_GLOBAL_CONFIG.multiplier));
}

const DEFAULT_SEED_PASSWORD = 'SmartEconomat2026!';

const LIST_ENDPOINTS_WITH_PAGE = new Set([
  '/usuarios',
  '/proveedor',
  '/productos',
  '/ubicacion',
  '/inventario',
  '/pedido-usuarios',
  '/pedidos',
  '/recepciones',
  '/recepcion-productos',
  '/albaranes',
  '/incidencias',
  '/incidencias-resueltas',
  '/movimientos',
  '/recetas',
  '/preparaciones',
  '/merma',
  '/archivos',
]);

function listFromResponse<T extends SeedRecord = SeedRecord>(
  input: unknown
): T[] {
  if (Array.isArray(input)) {
    return input.filter(isSeedRecord) as T[];
  }

  if (!isSeedRecord(input)) {
    return [];
  }

  if (Array.isArray(input.items)) {
    return input.items.filter(isSeedRecord) as T[];
  }

  if (Array.isArray(input.data)) {
    return input.data.filter(isSeedRecord) as T[];
  }

  if (isSeedRecord(input.data) && Array.isArray(input.data.items)) {
    return input.data.items.filter(isSeedRecord) as T[];
  }

  return [];
}

function pushId(
  context: SeedContext,
  key: string,
  id: string | undefined
): void {
  if (!id) return;
  const current = context.getState<string[]>(key) || [];
  if (!current.includes(id)) {
    current.push(id);
    context.set(key, current);
  }
}

async function saveListIds(
  context: SeedContext,
  endpoint: string,
  stateKey: string
): Promise<SeedEntity[]> {
  const listPath = LIST_ENDPOINTS_WITH_PAGE.has(endpoint)
    ? `${endpoint}?limit=25&page=1`
    : endpoint === '/producto-proveedor/search'
      ? `${endpoint}?q=seed&limit=25&offset=0`
      : endpoint === '/historial-precio'
        ? `${endpoint}?order=DESC`
        : endpoint;

  const list = await safe(`listar ${endpoint}`, () =>
    context.getJson<unknown>(listPath)
  );

  const items = listFromResponse(list);
  if (endpoint === '/proveedor') {
    context.set(stateKey, extractActiveEntityIds(items));
    return items;
  }

  for (const item of items) {
    pushId(context, stateKey, getEntityId(item));
  }
  return items;
}

async function safe<T>(label: string, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    const message = String(error instanceof Error ? error.message : error);
    throw new Error(`[seed] ${label} fallo: ${message}`);
  }
}

async function rolesPermisosTask(context: SeedContext): Promise<void> {
  const roles = await safe('roles', () =>
    context.getJson<unknown>('/admin/roles')
  );
  const permisos = await safe('permisos', () =>
    context.getJson<unknown>('/admin/permissions')
  );

  context.set('roles', roles);
  context.set('permisos', permisos);

  const roleIds = listFromResponse(roles)
    .map((role) => getEntityId(role))
    .filter(isNonEmptyString);
  context.set('roleIds', roleIds);

  const permissionIds = listFromResponse(permisos)
    .map((permission) => getEntityId(permission))
    .filter(isNonEmptyString);
  context.set('permissionIds', permissionIds);
}

async function usuariosTask(context: SeedContext): Promise<void> {
  const volumeMultiplier = getVolumeMultiplier(context);
  const desiredUsers = [
    {
      nombre: 'Super Administrador',
      username: 'superadmin',
      email: 'superadmin@smarteconomat.com',
      password: DEFAULT_SEED_PASSWORD,
      rol: 'SUPER_ADMIN',
    },
    {
      nombre: 'Administrador Principal',
      username: 'admin',
      email: 'admin@smarteconomat.com',
      password: DEFAULT_SEED_PASSWORD,
      rol: 'ADMIN',
    },
    {
      nombre: 'Profesor Seed Principal',
      username: 'profesor',
      email: 'profesor@smarteconomat.com',
      password: DEFAULT_SEED_PASSWORD,
      rol: 'PROFESOR',
    },
  ];

  for (let i = 0; i < 8 * volumeMultiplier; i++) {
    desiredUsers.push({
      nombre: pickDeterministic(DETERMINISTIC_PERSON_NAMES, i, 'http-usuario'),
      username: `seed_user_${i}`,
      email: `seed.user.${i}@smarteconomat.local`,
      password: DEFAULT_SEED_PASSWORD,
      rol: i % 3 === 0 ? 'PROFESOR' : 'ADMIN',
    });
  }

  const list = await safe('listar usuarios', () =>
    context.getJson<unknown>('/usuarios?limit=25&page=1')
  );
  const users = listFromResponse<SeedUserEntity>(list);

  for (const user of desiredUsers) {
    const already = users.find(
      (seedUser) => getStringField(seedUser, 'email') === user.email
    );
    const alreadyId = already ? getEntityId(already) : undefined;
    if (already) {
      context.set(`usuario:${user.username}`, alreadyId);
      pushId(context, 'usuarioIds', alreadyId);
      continue;
    }

    const created = await context.postJson<SeedEntity>('/usuarios/admin', user);
    const createdId = getEntityId(created);
    context.set(`usuario:${user.username}`, createdId);
    pushId(context, 'usuarioIds', createdId);
  }

  const profesores = (await saveListIds(
    context,
    '/profesores/all-profesores',
    'profesorIds'
  )) as SeedProfesorEntity[];

  const profExists = profesores.some(
    (profesor) => getProfesorEmail(profesor) === 'profesor1@smarteconomat.com'
  );

  if (!profExists) {
    const created = await context.postJson<SeedEntity>('/admin/profesores', {
      username: 'profesor1',
      email: 'profesor1@smarteconomat.com',
      password: DEFAULT_SEED_PASSWORD,
      cial: 'CIAL-11111',
    });
    pushId(context, 'usuarioIds', getEntityId(created));
  }

  await saveListIds(context, '/usuarios', 'usuarioIds');
  await saveListIds(context, '/profesores/all-profesores', 'profesorIds');
  await saveListIds(context, '/profesores/all-slots', 'profesorSlotIds');

  const profesoresActualizados = listFromResponse<SeedProfesorEntity>(
    await safe('listar profesores actualizados', () =>
      context.getJson<unknown>('/profesores/all-profesores')
    )
  );
  const profesorPrincipal = profesoresActualizados.find(
    (profesor) =>
      getProfesorUsername(profesor) === 'profesor' ||
      getProfesorEmail(profesor) === 'profesor@smarteconomat.com'
  );
  const profesorPrincipalId = profesorPrincipal
    ? getEntityId(profesorPrincipal)
    : undefined;

  if (!profesorPrincipalId) {
    throw new Error(
      '[seed] No se encontro el profesor fijo requerido para crear el alumno conocido'
    );
  }

  try {
    await safe('crear slot fijo profesor', () =>
      context.postJson<SeedEntity>('/profesores/admin-slots', {
        aula: 'Aula Seed Principal',
        numeroClase: 2026,
        capacidad: 30,
        profesorId: profesorPrincipalId,
      })
    );
  } catch (error) {
    const message = String(error instanceof Error ? error.message : error);
    const normalizedMessage = message.toLowerCase();
    if (
      !normalizedMessage.includes('duplicate') &&
      !normalizedMessage.includes('duplicada') &&
      !normalizedMessage.includes('ya existe')
    ) {
      throw error;
    }
  }

  try {
    const createdAlumno = await safe('crear alumno conocido', () =>
      context.postJson<SeedEntity>('/usuarios/admin', {
        nombre: 'Alumno Seed',
        username: 'alumno',
        email: 'alumno@smarteconomat.com',
        password: DEFAULT_SEED_PASSWORD,
        rol: 'ALUMNO',
        aula: 'Aula Seed Principal',
      })
    );
    pushId(context, 'usuarioIds', getEntityId(createdAlumno));
  } catch (error) {
    const message = String(error instanceof Error ? error.message : error);
    const normalizedMessage = message.toLowerCase();
    if (
      !normalizedMessage.includes('already exists') &&
      !normalizedMessage.includes('ya existe') &&
      !normalizedMessage.includes('taken')
    ) {
      throw error;
    }
  }

  const usuariosMinimos = listFromResponse<SeedUserEntity>(
    await safe('listar usuarios minimos actualizados', () =>
      context.getJson<unknown>('/usuarios/minimos')
    )
  );
  const alumnoConocido = usuariosMinimos.find(
    (usuario) =>
      getStringField(usuario, 'username') === 'alumno' ||
      getStringField(usuario, 'email') === 'alumno@smarteconomat.com'
  );
  const alumnoConocidoId = alumnoConocido
    ? getEntityId(alumnoConocido)
    : undefined;

  if (alumnoConocidoId) {
    await safe(`activar alumno conocido ${alumnoConocidoId}`, () =>
      context.patchJson(`/admin/users/${alumnoConocidoId}/activate`, {
        active: true,
      })
    );
  }

  const adminToken = context.getAccessToken();

  try {
    await context.loginWithCredentials({
      email: 'alumno@smarteconomat.com',
      password: DEFAULT_SEED_PASSWORD,
    });

    await safe('asociar alumno conocido a profesor fijo', () =>
      context.patchJson('/alumnos/change-profesor', {
        cialNuevoProfesor: 'CIAL-SEED-2026',
        nuevaAula: 'Aula Seed Principal',
        nuevoNumeroClase: 2026,
      })
    );
  } finally {
    context.setAccessToken(adminToken);
  }

  const usuarioIds = context.getState<string[]>('usuarioIds') || [];
  if (usuarioIds.length > 0) {
    const id = usuarioIds[0];
    await safe(`admin activate user ${id}`, () =>
      context.patchJson(`/admin/users/${id}/activate`, {})
    );
    await safe(`admin force reset user ${id}`, () =>
      context.postJson(`/admin/users/${id}/force-reset`, {})
    );
    await safe(`activar usuario ${id}`, () =>
      context.patchJson(`/usuarios/${id}/activar`, {})
    );
    await safe(`perfil usuario ${id}`, () =>
      context.getJson(`/usuarios/${id}`)
    );
    await safe(`DELETE usuario ${id}`, () =>
      context.deleteJson(`/usuarios/${id}`)
    );
  }

  await safe('usuarios minimos', () => context.getJson('/usuarios/minimos'));
  await safe('get self profile', () => context.getJson('/usuarios/perfil'));
  await safe('get auth profile', () => context.getJson('/auth/profile'));

  const seedProfesor = desiredUsers.find((user) => user.rol === 'PROFESOR');

  if (seedProfesor) {
    const profesorToken = await context.loginWithCredentials({
      email: seedProfesor.email,
      password: seedProfesor.password,
    });

    if (!profesorToken) {
      context.setAccessToken(adminToken);
      throw new Error('[seed] Login profesor semilla sin token');
    }

    try {
      await saveListIds(context, '/profesores/slots', 'profesorSlotIds');
      await saveListIds(context, '/profesores/alumnos', 'alumnoIds');

      const alumnoIds = context.getState<string[]>('alumnoIds') || [];
      if (alumnoIds.length > 0) {
        const aid = alumnoIds[0];
        await safe(`profesor activar alumno ${aid}`, () =>
          context.patchJson(`/profesores/alumnos/${aid}/activate`, {})
        );
        await safe(`profesor force reset alumno ${aid}`, () =>
          context.postJson(`/profesores/alumnos/${aid}/force-reset`, {})
        );
      }

      const slotIds = context.getState<string[]>('profesorSlotIds') || [];
      if (slotIds.length > 0) {
        const sid = slotIds[0];
        await safe(`borrar slot profesor ${sid}`, () =>
          context.deleteJson(`/profesores/slots/${sid}`)
        );
      }
    } finally {
      context.setAccessToken(adminToken);
    }
  }
}

async function profesorAlumnoTask(context: SeedContext): Promise<void> {
  await safe('listar aulas', () => context.getJson('/alumnos/aulas'));
  const aulasResponse = await safe('get json aulas', () =>
    context.getJson<unknown>('/alumnos/aulas')
  );
  const aulas = listFromResponse<SeedAulaEntity>(aulasResponse);
  if (aulas.length > 0) {
    const aula = aulas[0]?.aula;
    if (aula) {
      await safe(`listar clases aula ${aula}`, () =>
        context.getJson(`/alumnos/aulas/${aula}/clases`)
      );
      const clasesResponse = await safe(`get json clases aula ${aula}`, () =>
        context.getJson<unknown>(`/alumnos/aulas/${aula}/clases`)
      );
      const clases = listFromResponse<SeedClaseEntity>(clasesResponse);
      if (clases.length > 0) {
        const clase = clases[0]?.numeroClase;
        if (clase !== undefined) {
          await safe(`listar profesores aula ${aula} clase ${clase}`, () =>
            context.getJson(`/alumnos/aulas/${aula}/clases/${clase}/profesores`)
          );
        }
      }
    }
  }

  const profesorIds = context.getState<string[]>('profesorIds') || [];
  if (profesorIds.length > 0) {
    await safe('change profesor alumno', () =>
      context.patchJson('/alumnos/change-profesor', {
        nuevoProfesorId: profesorIds[0],
      })
    );
  }

  await saveListIds(context, '/profesores/admin-slots', 'profesorAdminSlotIds');
  const adminSlots = context.getState<string[]>('profesorAdminSlotIds') || [];
  if (adminSlots.length > 0) {
    await safe(`DELETE admin-slot ${adminSlots[0]}`, () =>
      context.deleteJson(`/profesores/admin-slots/${adminSlots[0]}`)
    );
  }
}

async function proveedorTask(context: SeedContext): Promise<void> {
  const volumeMultiplier = getVolumeMultiplier(context);
  const runTag = buildSeedRunTag(volumeMultiplier).toUpperCase();
  const desired = Array.from({ length: 15 * volumeMultiplier }).map(
    (_, idx) => {
      const profile = pickDeterministic(
        DETERMINISTIC_PROVIDER_PROFILES,
        idx,
        'http-proveedor-profile'
      );
      return {
        nombre: `${profile.nombre} ${runTag}-${String(idx + 1).padStart(2, '0')}`,
        contacto: profile.contacto,
        telefono: profile.telefono,
        email: `proveedor.seed.${String(idx).padStart(3, '0')}@smarteconomat.local`,
        direccion: profile.direccion,
        nif: deterministicCode('B', idx + 10_000, 8, 'http-proveedor-nif'),
      };
    }
  );

  const list = await safe('listar proveedor', () =>
    context.getJson<unknown>('/proveedor?limit=50&page=1')
  );
  const items = listFromResponse<SeedProveedorEntity>(list);

  for (const proveedor of desired) {
    const exists = items.find(
      (currentProveedor) =>
        getStringField(currentProveedor, 'nif') === proveedor.nif
    );
    const existingId = exists ? getEntityId(exists) : undefined;
    if (exists) {
      context.set(`proveedor:${proveedor.nif}`, existingId);
      continue;
    }

    const created = await safe(`crear proveedor ${proveedor.nif}`, () =>
      context.postJson<SeedEntity>('/proveedor', proveedor)
    );
    const createdId = getEntityId(created);
    context.set(`proveedor:${proveedor.nif}`, createdId);
    pushId(context, 'proveedorIds', createdId);
  }

  await saveListIds(context, '/proveedor', 'proveedorIds');
  const ids = context.getState<string[]>('proveedorIds') || [];
  if (ids.length > 0) {
    const id = ids[0];
    await safe(`get proveedor ${id}`, () =>
      context.getJson(`/proveedor/${id}`)
    );

    await safe(`delete proveedor ${id}`, () =>
      context.deleteJson(`/proveedor/${id}`)
    );
  }
}

async function productoTask(context: SeedContext): Promise<void> {
  const volumeMultiplier = getVolumeMultiplier(context);
  await saveListIds(context, '/proveedor', 'proveedorIds');
  const maxToCreate = 16 * volumeMultiplier;
  const batchSize = 4;
  const proveedorIds = context.getState<string[]>('proveedorIds') || [];
  const defaultProveedorId = proveedorIds[0];

  const list = await safe('listar productos', () =>
    context.getJson<unknown>('/productos?limit=50&page=1')
  );
  const items = listFromResponse<SeedProductoEntity>(list);

  const existingCodes = new Set(
    items
      .map((product) => getStringField(product, 'codigoBarras'))
      .filter(isNonEmptyString)
  );

  let offProducts = await safe('obtener productos OpenFoodFacts', () =>
    fetchOpenFoodFactsProducts({ pageSize: 50 })
  );

  offProducts = offProducts.filter((product) => !!product?.code);

  const candidates: Array<{ code: string; payload: Record<string, unknown> }> =
    [];
  for (const offProduct of offProducts) {
    if (candidates.length >= maxToCreate) {
      break;
    }

    const targetCode = (offProduct.code || '').trim();
    if (!targetCode || existingCodes.has(targetCode)) {
      continue;
    }

    await uploadOpenFoodFactsProductImage(context, offProduct);

    const payload = offProductToCreateProductoPayload(
      offProduct,
      defaultProveedorId
    );
    if (!payload) {
      continue;
    }

    candidates.push({
      code: targetCode,
      payload,
    });

    existingCodes.add(targetCode);
  }

  if (candidates.length === 0) {
    console.warn(
      '[seed] productoTask no encontro candidatos validos en OpenFoodFacts para crear productos nuevos'
    );
  }

  let consecutiveMisses = 0;
  for (let i = 0; i < candidates.length; i += batchSize) {
    const batch = candidates.slice(i, i + batchSize);
    const createdBatch = await Promise.all(
      batch.map((candidate) =>
        safe(`crear producto semilla ${candidate.code}`, () =>
          context.postJson<SeedEntity>('/productos', candidate.payload)
        )
      )
    );

    let batchHits = 0;
    for (const created of createdBatch) {
      batchHits++;
      pushId(context, 'productoIds', getEntityId(created));
    }

    if (batchHits === 0) {
      consecutiveMisses++;
    } else {
      consecutiveMisses = 0;
    }

    if (consecutiveMisses >= 3) {
      console.warn(
        '[seed] productoTask detenido anticipadamente por demasiados lotes sin inserciones'
      );
      break;
    }
  }

  await saveListIds(context, '/productos', 'productoIds');
  await saveListIds(
    context,
    '/producto-proveedor/search',
    'productoProveedorIds'
  );

  const productoIds = context.getState<string[]>('productoIds') || [];
  const deletableProducto = await safe(
    'crear producto eliminable dedicado',
    () =>
      context.postJson<SeedEntity>('/productos', {
        nombre: `Producto eliminable ${buildSeedRunTag(volumeMultiplier)}`,
        unidad: UnidadMedida.UNIDAD,
        tipo: TipoProducto.OTRO,
        contenido: 1,
      })
  );
  const deletableProductoId = deletableProducto
    ? getEntityId(deletableProducto)
    : undefined;

  if (productoIds.length > 0) {
    const pid = productoIds[0];
    await safe(`get producto ${pid}`, () =>
      context.getJson(`/productos/${pid}`)
    );
    await safe(`get pmp producto ${pid}`, () =>
      context.getJson(`/productos/${pid}/pmp`)
    );
    await safe(`get historial precios producto ${pid}`, () =>
      context.getJson(`/productos/${pid}/historial-precios`)
    );
  }

  if (deletableProductoId) {
    await safe(`delete producto ${deletableProductoId}`, () =>
      context.deleteJson(`/productos/${deletableProductoId}`)
    );
  }

  await safe('generar ean13', () =>
    context.getJson('/productos/generar-ean13')
  );
  await safe('producto alergenos', () =>
    context.getJson('/producto-alergenos')
  );

  const ppIds = context.getState<string[]>('productoProveedorIds') || [];
  if (ppIds.length > 0) {
    const ppid = ppIds[0];
    await safe(`historial producto-proveedor ${ppid}`, () =>
      context.getJson(`/producto-proveedor/${ppid}/historial`)
    );
  }

  if (productoIds.length > 1) {
    await safe(`comparar producto ${productoIds[1]}`, () =>
      context.getJson(`/producto-proveedor/comparar/${productoIds[1]}`)
    );
  }
}

async function ubicacionTask(context: SeedContext): Promise<void> {
  const volumeMultiplier = getVolumeMultiplier(context);
  const current = (await saveListIds(
    context,
    '/ubicacion',
    'ubicacionIds'
  )) as SeedUbicacionEntity[];
  const existingNames = new Set(
    current
      .map((ubicacion) => getStringField(ubicacion, 'nombre'))
      .filter(isNonEmptyString)
  );

  for (let i = 0; i < 20 * volumeMultiplier; i++) {
    const nombre = `UBI-SEED-${String(i).padStart(3, '0')}`;
    if (existingNames.has(nombre)) {
      continue;
    }

    const created = await safe(`crear ubicacion ${nombre}`, () =>
      context.postJson<SeedEntity>('/ubicacion', {
        nombre,
        descripcion: `Ubicacion automatica ${i}`,
        activo: true,
      })
    );

    pushId(context, 'ubicacionIds', getEntityId(created));
  }

  await saveListIds(context, '/ubicacion', 'ubicacionIds');

  const ubiIds = context.getState<string[]>('ubicacionIds') || [];
  if (ubiIds.length > 0) {
    const uid = ubiIds[0];
    await safe(`get ubicacion ${uid}`, () =>
      context.getJson(`/ubicacion/${uid}`)
    );
    await safe(`delete ubicacion ${uid}`, () =>
      context.deleteJson(`/ubicacion/${uid}`)
    );
  }
}

async function inventarioTask(context: SeedContext): Promise<void> {
  const volumeMultiplier = getVolumeMultiplier(context);
  await saveListIds(
    context,
    '/producto-proveedor/search',
    'productoProveedorIds'
  );
  await saveListIds(context, '/ubicacion', 'ubicacionIds');

  const productoProveedorIds =
    context.getState<string[]>('productoProveedorIds') || [];
  const ubicacionIds = context.getState<string[]>('ubicacionIds') || [];
  const toCreate = Math.min(
    productoProveedorIds.length,
    ubicacionIds.length,
    25 * volumeMultiplier
  );

  for (let i = 0; i < toCreate; i++) {
    await safe(`crear inventario ${i}`, () =>
      context.postJson('/inventario', {
        productoProveedorId: productoProveedorIds[i],
        ubicacionId: ubicacionIds[i],
        cantidadActual: deterministicInt(10, 500, i, 'http-inventario-actual'),
        cantidadMinima: deterministicInt(2, 25, i, 'http-inventario-minima'),
        cantidadMaxima: deterministicInt(300, 800, i, 'http-inventario-maxima'),
      })
    );
  }

  await saveListIds(context, '/inventario', 'inventarioIds');
  await safe('inventario stock', () => context.getJson('/inventario/stock'));

  const invIds = context.getState<string[]>('inventarioIds') || [];
  if (invIds.length > 0) {
    const iid = invIds[0];
    await safe(`get inventario ${iid}`, () =>
      context.getJson(`/inventario/${iid}`)
    );
    await safe(`delete inventario ${iid}`, () =>
      context.deleteJson(`/inventario/${iid}`)
    );
  }

  const inventarioIds = context.getState<string[]>('inventarioIds') || [];
  for (const [index, id] of inventarioIds.slice(0, 12).entries()) {
    const tipoAjuste = pickDeterministic(
      ['entrada', 'ajuste', 'salida_ajuste'] as const,
      index,
      'http-ajuste-tipo'
    );

    let ajusteValue = 1;
    if (tipoAjuste === 'salida_ajuste') {
      ajusteValue = -deterministicInt(1, 8, index, 'http-ajuste-salida');
    } else if (tipoAjuste === 'ajuste') {
      const v = deterministicInt(-5, 8, index, 'http-ajuste-general');
      ajusteValue =
        v === 0
          ? deterministicBool(index, 'http-ajuste-cero-signo')
            ? -1
            : 1
          : v;
    } else {
      ajusteValue = deterministicInt(1, 8, index, 'http-ajuste-entrada');
    }

    await safe(`ajuste inventario ${id}`, () =>
      context.postJson('/inventario/ajustes-manuales', {
        inventarioId: id,
        tipo: tipoAjuste,
        ajuste: ajusteValue,
        motivo: 'Ajuste seed masivo',
        observaciones: 'Ajuste automatizado por seeder HTTP',
      })
    );
  }
}

async function pingTask(context: SeedContext, path: string): Promise<void> {
  await safe(`ping ${path}`, () => context.getJson(`${path}?limit=10&page=1`));
}

async function pedidoTask(context: SeedContext): Promise<void> {
  const volumeMultiplier = getVolumeMultiplier(context);
  await saveListIds(context, '/pedido-usuarios', 'pedidoUsuarioIds');
  await saveListIds(context, '/purchase-batches', 'purchaseBatchIds');
  await saveListIds(context, '/pedidos', 'pedidoIds');
  await saveListIds(context, '/recetas', 'recetaIds');

  const recetaIds = context.getState<string[]>('recetaIds') || [];
  const recetaIdsForPedido = recetaIds.slice(0, 3);

  for (let i = 0; i < 8 * volumeMultiplier; i++) {
    await safe(`pedido-draft ${i}`, () =>
      context.postJson('/pedido/draft', {
        payload: {
          nombre: `Borrador Pedido ${i}`,
          nota: pickDeterministic(
            DETERMINISTIC_SHORT_NOTES,
            i,
            'http-pedido-draft-nota'
          ),
          lineas: [],
        },
      })
    );

    if (recetaIdsForPedido.length > 0) {
      await safe(`pedido from recipes ${i}`, () =>
        context.postJson('/pedidos/from-recipes', {
          recetaIds: recetaIdsForPedido,
          observaciones: 'Generado por seeder HTTP',
        })
      );
    }

    const pendingPedidoUsuarioIds = (
      context.getState<string[]>('pedidoUsuarioPendienteIds') ||
      context.getState<string[]>('pedidoUsuarioIds') ||
      []
    ).slice(0, 5);

    const consolidateBody: Record<string, unknown> = {};
    if (pendingPedidoUsuarioIds.length > 0)
      consolidateBody.pedidoUsuarioIds = pendingPedidoUsuarioIds;

    if (Object.keys(consolidateBody).length > 0) {
      consolidateBody.observaciones = pickDeterministic(
        DETERMINISTIC_SHORT_NOTES,
        i,
        'http-purchase-batch-observacion'
      );
      await safe(`purchase batch consolidate ${i}`, () =>
        context.postJson('/purchase-batches/consolidate', consolidateBody)
      );
    } else {
      throw new Error(
        '[seed] purchase batch consolidate requiere pedidos pendientes para ejecutarse en modo estricto'
      );
    }
  }

  await saveListIds(context, '/pedido-usuarios', 'pedidoUsuarioIds');
  await saveListIds(context, '/purchase-batches', 'purchaseBatchIds');
  await saveListIds(context, '/pedidos', 'pedidoIds');

  const puIds = context.getState<string[]>('pedidoUsuarioIds') || [];
  if (puIds.length > 0) {
    const puid = puIds[0];
    await safe(`get pedido-usuario ${puid}`, () =>
      context.getJson(`/pedido-usuarios/${puid}`)
    );
    await safe(`get pdf pedido-usuario ${puid}`, () =>
      context.getJson(`/pedido-usuarios/${puid}/pdf`)
    );
    await safe(`PATCH pedido-usuario ${puid}`, () =>
      context.patchJson(`/pedido-usuarios/${puid}`, { items: [] })
    );
  }

  const pbIds = context.getState<string[]>('purchaseBatchIds') || [];
  if (pbIds.length > 0) {
    const pbid = pbIds[0];
    await safe(`get purchase-batch ${pbid}`, () =>
      context.getJson(`/purchase-batches/${pbid}`)
    );
    await safe(`get pdf purchase-batch ${pbid}`, () =>
      context.getJson(`/purchase-batches/${pbid}/pdf`)
    );
    await safe(`PATCH purchase-batch ${pbid}`, () =>
      context.patchJson(`/purchase-batches/${pbid}`, {
        observaciones: 'Modified',
      })
    );
    await safe(`PATCH purchase-batch cancelar ${pbid}`, () =>
      context.patchJson(`/purchase-batches/${pbid}/cancelar`, {})
    );
    await safe(`PATCH purchase-batch aceptar ${pbid}`, () =>
      context.patchJson(`/purchase-batches/${pbid}/aceptar`, {})
    );
  }

  const pedIds = context.getState<string[]>('pedidoIds') || [];
  if (pedIds.length > 0) {
    const pedid = pedIds[0];
    await safe(`get pedido ${pedid}`, () =>
      context.getJson(`/pedidos/${pedid}`)
    );
    await safe(`PATCH pedido ${pedid}`, () =>
      context.patchJson(`/pedidos/${pedid}`, { nota: 'Updated' })
    );
    await safe(`PATCH pedido fecha-entrega ${pedid}`, () =>
      context.patchJson(`/pedidos/${pedid}/fecha-entrega`, {
        fechaEntrega: seedDateIso(7),
      })
    );
    await safe(`delete pedido ${pedid}`, () =>
      context.deleteJson(`/pedidos/${pedid}`)
    );
  }

  await safe('get pedido draft', () => context.getJson('/pedido/draft'));
  await safe('delete pedido draft', () => context.deleteJson('/pedido/draft'));

  await safe('pedido-usuarios from missing stock', () =>
    context.postJson('/pedido-usuarios/from-missing-stock', {
      items: (context.getState<string[]>('recetaIds') || [])
        .slice(0, 2)
        .map((recetaId) => ({ recetaId, cantidad: 1 })),
      observaciones: 'Seed desde faltantes',
    })
  );
  await safe('pedido-usuarios from recipes', () =>
    context.postJson('/pedido-usuarios/from-recipes', {
      recetaIds: context.getState<string[]>('recetaIds')?.slice(0, 2) || [],
      observaciones: 'Seed from recipes',
    })
  );
  await saveListIds(context, '/purchase-batches', 'purchaseBatchIds');
}

async function recepcionTask(context: SeedContext): Promise<void> {
  const volumeMultiplier = getVolumeMultiplier(context);
  await saveListIds(context, '/recepciones', 'recepcionIds');
  for (let i = 0; i < 5 * volumeMultiplier; i++) {
    await safe(`recepcion-draft ${i}`, () =>
      context.postJson('/recepcion/draft', {
        payload: {
          nombre: `Borrador Recepcion ${i}`,
          nota: pickDeterministic(
            DETERMINISTIC_SHORT_NOTES,
            i,
            'http-recepcion-draft-nota'
          ),
        },
      })
    );
  }

  await saveListIds(context, '/recepciones', 'recepcionIds');
  await saveListIds(context, '/recepcion-productos', 'recepcionProductoIds');
  await saveListIds(
    context,
    '/producto-proveedor/search',
    'productoProveedorIds'
  );

  await safe('get recepcion draft', () => context.getJson('/recepcion/draft'));
  await safe('delete recepcion draft', () =>
    context.deleteJson('/recepcion/draft')
  );

  const recIds = context.getState<string[]>('recepcionIds') || [];
  if (recIds.length > 0) {
    const rid = recIds[0];
    await safe(`get recepcion ${rid}`, () =>
      context.getJson(`/recepciones/${rid}`)
    );
    await safe(`PATCH recepcion ${rid}`, () =>
      context.patchJson(`/recepciones/${rid}`, { nota: 'Updated' })
    );
  }

  const rpIds = context.getState<string[]>('recepcionProductoIds') || [];
  if (rpIds.length > 0) {
    const rpid = rpIds[0];
    await safe(`get recepcion-producto ${rpid}`, () =>
      context.getJson(`/recepcion-productos/${rpid}`)
    );
    await safe(`PATCH recepcion-producto ${rpid}`, () =>
      context.patchJson(`/recepcion-productos/${rpid}`, { cantidad: 5 })
    );
    await safe(`DELETE recepcion-producto ${rpid}`, () =>
      context.deleteJson(`/recepcion-productos/${rpid}`)
    );
  }

  const productoProveedorIds =
    context.getState<string[]>('productoProveedorIds') || [];
  if (recIds[0] && productoProveedorIds[0]) {
    await safe('crear recepcion-producto manual', () =>
      context.postJson('/recepcion-productos', {
        recepcionId: recIds[0],
        productoProveedorId: productoProveedorIds[0],
        cantidad: 1,
      })
    );
  }

  await safe('reporte recepciones', () =>
    context.getJson('/recepciones/reporte-pdf')
  );
  await saveListIds(context, '/recepciones', 'recepcionIds');
  await saveListIds(context, '/recepcion-productos', 'recepcionProductoIds');
}

async function albaranTask(context: SeedContext): Promise<void> {
  await saveListIds(context, '/albaranes', 'albaranIds');

  const albIds = context.getState<string[]>('albaranIds') || [];
  if (albIds.length > 0) {
    const aid = albIds[0];
    await safe(`get albaran ${aid}`, () =>
      context.getJson(`/albaranes/${aid}`)
    );
    await safe(`delete albaran ${aid}`, () =>
      context.deleteJson(`/albaranes/${aid}`)
    );
  }

  await safe('crear albaran (sin documento)', () =>
    context.postJson('/albaranes', {
      nAlbaran: deterministicCode('ALB-SEED-', 1, 6, 'http-albaran'),
    })
  );

  await safe('upload albaran documento mockup', () =>
    context.postJson('/albaranes/upload-documento', { dummy: 'mock' })
  );
}

async function historialPrecioTask(context: SeedContext): Promise<void> {
  await saveListIds(context, '/historial-precio', 'historialPrecioIds');
  const hpIds = context.getState<string[]>('historialPrecioIds') || [];
  if (hpIds.length > 0) {
    const hpid = hpIds[0];
    await safe(`get historial-precio ${hpid}`, () =>
      context.getJson(`/historial-precio/${hpid}`)
    );
    await safe(`delete historial-precio ${hpid}`, () =>
      context.deleteJson(`/historial-precio/${hpid}`)
    );
  }
}

async function incidenciaTask(context: SeedContext): Promise<void> {
  const volumeMultiplier = getVolumeMultiplier(context);
  await saveListIds(context, '/incidencias', 'incidenciaIds');
  await saveListIds(context, '/incidencias-resueltas', 'incidenciaResueltaIds');
  await saveListIds(context, '/recepciones', 'recepcionIds');
  await saveListIds(context, '/usuarios', 'usuarioIds');

  const incIds = context.getState<string[]>('incidenciaIds') || [];
  const usuarioIds = context.getState<string[]>('usuarioIds') || [];
  const recepcionIds = context.getState<string[]>('recepcionIds') || [];

  const unwrapIncidencia = (payload: unknown): SeedRecord | null => {
    if (!isSeedRecord(payload)) {
      return null;
    }

    if (isSeedRecord(payload.data)) {
      return payload.data;
    }

    return payload;
  };

  const readIncidenciaEstado = (payload: unknown): string | undefined => {
    const incidencia = unwrapIncidencia(payload);
    return incidencia ? getStringField(incidencia, 'estado') : undefined;
  };

  const observedIncidenciaEstados = new Set<string>();

  const observeEstado = (payload: unknown): string | undefined => {
    const estado = readIncidenciaEstado(payload);
    const normalizedEstado = estado ? estado.trim().toLowerCase() : '';
    if (normalizedEstado.length > 0) {
      observedIncidenciaEstados.add(normalizedEstado);
    }
    return estado;
  };

  const readIncidenciaLineas = (payload: unknown): SeedRecord[] => {
    const incidencia = unwrapIncidencia(payload);
    if (!incidencia) {
      return [];
    }

    const lineas = incidencia.lineas;
    if (!Array.isArray(lineas)) {
      return [];
    }

    return lineas.filter(isSeedRecord);
  };

  const createReportedIncidencia = async (
    index: number,
    reason: string
  ): Promise<string> => {
    if (recepcionIds.length === 0) {
      throw new Error(
        '[seed] incidenciaTask requiere recepciones para cubrir estados de incidencia'
      );
    }

    const recepcionId = recepcionIds[index % recepcionIds.length];

    const created = await safe(`crear incidencia reportada (${reason})`, () =>
      context.postJson('/incidencias/reportar', {
        recepcionId,
        tipo: pickDeterministic(
          ['rotura', 'caducado', 'falta_producto', 'exceso_producto', 'otro'],
          index,
          `http-incidencia-estado-${reason}`
        ),
      })
    );

    const incidencia = unwrapIncidencia(created);
    const id = incidencia ? getEntityId(incidencia) : undefined;
    if (!id) {
      throw new Error(
        `[seed] crear incidencia reportada (${reason}) no devolvio id`
      );
    }

    return id;
  };

  const fetchIncidencia = async (id: string): Promise<unknown> =>
    safe(`get incidencia ${id} (estado)`, () =>
      context.getJson(`/incidencias/${id}`)
    );

  const warnUnexpectedEstado = (
    targetEstado: string,
    actualEstado: string | undefined,
    incidenciaId: string
  ): void => {
    if (actualEstado === targetEstado) {
      return;
    }

    throw new Error(
      `[seed] Estado incidencia no coincide para ${incidenciaId}: esperado=${targetEstado}, actual=${actualEstado ?? 'desconocido'}`
    );
  };
  if (incIds.length > 0) {
    const iid = incIds[0];
    await safe(`get incidencia ${iid}`, () =>
      context.getJson(`/incidencias/${iid}`)
    );
    await safe(`PATCH incidencia ${iid}`, () =>
      context.patchJson(`/incidencias/${iid}`, {
        observacionesRecepcion: pickDeterministic(
          DETERMINISTIC_SHORT_NOTES,
          0,
          'http-incidencia-patch-observaciones'
        ),
      })
    );
    await safe(`PATCH resolver incidencia ${iid}`, () =>
      context.patchJson(`/incidencias/${iid}/resolver`, {
        ...(usuarioIds[0] ? { usuarioId: usuarioIds[0] } : {}),
        estadoFinal: 'resuelta',
        observacionesResolucion: pickDeterministic(
          DETERMINISTIC_SHORT_NOTES,
          0,
          'http-incidencia-resolver-patch-observaciones'
        ),
      })
    );
    await safe(`POST resolver incidencia ${iid}`, () =>
      context.postJson(`/incidencias/${iid}/resolver`, {
        accion: 'aceptada',
        observaciones: pickDeterministic(
          DETERMINISTIC_SHORT_NOTES,
          0,
          'http-incidencia-resolver-post-observaciones'
        ),
      })
    );
    await safe(`delete incidencia ${iid}`, () =>
      context.deleteJson(`/incidencias/${iid}`)
    );
  }

  const resIds = context.getState<string[]>('incidenciaResueltaIds') || [];
  if (resIds.length > 0) {
    const rsid = resIds[0];
    await safe(`get incidencia-resuelta ${rsid}`, () =>
      context.getJson(`/incidencias-resueltas/${rsid}`)
    );
    await safe(`PATCH incidencia-resuelta ${rsid}`, () =>
      context.patchJson(`/incidencias-resueltas/${rsid}`, { nota: 'Updated' })
    );
    await safe(`DELETE incidencia-resuelta ${rsid}`, () =>
      context.deleteJson(`/incidencias-resueltas/${rsid}`)
    );
  }

  if (incIds[0] && usuarioIds[0]) {
    await safe('POST incidencias-resueltas dummy', () =>
      context.postJson('/incidencias-resueltas', {
        idIncidencia: incIds[0],
        idUsuarioResolutor: usuarioIds[0],
        tipoResolucion: 'aceptada',
        observaciones: pickDeterministic(
          DETERMINISTIC_SHORT_NOTES,
          0,
          'http-incidencia-resuelta-create-observaciones'
        ),
      })
    );
  }

  if (recepcionIds.length > 0) {
    const usuarioResolutorId = usuarioIds[0];

    const incidenciaNuevaId = await createReportedIncidencia(0, 'nueva');
    const incidenciaNueva = await fetchIncidencia(incidenciaNuevaId);
    warnUnexpectedEstado(
      'nueva',
      observeEstado(incidenciaNueva),
      incidenciaNuevaId
    );

    const incidenciaPendienteId = await createReportedIncidencia(
      1,
      'pendiente-validacion'
    );
    const incidenciaPendienteDetalle = await fetchIncidencia(
      incidenciaPendienteId
    );
    const lineasPendiente = readIncidenciaLineas(incidenciaPendienteDetalle);
    if (lineasPendiente.length > 0) {
      await safe(
        `patch resolver incidencia ${incidenciaPendienteId} (pendiente_validacion)`,
        () =>
          context.patchJson(`/incidencias/${incidenciaPendienteId}/resolver`, {
            marcarComoResuelta: false,
            observacionesResolucion: pickDeterministic(
              DETERMINISTIC_SHORT_NOTES,
              1,
              'http-incidencia-estado-pendiente-validacion-observaciones'
            ),
            lineas: lineasPendiente
              .map((linea) => {
                const id = getEntityId(linea);
                const cantidadEsperada = getNumberField(
                  linea,
                  'cantidadEsperada'
                );

                if (!id || cantidadEsperada === undefined) {
                  return null;
                }

                return {
                  id,
                  cantidadRecibida: cantidadEsperada,
                };
              })
              .filter((linea) => linea !== null),
          })
      );
    }
    const incidenciaPendiente = await fetchIncidencia(incidenciaPendienteId);
    warnUnexpectedEstado(
      'pendiente_validacion',
      observeEstado(incidenciaPendiente),
      incidenciaPendienteId
    );

    const incidenciaAjusteId = await createReportedIncidencia(2, 'en-ajuste');
    const incidenciaAjusteDetalle = await fetchIncidencia(incidenciaAjusteId);
    const lineaAjuste = readIncidenciaLineas(incidenciaAjusteDetalle)[0];
    const lineaAjusteId = lineaAjuste ? getEntityId(lineaAjuste) : undefined;
    if (lineaAjusteId) {
      await safe(
        `patch resolver incidencia ${incidenciaAjusteId} (en_ajuste)`,
        () =>
          context.patchJson(`/incidencias/${incidenciaAjusteId}/resolver`, {
            marcarComoResuelta: false,
            observacionesResolucion: pickDeterministic(
              DETERMINISTIC_SHORT_NOTES,
              2,
              'http-incidencia-estado-en-ajuste-observaciones'
            ),
            lineas: [
              {
                id: lineaAjusteId,
                estadoReclamacion: 'RECLAMADO',
              },
            ],
          })
      );
    }
    const incidenciaAjuste = await fetchIncidencia(incidenciaAjusteId);
    warnUnexpectedEstado(
      'en_ajuste',
      observeEstado(incidenciaAjuste),
      incidenciaAjusteId
    );

    const incidenciaResueltaId = await createReportedIncidencia(3, 'resuelta');
    await safe(
      `patch resolver incidencia ${incidenciaResueltaId} (resuelta)`,
      () =>
        context.patchJson(`/incidencias/${incidenciaResueltaId}/resolver`, {
          ...(usuarioResolutorId ? { usuarioId: usuarioResolutorId } : {}),
          marcarComoResuelta: true,
          estadoFinal: 'resuelta',
          observacionesResolucion: pickDeterministic(
            DETERMINISTIC_SHORT_NOTES,
            3,
            'http-incidencia-estado-resuelta-observaciones'
          ),
        })
    );
    const incidenciaResuelta = await fetchIncidencia(incidenciaResueltaId);
    warnUnexpectedEstado(
      'resuelta',
      observeEstado(incidenciaResuelta),
      incidenciaResueltaId
    );

    const incidenciaCanceladaId = await createReportedIncidencia(
      4,
      'cancelada'
    );
    await safe(
      `patch resolver incidencia ${incidenciaCanceladaId} (cancelada)`,
      () =>
        context.patchJson(`/incidencias/${incidenciaCanceladaId}/resolver`, {
          ...(usuarioResolutorId ? { usuarioId: usuarioResolutorId } : {}),
          marcarComoResuelta: true,
          estadoFinal: 'cancelada',
          observacionesResolucion: pickDeterministic(
            DETERMINISTIC_SHORT_NOTES,
            4,
            'http-incidencia-estado-cancelada-observaciones'
          ),
        })
    );
    const incidenciaCancelada = await fetchIncidencia(incidenciaCanceladaId);
    warnUnexpectedEstado(
      'cancelada',
      observeEstado(incidenciaCancelada),
      incidenciaCanceladaId
    );

    const incidenciaInvalidaId = await createReportedIncidencia(5, 'invalida');
    await safe(
      `patch resolver incidencia ${incidenciaInvalidaId} (invalida)`,
      () =>
        context.patchJson(`/incidencias/${incidenciaInvalidaId}/resolver`, {
          ...(usuarioResolutorId ? { usuarioId: usuarioResolutorId } : {}),
          marcarComoResuelta: true,
          estadoFinal: 'invalida',
          observacionesResolucion: pickDeterministic(
            DETERMINISTIC_SHORT_NOTES,
            5,
            'http-incidencia-estado-invalida-observaciones'
          ),
        })
    );
    const incidenciaInvalida = await fetchIncidencia(incidenciaInvalidaId);
    warnUnexpectedEstado(
      'invalida',
      observeEstado(incidenciaInvalida),
      incidenciaInvalidaId
    );

    const missingObservedEstados = INCIDENCIA_ESTADOS.filter(
      (estado) => !observedIncidenciaEstados.has(estado)
    );
    if (missingObservedEstados.length > 0) {
      throw new Error(
        `[seed] Cobertura de estados de incidencia incompleta en http-seed: faltan ${missingObservedEstados.join(', ')}`
      );
    }
  }

  for (let i = 0; i < 6 * volumeMultiplier; i++) {
    const recepcionId = recepcionIds[i % Math.max(1, recepcionIds.length)];
    if (!recepcionId) {
      continue;
    }

    await safe(`incidencia reportar ${i}`, () =>
      context.postJson('/incidencias/reportar', {
        recepcionId,
        tipo: pickDeterministic(
          ['rotura', 'caducado', 'falta_producto', 'exceso_producto', 'otro'],
          i,
          'http-incidencia-tipo'
        ),
      })
    );
  }
  await saveListIds(context, '/incidencias', 'incidenciaIds');
  await saveListIds(context, '/incidencias-resueltas', 'incidenciaResueltaIds');
}

async function recetaTask(context: SeedContext): Promise<void> {
  const volumeMultiplier = getVolumeMultiplier(context);
  await saveListIds(context, '/recetas', 'recetaIds');
  const recetaIds = context.getState<string[]>('recetaIds') || [];
  if (recetaIds.length > 0) {
    const rid = recetaIds[0];
    await safe(`get receta ${rid}`, () => context.getJson(`/recetas/${rid}`));
    await safe(`get receta detalle ${rid}`, () =>
      context.getJson(`/recetas/${rid}/detalle`)
    );
    await safe(`get receta escandallo ${rid}`, () =>
      context.getJson(`/recetas/${rid}/escandallo`)
    );
    await safe(`get receta pdf ${rid}`, () =>
      context.getJson(`/recetas/${rid}/pdf`)
    );
  }

  const sourceId = recetaIds[0];

  if (!sourceId) {
    throw new Error(
      '[seed] recetaTask requiere al menos una receta base para duplicación en modo estricto'
    );
  }

  for (let i = 0; i < 10 * volumeMultiplier; i++) {
    await safe(`duplicar receta ${i}`, () =>
      context.postJson('/recetas/duplicate', {
        sourceId,
        newName: `Receta duplicada seed ${deterministicCode('R', i, 4, 'http-receta-duplicate')}`,
      })
    );
  }

  await safe('export recetas pdf', () =>
    context.getJson(
      `/recetas/export/pdf?ids=${recetaIds.slice(0, 3).join(',')}`
    )
  );
  await saveListIds(context, '/recetas', 'recetaIds');
}

async function mermaTask(context: SeedContext): Promise<void> {
  await safe('merma stats', () => context.getJson('/merma/stats'));
  await saveListIds(context, '/merma', 'mermaIds');
  const merIds = context.getState<string[]>('mermaIds') || [];
  if (merIds.length > 0) {
    await safe(`get merma ${merIds[0]}`, () =>
      context.getJson(`/merma/${merIds[0]}`)
    );
  }
}

async function preparacionTaskEnhanced(context: SeedContext): Promise<void> {
  await safe('listar preparaciones', () => context.getJson('/preparaciones'));
  await saveListIds(context, '/preparaciones', 'preparacionIds');
  const prepIds = context.getState<string[]>('preparacionIds') || [];
  if (prepIds.length > 0) {
    const pid = prepIds[0];
    await safe(`get preparacion ${pid}`, () =>
      context.getJson(`/preparaciones/${pid}`)
    );
    await safe(`PATCH iniciar preparacion ${pid}`, () =>
      context.patchJson(`/preparaciones/${pid}/iniciar`, {})
    );
    await safe(`PATCH finalizar preparacion ${pid}`, () =>
      context.patchJson(`/preparaciones/${pid}/finalizar`, {})
    );
    await safe(`PATCH cancelar preparacion ${pid}`, () =>
      context.patchJson(`/preparaciones/${pid}/cancelar`, {})
    );
    await safe(`DELETE preparacion ${pid}`, () =>
      context.deleteJson(`/preparaciones/${pid}`)
    );
  }

  const recetaIds = context.getState<string[]>('recetaIds') || [];
  if (recetaIds.length > 0) {
    await safe('POST preparaciones dummy', () =>
      context.postJson('/preparaciones', { recetaId: recetaIds[0] })
    );
  }
}

async function produccionTask(context: SeedContext): Promise<void> {
  await safe('validar produccion', () =>
    context.postJson('/produccion/validar', {})
  );
  await safe('ejecutar produccion', () =>
    context.postJson('/produccion/ejecutar', {})
  );

  await saveListIds(context, '/produccion', 'produccionLoteIds');
  const lotIds = context.getState<string[]>('produccionLoteIds') || [];
  if (lotIds.length > 0) {
    const lid = lotIds[0];
    const lote = await safe(`get produccion ${lid}`, () =>
      context.getJson<SeedProduccionLoteEntity>(`/produccion/${lid}`)
    );

    const porcionesRestantes = getNumberField(lote, 'porcionesRestantes') ?? 0;
    if (porcionesRestantes >= 1) {
      const valor = Math.min(Math.floor(porcionesRestantes), 5);
      await safe(`PATCH consumir lote ${lid}`, () =>
        context.patchJson(`/produccion/lote/${lid}/consumir`, {
          tipo: 'raciones',
          valor,
        })
      );
    }
  }
}

async function movimientosTask(context: SeedContext): Promise<void> {
  await safe('movimientos historial', () =>
    context.getJson('/movimientos/historial')
  );
  await saveListIds(context, '/movimientos', 'movimientoIds');
  const movIds = context.getState<string[]>('movimientoIds') || [];
  if (movIds.length > 0) {
    const mid = movIds[0];
    await safe(`get movimiento ${mid}`, () =>
      context.getJson(`/movimientos/${mid}`)
    );
    await safe(`DELETE movimiento ${mid}`, () =>
      context.deleteJson(`/movimientos/${mid}`)
    );
  }
}

async function archivosTask(context: SeedContext): Promise<void> {
  await safe('mock upload archivo', () =>
    context.postJson('/archivos/upload', { dummy: 'file' })
  );
  await saveListIds(context, '/archivos', 'archivoIds');
  const arcIds = context.getState<string[]>('archivoIds') || [];
  if (arcIds.length > 0) {
    const aid = arcIds[0];
    await safe(`get archivo ${aid}`, () => context.getJson(`/archivos/${aid}`));
    await safe(`DELETE archivo ${aid}`, () =>
      context.deleteJson(`/archivos/${aid}`)
    );
  }
}

async function exportTask(context: SeedContext): Promise<void> {
  const endpoints = [
    '/export/albaranes/pdf',
    '/export/albaranes/xlsx',
    '/export/incidencias/xlsx',
    '/export/inventario/pdf',
    '/export/inventario/xlsx',
    '/export/movimientos/xlsx',
    '/export/pedidos/pdf',
    '/export/pedidos/xlsx',
    '/export/productos/pdf',
    '/export/productos/xlsx',
    '/export/proveedores/pdf',
    '/export/proveedores/xlsx',
    '/export/recepciones/xlsx',
    '/export/recetas/pdf',
    '/export/recetas/xlsx',
    '/export/ubicaciones/xlsx',
    '/export/usuarios/xlsx',
  ];
  for (const ep of endpoints) {
    await safe(`export ${ep}`, () => context.getJson(ep));
  }
}

async function authTask(context: SeedContext): Promise<void> {
  await safe('auth forgot-password', () =>
    context.postJson('/auth/forgot-password', { email: 'test@example.com' })
  );
  await safe('auth reset-password', () =>
    context.postJson('/auth/reset-password', {
      token: 'dummy',
      newPassword: 'Dummy',
    })
  );
  await safe('auth register mock', () =>
    context.postJson('/auth/register', { dummy: 'mock' })
  );
  await safe('auth change-password', () =>
    context.patchJson('/auth/change-password', {
      currentPassword: DEFAULT_SEED_PASSWORD,
      newPassword: 'NewPassword123!',
    })
  );
  await safe('auth logout', () => context.postJson('/auth/logout', {}));
}

async function baseTask(context: SeedContext): Promise<void> {
  await safe('root v1', () => context.getJson('/'));
}

async function alertasTask(context: SeedContext): Promise<void> {
  await safe('alertas caducidad', () => context.getJson('/alertas/caducidad'));
  await safe('alertas stock', () => context.getJson('/alertas/stock'));
}

const TASKS: Record<string, SeederTask> = {
  'roles-permisos': rolesPermisosTask,
  usuario: usuariosTask,
  proveedor: proveedorTask,
  producto: productoTask,
  inventario: inventarioTask,
  pedido: pedidoTask,
  recepcion: recepcionTask,
  albaran: albaranTask,
  'historial-precio': historialPrecioTask,
  incidencia: incidenciaTask,
  receta: recetaTask,
  preparacion: preparacionTaskEnhanced,
  merma: mermaTask,
  ubicacion: ubicacionTask,
  ping: (c) => pingTask(c, '/dashboard/stats'),
  profesorAlumno: profesorAlumnoTask,
  archivos: archivosTask,
  export: exportTask,
  produccion: produccionTask,
  movimientos: movimientosTask,
  auth: authTask,
  base: baseTask,
  alertas: alertasTask,
};

export async function runNamedHttpSeeder(
  name: string,
  context: SeedContext
): Promise<void> {
  const task = TASKS[name];
  if (!task) {
    throw new Error(`[seed] Seeder HTTP no registrado: ${name}`);
  }

  await task(context);
}
