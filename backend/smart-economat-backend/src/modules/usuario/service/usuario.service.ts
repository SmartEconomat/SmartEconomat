import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UsuarioRepository } from '../repository/usuario.repository';
import { CreateUsuarioDto } from '../dto/create-usuario.dto';
import { UpdateUsuarioDto } from '../dto/update-usuario.dto';
import { Usuario } from '../usuario.entity/usuario.entity';

@Injectable()
export class UsuarioService {
  constructor(
    @InjectRepository(UsuarioRepository)
    private usuarioRepository: UsuarioRepository
  ) {}

  async create(createUsuarioDto: CreateUsuarioDto): Promise<Usuario> {
    // Check if username already exists
    const existingUser = await this.usuarioRepository.findOne({
      where: { username: createUsuarioDto.username },
    });

    if (existingUser) {
      throw new ConflictException('El nombre de usuario ya existe');
    }

    const usuario = this.usuarioRepository.create(createUsuarioDto);
    return await this.usuarioRepository.save(usuario);
  }

  async findAll(): Promise<Usuario[]> {
    return await this.usuarioRepository.find();
  }

  async findOne(id: string): Promise<Usuario> {
    const usuario = await this.usuarioRepository.findOne({
      where: { id },
    });

    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    return usuario;
  }

  async update(
    id: string,
    updateUsuarioDto: UpdateUsuarioDto
  ): Promise<Usuario> {
    const usuario = await this.findOne(id);

    // Check if username is being updated and already exists
    if (
      updateUsuarioDto.username &&
      updateUsuarioDto.username !== usuario.username
    ) {
      const existingUser = await this.usuarioRepository.findOne({
        where: { username: updateUsuarioDto.username },
      });

      if (existingUser) {
        throw new ConflictException('El nombre de usuario ya existe');
      }
    }

    Object.assign(usuario, updateUsuarioDto);

    return await this.usuarioRepository.save(usuario);
  }

  async remove(id: string): Promise<void> {
    const result = await this.usuarioRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }
  }
}
