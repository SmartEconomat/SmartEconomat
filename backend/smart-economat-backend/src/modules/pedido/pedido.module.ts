import { Module } from '@nestjs/common';
import { PedidoService } from './service/pedido.service';
import { PedidoController } from './controller/pedido.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pedido } from './pedido.entity/pedido.entity';
import { PedidoRepository } from './repository/pedido.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Pedido])],
  controllers: [PedidoController],
  providers: [PedidoService, PedidoRepository],
  exports: [PedidoService],
})
export class PedidoModule {}
