import { faker } from '@faker-js/faker';
import {
  ALT_SEED_PASSWORD,
  DEFAULT_ADMIN_EMAIL,
  DEFAULT_SEED_PASSWORD,
} from './massive.config';
import { getRequiredStateString, getStateArray } from './massive.state';
import { BuildBodyEnv } from './massive.helpers.body.shared';

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
    const requiredRoleId = env.roleId || pickRequired('roleIds');
    const selectedPermissionId =
      env.permissionId ||
      context.getState<string[]>('permissionIds')?.[
        iteration % (context.getState<string[]>('permissionIds')?.length || 1)
      ] ||
      '';

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
        40000 + slotCursor + faker.number.int({ min: 0, max: 20000 }),
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
      ...(roleValue === 'PROFESOR' ? { cial: `CIAL-${suffix}` } : {}),
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

  return undefined;
}
