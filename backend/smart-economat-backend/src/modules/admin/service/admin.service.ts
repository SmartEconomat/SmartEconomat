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
 * Service responsible for administrative operations such as managing user roles,
 * activating/deactivating users, creating professors, and forcing password resets.
 *
 * @class AdminService
 */
@Injectable()
export class AdminService {
  /**
   * Constructs the AdminService with all required and optional dependencies.
   *
   * @param {Repository<Usuario>} usuarioRepo - TypeORM repository for the Usuario entity.
   * @param {Repository<Profesor>} profesorRepo - TypeORM repository for the Profesor entity.
   * @param {DataSource} dataSource - TypeORM DataSource used to run transactions.
   * @param {Repository<Rol>} [rolRepo] - Optional TypeORM repository for the Rol entity (required for role management features).
   * @param {AuthPermissionsService} [authPermissionsService] - Optional service for invalidating permission caches.
   * @param {Repository<Permiso>} [permisoRepo] - Optional TypeORM repository for the Permiso entity.
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
   * Determines whether the given role name is an elevated admin role.
   *
   * @param {string} [role] - The role name to check.
   * @returns {boolean} True if the role is an elevated admin role.
   */
  private isAdminRole(role?: string) {
    return isSherlockElevatedRole(role);
  }

  /**
   * Determines whether the given role name corresponds to the Super Admin role.
   *
   * @param {string} [role] - The role name to check.
   * @returns {boolean} True if the role is SUPER_ADMIN.
   */
  private isSuperAdmin(role?: string) {
    const normalized = role?.trim().toUpperCase();
    return normalized === SYSTEM_ROLES.SUPER_ADMIN;
  }

  /**
   * Ensures that the actor has sufficient privileges to modify the target user.
   * Throws a BadRequestException if a non-super-admin attempts to modify a super-admin,
   * or if a non-admin attempts to modify an admin.
   * Also checks that the last active admin is not being demoted.
   *
   * @param {string} actorId - The ID of the user performing the action.
   * @param {string} targetUserId - The ID of the user being modified.
   * @param {string} [nextRoleName] - The new role name that will be assigned to the target.
   * @returns {Promise<void>}
   * @throws {BadRequestException} When the actor lacks privileges to modify the target user.
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
      // TODO: add translation key 'errors.SUPER_ADMIN_MODIFY_REQUIRED' to i18n/es/translation.json
      throw new BadRequestException(
        I18nHelper.getError('SUPER_ADMIN_MODIFY_REQUIRED')
      );
    }

    if (targetIsAdmin && !actorIsAdmin) {
      // TODO: add translation key 'errors.ADMIN_MODIFY_REQUIRED' to i18n/es/translation.json
      throw new BadRequestException(
        I18nHelper.getError('ADMIN_MODIFY_REQUIRED')
      );
    }

    if (targetIsAdmin && !this.isAdminRole(nextRoleName)) {
      await this.ensureNotLastActiveAdmin(target, rolUsuario.ALUMNO, true);
    }
  }

  /**
   * Ensures the user is not the last active administrator in the system before
   * applying a change that would demote or deactivate them.
   *
   * @param {Usuario} user - The user entity being modified.
   * @param {string} nextRole - The role name the user will be assigned.
   * @param {boolean} nextActive - Whether the user will remain active after the change.
   * @returns {Promise<void>}
   * @throws {BadRequestException} When the user is the last active admin and the change would remove admin coverage.
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
   * Retrieves all active roles with their associated permissions.
   *
   * @returns {Promise<Rol[]>} List of active roles ordered alphabetically by name, or empty array if role management is unavailable.
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
   * Retrieves all active permissions ordered by module and name.
   *
   * @returns {Promise<Permiso[]>} List of active permissions, or empty array if permission management is unavailable.
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
   * Creates a new professor user within a database transaction.
   * Validates uniqueness of username, email, and CIAL before persisting.
   *
   * @param {CreateProfesorDto} dto - Data transfer object containing professor registration details.
   * @returns {Promise<{ id: string; user_id: string; username: string; cial: string; status: UserStatus }>} The created professor summary.
   * @throws {ConflictException} When a user with the same username or email already exists.
   * @throws {ConflictException} When a professor with the same CIAL already exists.
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
   * Updates the role of a user, optionally adjusting additional and excluded permissions.
   * Enforces role hierarchy rules (e.g. only super-admins can modify super-admins).
   *
   * @param {string} actorUserId - The ID of the administrator performing the update.
   * @param {string} userId - The ID of the user whose role is being updated.
   * @param {string} roleId - The ID of the new role to assign.
   * @param {string[]} [extraPermisosIds] - Optional list of additional permission IDs to grant.
   * @param {string[]} [excludedPermisosIds] - Optional list of permission IDs to explicitly exclude.
   * @returns {Promise<Usuario | null>} The updated user with roles and permissions relations loaded.
   * @throws {BadRequestException} When dynamic role management is not available.
   * @throws {NotFoundException} When the user or role is not found.
   * @throws {BadRequestException} When the actor lacks sufficient privileges to modify the target.
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
   * Activates or deactivates a user account.
   * If the `active` parameter is omitted, toggles the current activation status.
   * Prevents deactivating the last active administrator.
   *
   * @param {string} userId - The ID of the user to activate or deactivate.
   * @param {boolean} [active] - Explicit desired activation state. Omit to toggle.
   * @returns {Promise<{ message: string; id: string; status: UserStatus; activo: boolean }>} Result with updated status info.
   * @throws {NotFoundException} When the user is not found.
   * @throws {BadRequestException} When attempting to activate an already-active user.
   * @throws {BadRequestException} When the change would remove the last active admin.
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
   * Forces a password reset for a user by generating a provisional random password
   * and setting the mustChangePassword flag.
   *
   * @param {string} userId - The ID of the user whose password will be reset.
   * @returns {Promise<{ message: string; provisionalPassword: string; mustChangePassword: boolean }>} Result with the new provisional password.
   * @throws {NotFoundException} When the user is not found.
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
