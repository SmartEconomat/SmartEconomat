import { Injectable } from '@nestjs/common';
import { Brackets, DataSource, Repository } from 'typeorm';
import { Pedido } from '../pedido.entity/pedido.entity';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';

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
            'batch',
            'pedidoUsuario',
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
    const limit = Math.min(query.limit ?? 20, 50);
    const sortFieldMap: Record<string, string> = {
      fechaPedido: 'pedido.fechaPedido',
      fechaEntrega: 'pedido.fechaEntrega',
      costeTotal: 'pedido.costeTotal',
      estado: 'pedido.estado',
      fechaCreacion: 'pedido.createdAt',
      createdAt: 'pedido.createdAt',
      updatedAt: 'pedido.updatedAt',
    };
    const sortBy =
      sortFieldMap[query.sortBy ?? 'createdAt'] || 'pedido.createdAt';
    const order = query.order ?? 'ASC';

    const queryBuilder = this.createQueryBuilder('pedido').distinct(true);

    if (loadRelations) {
      queryBuilder
        .leftJoinAndSelect('pedido.usuario', 'usuario')
        .leftJoinAndSelect('pedido.proveedor', 'proveedor')
        .leftJoinAndSelect('pedido.pedidoUsuario', 'pedidoUsuario')
        .leftJoinAndSelect('pedido.pedidoProductos', 'pedidoProductos')
        .leftJoinAndSelect(
          'pedidoProductos.productoProveedor',
          'productoProveedor'
        )
        .leftJoinAndSelect('productoProveedor.producto', 'producto')
        .leftJoinAndSelect(
          'productoProveedor.proveedor',
          'productoProveedorProveedor'
        )
        .leftJoinAndSelect('pedido.recepcionesPedido', 'recepcionesPedido')
        .leftJoinAndSelect('pedido.batch', 'batch');
    } else {
      queryBuilder
        .leftJoin('pedido.usuario', 'usuario')
        .leftJoin('pedido.proveedor', 'proveedor')
        .leftJoin('pedido.pedidoUsuario', 'pedidoUsuario');
    }

    if (query.estado) {
      if (query.estado.startsWith('NOT_')) {
        const estados = query.estado.replace('NOT_', '').split(',');
        queryBuilder.andWhere('pedido.estado NOT IN (:...estados)', {
          estados,
        });
      } else if (query.estado.includes(',')) {
        queryBuilder.andWhere('pedido.estado IN (:...estados)', {
          estados: query.estado.split(','),
        });
      } else {
        queryBuilder.andWhere('pedido.estado = :estado', {
          estado: query.estado,
        });
      }
    }

    if (query.usuarioId) {
      queryBuilder.andWhere('pedido.usuarioId = :usuarioId', {
        usuarioId: query.usuarioId,
      });
    }

    if (query.sinLote) {
      queryBuilder.andWhere('pedido.batchId IS NULL');
    }

    if (query.fechaDesde) {
      queryBuilder.andWhere('pedido.fechaPedido >= :fechaDesde', {
        fechaDesde: query.fechaDesde,
      });
    }

    if (query.fechaHasta) {
      queryBuilder.andWhere('pedido.fechaPedido <= :fechaHasta', {
        fechaHasta: query.fechaHasta,
      });
    }

    if (query.searchTerm?.trim()) {
      const searchTermValue = `%${query.searchTerm.trim()}%`;

      queryBuilder.andWhere(
        new Brackets((subQuery) => {
          subQuery
            .where('CAST(pedido.numeroGlobal AS text) ILIKE :searchTerm', {
              searchTerm: searchTermValue,
            })
            .orWhere(
              'CAST(pedidoUsuario.numeroGlobal AS text) ILIKE :searchTerm',
              {
                searchTerm: searchTermValue,
              }
            )
            .orWhere('CAST(pedido.id AS text) ILIKE :searchTerm', {
              searchTerm: searchTermValue,
            })
            .orWhere('CAST(pedido.estado AS text) ILIKE :searchTerm', {
              searchTerm: searchTermValue,
            })
            .orWhere("COALESCE(proveedor.nombre, '') ILIKE :searchTerm", {
              searchTerm: searchTermValue,
            })
            .orWhere("COALESCE(usuario.nombre, '') ILIKE :searchTerm", {
              searchTerm: searchTermValue,
            })
            .orWhere("COALESCE(usuario.username, '') ILIKE :searchTerm", {
              searchTerm: searchTermValue,
            })
            .orWhere("COALESCE(usuario.email, '') ILIKE :searchTerm", {
              searchTerm: searchTermValue,
            });
        })
      );
    }

    const total = await queryBuilder.clone().getCount();
    const data = await queryBuilder
      .orderBy(sortBy, order)
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

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
            'batch',
            'pedidoUsuario',
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
