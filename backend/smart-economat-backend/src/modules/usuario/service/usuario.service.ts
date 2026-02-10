import { Injectable, NotFoundException } from '@nestjs/common';
import { UsuarioRepository } from '../repository/usuario.repository';
import { CreateUsuarioDto } from '../dto/create-usuario.dto';
import { UpdateUsuarioDto } from '../dto/update-usuario.dto';

@Injectable()
export class UsuarioService {
  constructor(private readonly usuarioRepo: UsuarioRepository) {}

  create(dto: CreateUsuarioDto) {
    return this.usuarioRepo.createUsuario(dto);
  }

  findAll() {
    return this.usuarioRepo.findAll();
  }

  async findOne(id: string) {
    const usuario = await this.usuarioRepo.findById(id);
    if (!usuario) throw new NotFoundException('Usuario no encontrado');
    return usuario;
  }

  update(id: string, dto: UpdateUsuarioDto) {
    return this.usuarioRepo.updateUsuario(id, dto);
  }

  remove(id: string) {
    return this.usuarioRepo.deleteUsuario(id);
  }
}
