import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Usuario } from '../usuario.entity/usuario.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class UsuarioRepository {
  constructor(
    @InjectRepository(Usuario)
    private readonly repo: Repository<Usuario>
  ) {}

  createUsuario(data: Partial<Usuario>) {
    return this.repo.save(this.repo.create(data));
  }

  findAll() {
    return this.repo.find({
      relations: ['movimientos', 'pedidos', 'recepciones'],
    });
  }

  findById(id: string) {
    return this.repo.findOne({
      where: { id },
      relations: ['movimientos', 'pedidos', 'recepciones'],
    });
  }

  async updateUsuario(id: string, data: Partial<Usuario>) {
    await this.repo.update(id, data);
    return this.findById(id);
  }

  deleteUsuario(id: string) {
    return this.repo.delete(id);
  }
}
