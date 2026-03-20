import { forwardRef, Module } from '@nestjs/common';
import { PedidoService } from './service/pedido.service';
import { PedidoController } from './controller/pedido.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pedido } from './pedido.entity/pedido.entity';
import { PedidoRepository } from './repository/pedido.repository';
import { PedidoProducto } from './pedido-producto.entity/pedido-producto.entity';
import { ProductoProveedor } from '../producto/producto-proveedor.entity/producto-proveedor.entity';
import { MovimientoModule } from '../movimiento/movimiento.module';
import { PurchaseBatch } from './purchase-batch.entity/purchase-batch.entity';
import { PurchaseBatchService } from './service/purchase-batch.service';

import { RecetaModule } from '../receta/receta.module';
import { RecetaToPedidoService } from './service/receta-to-pedido.service';
import { PedidoDraftModule } from '../pedido-draft/pedido-draft.module';
import { PurchaseBatchController } from './controller/purchase-batch.controller';
import { RecepcionModule } from '../recepcion/recepcion.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Pedido,
      PedidoProducto,
      ProductoProveedor,
      PurchaseBatch,
    ]),
    MovimientoModule,
    RecetaModule,
    forwardRef(() => PedidoDraftModule),
    forwardRef(() => RecepcionModule),
  ],
  controllers: [PedidoController, PurchaseBatchController],
  providers: [
    PedidoService,
    PedidoRepository,
    RecetaToPedidoService,
    PurchaseBatchService,
  ],
  exports: [PedidoService, PurchaseBatchService],
})
export class PedidoModule {}
