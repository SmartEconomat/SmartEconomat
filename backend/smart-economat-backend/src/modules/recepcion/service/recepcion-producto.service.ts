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

@Injectable()
export class RecepcionProductoService {
  constructor(
    @InjectRepository(RecepcionProducto)
    private readonly recepcionProductoRepository: Repository<RecepcionProducto>,
    @InjectRepository(Recepcion)
    private readonly recepcionRepository: Repository<Recepcion>,
    @InjectRepository(PedidoProducto)
    private readonly pedidoProductoRepository: Repository<PedidoProducto>
  ) {}

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
      ...(dto.fechaRecepcion
        ? { fechaRecepcion: new Date(dto.fechaRecepcion) }
        : {}),
    });

    return await this.recepcionProductoRepository.save(recepcionProducto);
  }

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
      ],
      order: { [sortBy]: order },
      skip: (page - 1) * limit,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit) || 1;
    return { data, total, page, limit, totalPages };
  }

  async findOne(id: string): Promise<RecepcionProducto> {
    const recepcionProducto = await this.recepcionProductoRepository.findOne({
      where: { id },
      relations: [
        'recepcion',
        'pedidoProducto',
        'pedidoProducto.productoProveedor',
        'pedidoProducto.productoProveedor.producto',
        'pedidoProducto.productoProveedor.proveedor',
      ],
    });

    if (!recepcionProducto) {
      throw new NotFoundException(
        I18nHelper.getError('RECEPTION_PRODUCT_NOT_FOUND')
      );
    }

    return recepcionProducto;
  }

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

    if (dto.fechaRecepcion) {
      recepcionProducto.fechaRecepcion = new Date(dto.fechaRecepcion);
    }

    return await this.recepcionProductoRepository.save(recepcionProducto);
  }

  async remove(id: string): Promise<void> {
    const recepcionProducto = await this.findOne(id);
    await this.recepcionProductoRepository.softDelete(recepcionProducto.id);
  }
}
