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
    private readonly authPermissionsService?: AuthPermissionsService
  ) {}

  private normalizeStaticRole(roleName: string): rolUsuario {
    const normalized = roleName.trim().toUpperCase();

    if (normalized === 'ADMIN') {
      return rolUsuario.ADMINISTRADOR;
    }

    if (normalized === 'PROFESOR') {
      return rolUsuario.PROFESOR;
    }

    if (normalized === 'ALUMNO') {
      return rolUsuario.ALUMNO;
    }

    throw new BadRequestException('El rol seleccionado no es compatible');
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
      where: [
        { nombre: rolUsuario.ADMINISTRADOR, activo: true },
        { nombre: rolUsuario.PROFESOR, activo: true },
        { nombre: rolUsuario.ALUMNO, activo: true },
      ],
      order: { nombre: 'ASC' },
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

  async updateUserRole(_actorUserId: string, userId: string, roleId: string) {
    if (!this.rolRepo) {
      throw new BadRequestException(
        'La gestión dinámica de roles no está disponible'
      );
    }

    const [user, role] = await Promise.all([
      this.usuarioRepo.findOne({ where: { id: userId }, relations: ['roles'] }),
      this.rolRepo.findOne({ where: { id: roleId, activo: true } }),
    ]);

    if (!user) {
      throw new NotFoundException(I18nHelper.getError('USER_NOT_FOUND_1'));
    }

    if (!role) {
      throw new NotFoundException('Rol no encontrado');
    }

    const nextRole = this.normalizeStaticRole(role.nombre);

    await this.ensureNotLastActiveAdmin(user, nextRole, user.activo);

    user.rol = nextRole;
    user.roles = [role];
    await this.usuarioRepo.save(user);
    await this.authPermissionsService?.invalidateUserCache(user.id);

    return this.usuarioRepo.findOne({
      where: { id: user.id },
      relations: ['roles'],
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
