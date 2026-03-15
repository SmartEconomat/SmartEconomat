import { Module } from '@nestjs/common';
import { PedidoService } from './service/pedido.service';
import { PedidoController } from './controller/pedido.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pedido } from './pedido.entity/pedido.entity';
import { PedidoRepository } from './repository/pedido.repository';
import { PedidoProducto } from './pedido-producto.entity/pedido-producto.entity';
import { ProductoProveedor } from '../producto/producto-proveedor.entity/producto-proveedor.entity';
import { MovimientoModule } from '../movimiento/movimiento.module';

import { RecetaModule } from '../receta/receta.module';
import { RecetaToPedidoService } from './service/receta-to-pedido.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Pedido, PedidoProducto, ProductoProveedor]),
    MovimientoModule,
    RecetaModule,
  ],
  controllers: [PedidoController],
  providers: [PedidoService, PedidoRepository, RecetaToPedidoService],
  exports: [PedidoService],
})
export class PedidoModule {}
