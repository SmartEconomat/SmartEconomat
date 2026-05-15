import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DataSource, Repository } from 'typeorm';
import { Permiso } from '../../src/modules/permisos/permiso.entity/permiso.entity';
import { PlantillaRol } from '../../src/modules/plantillas-roles/plantilla-rol.entity/plantilla-rol.entity';
import { Alumno } from '../../src/modules/alumno/alumno.entity/alumno.entity';
import { Profesor } from '../../src/modules/profesor/profesor.entity/profesor.entity';
import { AlumnoSlot } from '../../src/modules/profesor/profesor.entity/alumno-slot.entity';
import { Rol } from '../../src/modules/roles/rol.entity/rol.entity';
import { Usuario } from '../../src/modules/usuario/usuario.entity/usuario.entity';
import {
  rolUsuario,
  UserStatus,
  UserLanguage,
} from '../../src/modules/usuario/enums/usuario.enums';
import { ALL_PERMISSION_CODES } from '../../src/common/constants/permissions.constants';
import { PEDIDO_PROVEEDOR_SERIE_INICIAL } from '../../src/modules/pedido/utils/pedido-numero.util';
import { PURCHASE_BATCH_SERIE_INICIAL } from '../../src/modules/pedido/utils/purchase-batch-numero.util';

const PEDIDO_NUMERO_SEQUENCE_NAME = 'pedido_numero_global_seq';
const PURCHASE_BATCH_NUMERO_SEQUENCE_NAME = 'purchase_batch_numero_global_seq';

const SEED_PASSWORD = 'SmartEconomat2026!';
const SOURCE_ROOT = join(__dirname, '../../src');
const DECORATOR_MARKERS = [
  'RequirePermissions',
  'RequireAnyPermission',
  'ControllerPermissions',
];
const PERMISSION_LITERAL_PATTERN = /['"`]([a-z0-9_:-]+:[a-z0-9_:-]+)['"`]/gi;
const ESSENTIAL_PERMISSION_CODES = [
  'usuarios:listar',
  'usuarios:ver',
  'usuarios:crear',
  'usuarios:editar',
  'usuarios:activar_desactivar',
  'usuarios:resetear_password',
  'productos:listar',
  'productos:ver',
  'productos:crear',
  'productos:editar',
  'proveedores:listar',
  'proveedores:crear',
  'pedidos:listar',
  'pedidos:crear',
  'recepciones:listar',
  'recepciones:crear',
  'movimientos:listar',
  'movimientos:historial',
  'inventario:listar',
  'inventario:ver',
  'dashboard:ver_estadisticas',
  'profesor:gestionar_slots',
  'profesor:gestionar_alumnos',
  'profesor:ver_alumnos',
  'alumno:cambiar_profesor',
];
const ALUMNO_DEFAULT_PERMISSION_CODES = new Set([
  'productos:listar',
  'productos:ver',
  'inventario:listar',
  'inventario:ver',
  'movimientos:listar',
  'dashboard:ver_estadisticas',
  'alumno:cambiar_profesor',
]);

type BaselineUserSeed = {
  username: string;
  email: string;
  nombre: string;
  password: string;
  rol: rolUsuario;
  cial?: string;
};

type BaselineAlumnoSeed = {
  username: string;
  email: string;
  nombre: string;
  password: string;
  profesorUsername: string;
  aula: string;
  numeroClase: number;
  capacidad: number;
  codigoSlot: string;
};

const BASELINE_USERS: BaselineUserSeed[] = [
  {
    username: 'superadmin',
    email: 'superadmin@smarteconomat.com',
    nombre: 'Super Administrador Seed',
    password: SEED_PASSWORD,
    rol: rolUsuario.SUPER_ADMIN,
  },
  {
    username: 'admin',
    email: 'admin@smarteconomat.com',
    nombre: 'Administrador Seed',
    password: SEED_PASSWORD,
    rol: rolUsuario.ADMIN,
  },
  {
    username: 'profesor',
    email: 'profesor@smarteconomat.com',
    nombre: 'Profesor Seed Principal',
    password: SEED_PASSWORD,
    rol: rolUsuario.PROFESOR,
    cial: 'CIAL-SEED-2026',
  },
  {
    username: 'profesor1',
    email: 'profesor1@smarteconomat.com',
    nombre: 'Profesor Seed Legacy',
    password: SEED_PASSWORD,
    rol: rolUsuario.PROFESOR,
    cial: 'CIAL-11111',
  },
  {
    username: 'profesor2',
    email: 'profesor2@smarteconomat.com',
    nombre: 'Profesor Seed Auxiliar',
    password: SEED_PASSWORD,
    rol: rolUsuario.PROFESOR,
    cial: 'CIAL-22222',
  },
];

const BASELINE_ALUMNOS: BaselineAlumnoSeed[] = [
  {
    username: 'alumno',
    email: 'alumno@smarteconomat.com',
    nombre: 'Alumno Seed',
    password: SEED_PASSWORD,
    profesorUsername: 'profesor',
    aula: 'Aula Seed Principal',
    numeroClase: 2026,
    capacidad: 30,
    codigoSlot: 'AL-SEED2026',
  },
  {
    username: 'alumno_profesor1',
    email: 'alumno.profesor1@smarteconomat.com',
    nombre: 'Alumno Seed Profesor1',
    password: SEED_PASSWORD,
    profesorUsername: 'profesor1',
    aula: 'Aula Profesor1',
    numeroClase: 101,
    capacidad: 30,
    codigoSlot: 'AL-PROF1101',
  },
];

function listTypeScriptFiles(rootDir: string): string[] {
  return readdirSync(rootDir, { withFileTypes: true }).flatMap((entry) => {
    const filePath = join(rootDir, entry.name);

    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) {
        return [];
      }

      return listTypeScriptFiles(filePath);
    }

    return entry.isFile() && entry.name.endsWith('.ts') ? [filePath] : [];
  });
}

function collectPermissionCodesFromSource(): string[] {
  const permissionCodes = new Set<string>([
    ...ESSENTIAL_PERMISSION_CODES,
    ...ALL_PERMISSION_CODES,
  ]);

  for (const filePath of listTypeScriptFiles(SOURCE_ROOT)) {
    const fileContent = readFileSync(filePath, 'utf8');
    if (!DECORATOR_MARKERS.some((marker) => fileContent.includes(marker))) {
      continue;
    }

    for (const match of fileContent.matchAll(PERMISSION_LITERAL_PATTERN)) {
      const code = String(match[1] || '').trim();
      if (code.includes(':')) {
        permissionCodes.add(code);
      }
    }
  }

  return [...permissionCodes].sort();
}

function buildPermissionName(modulo: string, accion: string): string {
  return `${modulo} ${accion}`
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function resolveRolePermissionCodes(
  roleName: rolUsuario,
  allCodes: string[]
): string[] {
  if (roleName === rolUsuario.ADMIN || roleName === rolUsuario.SUPER_ADMIN) {
    return allCodes;
  }

  if (roleName === rolUsuario.PROFESOR) {
    return allCodes.filter(
      (code) =>
        !code.startsWith('usuarios:') &&
        !code.startsWith('roles:') &&
        !code.startsWith('permisos:')
    );
  }

  return allCodes.filter((code) => ALUMNO_DEFAULT_PERMISSION_CODES.has(code));
}

async function upsertPermissionCatalog(
  permisoRepo: Repository<Permiso>
): Promise<Map<string, Permiso>> {
  const permissionCodes = collectPermissionCodesFromSource();
  const existing = await permisoRepo.find();
  const byCode = new Map(existing.map((permiso) => [permiso.codigo, permiso]));

  for (const code of permissionCodes) {
    const [modulo, accion] = code.split(':');
    const permiso =
      byCode.get(code) ||
      permisoRepo.create({
        codigo: code,
      });

    permiso.nombre = buildPermissionName(modulo, accion);
    permiso.modulo = modulo;
    permiso.accion = accion;
    permiso.descripcion = `Permiso semilla para ${code}`;
    permiso.activo = true;

    const saved = await permisoRepo.save(permiso);
    byCode.set(code, saved);
  }

  return byCode;
}

async function upsertRoleCatalog(
  roleRepo: Repository<Rol>,
  permissionByCode: Map<string, Permiso>
): Promise<Map<rolUsuario, Rol>> {
  const roleMap = new Map<rolUsuario, Rol>();

  for (const roleName of Object.values(rolUsuario)) {
    const permissions = resolveRolePermissionCodes(roleName, [
      ...permissionByCode.keys(),
    ])
      .map((code) => permissionByCode.get(code))
      .filter((permiso): permiso is Permiso => Boolean(permiso));

    const existing = await roleRepo.findOne({
      where: { nombre: roleName },
      relations: ['permisos'],
    });

    const role =
      existing ||
      roleRepo.create({
        nombre: roleName,
      });

    role.descripcion = `Rol semilla ${roleName}`;
    role.esSistema = true;
    role.activo = true;
    role.permisos = permissions;

    const saved = await roleRepo.save(role);
    roleMap.set(roleName, saved);
  }

  return roleMap;
}

async function upsertTemplateCatalog(
  templateRepo: Repository<PlantillaRol>,
  permissionByCode: Map<string, Permiso>
): Promise<void> {
  for (const roleName of Object.values(rolUsuario)) {
    const permissions = resolveRolePermissionCodes(roleName, [
      ...permissionByCode.keys(),
    ])
      .map((code) => permissionByCode.get(code))
      .filter((permiso): permiso is Permiso => Boolean(permiso));

    const existing = await templateRepo.findOne({
      where: { nombre: roleName },
      relations: ['permisos'],
    });

    const template =
      existing ||
      templateRepo.create({
        nombre: roleName,
      });

    template.descripcion = `Plantilla semilla ${roleName}`;
    template.esEditable = roleName !== rolUsuario.SUPER_ADMIN;
    template.activo = true;
    template.permisos = permissions;

    await templateRepo.save(template);
  }
}

async function upsertBaselineUsers(
  userRepo: Repository<Usuario>,
  profesorRepo: Repository<Profesor>,
  roleMap: Map<rolUsuario, Rol>
): Promise<void> {
  for (const userSeed of BASELINE_USERS) {
    const role = roleMap.get(userSeed.rol);
    const existing = await userRepo.findOne({
      where: [{ email: userSeed.email }, { username: userSeed.username }],
      relations: ['roles', 'permisosAdicionales', 'permisosExcluidos'],
    });

    const user =
      existing ||
      userRepo.create({
        username: userSeed.username,
        email: userSeed.email,
      });

    user.username = userSeed.username;
    user.email = userSeed.email;
    user.nombre = userSeed.nombre;
    user.password = userSeed.password;
    user.rol = userSeed.rol;
    user.status = UserStatus.ACTIVE;
    user.activo = true;
    user.mustChangePassword = false;
    user.idioma = UserLanguage.ES;
    user.roles = role ? [role] : [];
    user.permisosAdicionales = [];
    user.permisosExcluidos = [];

    const savedUser = await userRepo.save(user);

    if (userSeed.cial) {
      const existingProfesor = await profesorRepo.findOne({
        where: { user: { id: savedUser.id } },
        relations: ['user'],
      });

      const profesor =
        existingProfesor ||
        profesorRepo.create({
          user: savedUser,
        });

      profesor.user = savedUser;
      profesor.cial = userSeed.cial;
      await profesorRepo.save(profesor);
    }
  }
}

async function upsertBaselineAlumnos(
  userRepo: Repository<Usuario>,
  profesorRepo: Repository<Profesor>,
  slotRepo: Repository<AlumnoSlot>,
  alumnoRepo: Repository<Alumno>,
  roleMap: Map<rolUsuario, Rol>
): Promise<void> {
  const alumnoRole = roleMap.get(rolUsuario.ALUMNO);

  for (const alumnoSeed of BASELINE_ALUMNOS) {
    const profesor = await profesorRepo.findOne({
      where: { user: { username: alumnoSeed.profesorUsername } },
      relations: ['user'],
    });

    if (!profesor) {
      throw new Error(
        `[test-seed] Profesor baseline no encontrado para alumno ${alumnoSeed.username}`
      );
    }

    const existingByCode = await slotRepo.findOne({
      where: { codigoSlot: alumnoSeed.codigoSlot },
      relations: ['profesor'],
    });

    const existingSlot =
      existingByCode ||
      (await slotRepo.findOne({
        where: {
          profesor: { id: profesor.id },
          aula: alumnoSeed.aula,
          numeroClase: alumnoSeed.numeroClase,
        },
        relations: ['profesor'],
      }));

    const slot =
      existingSlot ||
      slotRepo.create({
        profesor,
        aula: alumnoSeed.aula,
        numeroClase: alumnoSeed.numeroClase,
        capacidad: alumnoSeed.capacidad,
        codigoSlot: alumnoSeed.codigoSlot,
      });

    slot.profesor = profesor;
    slot.aula = alumnoSeed.aula;
    slot.numeroClase = alumnoSeed.numeroClase;
    slot.capacidad = alumnoSeed.capacidad;
    slot.codigoSlot = alumnoSeed.codigoSlot;

    const savedSlot = await slotRepo.save(slot);

    const existingUser = await userRepo.findOne({
      where: [{ email: alumnoSeed.email }, { username: alumnoSeed.username }],
      relations: ['roles', 'permisosAdicionales', 'permisosExcluidos'],
    });

    const user =
      existingUser ||
      userRepo.create({
        username: alumnoSeed.username,
        email: alumnoSeed.email,
      });

    user.username = alumnoSeed.username;
    user.email = alumnoSeed.email;
    user.nombre = alumnoSeed.nombre;
    user.password = alumnoSeed.password;
    user.rol = rolUsuario.ALUMNO;
    user.status = UserStatus.ACTIVE;
    user.activo = true;
    user.mustChangePassword = false;
    user.idioma = UserLanguage.ES;
    user.roles = alumnoRole ? [alumnoRole] : [];
    user.permisosAdicionales = [];
    user.permisosExcluidos = [];

    const savedUser = await userRepo.save(user);

    const existingAlumno = await alumnoRepo.findOne({
      where: { user: { id: savedUser.id } },
      relations: ['user', 'slot', 'profesor'],
    });

    const alumno =
      existingAlumno ||
      alumnoRepo.create({
        user: savedUser,
        slot: savedSlot,
        profesor,
      });

    alumno.user = savedUser;
    alumno.slot = savedSlot;
    alumno.profesor = profesor;

    await alumnoRepo.save(alumno);
  }
}

export async function seedTestBaseline(dataSource: DataSource): Promise<void> {
  const permisoRepo = dataSource.getRepository(Permiso);
  const roleRepo = dataSource.getRepository(Rol);
  const templateRepo = dataSource.getRepository(PlantillaRol);
  const userRepo = dataSource.getRepository(Usuario);
  const profesorRepo = dataSource.getRepository(Profesor);
  const slotRepo = dataSource.getRepository(AlumnoSlot);
  const alumnoRepo = dataSource.getRepository(Alumno);

  const permissionByCode = await upsertPermissionCatalog(permisoRepo);
  const roleMap = await upsertRoleCatalog(roleRepo, permissionByCode);
  await upsertTemplateCatalog(templateRepo, permissionByCode);
  await upsertBaselineUsers(userRepo, profesorRepo, roleMap);
  await upsertBaselineAlumnos(
    userRepo,
    profesorRepo,
    slotRepo,
    alumnoRepo,
    roleMap
  );

  /** Evita que los e2e ejecuten CREATE SEQUENCE y alteren el esquema de pg-mem
   * de forma incompatible con restore(seedSnapshot). */
  await dataSource.query(
    `CREATE SEQUENCE IF NOT EXISTS "${PEDIDO_NUMERO_SEQUENCE_NAME}" START WITH ${PEDIDO_PROVEEDOR_SERIE_INICIAL}`
  );
  await dataSource.query(
    `CREATE SEQUENCE IF NOT EXISTS "${PURCHASE_BATCH_NUMERO_SEQUENCE_NAME}" START WITH ${PURCHASE_BATCH_SERIE_INICIAL}`
  );
}
