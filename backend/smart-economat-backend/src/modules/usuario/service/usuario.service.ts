import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { UsuarioRepository } from '../repository/usuario.repository';
import { CreateUsuarioDto } from '../dto/create-usuario.dto';
import { I18nHelper } from '../../../common/helpers/i18n.helper';
import { Usuario } from '../usuario.entity/usuario.entity';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { AdminCreateUsuarioDto } from '../dto/admin-create-usuario.dto';
import { AdminUpdateUsuarioDto } from '../dto/admin-update-usuario.dto';

import { ChangePasswordDto } from '../dto/change-password.dto';
import * as bcrypt from 'bcrypt';
import { UserStatus, rolUsuario } from '../enums/usuario.enums';
import { Permiso } from '../../permisos/permiso.entity/permiso.entity';
import { AuthPermissionsService } from '../../auth/service/auth-permissions.service';
import { Profesor } from '../../profesor/profesor.entity/profesor.entity';
import { AlumnoSlot } from '../../profesor/profesor.entity/alumno-slot.entity';
import { Alumno } from '../../alumno/alumno.entity/alumno.entity';
import { Rol } from '../../roles/rol.entity/rol.entity';

/**
 * Service responsible for managing user (Usuario) data, including account
 * creation, profile management, password operations, and fine-grained
 * permission customisation via additional and excluded permission lists.
 *
 * @class UsuarioService
 */
@Injectable()
export class UsuarioService {
  /**
   * Creates an instance of UsuarioService.
   *
   * @param {UsuarioRepository} usuarioRepo - Custom repository for the Usuario entity.
   * @param {DataSource} dataSource - TypeORM data source used for transactional operations.
   * @param {Repository<Permiso>} permisoRepo - Repository for looking up individual permissions.
   * @param {AuthPermissionsService} authPermissionsService - Service for permission cache management.
   */
  constructor(
    private readonly usuarioRepo: UsuarioRepository,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @InjectRepository(Permiso)
    private readonly permisoRepo: Repository<Permiso>,
    private readonly authPermissionsService: AuthPermissionsService
  ) {}

  /**
   * Creates a standard user account from the provided DTO. The account is
   * immediately set to active.
   *
   * @param {CreateUsuarioDto} dto - User creation payload.
   * @returns {Promise<Usuario>} The newly created user entity.
   */
  create(dto: CreateUsuarioDto) {
    return this.usuarioRepo.createUsuario({
      ...dto,
      activo: true,
    });
  }

  /**
   * Creates a user account with elevated privileges in a single transaction.
   * Depending on the assigned role, a linked Profesor or Alumno profile is also
   * created. Alumno accounts can optionally be assigned to an existing classroom slot.
   *
   * @param {AdminCreateUsuarioDto} dto - Admin-level user creation payload.
   * @returns {Promise<Usuario>} The newly created user with all relations loaded.
   */
  async createAdmin(dto: AdminCreateUsuarioDto) {
    const savedUserId = await this.dataSource.transaction(async (manager) => {
      const { aula, cial, ...userData } = dto;
      const systemRole = await manager.findOne(Rol, {
        where: { nombre: dto.rol },
      });

      const usuario = manager.create(Usuario, {
        ...userData,
        status: UserStatus.ACTIVE,
        activo: true,
        roles: systemRole ? [systemRole] : [],
      });

      const savedUser = await manager.save(usuario);

      if (dto.rol === rolUsuario.PROFESOR) {
        const profesor = manager.create(Profesor, {
          user: savedUser,
          cial: cial || `CIAL-${Date.now()}`,
        });
        await manager.save(profesor);
      } else if (dto.rol === rolUsuario.ALUMNO) {
        const alumno = manager.create(Alumno, {
          user: savedUser,
        });

        if (aula) {
          const slot = await manager.findOne(AlumnoSlot, {
            where: { aula },
            relations: ['profesor'],
          });
          if (slot) {
            alumno.slot = slot;
            alumno.profesor = slot.profesor;
          }
        }
        await manager.save(alumno);
      }

      return savedUser.id;
    });

    return this.findOne(savedUserId);
  }

  /**
   * Returns a paginated list of users, respecting the calling user's role for
   * visibility of deleted records.
   *
   * @param {PaginationQueryDto} query - Pagination and filter parameters.
   * @param {string} [userRole] - Role of the requesting user.
   * @returns {Promise<PaginatedResponseDto<Usuario>>} Paginated user list.
   */
  findAll(query: PaginationQueryDto, userRole?: string) {
    return this.usuarioRepo.findAll(query, userRole);
  }

  /**
   * Returns a minimal projection of all users (e.g. id and display name)
   * suitable for dropdowns and autocomplete widgets.
   *
   * @returns {Promise<Partial<Usuario>[]>} Array of minimal user objects.
   */
  findAllMinimal() {
    return this.usuarioRepo.findAllMinimal();
  }

  /**
   * Retrieves a single user by UUID with full relations loaded.
   *
   * @param {string} id - UUID of the user.
   * @returns {Promise<Usuario>} The found user entity.
   * @throws {NotFoundException} If no user with the given ID exists.
   */
  async findOne(id: string) {
    const usuario = await this.usuarioRepo.findById(id);
    if (!usuario) {
      throw new NotFoundException(I18nHelper.getError('USER_NOT_FOUND'));
    }
    return usuario;
  }

  /**
   * Updates a user's own profile fields.
   *
   * @param {string} id - UUID of the user.
   * @param {Partial<Usuario>} dto - Partial user data to apply.
   * @returns {Promise<Usuario>} The updated user entity.
   */
  update(id: string, dto: Partial<Usuario>) {
    return this.usuarioRepo.updateUsuario(id, dto);
  }

  /**
   * Admin-only update of a user's account data. Verifies existence before updating.
   *
   * @param {string} id - UUID of the user to update.
   * @param {AdminUpdateUsuarioDto} dto - Admin-level update payload.
   * @returns {Promise<Usuario>} The updated user entity.
   * @throws {NotFoundException} If the user does not exist.
   */
  async updateAdmin(id: string, dto: AdminUpdateUsuarioDto) {
    const usuario = await this.findOne(id);
    if (!usuario) {
      throw new NotFoundException(I18nHelper.getError('USER_NOT_FOUND'));
    }

    return this.usuarioRepo.updateUsuario(id, dto);
  }

  /**
   * Allows a user to change their own password after verifying the current one.
   *
   * @param {string} userId - UUID of the user changing the password.
   * @param {ChangePasswordDto} dto - DTO containing the old and new passwords.
   * @returns {Promise<Usuario>} The updated user entity.
   * @throws {NotFoundException} If the user does not exist.
   * @throws {UnauthorizedException} If the provided old password does not match.
   */
  async changePassword(userId: string, dto: ChangePasswordDto) {
    const usuario = await this.usuarioRepo.findByIdWithPassword(userId);
    if (!usuario) throw new NotFoundException();

    const isMatch = await bcrypt.compare(dto.oldPassword, usuario.password);
    if (!isMatch) {
      throw new UnauthorizedException(
        I18nHelper.getError('INVALID_OLD_PASSWORD')
      );
    }

    return this.usuarioRepo.updateUsuario(userId, {
      password: dto.newPassword,
    });
  }

  /**
   * Resets a user's password (admin action) and flags the account to require
   * a password change on next login. Blocked accounts cannot have their
   * password reset.
   *
   * @param {string} id - UUID of the user whose password is being reset.
   * @param {ResetPasswordDto} dto - DTO containing the new password.
   * @returns {Promise<Usuario>} The updated user entity.
   * @throws {NotFoundException} If the user does not exist.
   * @throws {BadRequestException} If the user account is blocked.
   */
  async resetPassword(id: string, dto: ResetPasswordDto) {
    const usuario = await this.findOne(id);

    if (usuario.status === UserStatus.BLOCKED) {
      throw new BadRequestException(
        I18nHelper.getError('USER_BLOCKED_CANNOT_RESET_PASSWORD')
      );
    }

    return this.usuarioRepo.updateUsuario(id, {
      password: dto.password,
      mustChangePassword: true,
    });
  }

  /**
   * Soft-deletes a user account.
   *
   * @param {string} id - UUID of the user to delete.
   * @returns {Promise<void>}
   */
  async remove(id: string) {
    return this.usuarioRepo.deleteUsuario(id);
  }

  /**
   * Adds a permission to the user's additional permissions list if it is not
   * already present, then invalidates the permission cache for that user.
   *
   * @param {string} userId - UUID of the user.
   * @param {string} permisoId - UUID of the permission to add.
   * @returns {Promise<Usuario>} The updated user entity.
   * @throws {NotFoundException} If the user or permission does not exist.
   */
  async addAdditionalPermission(userId: string, permisoId: string) {
    const usuario = await this.usuarioRepo.findById(userId);
    if (!usuario) throw new NotFoundException();

    const permiso = await this.permisoRepo.findOneBy({ id: permisoId });
    if (!permiso)
      throw new NotFoundException(I18nHelper.getError('PERMISO_NO_ENCONTRADO'));

    const basicUser = await this.usuarioRepo.repo.findOne({
      where: { id: userId },
      relations: ['permisosAdicionales'],
    });

    if (!basicUser!.permisosAdicionales.find((p) => p.id === permisoId)) {
      basicUser!.permisosAdicionales.push(permiso);
      await this.usuarioRepo.repo.save(basicUser!);
      await this.authPermissionsService.invalidateUserCache(userId);
    }
    return this.findOne(userId);
  }

  /**
   * Removes a permission from the user's additional permissions list and
   * invalidates the permission cache for that user.
   *
   * @param {string} userId - UUID of the user.
   * @param {string} permisoId - UUID of the permission to remove.
   * @returns {Promise<Usuario>} The updated user entity.
   * @throws {NotFoundException} If the user does not exist.
   */
  async removeAdditionalPermission(userId: string, permisoId: string) {
    const basicUser = await this.usuarioRepo.repo.findOne({
      where: { id: userId },
      relations: ['permisosAdicionales'],
    });
    if (!basicUser) throw new NotFoundException();

    basicUser.permisosAdicionales = basicUser.permisosAdicionales.filter(
      (p) => p.id !== permisoId
    );
    await this.usuarioRepo.repo.save(basicUser);
    await this.authPermissionsService.invalidateUserCache(userId);
    return this.findOne(userId);
  }

  /**
   * Adds a permission to the user's excluded permissions list if not already
   * present, then invalidates the permission cache for that user.
   *
   * @param {string} userId - UUID of the user.
   * @param {string} permisoId - UUID of the permission to exclude.
   * @returns {Promise<Usuario>} The updated user entity.
   * @throws {NotFoundException} If the user or permission does not exist.
   */
  async addExcludedPermission(userId: string, permisoId: string) {
    const usuario = await this.usuarioRepo.findById(userId);
    if (!usuario) throw new NotFoundException();

    const permiso = await this.permisoRepo.findOneBy({ id: permisoId });
    if (!permiso)
      throw new NotFoundException(I18nHelper.getError('PERMISO_NO_ENCONTRADO'));

    const basicUser = await this.usuarioRepo.repo.findOne({
      where: { id: userId },
      relations: ['permisosExcluidos'],
    });

    if (!basicUser!.permisosExcluidos.find((p) => p.id === permisoId)) {
      basicUser!.permisosExcluidos.push(permiso);
      await this.usuarioRepo.repo.save(basicUser!);
      await this.authPermissionsService.invalidateUserCache(userId);
    }
    return this.findOne(userId);
  }

  /**
   * Removes a permission from the user's excluded permissions list and
   * invalidates the permission cache for that user.
   *
   * @param {string} userId - UUID of the user.
   * @param {string} permisoId - UUID of the permission to remove from exclusions.
   * @returns {Promise<{ success: boolean }>} Simple success indicator.
   * @throws {NotFoundException} If the user does not exist.
   */
  async removeExcludedPermission(userId: string, permisoId: string) {
    const basicUser = await this.usuarioRepo.repo.findOne({
      where: { id: userId },
      relations: ['permisosExcluidos'],
    });
    if (!basicUser) throw new NotFoundException();

    basicUser.permisosExcluidos = (basicUser.permisosExcluidos || []).filter(
      (p) => p.id !== permisoId
    );
    await this.usuarioRepo.repo.save(basicUser);
    await this.authPermissionsService.invalidateUserCache(userId);
    return { success: true };
  }

  /**
   * Returns the resolved list of permission keys for a user, taking into
   * account role-based permissions, additional grants, and exclusions.
   *
   * @param {string} userId - UUID of the user.
   * @returns {Promise<string[]>} Array of permission key strings.
   */
  async getUserPermissions(userId: string): Promise<string[]> {
    return this.authPermissionsService.getUserPermissions(userId);
  }
}
