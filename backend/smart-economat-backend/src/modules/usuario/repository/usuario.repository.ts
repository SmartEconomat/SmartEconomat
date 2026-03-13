import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Usuario } from '../usuario.entity/usuario.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { buildFindManyOptions } from '../../../common/utils/typeorm-query.helper';

@Injectable()
export class UsuarioRepository {
  constructor(
    @InjectRepository(Usuario)
    public readonly repo: Repository<Usuario>
  ) {}

  createUsuario(data: Partial<Usuario>) {
    return this.repo.save(this.repo.create(data));
  }

  findAll(query: PaginationQueryDto) {
    const page = query.page ?? 1;
    const paginationOptions = buildFindManyOptions<Usuario>(query, 'username');
    const limit = paginationOptions.take ?? query.limit ?? 20;

    return this.repo
      .findAndCount({
        relations: ['movimientos', 'pedidos', 'recepciones'],
        ...paginationOptions,
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

  async deleteUsuario(id: string) {
    const usuario = await this.findById(id);
    if (!usuario) return null;

    usuario.activo = false;
    await this.repo.save(usuario);

    return this.findById(id);
  }
}
