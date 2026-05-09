import { Injectable } from '@nestjs/common';
import { Brackets, DataSource, Repository } from 'typeorm';
import { Pedido } from '../pedido.entity/pedido.entity';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';

/** Clase pública (PedidoRepository). Paquete: smart-economat-backend (Nest). */
@Injectable()
/**
 * Repositorio para operaciones de persistencia de pedido.
 */
export class PedidoRepository extends Repository<Pedido> {
  /**
   * Construye la instancia configurada.
   * @undefined {DataSource} dataSource - Entrada efectiva esperada por el contrato.
   */
  constructor(private dataSource: DataSource) {
    super(Pedido, dataSource.createEntityManager());
  }

  /**
   * Busca all with relations.
   *
   * @param loadRelations Parámetro de entrada para la operación. Opcional.
   * @returns Valor resultante de la operación.
   */
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

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Expone "findAllPaginated" en smart-economat-backend (Nest).
   * @undefined {PaginationQueryDto} query - Entrada efectiva esperada por el contrato.
   * @undefined {boolean} loadRelations - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<PaginatedResponseDto<Pedido>>} Datos efectivos después de ejecutar la operación.
   */
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

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Expone "findOneWithRelations" en smart-economat-backend (Nest).
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {boolean} loadRelations - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<Pedido | null>} Datos efectivos después de ejecutar la operación.
   */
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

  /**
   * Busca by estado.
   *
   * @param estado Parámetro de entrada para la operación.
   * @param loadRelations Parámetro de entrada para la operación. Opcional.
   * @returns Valor resultante de la operación.
   */
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

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Expone "findByUsuario" en smart-economat-backend (Nest).
   * @undefined {string} idUsuario - Entrada efectiva esperada por el contrato.
   * @undefined {boolean} loadRelations - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<Pedido[]>} Datos efectivos después de ejecutar la operación.
   */
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
