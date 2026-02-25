import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Pedido } from '../pedido.entity/pedido.entity';
import { EstadoPedido } from '../enums/estado-pedido.enum';
import { CreatePedidoDto, UpdatePedidoDto } from '../dto/create-pedido.dto';
import { CancelPedidoDto } from '../dto/cancelPedido.dto';
import { PedidoRepository } from '../repository/pedido.repository';
import { I18nHelper } from '../../../common/helpers/i18n.helper';

@Injectable()
export class PedidoService {
  constructor(private readonly pedidoRepository: PedidoRepository) {}

  async create(createPedidoDto: CreatePedidoDto): Promise<Pedido> {
    const pedido = this.pedidoRepository.create({
      ...createPedidoDto,
      estado: EstadoPedido.PENDIENTE,
      costeTotal: createPedidoDto.costeTotal || 0,
    });

    if (createPedidoDto.fechaEntrega) {
      pedido.fechaEntrega = new Date(createPedidoDto.fechaEntrega);
    }

    return await this.pedidoRepository.save(pedido);
  }

  async findAll(): Promise<Pedido[]> {
    return await this.pedidoRepository.findAllWithRelations();
  }

  async findOne(id: string): Promise<Pedido> {
    const pedido = await this.pedidoRepository.findOneWithRelations(id);
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
