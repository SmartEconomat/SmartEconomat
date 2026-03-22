import { Injectable } from '@nestjs/common';
import {
  DataSource,
  Repository,
  FindOptionsWhere,
  Not,
  ILike,
  In,
} from 'typeorm';
import { Pedido, EstadoPedido } from '../pedido.entity/pedido.entity';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';
import { buildFindManyOptions } from '../../../common/utils/typeorm-query.helper';

const UUID_SEARCH_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

    const normalizedSearchTerm = query.searchTerm?.trim();

    if (normalizedSearchTerm) {
      const likeTerm = ILike(`%${normalizedSearchTerm}%`);

      whereConditions.push({
        ...baseCondition,
        observaciones: likeTerm,
      });

      whereConditions.push(
        {
          ...baseCondition,
          proveedor: { nombre: likeTerm },
        },
        {
          ...baseCondition,
          proveedor: { nif: likeTerm },
        },
        {
          ...baseCondition,
          proveedor: { email: likeTerm },
        },
        {
          ...baseCondition,
          usuario: { nombre: likeTerm },
        },
        {
          ...baseCondition,
          usuario: { username: likeTerm },
        },
        {
          ...baseCondition,
          usuario: { email: likeTerm },
        },
        {
          ...baseCondition,
          motivoCancelacion: likeTerm,
        },
        {
          ...baseCondition,
          motivoIncidencia: likeTerm,
        }
      );

      if (UUID_SEARCH_REGEX.test(normalizedSearchTerm)) {
        whereConditions.push({
          ...baseCondition,
          id: normalizedSearchTerm,
        });
      }

      if (!query.estado) {
        const matchingStates = Object.values(EstadoPedido).filter((estado) =>
          estado.toLowerCase().includes(normalizedSearchTerm.toLowerCase())
        );

        whereConditions.push(
          ...matchingStates.map((estado) => ({
            ...baseCondition,
            estado,
          }))
        );
      }
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
