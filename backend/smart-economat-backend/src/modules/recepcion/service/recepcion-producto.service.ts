import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RecepcionProducto } from '../recepcion-productos.entity/recepcion-producto.entity';
import { Recepcion } from '../recepcion.entity/recepcion.entity';
import { PedidoProducto } from '../../pedido/pedido-producto.entity/pedido-producto.entity';
import { CreateRecepcionProductoDto } from '../dto/create-recepcion-producto.dto';
import { UpdateRecepcionProductoDto } from '../dto/update-recepcion-producto.dto';
import { I18nHelper } from '../../../common/helpers/i18n.helper';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';
import { EstadoProductoRecepcion } from '../enums/estado-producto.enum';

/**
 * @description Service layer for managing received-product line items (RecepcionProducto).
 * Provides CRUD operations including creation with foreign-key validation,
 * paginated listing, single-item retrieval, partial updates, and soft-deletion.
 */
@Injectable()
export class RecepcionProductoService {
  /**
   * @description Constructs the service with its required TypeORM repositories.
   * @param recepcionProductoRepository - Repository for RecepcionProducto entities.
   * @param recepcionRepository - Repository for Recepcion entities, used for FK validation.
   * @param pedidoProductoRepository - Repository for PedidoProducto entities, used for FK validation.
   */
  constructor(
    @InjectRepository(RecepcionProducto)
    private readonly recepcionProductoRepository: Repository<RecepcionProducto>,
    @InjectRepository(Recepcion)
    private readonly recepcionRepository: Repository<Recepcion>,
    @InjectRepository(PedidoProducto)
    private readonly pedidoProductoRepository: Repository<PedidoProducto>
  ) {}

  /**
   * @description Creates and persists a new RecepcionProducto record.
   * Validates that both the referenced Recepcion and PedidoProducto exist before saving.
   * @param dto - DTO containing the recepcion ID, pedidoProducto ID, quantities, and optional metadata.
   * @returns The newly created RecepcionProducto entity with relations loaded.
   * @throws {NotFoundException} If the referenced Recepcion does not exist.
   * @throws {NotFoundException} If the referenced PedidoProducto does not exist.
   */
  async create(dto: CreateRecepcionProductoDto): Promise<RecepcionProducto> {
    const recepcion = await this.recepcionRepository.findOne({
      where: { id: dto.idRecepcion },
    });

    if (!recepcion) {
      throw new NotFoundException(I18nHelper.getError('RECEPTION_NOT_FOUND'));
    }

    const pedidoProducto = await this.pedidoProductoRepository.findOne({
      where: { id: dto.idPedidoProducto },
    });

    if (!pedidoProducto) {
      throw new NotFoundException(
        I18nHelper.getError('PEDIDO_PRODUCT_NOT_FOUND')
      );
    }

    const recepcionProducto = this.recepcionProductoRepository.create({
      recepcion,
      pedidoProducto,
      cantidadRecibida: dto.cantidadRecibida,
      observaciones: dto.observaciones,
      estadoProducto: dto.estadoProducto || EstadoProductoRecepcion.PERFECTO,
      ...(dto.fechaRecepcion
        ? { fechaRecepcion: new Date(dto.fechaRecepcion) }
        : {}),
    });

    return await this.recepcionProductoRepository.save(recepcionProducto);
  }

  /**
   * @description Returns a paginated list of RecepcionProducto records with full relations.
   * Defaults to sorting by `fechaRecepcion` descending, maximum 50 records per page.
   * @param query - Pagination parameters: page, limit, sortBy, and order.
   * @returns Paginated response containing the records and metadata (total, page, totalPages).
   */
  async findAll(
    query: PaginationQueryDto
  ): Promise<PaginatedResponseDto<RecepcionProducto>> {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 50);
    const sortBy = query.sortBy ?? 'fechaRecepcion';
    const order = query.order ?? 'DESC';

    const [data, total] = await this.recepcionProductoRepository.findAndCount({
      relations: [
        'recepcion',
        'pedidoProducto',
        'pedidoProducto.productoProveedor',
        'pedidoProducto.productoProveedor.producto',
        'pedidoProducto.productoProveedor.proveedor',
        'incidencia',
      ],
      order: { [sortBy]: order },
      skip: (page - 1) * limit,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit) || 1;
    return { data, total, page, limit, totalPages };
  }

  /**
   * @description Retrieves a single RecepcionProducto by its UUID with all related entities loaded.
   * @param id - UUID of the RecepcionProducto to retrieve.
   * @returns The found RecepcionProducto entity with relations.
   * @throws {NotFoundException} If no RecepcionProducto with the given ID exists.
   */
  async findOne(id: string): Promise<RecepcionProducto> {
    const recepcionProducto = await this.recepcionProductoRepository.findOne({
      where: { id },
      relations: [
        'recepcion',
        'pedidoProducto',
        'pedidoProducto.productoProveedor',
        'pedidoProducto.productoProveedor.producto',
        'pedidoProducto.productoProveedor.proveedor',
        'incidencia',
      ],
    });

    if (!recepcionProducto) {
      throw new NotFoundException(
        I18nHelper.getError('RECEPTION_PRODUCT_NOT_FOUND')
      );
    }

    return recepcionProducto;
  }

  /**
   * @description Partially updates an existing RecepcionProducto.
   * Only the fields present in the DTO are applied; FK references (recepcion, pedidoProducto)
   * are validated before assignment.
   * @param id - UUID of the RecepcionProducto to update.
   * @param dto - Partial update payload.
   * @returns The updated RecepcionProducto entity.
   * @throws {NotFoundException} If the RecepcionProducto, Recepcion, or PedidoProducto is not found.
   */
  async update(
    id: string,
    dto: UpdateRecepcionProductoDto
  ): Promise<RecepcionProducto> {
    const recepcionProducto = await this.findOne(id);

    if (dto.idRecepcion) {
      const recepcion = await this.recepcionRepository.findOne({
        where: { id: dto.idRecepcion },
      });

      if (!recepcion) {
        throw new NotFoundException(I18nHelper.getError('RECEPTION_NOT_FOUND'));
      }

      recepcionProducto.recepcion = recepcion;
    }

    if (dto.idPedidoProducto) {
      const pedidoProducto = await this.pedidoProductoRepository.findOne({
        where: { id: dto.idPedidoProducto },
      });

      if (!pedidoProducto) {
        throw new NotFoundException(
          I18nHelper.getError('PEDIDO_PRODUCT_NOT_FOUND')
        );
      }

      recepcionProducto.pedidoProducto = pedidoProducto;
    }

    if (dto.cantidadRecibida !== undefined) {
      recepcionProducto.cantidadRecibida = dto.cantidadRecibida;
    }

    if (dto.observaciones !== undefined) {
      recepcionProducto.observaciones = dto.observaciones;
    }

    if (dto.estadoProducto !== undefined) {
      recepcionProducto.estadoProducto = dto.estadoProducto;
    }

    if (dto.fechaRecepcion) {
      recepcionProducto.fechaRecepcion = new Date(dto.fechaRecepcion);
    }

    return await this.recepcionProductoRepository.save(recepcionProducto);
  }

  /**
   * @description Soft-deletes a RecepcionProducto by its UUID.
   * The record is marked as deleted but remains in the database.
   * @param id - UUID of the RecepcionProducto to remove.
   * @returns Resolves with void on success.
   * @throws {NotFoundException} If no RecepcionProducto with the given ID exists.
   */
  async remove(id: string): Promise<void> {
    const recepcionProducto = await this.findOne(id);
    await this.recepcionProductoRepository.softDelete(recepcionProducto.id);
  }
}
