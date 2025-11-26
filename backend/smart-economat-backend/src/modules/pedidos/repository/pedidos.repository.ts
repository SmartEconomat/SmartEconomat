import { DataSource, Repository } from 'typeorm';
import { Pedido } from '../pedido.entity/pedido.entity';
import { Injectable } from '@nestjs/common';

@Injectable()
export class PedidoRepository extends Repository<Pedido> {
  constructor(private dataSource: DataSource) {
    super(Pedido, dataSource.createEntityManager());
  }
}
