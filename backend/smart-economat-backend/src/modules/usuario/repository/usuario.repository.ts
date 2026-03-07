import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Usuario } from '../usuario.entity/usuario.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

@Injectable()
export class UsuarioRepository {
  constructor(
    @InjectRepository(Usuario)
    private readonly repo: Repository<Usuario>
  ) {}

  createUsuario(data: Partial<Usuario>) {
    return this.repo.save(this.repo.create(data));
  }

  findAll(query: PaginationQueryDto) {
    const page = query.page ?? 1;

    const limit = Math.min(query.limit ?? 20, 100);
    return this.repo
      .findAndCount({
        relations: ['movimientos', 'pedidos', 'recepciones'],
        order: { username: 'ASC' },
        skip: (page - 1) * limit,
        take: limit,
      })
      .then(([data, total]) => {
        const processedData = data.map((usuario) => ({
          ...usuario,
          movimientos: usuario.movimientos || [],
          pedidos: usuario.pedidos || [],
          recepciones: usuario.recepciones || [],
        }));

        return {
          data: processedData,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit) || 1,
        } as PaginatedResponseDto<Usuario>;
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
