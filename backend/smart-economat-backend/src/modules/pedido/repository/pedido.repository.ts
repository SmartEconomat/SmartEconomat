import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Pedido } from '../pedido.entity/pedido.entity';

@Injectable()
export class PedidoRepository extends Repository<Pedido> {
  constructor(private dataSource: DataSource) {
    super(Pedido, dataSource.createEntityManager());
  }

  async findAllWithRelations(): Promise<Pedido[]> {
    return await this.find({
      relations: ['usuario', 'pedidoProductos', 'recepcionesPedido'],
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findOneWithRelations(id: string): Promise<Pedido | null> {
    return await this.findOne({
      where: { id },
      relations: ['usuario', 'pedidoProductos', 'recepcionesPedido'],
    });
  }

  async findByEstado(estado: string): Promise<Pedido[]> {
    return await this.find({
      where: { estado: estado as any },
      relations: ['usuario', 'pedidoProductos'],
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findByUsuario(idUsuario: string): Promise<Pedido[]> {
    return await this.find({
      where: { usuario: { id: idUsuario } },
      relations: ['usuario', 'pedidoProductos'],
      order: {
        createdAt: 'DESC',
      },
    });
  }
}
