import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UsuarioRepository } from '../repository/usuario.repository';
import { CreateUsuarioDto } from '../dto/create-usuario.dto';
import { I18nHelper } from '../../../common/helpers/i18n.helper';
import { Usuario } from '../usuario.entity/usuario.entity';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';

import { ChangePasswordDto } from '../dto/change-password.dto';
import * as bcrypt from 'bcrypt';
import { UserStatus } from '../enums/usuario.enums';

@Injectable()
export class UsuarioService {
  constructor(private readonly usuarioRepo: UsuarioRepository) {}

  create(dto: CreateUsuarioDto) {
    return this.usuarioRepo.createUsuario(dto);
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

    if (usuario.status !== UserStatus.ACTIVE) {
      throw new BadRequestException(
        I18nHelper.getError('USER_INACTIVE_CANNOT_RESET_PASSWORD')
      );
    }

    return this.usuarioRepo.updateUsuario(id, {
      password: dto.password,
      mustChangePassword: true,
    });
  }

  remove(id: string) {
    return this.usuarioRepo.deleteUsuario(id);
  }
}
