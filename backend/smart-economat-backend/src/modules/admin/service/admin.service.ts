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

@Injectable()
export class AdminService {
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

  private isAdminRole(role?: string) {
    if (!role) return false;
    const normalized = role.toUpperCase();
    return (
      normalized === (rolUsuario.ADMINISTRADOR as string) ||
      normalized === (rolUsuario.SUPER_ADMIN as string) ||
      normalized === 'ADMIN'
    );
  }

  private isSuperAdmin(role?: string) {
    return role?.toUpperCase() === rolUsuario.SUPER_ADMIN;
  }

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

    const actorIsSuper = this.isSuperAdmin(actor.rol);
    const actorIsAdmin = this.isAdminRole(actor.rol);
    const targetIsSuper = this.isSuperAdmin(target.rol);
    const targetIsAdmin = this.isAdminRole(target.rol);

    if (targetIsSuper && !actorIsSuper) {
      throw new BadRequestException(
        'Solo un Super Administrador puede modificar a otro Super Administrador'
      );
    }

    if (targetIsAdmin && !actorIsAdmin) {
      throw new BadRequestException(
        'Solo un administrador puede modificar a otro administrador'
      );
    }

    if (targetIsAdmin && !this.isAdminRole(nextRoleName)) {
      await this.ensureNotLastActiveAdmin(target, rolUsuario.ALUMNO, true);
    }
  }

  private async ensureNotLastActiveAdmin(
    user: Usuario,
    nextRole: rolUsuario,
    nextActive: boolean
  ) {
    const isCurrentlyActiveAdmin =
      user.rol === rolUsuario.ADMINISTRADOR &&
      user.status === UserStatus.ACTIVE &&
      user.activo;
    const willRemainActiveAdmin =
      nextRole === rolUsuario.ADMINISTRADOR && nextActive;

    if (!isCurrentlyActiveAdmin || willRemainActiveAdmin) {
      return;
    }

    const activeAdmins = await this.usuarioRepo.count({
      where: {
        rol: rolUsuario.ADMINISTRADOR,
        status: UserStatus.ACTIVE,
        activo: true,
      },
    });

    if (activeAdmins <= 1) {
      throw new BadRequestException(
        'No puedes modificar al último administrador activo del sistema'
      );
    }
  }

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

  async getPermissions() {
    if (!this.permisoRepo) {
      return [];
    }

    return this.permisoRepo.find({
      where: { activo: true },
      order: { modulo: 'ASC', nombre: 'ASC' },
    });
  }

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
            where: { nombre: rolUsuario.PROFESOR },
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

  async updateUserRole(
    actorUserId: string,
    userId: string,
    roleId: string,
    extraPermisosIds?: string[],
    excludedPermisosIds?: string[]
  ) {
    if (!this.rolRepo) {
      throw new BadRequestException(
        'La gestión dinámica de roles no está disponible'
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
      throw new NotFoundException('Rol no encontrado');
    }

    await this.ensureNotDemotingAdmin(actorUserId, userId, role.nombre);

    let legacyRole = rolUsuario.ALUMNO;
    const normalized = role.nombre.trim().toUpperCase();
    if (
      normalized === (rolUsuario.ADMINISTRADOR as string) ||
      normalized === 'ADMIN'
    ) {
      legacyRole = rolUsuario.ADMINISTRADOR;
    } else if (
      normalized === (rolUsuario.PROFESOR as string) ||
      normalized === 'PROFESOR'
    ) {
      legacyRole = rolUsuario.PROFESOR;
    } else if (normalized === (rolUsuario.SUPER_ADMIN as string)) {
      legacyRole = rolUsuario.SUPER_ADMIN;
    }

    user.rol = legacyRole;
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

    await this.ensureNotLastActiveAdmin(user, user.rol, nextActive);

    user.status = nextActive ? UserStatus.ACTIVE : UserStatus.INACTIVE;
    user.activo = nextActive;
    await this.usuarioRepo.save(user);
    await this.authPermissionsService?.invalidateUserCache(user.id);

    return {
      message: nextActive
        ? I18nHelper.translate('messages.USER_ACTIVATED_SUCCESSFULLY')
        : 'Usuario suspendido correctamente',
      id: user.id,
      status: user.status,
      activo: user.activo,
    };
  }

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
    user.passwordResetToken = null;
    user.passwordResetExpires = null;

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
