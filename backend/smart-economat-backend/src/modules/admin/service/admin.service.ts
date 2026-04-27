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
 * Documentación en español.
 */
@Injectable()
export class AdminService {
  /**
   * Documentación en español.
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
   * Documentación en español.
   */
  private isAdminRole(role?: string) {
    return isSherlockElevatedRole(role);
  }

  /**
   * Documentación en español.
   */
  private isSuperAdmin(role?: string) {
    const normalized = role?.trim().toUpperCase();
    return normalized === SYSTEM_ROLES.SUPER_ADMIN;
  }

  /**
   * Documentación en español.
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
   * Documentación en español.
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
   * Documentación en español.
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
   * Documentación en español.
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
   * Documentación en español.
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
   * Documentación en español.
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
   * Documentación en español.
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
   * Documentación en español.
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
