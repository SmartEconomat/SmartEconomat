import {
  ALT_SEED_PASSWORD,
  DEFAULT_ADMIN_EMAIL,
  DEFAULT_SEED_PASSWORD,
} from './massive.config';
import { getRequiredStateString, getStateArray } from './massive.state';
import { BuildBodyEnv } from './massive.helpers.body.shared';
import {
  DETERMINISTIC_PERSON_NAMES,
  deterministicCode,
  deterministicInt,
  pickDeterministic,
} from './deterministic.seed-data';

function parseAdminRoleTargetUserId(resolvedPath: string): string {
  const match = resolvedPath.match(/^\/admin\/users\/([^/]+)\/role$/);
  return match?.[1] || '';
}

export function buildAdminUserRoleBody(
  env: BuildBodyEnv
): Record<string, unknown> {
  const { context, iteration, resolvedPath } = env;
  const targetUserId = parseAdminRoleTargetUserId(resolvedPath);
  const availableRoleIds = getStateArray(context, 'roleIds').filter(Boolean);
  const availablePermissionIds = getStateArray(context, 'permissionIds').filter(
    Boolean
  );
  const currentRoleIdByUserId =
    context.getState<Record<string, string>>('seedAdminUserRoleIdByUserId') ||
    {};
  const currentAdditionalPermissionIdsByUserId =
    context.getState<Record<string, string[]>>(
      'seedAdminUserAdditionalPermissionIdsByUserId'
    ) || {};

  const currentRoleId = targetUserId ? currentRoleIdByUserId[targetUserId] : '';
  const currentAdditionalPermissionIds = targetUserId
    ? currentAdditionalPermissionIdsByUserId[targetUserId] || []
    : [];

  const preferredRoleId = env.roleId || env.pickRequired('roleIds');
  const candidateRoleIds = availableRoleIds.filter(
    (roleId) => roleId !== currentRoleId
  );

  const roleId =
    preferredRoleId && preferredRoleId !== currentRoleId
      ? preferredRoleId
      : candidateRoleIds.length > 0
        ? candidateRoleIds[iteration % candidateRoleIds.length] ||
          preferredRoleId
        : preferredRoleId;

  const preferredPermissionId =
    env.permissionId ||
    availablePermissionIds[iteration % (availablePermissionIds.length || 1)] ||
    '';
  const candidatePermissionIds = availablePermissionIds.filter(
    (permissionId) => !currentAdditionalPermissionIds.includes(permissionId)
  );
  const nextPermissionId =
    preferredPermissionId &&
    !currentAdditionalPermissionIds.includes(preferredPermissionId)
      ? preferredPermissionId
      : candidatePermissionIds.length > 0
        ? candidatePermissionIds[iteration % candidatePermissionIds.length] ||
          ''
        : '';

  return {
    roleId,
    permisosAdicionalesIds: nextPermissionId ? [nextPermissionId] : [],
    permisosExcluidosIds: [],
  };
}

export function buildBodyAuthUsers(
  env: BuildBodyEnv
): Record<string, unknown> | undefined {
  const {
    context,
    endpoint,
    resolvedPath,
    templatePath,
    iteration,
    roleValue,
    statusValue,
    runTag,
    suffix,
    pickRequired,
  } = env;

  if (resolvedPath === '/admin/profesores') {
    return {
      username: `admin_prof_${suffix}`,
      email: `admin.prof.${suffix}@smarteconomat.local`,
      password: DEFAULT_SEED_PASSWORD,
      idioma: 'es',
      cial: deterministicCode(
        'CIALA',
        iteration,
        6,
        `admin-profesor-cial-${suffix}`
      ),
    };
  }

  if (resolvedPath === '/profesores/register') {
    return {
      username: `register_prof_${suffix}`,
      email: `register.prof.${suffix}@smarteconomat.local`,
      password: DEFAULT_SEED_PASSWORD,
      idioma: 'es',
      cial: deterministicCode(
        'CIALR',
        iteration,
        6,
        `register-profesor-cial-${suffix}`
      ),
    };
  }

  if (templatePath === '/admin/users/:id/activate') {
    return { active: true };
  }

  if (templatePath === '/admin/users/:id/role') {
    return buildAdminUserRoleBody(env);
  }

  if (resolvedPath === '/auth/register') {
    return {
      username: `reg_${suffix}`,
      email: `register.${suffix}@smarteconomat.local`,
      password: DEFAULT_SEED_PASSWORD,
      idioma: 'es',
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
      idioma: 'es',
      codigoClase,
    };
  }

  if (resolvedPath === '/alumnos/change-profesor') {
    const transferCial = context.getState<string>(
      'seedAlumnoTransferProfesorCial'
    );
    const transferAula = context.getState<string>('seedAlumnoTransferAula');
    const transferNumeroRaw = context.getState<string>(
      'seedAlumnoTransferNumeroClase'
    );
    const transferNumero = Number.parseInt(transferNumeroRaw || '', 10);

    if (
      transferCial &&
      transferAula &&
      Number.isFinite(transferNumero) &&
      !Number.isNaN(transferNumero)
    ) {
      return {
        cialNuevoProfesor: transferCial,
        nuevaAula: transferAula,
        nuevoNumeroClase: transferNumero,
      };
    }

    const slotTriples = getStateArray(context, 'seedProfesorSlotTriples');
    if (slotTriples.length > 0) {
      const rawTriple =
        slotTriples[(iteration + 1) % slotTriples.length] || slotTriples[0];
      const [cial, aula, numeroClaseRaw] = rawTriple.split('|');
      const numeroClase = Number.parseInt(numeroClaseRaw || '', 10);

      if (
        cial &&
        aula &&
        Number.isFinite(numeroClase) &&
        !Number.isNaN(numeroClase)
      ) {
        return {
          cialNuevoProfesor: cial,
          nuevaAula: aula,
          nuevoNumeroClase: numeroClase,
        };
      }
    }

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
    const slotCursor =
      context.getState<number>('seedProfesorSlotCreateCursor') || 0;
    context.set('seedProfesorSlotCreateCursor', slotCursor + 1);

    return {
      aula: `Aula-S-${suffix}`.slice(0, 50),
      numeroClase:
        40000 +
        slotCursor +
        deterministicInt(0, 20000, slotCursor, 'prof-slot-numero-clase'),
      capacidad: deterministicInt(15, 40, slotCursor, 'prof-slot-capacidad'),
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
      capacidad: deterministicInt(10, 45, iteration, 'prof-slot-update'),
    };
  }

  if (resolvedPath === '/permisos' && endpoint.method === 'POST') {
    const moduloSeed = pickDeterministic(
      ['alpha', 'beta', 'gamma', 'delta', 'omega', 'sigma', 'tau', 'zeta'],
      iteration,
      'permiso-modulo'
    );
    const accionSeed = pickDeterministic(
      [
        'crear',
        'editar',
        'listar',
        'ver',
        'activar',
        'desactivar',
        'auditar',
        'sincronizar',
      ],
      iteration,
      'permiso-accion'
    );
    const modulo = `seed_mod_${moduloSeed}`;
    const accion = `seed_${accionSeed}`;

    return {
      codigo: `${modulo}:${accion}`,
      nombre: `Permiso seed ${suffix}`.slice(0, 150),
      descripcion: `Permiso generado por seed masivo (${suffix})`.slice(0, 255),
      modulo,
      accion,
      activo: iteration % 2 === 0,
    };
  }

  if (templatePath === '/permisos/:id' && endpoint.method === 'PATCH') {
    return {
      nombre: `Permiso actualizado ${suffix}`.slice(0, 150),
      descripcion: `Actualización seed masivo ${suffix}`.slice(0, 255),
      activo: iteration % 2 === 0,
    };
  }

  if (resolvedPath === '/roles/assign-user' && endpoint.method === 'POST') {
    const createdRoleIds = new Set(
      getStateArray(context, 'seedCreatedRoleIds')
    );
    const roleIdByName =
      context.getState<Record<string, string>>('seedRoleIdByName') || {};

    const preferredSystemRoleIds = ['PROFESOR', 'ALUMNO', 'ADMIN']
      .map((roleName) => roleIdByName[roleName])
      .filter(
        (roleId): roleId is string =>
          typeof roleId === 'string' &&
          roleId.trim().length > 0 &&
          !createdRoleIds.has(roleId)
      );

    const fallbackAssignableRoleIds = getStateArray(context, 'roleIds').filter(
      (roleId) =>
        typeof roleId === 'string' &&
        roleId.trim().length > 0 &&
        !createdRoleIds.has(roleId)
    );

    const assignableRoleIds =
      preferredSystemRoleIds.length > 0
        ? preferredSystemRoleIds
        : fallbackAssignableRoleIds;

    const selectedRoleId =
      assignableRoleIds[iteration % (assignableRoleIds.length || 1)] ||
      pickRequired('roleIds');

    return {
      usuarioId: pickRequired('usuarioIds'),
      rolId: selectedRoleId,
    };
  }

  if (templatePath === '/roles/:id/permisos' && endpoint.method === 'PATCH') {
    const availablePermissionIds = getStateArray(
      context,
      'permissionIds'
    ).filter(Boolean);
    const count = Math.min(4 + (iteration % 4), availablePermissionIds.length);
    const selected = availablePermissionIds.slice(0, count);

    return {
      permisoIds: selected,
    };
  }

  if (templatePath === '/plantillas-roles/:id/permisos') {
    const availablePermissionIds = getStateArray(
      context,
      'permissionIds'
    ).filter(Boolean);
    const count = Math.min(3 + (iteration % 5), availablePermissionIds.length);
    const selected = availablePermissionIds.slice(0, count);
    return {
      permisoIds: selected,
    };
  }

  if (templatePath === '/plantillas-roles/:id/duplicar') {
    return {
      nombre: `Plantilla seed ${suffix}`.slice(0, 100),
    };
  }

  if (templatePath === '/plantillas-roles/:id/activo') {
    return {
      activo: iteration % 2 === 0,
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
    return {
      nombre: pickDeterministic(
        DETERMINISTIC_PERSON_NAMES,
        iteration,
        'perfil-nombre'
      ),
    };
  }

  if (templatePath === '/usuarios/:id' && endpoint.method === 'PATCH') {
    return {
      nombre: pickDeterministic(
        DETERMINISTIC_PERSON_NAMES,
        iteration + 1,
        'usuario-patch-nombre'
      ),
    };
  }

  if (resolvedPath.startsWith('/usuarios/admin')) {
    return {
      nombre: pickDeterministic(
        DETERMINISTIC_PERSON_NAMES,
        iteration,
        'admin-usuario-nombre'
      ),
      username: `admin_${suffix}`,
      email: `admin.${suffix}@smarteconomat.local`,
      password: DEFAULT_SEED_PASSWORD,
      idioma: 'es',
      rol: roleValue,
      ...(roleValue === 'PROFESOR'
        ? {
            cial: deterministicCode(
              'CIAL',
              iteration,
              6,
              `admin-user-cial-${suffix}`
            ),
          }
        : {}),
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
      idioma: 'es',
      nombre: pickDeterministic(
        DETERMINISTIC_PERSON_NAMES,
        iteration,
        'usuario-create-nombre'
      ),
      rol: roleValue,
      status: statusValue,
    };
  }

  return undefined;
}
