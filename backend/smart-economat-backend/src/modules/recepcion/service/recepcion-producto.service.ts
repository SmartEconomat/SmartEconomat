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
 * Servicio de dominio para recepcion producto.
 */
@Injectable()
export class RecepcionProductoService {
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
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
   * Crea create.
   *
   * @param dto Parámetro de entrada para la operación.
   * @returns Valor resultante de la operación.
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
      cantidadAlbaran: dto.cantidadAlbaran,
    });

    return await this.recepcionProductoRepository.save(recepcionProducto);
  }

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Expone "findAll" en smart-economat-backend (Nest).
   * @undefined {PaginationQueryDto} query - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<PaginatedResponseDto<RecepcionProducto>>} Datos efectivos después de ejecutar la operación.
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
   * Busca one.
   *
   * @param id Parámetro de entrada para la operación.
   * @returns Valor resultante de la operación.
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
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Persiste modificaciones válidas sobre entidades existentes.
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {UpdateRecepcionProductoDto} dto - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<RecepcionProducto>} Datos efectivos después de ejecutar la operación.
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

    if (dto.cantidadAlbaran !== undefined) {
      recepcionProducto.cantidadAlbaran = dto.cantidadAlbaran;
    }

    return await this.recepcionProductoRepository.save(recepcionProducto);
  }

  /**
   * Elimina remove.
   *
   * @param id Parámetro de entrada para la operación.
   * @returns Valor resultante de la operación.
   */
  async remove(id: string): Promise<void> {
    const recepcionProducto = await this.findOne(id);
    await this.recepcionProductoRepository.softDelete(recepcionProducto.id);
  }
}
