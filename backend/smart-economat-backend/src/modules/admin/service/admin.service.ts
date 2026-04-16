import { I18nHelper } from '../../../common/helpers/i18n.helper';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, FindOptionsWhere, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'node:crypto';
import { Usuario } from '../../usuario/usuario.entity/usuario.entity';
import { Profesor } from '../../profesor/profesor.entity/profesor.entity';
import { CreateProfesorDto } from '../../profesor/dto/create-profesor.dto';
import { rolUsuario, UserStatus } from '../../usuario/enums/usuario.enums';
import { Rol } from '../../roles/rol.entity/rol.entity';
import { AuthPermissionsService } from '../../auth/service/auth-permissions.service';
import { Permiso } from '../../permisos/permiso.entity/permiso.entity';
import { In } from 'typeorm';
import { SYSTEM_ROLES } from '../../../common/constants/system-roles.constants';
import {
  isSherlockElevatedRole,
  getRolPrincipal,
} from '../../sherlock-auth/utils/access.utils';

/**
 * Servicio responsable de las operaciones administrativas como la gestión de roles de usuario,
 * activación/desactivación de usuarios, creación de profesores y forzar restablecimientos de contraseña.
 *
 * @class AdminService
 */
@Injectable()
export class AdminService {
  /**
   * Construye el AdminService con todas las dependencias requeridas y opcionales.
   *
   * @param {Repository<Usuario>} usuarioRepo - Repositorio TypeORM para la entidad Usuario.
   * @param {Repository<Profesor>} profesorRepo - Repositorio TypeORM para la entidad Profesor.
   * @param {DataSource} dataSource - DataSource de TypeORM utilizado para ejecutar transacciones.
   * @param {Repository<Rol>} [rolRepo] - Repositorio TypeORM opcional para la entidad Rol (requerido para las funciones de gestión de roles).
   * @param {AuthPermissionsService} [authPermissionsService] - Servicio opcional para invalidar cachés de permisos.
   * @param {Repository<Permiso>} [permisoRepo] - Repositorio TypeORM opcional para la entidad Permiso.
   */
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
    @InjectRepository(Profesor)
    private readonly profesorRepo: Repository<Profesor>,
    private readonly dataSource: DataSource,
    @InjectRepository(Rol)
    @Optional()
    private readonly rolRepo?: Repository<Rol>,
    @Optional()
    private readonly authPermissionsService?: AuthPermissionsService,
    @InjectRepository(Permiso)
    @Optional()
    private readonly permisoRepo?: Repository<Permiso>
  ) {}

  /**
   * Determina si el nombre de rol dado es un rol de administrador elevado.
   *
   * @param {string} [role] - El nombre del rol a comprobar.
   * @returns {boolean} True si el rol es un rol de administrador elevado.
   */
  private isAdminRole(role?: string) {
    return isSherlockElevatedRole(role);
  }

  /**
   * Determina si el nombre de rol dado corresponde al rol de Super Administrador.
   *
   * @param {string} [role] - El nombre del rol a comprobar.
   * @returns {boolean} True si el rol es SUPER_ADMIN.
   */
  private isSuperAdmin(role?: string) {
    const normalized = role?.trim().toUpperCase();
    return normalized === SYSTEM_ROLES.SUPER_ADMIN;
  }

  /**
   * Comprueba que el actor tiene privilegios suficientes para modificar al usuario objetivo.
   * Lanza una BadRequestException si un usuario no super-admin intenta modificar a un super-admin,
   * o si un usuario no admin intenta modificar a un admin.
   * También comprueba que no se está degradando al último administrador activo.
   *
   * @param {string} actorId - El ID del usuario que realiza la acción.
   * @param {string} targetUserId - El ID del usuario que se está modificando.
   * @param {string} [nextRoleName] - El nuevo nombre de rol que se asignará al objetivo.
   * @returns {Promise<void>}
   * @throws {BadRequestException} Cuando el actor no tiene privilegios para modificar al usuario objetivo.
   */
  private async ensureNotDemotingAdmin(
    actorId: string,
    targetUserId: string,
    nextRoleName?: string
  ) {
    const actor = await this.usuarioRepo.findOne({
      where: { id: actorId },
      relations: ['roles'],
    });
    const target = await this.usuarioRepo.findOne({
      where: { id: targetUserId },
      relations: ['roles'],
    });

    if (!actor || !target) return;

    const actorRol = getRolPrincipal(actor.roles, actor.rol);
    const targetRol = getRolPrincipal(target.roles, target.rol);
    const actorIsSuper = this.isSuperAdmin(actorRol);
    const actorIsAdmin = this.isAdminRole(actorRol);
    const targetIsSuper = this.isSuperAdmin(targetRol);
    const targetIsAdmin = this.isAdminRole(targetRol);

    if (targetIsSuper && !actorIsSuper) {
      throw new BadRequestException(
        I18nHelper.getError('SUPER_ADMIN_MODIFY_REQUIRED')
      );
    }

    if (targetIsAdmin && !actorIsAdmin) {
      throw new BadRequestException(
        I18nHelper.getError('ADMIN_MODIFY_REQUIRED')
      );
    }

    if (targetIsAdmin && !this.isAdminRole(nextRoleName)) {
      await this.ensureNotLastActiveAdmin(target, rolUsuario.ALUMNO, true);
    }
  }

  /**
   * Comprueba que el usuario no sea el último administrador activo del sistema antes de
   * aplicar un cambio que lo degradaría o desactivaría.
   *
   * @param {Usuario} user - La entidad de usuario que se está modificando.
   * @param {string} nextRole - El nombre de rol que se asignará al usuario.
   * @param {boolean} nextActive - Si el usuario permanecerá activo tras el cambio.
   * @returns {Promise<void>}
   * @throws {BadRequestException} Cuando el usuario es el último administrador activo y el cambio eliminaría la cobertura de admin.
   */
  private async ensureNotLastActiveAdmin(
    user: Usuario,
    nextRole: string,
    nextActive: boolean
  ) {
    const currentRol = getRolPrincipal(user.roles, user.rol);
    const isCurrentlyActiveAdmin =
      this.isAdminRole(currentRol) &&
      user.status === UserStatus.ACTIVE &&
      user.activo;
    const willRemainActiveAdmin = this.isAdminRole(nextRole) && nextActive;

    if (!isCurrentlyActiveAdmin || willRemainActiveAdmin) {
      return;
    }

    const activeAdmins = await this.usuarioRepo
      .createQueryBuilder('usuario')
      .innerJoin('usuario.roles', 'rol')
      .where('rol.nombre IN (:...adminRoles)', {
        adminRoles: [SYSTEM_ROLES.ADMIN, SYSTEM_ROLES.SUPER_ADMIN],
      })
      .andWhere('usuario.status = :status', { status: UserStatus.ACTIVE })
      .andWhere('usuario.activo = :activo', { activo: true })
      .getCount();

    if (activeAdmins <= 1) {
      throw new BadRequestException(
        I18nHelper.getError('CANNOT_MODIFY_LAST_ACTIVE_ADMIN')
      );
    }
  }

  /**
   * Obtiene todos los roles activos con sus permisos asociados.
   *
   * @returns {Promise<Rol[]>} Lista de roles activos ordenados alfabéticamente por nombre, o array vacío si la gestión de roles no está disponible.
   */
  async getRoles() {
    if (!this.rolRepo) {
      return [];
    }

    return this.rolRepo.find({
      where: { activo: true },
      relations: ['permisos'],
      order: { nombre: 'ASC' },
    });
  }

  /**
   * Obtiene todos los permisos activos ordenados por módulo y nombre.
   *
   * @returns {Promise<Permiso[]>} Lista de permisos activos, o array vacío si la gestión de permisos no está disponible.
   */
  async getPermissions() {
    if (!this.permisoRepo) {
      return [];
    }

    return this.permisoRepo.find({
      where: { activo: true },
      order: { modulo: 'ASC', nombre: 'ASC' },
    });
  }

  /**
   * Crea un nuevo usuario profesor dentro de una transacción de base de datos.
   * Valida la unicidad del nombre de usuario, correo electrónico y CIAL antes de persistir.
   *
   * @param {CreateProfesorDto} dto - Objeto de transferencia de datos con los detalles de registro del profesor.
   * @returns {Promise<{ id: string; user_id: string; username: string; cial: string; status: UserStatus }>} El resumen del profesor creado.
   * @throws {ConflictException} Cuando ya existe un usuario con el mismo nombre de usuario o correo electrónico.
   * @throws {ConflictException} Cuando ya existe un profesor con el mismo CIAL.
   */
  async createProfesor(dto: CreateProfesorDto) {
    return this.dataSource.transaction(async (manager) => {
      const whereConditions: FindOptionsWhere<Usuario>[] = [
        { username: dto.username },
      ];
      if (dto.email) {
        whereConditions.push({ email: dto.email });
      }

      const isExisting = await manager.findOne(Usuario, {
        where: whereConditions,
      });

      if (isExisting)
        throw new ConflictException(
          I18nHelper.getError('USER_OR_EMAIL_ALREADY_EXISTS')
        );

      const isCialExisting = await manager.findOne(Profesor, {
        where: { cial: dto.cial },
      });
      if (isCialExisting)
        throw new ConflictException(I18nHelper.getError('CIAL_ALREADY_EXISTS'));

      const passwordHash = await bcrypt.hash(dto.password, 10);
      const profesorRole = this.rolRepo
        ? await manager.findOne(Rol, {
            where: { nombre: SYSTEM_ROLES.PROFESOR },
          })
        : null;

      const user = manager.create(Usuario, {
        username: dto.username,
        email: dto.email,
        password: passwordHash,
        rol: rolUsuario.PROFESOR,
        status: UserStatus.INACTIVE,
        activo: false,
        roles: profesorRole ? [profesorRole] : [],
      });
      await manager.save(user);

      const profesor = manager.create(Profesor, {
        user: { id: user.id },
        cial: dto.cial,
      });
      await manager.save(profesor);

      return {
        id: profesor.id,
        user_id: user.id,
        username: user.username,
        cial: profesor.cial,
        status: user.status,
      };
    });
  }

  /**
   * Actualiza el rol de un usuario, ajustando opcionalmente los permisos adicionales y excluidos.
   * Aplica las reglas de jerarquía de roles (p. ej. solo los super-admins pueden modificar super-admins).
   *
   * @param {string} actorUserId - El ID del administrador que realiza la actualización.
   * @param {string} userId - El ID del usuario cuyo rol se está actualizando.
   * @param {string} roleId - El ID del nuevo rol a asignar.
   * @param {string[]} [extraPermisosIds] - Lista opcional de IDs de permisos adicionales a conceder.
   * @param {string[]} [excludedPermisosIds] - Lista opcional de IDs de permisos a excluir explícitamente.
   * @returns {Promise<Usuario | null>} El usuario actualizado con las relaciones de roles y permisos cargadas.
   * @throws {BadRequestException} Cuando la gestión dinámica de roles no está disponible.
   * @throws {NotFoundException} Cuando el usuario o el rol no se encuentran.
   * @throws {BadRequestException} Cuando el actor no tiene privilegios suficientes para modificar al objetivo.
   */
  async updateUserRole(
    actorUserId: string,
    userId: string,
    roleId: string,
    extraPermisosIds?: string[],
    excludedPermisosIds?: string[]
  ) {
    if (!this.rolRepo) {
      throw new BadRequestException(
        I18nHelper.getError('DYNAMIC_ROLE_MANAGEMENT_UNAVAILABLE')
      );
    }

    const [user, role] = await Promise.all([
      this.usuarioRepo.findOne({
        where: { id: userId },
        relations: ['roles', 'permisosAdicionales', 'permisosExcluidos'],
      }),
      this.rolRepo.findOne({ where: { id: roleId, activo: true } }),
    ]);

    if (!user) {
      throw new NotFoundException(I18nHelper.getError('USER_NOT_FOUND_1'));
    }

    if (!role) {
      throw new NotFoundException(
        I18nHelper.getError('ROLE_NOT_FOUND', { id: roleId })
      );
    }

    await this.ensureNotDemotingAdmin(actorUserId, userId, role.nombre);

    let persistedRole = rolUsuario.ALUMNO;
    const normalized = role.nombre.trim().toUpperCase();
    if (normalized === SYSTEM_ROLES.ADMIN) {
      persistedRole = rolUsuario.ADMIN;
    } else if (normalized === SYSTEM_ROLES.PROFESOR) {
      persistedRole = rolUsuario.PROFESOR;
    } else if (normalized === SYSTEM_ROLES.SUPER_ADMIN) {
      persistedRole = rolUsuario.SUPER_ADMIN;
    }

    user.rol = persistedRole;
    user.roles = [role];

    if (this.permisoRepo) {
      if (extraPermisosIds) {
        user.permisosAdicionales = await this.permisoRepo.find({
          where: { id: In(extraPermisosIds) },
        });
      }
      if (excludedPermisosIds) {
        user.permisosExcluidos = await this.permisoRepo.find({
          where: { id: In(excludedPermisosIds) },
        });
      }
    }

    await this.usuarioRepo.save(user);
    await this.authPermissionsService?.invalidateUserCache(user.id);

    return this.usuarioRepo.findOne({
      where: { id: user.id },
      relations: ['roles', 'permisosAdicionales', 'permisosExcluidos'],
    });
  }

  /**
   * Activa o desactiva una cuenta de usuario.
   * Si se omite el parámetro `active`, alterna el estado de activación actual.
   * Impide desactivar al último administrador activo.
   *
   * @param {string} userId - El ID del usuario a activar o desactivar.
   * @param {boolean} [active] - Estado de activación explícito deseado. Omitir para alternar.
   * @returns {Promise<{ message: string; id: string; status: UserStatus; activo: boolean }>} Resultado con la información de estado actualizada.
   * @throws {NotFoundException} Cuando el usuario no se encuentra.
   * @throws {BadRequestException} Cuando se intenta activar a un usuario ya activo.
   * @throws {BadRequestException} Cuando el cambio eliminaría al último administrador activo.
   */
  async activateUser(userId: string, active?: boolean) {
    const user = await this.usuarioRepo.findOne({
      where: { id: userId },
      relations: ['roles'],
    });
    if (!user)
      throw new NotFoundException(I18nHelper.getError('USER_NOT_FOUND_1'));

    if (active === undefined && user.status === UserStatus.ACTIVE) {
      throw new BadRequestException(
        I18nHelper.getError('USER_IS_ALREADY_ACTIVE')
      );
    }

    const nextActive = active ?? user.status !== UserStatus.ACTIVE;

    await this.ensureNotLastActiveAdmin(
      user,
      getRolPrincipal(user.roles, user.rol),
      nextActive
    );

    user.status = nextActive ? UserStatus.ACTIVE : UserStatus.INACTIVE;
    user.activo = nextActive;
    await this.usuarioRepo.save(user);
    await this.authPermissionsService?.invalidateUserCache(user.id);

    return {
      message: nextActive
        ? I18nHelper.translate('messages.USER_ACTIVATED_SUCCESSFULLY')
        : I18nHelper.translate('messages.USER_SUSPENDED_SUCCESSFULLY'),
      id: user.id,
      status: user.status,
      activo: user.activo,
    };
  }

  /**
   * Fuerza el restablecimiento de contraseña de un usuario generando una contraseña aleatoria provisional
   * y estableciendo el indicador mustChangePassword.
   *
   * @param {string} userId - El ID del usuario cuya contraseña se restablecerá.
   * @returns {Promise<{ message: string; provisionalPassword: string; mustChangePassword: boolean }>} Resultado con la nueva contraseña provisional.
   * @throws {NotFoundException} Cuando el usuario no se encuentra.
   */
  async forcePasswordReset(userId: string) {
    const user = await this.usuarioRepo.findOne({ where: { id: userId } });
    if (!user)
      throw new NotFoundException(I18nHelper.getError('USER_NOT_FOUND'));

    const chars =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let provisionalPassword = '';
    const bytes = randomBytes(8);
    for (let i = 0; i < 8; i++) {
      provisionalPassword += chars[bytes[i] % chars.length];
    }

    user.password = provisionalPassword;
    user.mustChangePassword = true;
    user.resetPasswordOtp = null;
    user.resetPasswordOtpExpires = null;

    await this.usuarioRepo.save(user);

    return {
      message: I18nHelper.translate(
        'messages.CONTRASE_A_RESTABLECIDA_EXITOSAMENTE_ENT'
      ),
      provisionalPassword,
      mustChangePassword: true,
    };
  }
}
