import { Injectable } from '@nestjs/common';
import {
  DataSource,
  Repository,
  FindOptionsWhere,
  Not,
  ILike,
  In,
} from 'typeorm';
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
    loadRelations = false,
    userRole?: string
  ): Promise<PaginatedResponseDto<Pedido>> {
    const isAdmin =
      userRole?.toUpperCase() === 'ADMIN' ||
      userRole?.toUpperCase() === 'ADMINISTRADOR' ||
      userRole?.toUpperCase() === 'SUPER_ADMIN';
    const page = query.page ?? 1;
    const paginationOptions = buildFindManyOptions<Pedido>(query, 'createdAt', {
      fechaCreacion: 'createdAt',
    });

    const whereConditions: FindOptionsWhere<Pedido>[] = [];

    const baseCondition: FindOptionsWhere<Pedido> = {};
    if (query.estado) {
      if (query.estado.startsWith('NOT_')) {
        const val = query.estado.replace('NOT_', '');
        if (val.includes(',')) {
          baseCondition.estado = Not(In(val.split(','))) as any;
        } else {
          baseCondition.estado = Not(val) as any;
        }
      } else if (query.estado.includes(',')) {
        baseCondition.estado = In(query.estado.split(',')) as any;
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
      withDeleted: isAdmin,
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
    loadRelations = false,
    userRole?: string
  ): Promise<Pedido | null> {
    const isAdmin =
      userRole?.toUpperCase() === 'ADMIN' ||
      userRole?.toUpperCase() === 'ADMINISTRADOR' ||
      userRole?.toUpperCase() === 'SUPER_ADMIN';
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
      withDeleted: isAdmin,
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
