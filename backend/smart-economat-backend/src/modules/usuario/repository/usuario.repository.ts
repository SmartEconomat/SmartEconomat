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

  findByIdWithPassword(id: string) {
    return this.repo
      .createQueryBuilder('usuario')
      .addSelect('usuario.password')
      .where('usuario.id = :id', { id })
      .getOne();
  }

  async updateUsuario(id: string, data: Partial<Usuario>) {
    const usuario = await this.findById(id);
    if (!usuario) return null;

    Object.assign(usuario, data);
    await this.repo.save(usuario);

    return this.findById(id);
  }

  deleteUsuario(id: string) {
    return this.repo.delete(id);
  }
}
