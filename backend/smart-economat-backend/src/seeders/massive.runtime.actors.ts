import * as crypto from 'crypto';
import Redis from 'ioredis';
import { HttpSeedRequestError, SeedContext } from './seed-context';
import { DEFAULT_SEED_PASSWORD } from './massive.config';
import {
  ADMIN_PERMISSION_CODES,
  ADMIN_RESTRICTED_PERMISSION_CODES,
} from '../common/constants/role-permission-sets.constants';
import { ALL_PERMISSION_CODES } from '../common/constants/permissions.constants';
import { getSystemRoleTemplateAliases } from '../common/constants/system-role-template.constants';
import AppDataSource from '../config/typeorm.config';
import { Rol } from '../modules/roles/rol.entity/rol.entity';
import { Usuario } from '../modules/usuario/usuario.entity/usuario.entity';
import { rolUsuario, UserStatus } from '../modules/usuario/enums/usuario.enums';
import { Permiso } from '../modules/permisos/permiso.entity/permiso.entity';
import { PlantillaRol } from '../modules/plantillas-roles/plantilla-rol.entity/plantilla-rol.entity';
import { Profesor } from '../modules/profesor/profesor.entity/profesor.entity';
import { AlumnoSlot } from '../modules/profesor/profesor.entity/alumno-slot.entity';
import { Alumno } from '../modules/alumno/alumno.entity/alumno.entity';
import { Endpoint, HttpMethod } from './massive.types';
import {
  activateUserByIdentity,
  collectStateFromResponse,
  extractClassCodeFromResponse,
  findProfesorIdByUserId,
  getStateArray,
  normalizePath,
  pushStateValue,
  setUserRoleForSeed,
  toEntityArray,
} from './massive.helpers';
import {
  buildSeedRunTag,
  deterministicCode,
  deterministicInt,
  deterministicToken,
  seedDateIso,
} from './deterministic.seed-data';

/**
 * Documentación en español.
 */
async function flushPermissionCache(): Promise<void> {
  const redisHost = process.env.REDIS_HOST || 'localhost';
  const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);
  let firstRedisError: string | null = null;
  const redis = new Redis({
    host: redisHost,
    port: redisPort,
    lazyConnect: true,
    connectTimeout: 1500,
    enableOfflineQueue: false,
    maxRetriesPerRequest: 1,
    retryStrategy: () => null,
  });

  redis.on('error', (error) => {
    if (!firstRedisError) {
      firstRedisError = String(error instanceof Error ? error.message : error);
    }
  });

  try {
    await redis.connect();
    const keys = await redis.keys('user:permissions:*');
    if (keys.length > 0) {
      await redis.del(...keys);
      console.log(
        `[seed-massive] Flushed ${keys.length} permission cache keys from Redis`
      );
    }
  } catch (error) {
    const message =
      firstRedisError || String(error instanceof Error ? error.message : error);
    console.warn(
      `[seed-massive] Could not flush Redis permission cache (${redisHost}:${redisPort}): ${message}`
    );
  } finally {
    try {
      await redis.quit();
    } catch {
      redis.disconnect();
    }
  }
}

const FIXED_SEED_SUPERADMIN = {
  username: 'superadmin',
  email: 'superadmin@smarteconomat.com',
  password: DEFAULT_SEED_PASSWORD,
  nombre: 'Super Administrador Seed',
  role: rolUsuario.SUPER_ADMIN,
};

const FIXED_SEED_ADMIN = {
  username: 'admin',
  email: 'admin@smarteconomat.com',
  password: DEFAULT_SEED_PASSWORD,
  nombre: 'Administrador Seed',
  role: rolUsuario.ADMIN,
};

const FIXED_SEED_PROFESOR = {
  username: 'profesor',
  email: 'profesor@smarteconomat.com',
  password: DEFAULT_SEED_PASSWORD,
  nombre: 'Profesor Seed',
  role: rolUsuario.PROFESOR,
  cial: 'CIAL-SEED-2026',
};

const FIXED_SEED_ALUMNO = {
  username: 'alumno',
  email: 'alumno@smarteconomat.com',
  password: DEFAULT_SEED_PASSWORD,
  nombre: 'Alumno Seed',
  role: rolUsuario.ALUMNO,
};

const FIXED_SEED_ALUMNO_TRANSFER_ACTOR = {
  username: 'seed_alumno_transfer_actor',
  email: 'seed.alumno.transfer@smarteconomat.local',
  password: DEFAULT_SEED_PASSWORD,
  nombre: 'Alumno Transfer Actor',
};

const FIXED_SEED_PROFESOR_SLOT = {
  aula: 'Aula Seed Principal',
  numeroClase: 2026,
  capacidad: 999,
  codigoSlot: 'AL-SEED2026',
};

type SeedRoleTemplateConfig = {
  role: rolUsuario;
  nombre: string;
  descripcion: string;
  esEditable: boolean;
};

const SEED_ROLE_TEMPLATE_CONFIG: readonly SeedRoleTemplateConfig[] = [
  {
    role: rolUsuario.SUPER_ADMIN,
    nombre: rolUsuario.SUPER_ADMIN,
    descripcion: 'Plantilla de sistema con todos los permisos. No editable.',
    esEditable: false,
  },
  {
    role: rolUsuario.ADMIN,
    nombre: rolUsuario.ADMIN,
    descripcion: 'Plantilla con permisos máximos de administración.',
    esEditable: false,
  },
  {
    role: rolUsuario.PROFESOR,
    nombre: rolUsuario.PROFESOR,
    descripcion: 'Plantilla operativa para el rol de profesor.',
    esEditable: true,
  },
  {
    role: rolUsuario.ALUMNO,
    nombre: rolUsuario.ALUMNO,
    descripcion: 'Plantilla operativa para el rol de alumno.',
    esEditable: true,
  },
];

const SEED_PROFESOR_PERMISSION_CODES = [
  'profesor:gestionar_slots',
  'profesor:ver_alumnos',
  'profesor:gestionar_alumnos',
  'dashboard:ver_estadisticas',
  'productos:listar',
  'productos:ver',
  'proveedores:listar',
  'ubicaciones:listar',
  'ubicaciones:ver',
  'inventario:listar',
  'inventario:ver',
  'inventario:ajustar_stock',
  'pedidos:crear',
  'pedidos:listar',
  'pedidos:ver',
  'pedidos:editar',
  'pedidos:cancelar',
  'recepciones:listar',
  'recepciones:ver',
  'recepciones:editar',
  'incidencias:crear',
  'incidencias:listar',
  'incidencias:ver',
  'incidencias:editar',
  'incidencias:resolver',
  'albaranes:crear',
  'albaranes:listar',
  'albaranes:ver',
  'albaranes:editar',
  'recetas:listar',
  'recetas:ver',
  'recetas:cocinar',
  'merma:crear',
  'merma:listar',
  'merma:ver',
  'merma:stats',
  'archivos:subir',
  'archivos:listar',
  'archivos:ver',
] as const;

const SEED_ALUMNO_PERMISSION_CODES = [
  'alumno:cambiar_profesor',
  'dashboard:ver_estadisticas',
  'productos:listar',
  'productos:ver',
  'proveedores:listar',
  'inventario:listar',
  'inventario:ver',
  'recetas:listar',
  'recetas:ver',
  'merma:listar',
  'merma:ver',
] as const;

function parseNumeroClaseValue(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.trunc(value);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    const parsed = Number.parseInt(trimmed, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

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
    where: [{ username: params.username }, { email: params.email }],
    relations: ['roles'],
  });

  if (!existing) {
    const created = userRepo.create({
      username: params.username,
      email: params.email,
      password: params.password,
      rol: params.role,
      nombre: params.nombre,
      status: UserStatus.ACTIVE,
      activo: true,
      mustChangePassword: false,
      roles: roleEntity ? [roleEntity] : [],
    });
    return userRepo.save(created);
  }

  existing.username = params.username;
  existing.email = params.email;
  existing.password = params.password;
  existing.rol = params.role;
  existing.nombre = params.nombre;
  existing.status = UserStatus.ACTIVE;
  existing.activo = true;
  existing.mustChangePassword = false;
  existing.roles = roleEntity ? [roleEntity] : [];

  return userRepo.save(existing);
}

async function upsertSeedProfesorViaRepository(params: {
  username: string;
  email: string;
  password: string;
  nombre: string;
  cial: string;
}): Promise<{ user: Usuario; profesor: Profesor }> {
  await ensureRepositoryReady();

  const user = await upsertSeedUserViaRepository({
    username: params.username,
    email: params.email,
    password: params.password,
    role: rolUsuario.PROFESOR,
    nombre: params.nombre,
  });

  const profesorRepo = AppDataSource.getRepository(Profesor);
  const existingProfesor = await profesorRepo.findOne({
    where: [{ user: { id: user.id } }, { cial: params.cial }],
    relations: ['user'],
  });

  const profesor =
    existingProfesor ||
    profesorRepo.create({
      user,
      cial: params.cial,
    });

  profesor.user = user;
  profesor.cial = params.cial;

  return {
    user,
    profesor: await profesorRepo.save(profesor),
  };
}

async function upsertAlumnoSlotViaRepository(params: {
  profesor: Profesor;
  aula: string;
  numeroClase: number;
  capacidad: number;
  codigoSlot: string;
}): Promise<AlumnoSlot> {
  await ensureRepositoryReady();

  const slotRepo = AppDataSource.getRepository(AlumnoSlot);

  const existingByCode = await slotRepo.findOne({
    where: { codigoSlot: params.codigoSlot },
    relations: ['profesor'],
  });

  const existingSlot =
    existingByCode ||
    (await slotRepo.findOne({
      where: {
        profesor: { id: params.profesor.id },
        aula: params.aula,
        numeroClase: params.numeroClase,
      },
      relations: ['profesor'],
    }));

  const slot =
    existingSlot ||
    slotRepo.create({
      profesor: params.profesor,
      aula: params.aula,
      numeroClase: params.numeroClase,
      capacidad: params.capacidad,
      codigoSlot: params.codigoSlot,
    });

  slot.profesor = params.profesor;
  slot.aula = params.aula;
  slot.numeroClase = params.numeroClase;
  slot.capacidad = params.capacidad;
  slot.codigoSlot = params.codigoSlot;

  return slotRepo.save(slot);
}

async function upsertSeedAlumnoViaRepository(params: {
  username: string;
  email: string;
  password: string;
  nombre: string;
  profesor: Profesor;
  slot: AlumnoSlot;
}): Promise<{ user: Usuario; alumno: Alumno }> {
  await ensureRepositoryReady();

  const user = await upsertSeedUserViaRepository({
    username: params.username,
    email: params.email,
    password: params.password,
    role: rolUsuario.ALUMNO,
    nombre: params.nombre,
  });

  const alumnoRepo = AppDataSource.getRepository(Alumno);
  const existingAlumno = await alumnoRepo.findOne({
    where: { user: { id: user.id } },
    relations: ['user', 'slot', 'profesor'],
  });

  const alumno =
    existingAlumno ||
    alumnoRepo.create({
      user,
      slot: params.slot,
      profesor: params.profesor,
    });

  alumno.user = user;
  alumno.slot = params.slot;
  alumno.profesor = params.profesor;

  return {
    user,
    alumno: await alumnoRepo.save(alumno),
  };
}

async function resolvePermissionIdsByCodes(
  codes: readonly string[]
): Promise<string[]> {
  await ensureRepositoryReady();
  const permisoRepo = AppDataSource.getRepository(Permiso);
  const ids: string[] = [];
  for (const code of codes) {
    const permiso = await permisoRepo.findOne({ where: { codigo: code } });
    if (permiso) {
      ids.push(permiso.id);
    }
  }
  return ids;
}

type PermissionSeed = {
  codigo: string;
  nombre: string;
  descripcion: string;
  modulo: string;
  accion: string;
};

function buildPermissionSeed(code: string): PermissionSeed | null {
  const [modulo, accion] = code.split(':');
  if (!modulo || !accion) {
    return null;
  }

  const nombre = `${modulo} ${accion}`
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());

  return {
    codigo: code,
    nombre,
    descripcion: `[seed-massive] Permiso bootstrap ${code}`,
    modulo,
    accion,
  };
}

async function ensureSeedPermissions(context: SeedContext): Promise<void> {
  await ensureRepositoryReady();

  const permisoRepo = AppDataSource.getRepository(Permiso);
  const permissionCodes = [...ALL_PERMISSION_CODES].sort();
  const ensuredPermissionIds: string[] = [];

  for (const code of permissionCodes) {
    const permissionSeed = buildPermissionSeed(code);
    if (!permissionSeed) {
      continue;
    }

    const existing = await permisoRepo
      .createQueryBuilder('permiso')
      .withDeleted()
      .where('permiso.codigo = :codigo', {
        codigo: permissionSeed.codigo,
      })
      .getOne();

    const permiso = existing || permisoRepo.create();
    permiso.codigo = permissionSeed.codigo;
    permiso.nombre = permissionSeed.nombre;
    permiso.descripcion = permissionSeed.descripcion;
    permiso.modulo = permissionSeed.modulo;
    permiso.accion = permissionSeed.accion;
    permiso.activo = true;
    permiso.deletedAt = null;
    permiso.deletedBy = null;

    const saved = await permisoRepo.save(permiso);
    ensuredPermissionIds.push(saved.id);
    pushStateValue(context, 'permissionIds', saved.id);
  }

  if (ensuredPermissionIds.length === 0) {
    throw new Error(
      '[seed-massive] No fue posible bootstrapear permisos del sistema para el seeder masivo'
    );
  }
}

async function removeUserAdditionalPermissions(
  userId: string,
  permissionCodes: readonly string[]
): Promise<void> {
  await ensureRepositoryReady();

  const userRepo = AppDataSource.getRepository(Usuario);
  const user = await userRepo.findOne({
    where: { id: userId },
    relations: { permisosAdicionales: true },
  });

  if (!user) {
    throw new Error(
      `[seed-massive] Usuario no encontrado para limpiar permisos: ${userId}`
    );
  }

  const blockedCodes = new Set(permissionCodes);
  const currentPermissions = user.permisosAdicionales || [];
  const nextPermissions = currentPermissions.filter(
    (permiso) => !blockedCodes.has(permiso.codigo)
  );

  if (nextPermissions.length === currentPermissions.length) {
    return;
  }

  user.permisosAdicionales = nextPermissions;
  await userRepo.save(user);
}

async function syncUserRoleViaAdminRoute(
  context: SeedContext,
  adminToken: string,
  userId: string,
  roleName: rolUsuario,
  permisosAdicionalesIds: string[] = [],
  permisosExcluidosIds: string[] = []
): Promise<void> {
  const roleIdByName =
    context.getState<Record<string, string>>('seedRoleIdByName') || {};
  const roleId = roleIdByName[roleName.trim().toUpperCase()];

  if (!roleId) {
    await setUserRoleForSeed(context, adminToken, userId, roleName);
    return;
  }

  await context.requestJson<unknown>(`/admin/users/${userId}/role`, {
    method: 'PATCH',
    body: {
      roleId,
      permisosAdicionalesIds,
      permisosExcluidosIds,
    },
    tokenOverride: adminToken,
  });
}

async function ensureSeedRoleIds(context: SeedContext): Promise<void> {
  const requiredSystemRoles: string[] = [
    rolUsuario.SUPER_ADMIN,
    rolUsuario.ADMIN,
    rolUsuario.PROFESOR,
    rolUsuario.ALUMNO,
  ];

  const cachedRoleIdByName =
    context.getState<Record<string, string>>('seedRoleIdByName') || {};
  const hasAllRequiredRolesCached =
    getStateArray(context, 'roleIds').length > 0 &&
    requiredSystemRoles.every((roleName) => {
      const normalized = roleName.trim().toUpperCase();
      const cachedId = cachedRoleIdByName[normalized];
      return typeof cachedId === 'string' && cachedId.trim().length > 0;
    });

  if (hasAllRequiredRolesCached) {
    return;
  }

  await ensureRepositoryReady();
  const roleRepo = AppDataSource.getRepository(Rol);
  const existingRoles = await roleRepo.find();
  const byNormalizedName = new Map<string, Rol>();
  const roleIdByName =
    context.getState<Record<string, string>>('seedRoleIdByName') || {};

  for (const role of existingRoles) {
    const normalized =
      typeof role.nombre === 'string' ? role.nombre.trim().toUpperCase() : '';
    if (normalized.length > 0 && !byNormalizedName.has(normalized)) {
      byNormalizedName.set(normalized, role);
      roleIdByName[normalized] = role.id;
    }
  }

  for (const roleName of requiredSystemRoles) {
    const normalized = roleName.trim().toUpperCase();
    const matched = byNormalizedName.get(normalized);

    if (matched) {
      let needsSave = false;
      if (!matched.activo) {
        matched.activo = true;
        needsSave = true;
      }
      if (!matched.esSistema) {
        matched.esSistema = true;
        needsSave = true;
      }

      const saved = needsSave ? await roleRepo.save(matched) : matched;
      pushStateValue(context, 'roleIds', saved.id);
      roleIdByName[normalized] = saved.id;
      continue;
    }

    const created = roleRepo.create({
      nombre: roleName,
      descripcion: `Rol de sistema bootstrap para seeding (${roleName})`,
      esSistema: true,
      activo: true,
    } as Rol);

    const saved = await roleRepo.save(created);
    byNormalizedName.set(normalized, saved);
    pushStateValue(context, 'roleIds', saved.id);
    roleIdByName[normalized] = saved.id;
  }

  context.set('seedRoleIdByName', roleIdByName);

  if (getStateArray(context, 'roleIds').length === 0) {
    throw new Error(
      '[seed-massive] No fue posible preparar roleIds para rutas admin'
    );
  }
}

async function ensureSeedRoleTemplates(context: SeedContext): Promise<void> {
  await ensureRepositoryReady();

  const roleRepo = AppDataSource.getRepository(Rol);
  const plantillaRepo = AppDataSource.getRepository(PlantillaRol);
  const permisoRepo = AppDataSource.getRepository(Permiso);

  const roles = await roleRepo.find();

  const roleByName = new Map<string, Rol>();
  for (const role of roles) {
    if (typeof role.nombre !== 'string') {
      continue;
    }

    const normalizedName = role.nombre.trim().toUpperCase();
    if (normalizedName.length > 0 && !roleByName.has(normalizedName)) {
      roleByName.set(normalizedName, role);
    }
  }

  const allPermisos = await permisoRepo.find({ where: { activo: true } });
  const permisoByCode = new Map<string, Permiso>();
  for (const p of allPermisos) {
    permisoByCode.set(p.codigo, p);
  }

  const permissionCodesByRole: Record<string, readonly string[]> = {
    [rolUsuario.ADMIN.toUpperCase()]: ADMIN_PERMISSION_CODES,
    [rolUsuario.PROFESOR.toUpperCase()]: SEED_PROFESOR_PERMISSION_CODES,
    [rolUsuario.ALUMNO.toUpperCase()]: SEED_ALUMNO_PERMISSION_CODES,
  };

  const collapseTemplateDuplicates = async (
    keepTemplateId: string,
    duplicateTemplateIds: string[]
  ): Promise<void> => {
    const uniqueDuplicateIds = [...new Set(duplicateTemplateIds)].filter(
      (templateId) => templateId !== keepTemplateId
    );

    if (uniqueDuplicateIds.length === 0) {
      return;
    }

    await AppDataSource.query(
      `UPDATE "rol"
       SET "plantilla_rol_id" = $1
       WHERE "plantilla_rol_id" = ANY($2::uuid[])`,
      [keepTemplateId, uniqueDuplicateIds]
    );

    await AppDataSource.query(
      `UPDATE "plantilla_rol"
       SET "plantilla_padre_id" = $1
       WHERE "plantilla_padre_id" = ANY($2::uuid[])`,
      [keepTemplateId, uniqueDuplicateIds]
    );

    await AppDataSource.query(
      `DELETE FROM "plantilla_rol"
       WHERE "id" = ANY($1::uuid[])`,
      [uniqueDuplicateIds]
    );
  };

  for (const templateConfig of SEED_ROLE_TEMPLATE_CONFIG) {
    const roleName = templateConfig.role.trim().toUpperCase();
    const role = roleByName.get(roleName);

    if (!role) {
      throw new Error(
        `[seed-massive] No se encontró el rol ${templateConfig.role} para recargar plantillas base`
      );
    }

    const templateAliases = getSystemRoleTemplateAliases(
      templateConfig.role
    ).map((name) => name.trim().toUpperCase());

    const matchingTemplates = await plantillaRepo
      .createQueryBuilder('plantilla')
      .withDeleted()
      .leftJoinAndSelect('plantilla.permisos', 'permiso')
      .where('UPPER(plantilla.nombre) IN (:...aliases)', {
        aliases: templateAliases,
      })
      .orderBy(
        'CASE WHEN UPPER(plantilla.nombre) = UPPER(:canonicalName) THEN 0 ELSE 1 END',
        'ASC'
      )
      .addOrderBy('plantilla.createdAt', 'ASC')
      .setParameter('canonicalName', templateConfig.nombre)
      .getMany();

    const existingTemplate = matchingTemplates[0];

    if (existingTemplate) {
      await collapseTemplateDuplicates(
        existingTemplate.id,
        matchingTemplates.slice(1).map((template) => template.id)
      );
    }

    const plantilla = existingTemplate || plantillaRepo.create();
    plantilla.nombre = templateConfig.nombre;
    plantilla.descripcion = templateConfig.descripcion;
    plantilla.esEditable = templateConfig.esEditable;
    plantilla.activo = true;

    if ((plantilla as unknown as Record<string, unknown>).deletedAt) {
      (plantilla as unknown as Record<string, unknown>).deletedAt = null;
    }
    Object.assign(plantilla, { plantillaPadreId: null });

    const codes = permissionCodesByRole[roleName];
    const resolvedPermissions = codes
      ? codes
          .map((code) => permisoByCode.get(code))
          .filter((p): p is Permiso => p !== undefined)
      : allPermisos;

    const roleWithPermisos = await roleRepo.findOne({
      where: { id: role.id },
      relations: { permisos: true },
    });

    if (roleWithPermisos) {
      roleWithPermisos.permisos = resolvedPermissions;
      await roleRepo.save(roleWithPermisos);
    }

    if (codes) {
      plantilla.permisos = resolvedPermissions;
    } else {
      plantilla.permisos = allPermisos;
    }

    const savedTemplate = await plantillaRepo.save(plantilla);

    if (!role.plantillaRolId || role.plantillaRolId !== savedTemplate.id) {
      role.plantillaRolId = savedTemplate.id;
      await roleRepo.save(role);
    }

    pushStateValue(context, 'plantillaRolIds', savedTemplate.id);
  }
}

export async function warmAdminState(context: SeedContext): Promise<void> {
  for (const path of ['/admin/roles', '/admin/permissions']) {
    const response = await context.requestJson<unknown>(path, {
      method: 'GET',
    });
    collectStateFromResponse(context, path, response);
  }

  await ensureSeedRoleIds(context);
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
    { path: '/plantillas-roles', method: 'GET' },
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
  const actorUsername = 'seed_pwd_actor';

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
  const actorUsername = 'seed_reset_actor';
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

  const rawToken = deterministicToken('seed_token', 0, 'reset-actor');
  const hashedTokenValue = crypto
    .createHash('sha256')
    .update(rawToken)
    .digest('hex');

  const userRepo = AppDataSource.getRepository(Usuario);
  await userRepo.update(actorUserId, {
    resetPasswordOtp: hashedTokenValue,
    resetPasswordOtpExpires: new Date(seedDateIso(3650)),
  });

  console.log(`[seed-massive] Setting seedResetPasswordToken to ${rawToken}`);
  context.set('seedResetActorEmail', actorEmail);
  context.set('seedResetActorUserId', actorUserId);
  context.set('seedResetPasswordToken', rawToken);
}

export async function ensureCanonicalSeedCredentials(
  context: SeedContext
): Promise<void> {
  const fixedSuperAdminUser = await upsertSeedUserViaRepository(
    FIXED_SEED_SUPERADMIN
  );
  const fixedAdminUser = await upsertSeedUserViaRepository(FIXED_SEED_ADMIN);
  const fixedProfesor =
    await upsertSeedProfesorViaRepository(FIXED_SEED_PROFESOR);
  const fixedProfesorSlot = await upsertAlumnoSlotViaRepository({
    profesor: fixedProfesor.profesor,
    ...FIXED_SEED_PROFESOR_SLOT,
  });
  const fixedAlumno = await upsertSeedAlumnoViaRepository({
    username: FIXED_SEED_ALUMNO.username,
    email: FIXED_SEED_ALUMNO.email,
    password: FIXED_SEED_ALUMNO.password,
    nombre: FIXED_SEED_ALUMNO.nombre,
    profesor: fixedProfesor.profesor,
    slot: fixedProfesorSlot,
  });

  const superAdminToken = await context.loginWithCredentials(
    {
      email: FIXED_SEED_SUPERADMIN.email,
      password: FIXED_SEED_SUPERADMIN.password,
    },
    {
      setActiveToken: false,
      sessionKey: 'superadmin:0',
    }
  );

  const adminToken = await context.loginWithCredentials(
    {
      email: FIXED_SEED_ADMIN.email,
      password: FIXED_SEED_ADMIN.password,
    },
    {
      setActiveToken: false,
      sessionKey: 'admin:0',
    }
  );

  const profesorToken = await context.loginWithCredentials(
    {
      email: FIXED_SEED_PROFESOR.email,
      password: FIXED_SEED_PROFESOR.password,
    },
    {
      setActiveToken: false,
      sessionKey: 'profesor:0',
    }
  );

  const alumnoToken = await context.loginWithCredentials(
    {
      email: FIXED_SEED_ALUMNO.email,
      password: FIXED_SEED_ALUMNO.password,
    },
    {
      setActiveToken: false,
      sessionKey: 'alumno:0',
    }
  );

  context.set('seedTokenSuperAdmin', superAdminToken);
  context.set('seedTokenAdmin', superAdminToken);
  context.set('seedTokenProfesor', profesorToken);
  context.set('seedTokenAlumno', alumnoToken);
  context.set('seedTokenAdminRoutesSuper', superAdminToken);
  context.set('seedTokenAdminRoutesAdmin', adminToken);
  context.set('seedTokenAdminRoutesProfesor', profesorToken);
  context.set('seedAdminLoginEmail', FIXED_SEED_SUPERADMIN.email);
  context.set('seedAdminCurrentPassword', DEFAULT_SEED_PASSWORD);
  context.set('seedFixedSuperAdminUserId', fixedSuperAdminUser.id);
  context.set('seedFixedAdminUserId', fixedAdminUser.id);
  context.set('seedFixedProfesorUserId', fixedProfesor.user.id);
  context.set('seedFixedProfesorSlotId', fixedProfesorSlot.id);
  context.set('seedFixedAlumnoId', fixedAlumno.alumno.id);
  context.set('seedFixedAlumnoUserId', fixedAlumno.user.id);
  pushStateValue(context, 'seedProtectedUserIds', fixedSuperAdminUser.id);
  pushStateValue(context, 'seedProtectedUserIds', fixedAdminUser.id);
  pushStateValue(context, 'seedProtectedUserIds', fixedProfesor.user.id);
  pushStateValue(context, 'seedProtectedUserIds', fixedAlumno.user.id);

  console.log(
    '[seed-massive] Credenciales canónicas verificadas para superadmin/admin/profesor/alumno'
  );
}

function resolveCountInRange(
  envName: string,
  min: number,
  max: number
): number {
  const raw = process.env[envName];
  const fallback = deterministicInt(min, max, min + max, envName);
  if (!raw) {
    return fallback;
  }

  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed)) {
    return fallback;
  }

  return Math.max(min, Math.min(max, parsed));
}

function isHttpConflict(error: unknown): error is HttpSeedRequestError {
  return error instanceof HttpSeedRequestError && error.status === 409;
}

export async function ensureRoleActors(context: SeedContext): Promise<void> {
  await ensureSeedPermissions(context);
  await warmAdminState(context);
  await ensureSeedRoleTemplates(context);

  const profesorPermIds = await resolvePermissionIdsByCodes(
    SEED_PROFESOR_PERMISSION_CODES
  );
  const alumnoPermIds = await resolvePermissionIdsByCodes(
    SEED_ALUMNO_PERMISSION_CODES
  );

  const fixedSuperAdminUser = await upsertSeedUserViaRepository(
    FIXED_SEED_SUPERADMIN
  );
  const superAdminToken = await context.loginWithCredentials(
    {
      email: FIXED_SEED_SUPERADMIN.email,
      password: FIXED_SEED_SUPERADMIN.password,
    },
    {
      setActiveToken: false,
      sessionKey: 'superadmin:0',
    }
  );

  await syncUserRoleViaAdminRoute(
    context,
    superAdminToken,
    fixedSuperAdminUser.id,
    rolUsuario.SUPER_ADMIN
  );

  const fixedAdminUser = await upsertSeedUserViaRepository(FIXED_SEED_ADMIN);
  await removeUserAdditionalPermissions(
    fixedAdminUser.id,
    ADMIN_RESTRICTED_PERMISSION_CODES
  );
  await syncUserRoleViaAdminRoute(
    context,
    superAdminToken,
    fixedAdminUser.id,
    rolUsuario.ADMIN
  );

  const adminToken = await context.loginWithCredentials(
    {
      email: FIXED_SEED_ADMIN.email,
      password: FIXED_SEED_ADMIN.password,
    },
    {
      setActiveToken: false,
      sessionKey: 'admin:0',
    }
  );

  const fixedProfesor =
    await upsertSeedProfesorViaRepository(FIXED_SEED_PROFESOR);
  await syncUserRoleViaAdminRoute(
    context,
    superAdminToken,
    fixedProfesor.user.id,
    rolUsuario.PROFESOR,
    profesorPermIds
  );

  const fixedProfesorSlot = await upsertAlumnoSlotViaRepository({
    profesor: fixedProfesor.profesor,
    ...FIXED_SEED_PROFESOR_SLOT,
  });

  const fixedProfesorToken = await context.loginWithCredentials(
    {
      email: FIXED_SEED_PROFESOR.email,
      password: FIXED_SEED_PROFESOR.password,
    },
    {
      setActiveToken: false,
      sessionKey: 'profesor:0',
    }
  );

  const fixedAlumno = await upsertSeedAlumnoViaRepository({
    username: FIXED_SEED_ALUMNO.username,
    email: FIXED_SEED_ALUMNO.email,
    password: FIXED_SEED_ALUMNO.password,
    nombre: FIXED_SEED_ALUMNO.nombre,
    profesor: fixedProfesor.profesor,
    slot: fixedProfesorSlot,
  });
  await syncUserRoleViaAdminRoute(
    context,
    superAdminToken,
    fixedAlumno.user.id,
    rolUsuario.ALUMNO,
    alumnoPermIds
  );

  const fixedAlumnoToken = await context.loginWithCredentials(
    {
      email: FIXED_SEED_ALUMNO.email,
      password: FIXED_SEED_ALUMNO.password,
    },
    {
      setActiveToken: false,
      sessionKey: 'alumno:0',
    }
  );

  const transferAlumnoActor = await upsertSeedAlumnoViaRepository({
    username: FIXED_SEED_ALUMNO_TRANSFER_ACTOR.username,
    email: FIXED_SEED_ALUMNO_TRANSFER_ACTOR.email,
    password: FIXED_SEED_ALUMNO_TRANSFER_ACTOR.password,
    nombre: FIXED_SEED_ALUMNO_TRANSFER_ACTOR.nombre,
    profesor: fixedProfesor.profesor,
    slot: fixedProfesorSlot,
  });

  await syncUserRoleViaAdminRoute(
    context,
    superAdminToken,
    transferAlumnoActor.user.id,
    rolUsuario.SUPER_ADMIN
  );

  const transferAlumnoToken = await context.loginWithCredentials(
    {
      email: FIXED_SEED_ALUMNO_TRANSFER_ACTOR.email,
      password: FIXED_SEED_ALUMNO_TRANSFER_ACTOR.password,
    },
    {
      setActiveToken: false,
      sessionKey: 'alumno-transfer:0',
    }
  );

  context.set('seedTokenSuperAdmin', superAdminToken);
  context.set('seedTokenAdmin', superAdminToken);
  pushStateValue(context, 'usuarioIds', fixedSuperAdminUser.id);
  pushStateValue(context, 'seedProtectedUserIds', fixedSuperAdminUser.id);
  pushStateValue(context, 'usuarioIds', fixedAdminUser.id);
  pushStateValue(context, 'seedProtectedUserIds', fixedAdminUser.id);
  pushStateValue(context, 'usuarioIds', fixedProfesor.user.id);
  pushStateValue(context, 'seedProtectedUserIds', fixedProfesor.user.id);
  pushStateValue(context, 'profesorIds', fixedProfesor.profesor.id);
  pushStateValue(context, 'profesorAdminSlotIds', fixedProfesorSlot.id);
  pushStateValue(context, 'profesorSlotIds', fixedProfesorSlot.id);
  pushStateValue(
    context,
    'seedProfesorSlotTriples',
    `${fixedProfesor.profesor.cial}|${fixedProfesorSlot.aula}|${fixedProfesorSlot.numeroClase}`
  );
  pushStateValue(context, 'seedProfesorCials', fixedProfesor.profesor.cial);
  pushStateValue(context, 'seedClassCodes', fixedProfesorSlot.codigoSlot);
  pushStateValue(context, 'usuarioIds', fixedAlumno.user.id);
  pushStateValue(context, 'seedProtectedUserIds', fixedAlumno.user.id);
  pushStateValue(context, 'usuarioIds', transferAlumnoActor.user.id);
  pushStateValue(context, 'seedProtectedUserIds', transferAlumnoActor.user.id);
  pushStateValue(context, 'alumnoIds', fixedAlumno.alumno.id);
  pushStateValue(context, 'alumnoIds', transferAlumnoActor.alumno.id);
  pushStateValue(context, 'seedAlumnoTokens', fixedAlumnoToken);
  pushStateValue(context, 'seedAlumnoTokens', transferAlumnoToken);
  pushStateValue(context, 'seedAlumnoUserIds', fixedAlumno.user.id);
  pushStateValue(context, 'seedAlumnoUserIds', transferAlumnoActor.user.id);
  context.set('seedFixedSuperAdminUserId', fixedSuperAdminUser.id);
  context.set('seedFixedAdminUserId', fixedAdminUser.id);
  context.set('seedFixedProfesorUserId', fixedProfesor.user.id);
  context.set('seedFixedProfesorSlotId', fixedProfesorSlot.id);
  context.set('seedFixedAlumnoId', fixedAlumno.alumno.id);
  context.set('seedFixedAlumnoUserId', fixedAlumno.user.id);
  context.set('seedTokenAlumnoTransfer', transferAlumnoToken);
  context.set('seedAdminLoginEmail', FIXED_SEED_SUPERADMIN.email);
  context.set('seedAdminCurrentPassword', DEFAULT_SEED_PASSWORD);

  const runTag =
    context.getState<string>('seedRunTag') ||
    buildSeedRunTag(context.getState<number>('seedMultiplier') || 1);
  const adminCount = resolveCountInRange('SEED_ADMIN_COUNT', 2, 3);
  const profesorCount = resolveCountInRange('SEED_PROFESOR_COUNT', 3, 5);
  const requestedAlumnoCount = resolveCountInRange('SEED_ALUMNO_COUNT', 10, 30);
  const alumnoCount = Math.max(requestedAlumnoCount, profesorCount * 2);
  const extraAdminCount = Math.max(0, adminCount - 1);
  const extraProfesorCount = Math.max(0, profesorCount - 1);
  const extraAlumnoCount = Math.max(0, alumnoCount - 1);
  const runTagClassOffset = Array.from(runTag).reduce(
    (acc, char) => (acc * 31 + char.charCodeAt(0)) % 200_000,
    97
  );

  type AdminActor = { userId: string; email: string; token: string };
  type ProfesorActor = {
    userId: string;
    profesorId: string;
    email: string;
    token: string;
    classCode: string;
    cial: string;
  };

  const adminActors: AdminActor[] = [
    {
      userId: fixedAdminUser.id,
      email: FIXED_SEED_ADMIN.email,
      token: adminToken,
    },
  ];
  pushStateValue(context, 'seedAdminUserIds', fixedAdminUser.id);
  pushStateValue(context, 'seedAdminTokens', adminToken);

  for (let i = 0; i < extraAdminCount; i++) {
    const username = `seed_admin_${runTag}_${i}`;
    const email = `${username}@smarteconomat.local`;
    const actorIndex = i + 1;

    const adminUser = await upsertSeedUserViaRepository({
      username,
      email,
      password: DEFAULT_SEED_PASSWORD,
      role: rolUsuario.ADMIN,
      nombre: `Seed Admin ${i}`,
    });
    const userId = adminUser.id;

    await removeUserAdditionalPermissions(
      userId,
      ADMIN_RESTRICTED_PERMISSION_CODES
    );

    const token = await context.loginWithCredentials(
      {
        email,
        password: DEFAULT_SEED_PASSWORD,
      },
      {
        setActiveToken: false,
        sessionKey: `admin:${actorIndex}`,
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

  const profesorActors: ProfesorActor[] = [
    {
      userId: fixedProfesor.user.id,
      profesorId: fixedProfesor.profesor.id,
      email: FIXED_SEED_PROFESOR.email,
      token: fixedProfesorToken,
      classCode: fixedProfesorSlot.codigoSlot || '',
      cial: fixedProfesor.profesor.cial,
    },
  ];
  pushStateValue(context, 'seedProfesorTokens', fixedProfesorToken);
  pushStateValue(context, 'seedProfesorUserIds', fixedProfesor.user.id);

  for (let i = 0; i < extraProfesorCount; i++) {
    const creatorAdmin = adminActors[i % adminActors.length];
    const username = `seed_prof_${runTag}_${i}`;
    const email = `${username}@smarteconomat.local`;
    const cial = deterministicCode(
      'CIAL',
      i + 100,
      6,
      `seed-prof-cial-${runTag}`
    );
    const actorIndex = i + 1;

    try {
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
    } catch (error) {
      if (!isHttpConflict(error)) {
        throw error;
      }

      console.warn(
        `[seed-massive] Profesor actor ya existente (${email}), reutilizando registro.`
      );
    }

    const profesorUserId = await activateUserByIdentity(
      context,
      superAdminToken,
      {
        email,
        username,
      }
    );

    await syncUserRoleViaAdminRoute(
      context,
      superAdminToken,
      profesorUserId,
      rolUsuario.PROFESOR,
      profesorPermIds
    );

    await upsertSeedUserViaRepository({
      username,
      email,
      password: DEFAULT_SEED_PASSWORD,
      role: rolUsuario.PROFESOR,
      nombre: `Seed Profesor ${i}`,
    });

    const profesorToken = await context.loginWithCredentials(
      {
        email,
        password: DEFAULT_SEED_PASSWORD,
      },
      {
        setActiveToken: false,
        sessionKey: `profesor:${actorIndex}`,
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

    const slotAula = `Aula Seed ${runTag} ${i}`;
    const slotNumeroClase = 2000 + runTagClassOffset + i;

    let slotResponse: unknown;
    try {
      slotResponse = await context.requestJson<unknown>(
        '/profesores/admin-slots',
        {
          method: 'POST',
          body: {
            aula: slotAula,
            numeroClase: slotNumeroClase,
            capacidad: 500,
            profesorId,
          },
          tokenOverride: superAdminToken,
        }
      );
    } catch (error) {
      if (!isHttpConflict(error)) {
        throw error;
      }

      console.warn(
        `[seed-massive] Slot de profesor ya existente (${slotAula}/${slotNumeroClase}) para ${email}, reutilizando.`
      );

      const ownSlotsResponse = await context.requestJson<unknown>(
        '/profesores/slots',
        {
          method: 'GET',
          tokenOverride: profesorToken,
        }
      );

      const existingSlot = toEntityArray(ownSlotsResponse).find((entity) => {
        const aulaValue =
          typeof entity.aula === 'string' ? entity.aula.trim() : '';
        const numeroClaseRaw =
          entity.numeroClase ?? entity.numero_clase ?? entity.numero;
        const numeroClaseValue = parseNumeroClaseValue(numeroClaseRaw);

        return aulaValue === slotAula && numeroClaseValue === slotNumeroClase;
      });

      if (!existingSlot) {
        throw new Error(
          `[seed-massive] No se encontró slot existente para profesor ${email} (${slotAula}/${slotNumeroClase})`
        );
      }

      slotResponse = existingSlot;
    }

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

  const transferTargetProfesor = profesorActors[0];
  if (!transferTargetProfesor) {
    throw new Error(
      '[seed-massive] No se pudo preparar profesor destino para cambio de alumno'
    );
  }

  const transferAula = `Aula Transfer ${runTag}`;
  const transferNumeroClase = 9000;
  let transferSlotResponse: unknown;
  try {
    transferSlotResponse = await context.requestJson<unknown>(
      '/profesores/admin-slots',
      {
        method: 'POST',
        body: {
          aula: transferAula,
          numeroClase: transferNumeroClase,
          capacidad: 500,
          profesorId: transferTargetProfesor.profesorId,
        },
        tokenOverride: superAdminToken,
      }
    );
  } catch (error) {
    if (!isHttpConflict(error)) {
      throw error;
    }

    const transferOwnerToken = transferTargetProfesor.token;
    const ownSlotsResponse = await context.requestJson<unknown>(
      '/profesores/slots',
      {
        method: 'GET',
        tokenOverride: transferOwnerToken,
      }
    );

    const existingTransferSlot = toEntityArray(ownSlotsResponse).find(
      (entity) => {
        const aulaValue =
          typeof entity.aula === 'string' ? entity.aula.trim() : '';
        const numeroClaseRaw =
          entity.numeroClase ?? entity.numero_clase ?? entity.numero;
        const numeroClaseValue = parseNumeroClaseValue(numeroClaseRaw);

        return (
          aulaValue === transferAula && numeroClaseValue === transferNumeroClase
        );
      }
    );

    if (!existingTransferSlot) {
      throw new Error(
        `[seed-massive] No se encontró slot de transferencia existente (${transferAula}/${transferNumeroClase})`
      );
    }

    transferSlotResponse = existingTransferSlot;
  }

  collectStateFromResponse(
    context,
    '/profesores/admin-slots',
    transferSlotResponse
  );
  pushStateValue(
    context,
    'seedProfesorSlotTriples',
    `${transferTargetProfesor.cial}|${transferAula}|${transferNumeroClase}`
  );
  context.set('seedAlumnoTransferProfesorCial', transferTargetProfesor.cial);
  context.set('seedAlumnoTransferAula', transferAula);
  context.set('seedAlumnoTransferNumeroClase', String(transferNumeroClase));

  context.set('seedTokenProfesor', profesorActors[0].token);
  context.set('seedTokenAdminRoutesProfesor', profesorActors[0].token);

  const profesorAlumnoCount = new Map<string, number>([
    [fixedProfesor.profesor.id, 1],
  ]);
  const alumnoTokens: string[] = [fixedAlumnoToken];

  for (let i = 0; i < extraAlumnoCount; i++) {
    const profesorActor = profesorActors[i % profesorActors.length];
    const username = `seed_alumno_${runTag}_${i}`;
    const actorIndex = i + 1;

    try {
      await context.requestJson('/alumnos/register', {
        method: 'POST',
        body: {
          username,
          password: DEFAULT_SEED_PASSWORD,
          codigoClase: profesorActor.classCode,
        },
        auth: false,
      });
    } catch (error) {
      if (!isHttpConflict(error)) {
        throw error;
      }

      console.warn(
        `[seed-massive] Alumno actor ya existente (${username}), reutilizando registro.`
      );
    }

    const alumnoUserId = await activateUserByIdentity(
      context,
      superAdminToken,
      {
        username,
      }
    );

    await syncUserRoleViaAdminRoute(
      context,
      superAdminToken,
      alumnoUserId,
      rolUsuario.ALUMNO,
      alumnoPermIds
    );

    await upsertSeedUserViaRepository({
      username,
      email: username,
      password: DEFAULT_SEED_PASSWORD,
      role: rolUsuario.ALUMNO,
      nombre: `Seed Alumno ${i}`,
    });

    const alumnoToken = await context.loginWithCredentials(
      {
        email: username,
        password: DEFAULT_SEED_PASSWORD,
      },
      {
        setActiveToken: false,
        sessionKey: `alumno:${actorIndex}`,
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

  context.set(
    'seedTokenAlumno',
    alumnoTokens[alumnoTokens.length - 1] || alumnoTokens[0] || ''
  );

  const profesoresSinAlumnos = profesorActors.filter(
    (profesorActor) =>
      (profesorAlumnoCount.get(profesorActor.profesorId) || 0) < 2
  );
  if (profesoresSinAlumnos.length > 0) {
    throw new Error(
      `[seed-massive] Profesores sin alumnos suficientes: ${profesoresSinAlumnos.map((actor) => actor.email).join(', ')}`
    );
  }

  await flushPermissionCache();

  const alumnoToProfesorIndex: Record<string, number> = {};
  const slotToProfesorIndex: Record<string, number> = {};
  const profesorIndexByToken: Record<string, number> = {};

  const superAdminTokenForWarmup =
    context.getState<string>('seedTokenSuperAdmin') ||
    context.getState<string>('seedTokenAdmin') ||
    context.getAccessToken();

  const allSlotsResponse = await context.requestJson<unknown>(
    '/profesores/all-slots',
    {
      method: 'GET',
      tokenOverride: superAdminTokenForWarmup,
    }
  );
  const allSlots = toEntityArray(allSlotsResponse);

  const profesorIdToIdx = new Map<string, number>();
  for (let pIdx = 0; pIdx < profesorActors.length; pIdx++) {
    const prof = profesorActors[pIdx];
    if (!prof) continue;
    profesorIdToIdx.set(prof.profesorId, pIdx);
    profesorIndexByToken[prof.token] = pIdx;
    context.set(`seedProfesorTokenByIndex:${pIdx}`, prof.token);
  }

  for (let pIdx = 0; pIdx < profesorActors.length; pIdx++) {
    const prof = profesorActors[pIdx];
    if (!prof) continue;

    const ownedSlotIds = allSlots
      .filter((slot) => {
        const slotProfesorId =
          (slot.profesor as Record<string, unknown>)?.id || slot.profesorId;
        return slotProfesorId === prof.profesorId;
      })
      .map((slot) => slot.id)
      .filter((id): id is string => typeof id === 'string' && id.length > 0);

    context.set(
      `seedProfesorOwnedSlotIds:${pIdx}`,
      JSON.stringify(ownedSlotIds)
    );

    for (const slotId of ownedSlotIds) {
      slotToProfesorIndex[slotId] = pIdx;
      pushStateValue(context, 'profesorSlotIds', slotId);
    }

    const ownedAlumnoIds: string[] = [];
    for (const slot of allSlots) {
      const slotProfesorId =
        (slot.profesor as Record<string, unknown>)?.id || slot.profesorId;
      if (slotProfesorId !== prof.profesorId) continue;
      const slotAlumnos = Array.isArray(slot.alumnos) ? slot.alumnos : [];
      for (const alumno of slotAlumnos) {
        const aId = (alumno as Record<string, unknown>)?.id;
        if (typeof aId === 'string' && aId.length > 0) {
          ownedAlumnoIds.push(aId);
        }
      }
    }

    context.set(
      `seedProfesorOwnedAlumnoIds:${pIdx}`,
      JSON.stringify(ownedAlumnoIds)
    );
    for (const alumnoId of ownedAlumnoIds) {
      alumnoToProfesorIndex[alumnoId] = pIdx;
      pushStateValue(context, 'alumnoIds', alumnoId);
    }
  }

  context.set(
    'seedAlumnoToProfesorIndex',
    JSON.stringify(alumnoToProfesorIndex)
  );
  context.set('seedSlotToProfesorIndex', JSON.stringify(slotToProfesorIndex));
  context.set('seedProfesorIndexByToken', JSON.stringify(profesorIndexByToken));
  context.set('seedProfesorActorCount', profesorActors.length);

  if (getStateArray(context, 'alumnoIds').length === 0) {
    throw new Error(
      '[seed-massive] No hay alumnos disponibles en estado tras el warmup de profesores/alumnos'
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
  const runTag =
    context.getState<string>('seedRunTag') ||
    buildSeedRunTag(context.getState<number>('seedMultiplier') || 1);
  const roleIdByName =
    context.getState<Record<string, string>>('seedRoleIdByName') || {};
  const alumnoRoleId = roleIdByName[rolUsuario.ALUMNO] || '';
  const adminUserRoleIdByUserId =
    context.getState<Record<string, string>>('seedAdminUserRoleIdByUserId') ||
    {};
  const adminUserAdditionalPermissionIdsByUserId =
    context.getState<Record<string, string[]>>(
      'seedAdminUserAdditionalPermissionIdsByUserId'
    ) || {};
  const adminUserExcludedPermissionIdsByUserId =
    context.getState<Record<string, string[]>>(
      'seedAdminUserExcludedPermissionIdsByUserId'
    ) || {};

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
    adminUserRoleIdByUserId[userId] = alumnoRoleId;
    adminUserAdditionalPermissionIdsByUserId[userId] = [];
    adminUserExcludedPermissionIdsByUserId[userId] = [];
  }

  context.set('seedTokenAdminRoutesSuper', superAdminToken);
  context.set('seedTokenAdminRoutesAdmin', adminToken);
  context.set('seedTokenAdminRoutesProfesor', profesorToken);
  context.set('seedAdminRouteTargetUserIds', targetUserIds);
  context.set('seedAdminUserRoleIdByUserId', adminUserRoleIdByUserId);
  context.set(
    'seedAdminUserAdditionalPermissionIdsByUserId',
    adminUserAdditionalPermissionIdsByUserId
  );
  context.set(
    'seedAdminUserExcludedPermissionIdsByUserId',
    adminUserExcludedPermissionIdsByUserId
  );

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
  endpoint: Endpoint
): number[] {
  if (endpoint.method === 'POST') {
    return [200, 201];
  }

  return [200];
}
