import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pedido } from '../pedido.entity/pedido.entity';
import { CreatePedidoDto } from '../dto/create-pedido.dto';
import { UpdatePedidoDto } from '../dto/create-pedido.dto';
import { I18nHelper } from '../../../common/helpers/i18n.helper';

@Injectable()
export class PedidoService {
  constructor(
    @InjectRepository(Pedido)
    private readonly pedidoRepository: Repository<Pedido>
  ) {}

  async create(createPedidoDto: CreatePedidoDto): Promise<Pedido> {
    const { pedidoProductos, ...rest } = createPedidoDto;
    const pedido = this.pedidoRepository.create(rest);

    if (pedidoProductos && pedidoProductos.length > 0) {
      pedido.pedidoProductos = pedidoProductos.map((pp) => ({
        ...pp,
        productoProveedor: { id: pp.productoProveedorId } as any,
      })) as any;
    }

    const saved = await this.pedidoRepository.save(pedido);
    return this.findOne(saved.id);
  }

  async findAll(): Promise<Pedido[]> {
    return this.pedidoRepository.find({
      relations: [
        'usuario',
        'pedidoProductos',
        'pedidoProductos.productoProveedor',
        'pedidoProductos.productoProveedor.producto',
        'pedidoProductos.productoProveedor.proveedor',
      ],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Pedido> {
    const pedido = await this.pedidoRepository.findOne({
      where: { id },
      relations: [
        'usuario',
        'pedidoProductos',
        'pedidoProductos.productoProveedor',
        'pedidoProductos.productoProveedor.producto',
        'pedidoProductos.productoProveedor.proveedor',
      ],
    });
    if (!pedido) {
      throw new NotFoundException(I18nHelper.getError('ORDER_NOT_FOUND'));
    }
    return pedido;
  }

  async update(id: string, updatePedidoDto: UpdatePedidoDto): Promise<Pedido> {
    const { pedidoProductos, ...rest } = updatePedidoDto;
    const pedido = await this.findOne(id);

    this.pedidoRepository.merge(pedido, rest);

    if (pedidoProductos) {
      pedido.pedidoProductos = pedidoProductos.map((pp) => ({
        ...pp,
        id_pedido: id,
        productoProveedor: { id: pp.productoProveedorId } as any,
      })) as any;
    }

    await this.pedidoRepository.save(pedido);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const result = await this.pedidoRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(I18nHelper.getError('ORDER_NOT_FOUND'));
    }
  }

  async updateFechaEntrega(id: string, dto: any): Promise<Pedido> {
    return this.update(id, dto);
  }

  async cancelarPedido(id: string, dto: any): Promise<Pedido> {
    return this.update(id, { estado: 'cancelado' as any, ...dto });
  }
}
