import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Pedido } from '../pedido.entity/pedido.entity';
import { EstadoPedido } from '../enums/estado-pedido.enum';
import { CreatePedidoDto } from '../dto/create-pedido.dto';
import { UpdatePedidoDto } from '../dto/updatePedido.dto';
import { CancelPedidoDto } from '../dto/cancelPedido.dto';
import { PedidoRepository } from '../repository/pedido.repository';
import { PedidoProducto } from '../pedido-producto.entity/pedido-producto.entity';
import { I18nHelper } from '../../../common/helpers/i18n.helper';
import { MovimientoHelper } from '../../../common/helpers/movimiento.helper';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';

@Injectable()
export class PedidoService {
  constructor(
    private readonly pedidoRepository: PedidoRepository,
    private readonly movimientoHelper: MovimientoHelper
  ) {}

  async create(
    createPedidoDto: CreatePedidoDto,
    userId: string
  ): Promise<Pedido> {
    const {
      pedidoProductos,
      productos,
      fechaEntrega,
      proveedorId,
      ...pedidoFields
    } = createPedidoDto;

    const lineas = (pedidoProductos ?? [])
      .map((pp) => ({
        productoProveedor: { id: pp.productoProveedorId },
        cantidad: pp.cantidad,
        precioUnitario: pp.precioUnitario,
        observaciones: pp.observaciones,
      }))
      .concat(
        (productos ?? []).map((p) => ({
          productoProveedor: { id: p.idProductoProveedor },
          cantidad: p.cantidad,
          precioUnitario: p.precioUnitario,
          observaciones: p.observaciones,
        }))
      );

    if (lineas.length === 0) {
      throw new BadRequestException(
        I18nHelper.getError('ORDER_MIN_ONE_PRODUCT')
      );
    }

    const pedido = this.pedidoRepository.create({
      ...pedidoFields,
      proveedor: { id: proveedorId },
      estado: EstadoPedido.PENDIENTE,
      costeTotal: createPedidoDto.costeTotal || 0,
      pedidoProductos: lineas as any,
      ...(fechaEntrega ? { fechaEntrega: new Date(fechaEntrega) } : {}),
    });

    const savedPedido = await this.pedidoRepository.save(pedido);

    await this.movimientoHelper.trackPedidoCreation(
      userId,
      savedPedido.id,
      `Creación de pedido #${savedPedido.id}`
    );

    return savedPedido;
  }

  async findAll(
    query: PaginationQueryDto
  ): Promise<PaginatedResponseDto<Pedido>> {
    return await this.pedidoRepository.findAllPaginated(query, true);
  }

  async findOne(id: string): Promise<Pedido> {
    const pedido = await this.pedidoRepository.findOneWithRelations(id, true);
    if (!pedido) {
      throw new NotFoundException(I18nHelper.getError('ORDER_NOT_FOUND'));
    }
    return pedido;
  }

  async update(id: string, updatePedidoDto: UpdatePedidoDto): Promise<Pedido> {
    const pedido = await this.findOne(id);

    if (updatePedidoDto.fechaEntrega) {
      pedido.fechaEntrega = new Date(updatePedidoDto.fechaEntrega);
    }

    if (updatePedidoDto.estado) {
      pedido.estado = updatePedidoDto.estado;
    }

    if (updatePedidoDto.proveedorId) {
      pedido.proveedor = { id: updatePedidoDto.proveedorId } as any;
    }

    const lineasOriginales = (updatePedidoDto.pedidoProductos ?? [])
      .map((pp) => ({
        productoProveedor: { id: pp.productoProveedorId },
        cantidad: pp.cantidad,
        precioUnitario: pp.precioUnitario,
        observaciones: pp.observaciones,
      }))
      .concat(
        (updatePedidoDto.productos ?? []).map((p) => ({
          productoProveedor: { id: p.idProductoProveedor },
          cantidad: p.cantidad,
          precioUnitario: p.precioUnitario,
          observaciones: p.observaciones,
        }))
      );

    if (
      lineasOriginales.length === 0 &&
      (updatePedidoDto.pedidoProductos !== undefined ||
        updatePedidoDto.productos !== undefined)
    ) {
      throw new BadRequestException(
        I18nHelper.getError('ORDER_MIN_ONE_PRODUCT')
      );
    }

    if (
      updatePedidoDto.pedidoProductos !== undefined ||
      updatePedidoDto.productos !== undefined
    ) {
      await this.pedidoRepository.manager.delete(PedidoProducto, {
        pedido: { id },
      });

      pedido.pedidoProductos = lineasOriginales as any;

      const costeRedux = lineasOriginales.reduce(
        (total, l) => total + l.cantidad * l.precioUnitario,
        0
      );
      pedido.costeTotal = updatePedidoDto.costeTotal ?? costeRedux;
    }

    return await this.pedidoRepository.save(pedido);
  }

  async updateFechaEntrega(id: string, dto: UpdatePedidoDto): Promise<Pedido> {
    const pedido = await this.findOne(id);

    if (dto.fechaEntrega) {
      pedido.fechaEntrega = new Date(dto.fechaEntrega);
      return await this.pedidoRepository.save(pedido);
    }

    return pedido;
  }

  async cancelarPedido(id: string, dto: CancelPedidoDto): Promise<Pedido> {
    const pedido = await this.findOne(id);

    if (
      pedido.estado === EstadoPedido.RECIBIDO ||
      pedido.estado === EstadoPedido.EN_PROCESO
    ) {
      throw new BadRequestException(
        I18nHelper.getError('ORDER_NOT_CANCELLABLE')
      );
    }

    pedido.cancelar(dto.motivoCancelacion);
    return await this.pedidoRepository.save(pedido);
  }

  async remove(id: string): Promise<void> {
    const pedido = await this.findOne(id);

    if (
      pedido.estado !== EstadoPedido.PENDIENTE &&
      pedido.estado !== EstadoPedido.CANCELADO
    ) {
      throw new BadRequestException(
        I18nHelper.getError('ORDER_CANNOT_BE_DELETED')
      );
    }

    await this.pedidoRepository.remove(pedido);
  }
}
