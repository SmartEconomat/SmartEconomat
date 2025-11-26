import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Pedido } from '../pedido.entity/pedido.entity';
import { PedidoRepository } from '../repository/pedidos.repository';
import { CreatePedidoDto } from '../dto/create-pedido.dto';
import { UpdatePedidoDto } from '../dto/update-pedido.dto';

@Injectable()
export class PedidoService {
  constructor(
    @InjectRepository(Pedido)
    private readonly pedidoRepository: PedidoRepository
  ) {}

  async create(createPedidoDto: CreatePedidoDto): Promise<Pedido> {
    const { usuarioId, pedidoProductos, ...pedidoData } = createPedidoDto;
    const pedido = this.pedidoRepository.create({
      ...pedidoData,
      usuario: { id: usuarioId } as any,
      pedidoProductos: pedidoProductos.map((p) => ({
        ...p,
        productoProveedor: { id: p.productoProveedorId } as any,
      })),
    });
    return this.pedidoRepository.save(pedido);
  }

  async findAll(): Promise<Pedido[]> {
    return this.pedidoRepository.find();
  }

  async findOne(id: string): Promise<Pedido> {
    const pedido = await this.pedidoRepository.findOne({ where: { id } });
    if (!pedido) {
      throw new NotFoundException(`Pedido with ID ${id} not found`);
    }
    return pedido;
  }

  async update(id: string, updatePedidoDto: UpdatePedidoDto): Promise<Pedido> {
    const pedido = await this.findOne(id);
    this.pedidoRepository.merge(pedido, updatePedidoDto);
    return this.pedidoRepository.save(pedido);
  }

  async remove(id: string): Promise<void> {
    const result = await this.pedidoRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Pedido with ID ${id} not found`);
    }
  }
}
