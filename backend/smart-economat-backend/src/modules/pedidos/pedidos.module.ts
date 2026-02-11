import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pedido } from './pedido.entity/pedido.entity';
import { PedidoProducto } from './pedido-producto.entity/pedido-producto.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Pedido, PedidoProducto])],
  controllers: [],
  providers: [],
})
export class PedidoModule {}
