import { Injectable } from '@nestjs/common';
import { DataSource, Repository, FindOptionsWhere, Not, ILike } from 'typeorm';
import { Pedido } from '../pedido.entity/pedido.entity';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';
import { buildFindManyOptions } from '../../../common/utils/typeorm-query.helper';

@Injectable()
export class PedidoRepository extends Repository<Pedido> {
  constructor(private dataSource: DataSource) {
    super(Pedido, dataSource.createEntityManager());
  }

  async findAllWithRelations(loadRelations = false): Promise<Pedido[]> {
    return await this.find({
      relations: loadRelations
        ? [
            'usuario',
            'proveedor',
            'pedidoProductos',
            'pedidoProductos.productoProveedor',
            'pedidoProductos.productoProveedor.producto',
            'pedidoProductos.productoProveedor.proveedor',
            'recepcionesPedido',
          ]
        : [],
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findAllPaginated(
    query: PaginationQueryDto,
    loadRelations = false
  ): Promise<PaginatedResponseDto<Pedido>> {
    const page = query.page ?? 1;
    const paginationOptions = buildFindManyOptions<Pedido>(query, 'createdAt', {
      fechaCreacion: 'createdAt',
    });

    const whereConditions: FindOptionsWhere<Pedido>[] = [];

    const baseCondition: FindOptionsWhere<Pedido> = {};
    if (query.estado) {
      if (query.estado.startsWith('NOT_')) {
        baseCondition.estado = Not(query.estado.replace('NOT_', '')) as any;
      } else {
        baseCondition.estado = query.estado as any;
      }
    }

    if (query.searchTerm) {
      whereConditions.push({
        ...baseCondition,
        id: ILike(`%${query.searchTerm}%`),
      });
    } else {
      whereConditions.push(baseCondition);
    }

    const [data, total] = await this.findAndCount({
      where: whereConditions,
      relations: loadRelations
        ? [
            'usuario',
            'proveedor',
            'pedidoProductos',
            'pedidoProductos.productoProveedor',
            'pedidoProductos.productoProveedor.producto',
            'pedidoProductos.productoProveedor.proveedor',
            'recepcionesPedido',
          ]
        : [],
      ...paginationOptions,
    });

    const limit = paginationOptions.take ?? query.limit ?? 20;

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async findOneWithRelations(
    id: string,
    loadRelations = false
  ): Promise<Pedido | null> {
    return await this.findOne({
      where: { id },
      relations: loadRelations
        ? [
            'usuario',
            'proveedor',
            'pedidoProductos',
            'pedidoProductos.productoProveedor',
            'pedidoProductos.productoProveedor.producto',
            'pedidoProductos.productoProveedor.proveedor',
            'recepcionesPedido',
          ]
        : [],
    });
  }

  async findByEstado(estado: string, loadRelations = false): Promise<Pedido[]> {
    return await this.find({
      where: { estado: estado as any },
      relations: loadRelations
        ? [
            'usuario',
            'proveedor',
            'pedidoProductos',
            'pedidoProductos.productoProveedor',
            'pedidoProductos.productoProveedor.producto',
            'pedidoProductos.productoProveedor.proveedor',
          ]
        : [],
      order: { createdAt: 'DESC' },
    });
  }

  async findByUsuario(
    idUsuario: string,
    loadRelations = false
  ): Promise<Pedido[]> {
    return await this.find({
      where: { usuario: { id: idUsuario } },
      relations: loadRelations
        ? [
            'usuario',
            'proveedor',
            'pedidoProductos',
            'pedidoProductos.productoProveedor',
            'pedidoProductos.productoProveedor.producto',
            'pedidoProductos.productoProveedor.proveedor',
          ]
        : [],
      order: { createdAt: 'DESC' },
    });
  }
}
