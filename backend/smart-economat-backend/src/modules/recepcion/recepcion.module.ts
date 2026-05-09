import { forwardRef, Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Recepcion } from './recepcion.entity/recepcion.entity';
import { Usuario } from '../usuario/usuario.entity/usuario.entity';
import { RecepcionController } from './controller/recepcion.controller';
import { RecepcionProductoController } from './controller/recepcion-producto.controller';
import { RecepcionService } from './service/recepcion.service';
import { RecepcionStockService } from './service/recepcion-stock.service';
import { RecepcionProductoService } from './service/recepcion-producto.service';
import { RecepcionPedido } from './recepcion-pedido.entity/recepcion-pedido.entity';
import { RecepcionProducto } from './recepcion-productos.entity/recepcion-producto.entity';
import { Albaran } from '../albaran/albaran.entity/albaran.entity';
import { Inventario } from '../inventario/inventario.entity/inventario.entity';
import { Movimiento } from '../movimiento/movimiento.entity/movimiento.entity';
import { AlbaranPedidoRecepcion } from '../albaran/albaran-pedido-recepcion.entity/albaran-pedido-recepcion.entity';
import { Pedido } from '../pedido/pedido.entity/pedido.entity';
import { PedidoProducto } from '../pedido/pedido-producto.entity/pedido-producto.entity';
import { MovimientoModule } from '../movimiento/movimiento.module';

import { PdfReportService } from './service/pdf-report.service';
import { PedidoModule } from '../pedido/pedido.module';
import { ProductoModule } from '../producto/producto.module';

/** Clase pública (RecepcionModule). Paquete: smart-economat-backend (Nest). */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Recepcion,
      Usuario,
      RecepcionPedido,
      RecepcionProducto,
      Albaran,
      Inventario,
      Movimiento,
      AlbaranPedidoRecepcion,
      Pedido,
      PedidoProducto,
    ]),
    MovimientoModule,
    forwardRef(() => PedidoModule),
    forwardRef(() => ProductoModule),
    EventEmitterModule,
  ],
  controllers: [RecepcionController, RecepcionProductoController],
  providers: [
    RecepcionService,
    RecepcionStockService,
    RecepcionProductoService,
    PdfReportService,
  ],
  exports: [RecepcionService, RecepcionStockService, PdfReportService],
})
export class RecepcionModule {}
