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

@Injectable()
export class UsuarioService {
  constructor(
    private readonly usuarioRepo: UsuarioRepository,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @InjectRepository(Permiso)
    private readonly permisoRepo: Repository<Permiso>,
    private readonly authPermissionsService: AuthPermissionsService
  ) {}

  create(dto: CreateUsuarioDto) {
    return this.usuarioRepo.createUsuario({
      ...dto,
      activo: true,
    });
  }

  async createAdmin(dto: AdminCreateUsuarioDto) {
    return await this.dataSource.transaction(async (manager) => {
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
          });
          if (slot) {
            alumno.slot = slot;
          }
        }
        await manager.save(alumno);
      }

      return this.findOne(savedUser.id);
    });
  }

  findAll(query: PaginationQueryDto) {
    return this.usuarioRepo.findAll(query);
  }

  async findOne(id: string) {
    const usuario = await this.usuarioRepo.findById(id);
    if (!usuario) {
      throw new NotFoundException(I18nHelper.getError('USER_NOT_FOUND'));
    }
    return usuario;
  }

  update(id: string, dto: Partial<Usuario>) {
    return this.usuarioRepo.updateUsuario(id, dto);
  }

  async updateAdmin(id: string, dto: AdminUpdateUsuarioDto) {
    const usuario = await this.findOne(id);
    if (!usuario) {
      throw new NotFoundException(I18nHelper.getError('USER_NOT_FOUND'));
    }

    return this.usuarioRepo.updateUsuario(id, dto);
  }

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

  async remove(id: string) {
    const usuario = await this.usuarioRepo.findById(id);
    if (!usuario) return null;

    usuario.activo = false;
    await this.usuarioRepo.repo.save(usuario);

    return this.usuarioRepo.findById(id);
  }

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
}
