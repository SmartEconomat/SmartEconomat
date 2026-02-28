import { Module } from '@nestjs/common';
import { PedidoService } from './service/pedido.service';
import { PedidoController } from './controller/pedido.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pedido } from './pedido.entity/pedido.entity';
import { PedidoRepository } from './repository/pedido.repository';
import { PedidoProducto } from './pedido-producto.entity/pedido-producto.entity';
import { ProductoProveedor } from '../producto/producto-proveedor.entity/producto-proveedor.entity';
import { MovimientoModule } from '../movimiento/movimiento.module';
import { MovimientoHelper } from '../../common/helpers/movimiento.helper';

@Module({
  imports: [
    TypeOrmModule.forFeature([Pedido, PedidoProducto, ProductoProveedor]),
    MovimientoModule,
  ],
  controllers: [PedidoController],
  providers: [PedidoService, PedidoRepository, MovimientoHelper],
  exports: [PedidoService],
})
export class PedidoModule {}
