import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './controller/dashboard.controller';
import { DashboardService } from './service/dashboard.service';
import { Inventario } from '../inventario/inventario.entity/inventario.entity';
import { Pedido } from '../pedido/pedido.entity/pedido.entity';
import { Movimiento } from '../movimiento/movimiento.entity/movimiento.entity';
import { Producto } from '../producto/producto.entity/producto.entity';
import { Proveedor } from '../proveedor/proveedor.entity/proveedor.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Inventario,
      Pedido,
      Movimiento,
      Producto,
      Proveedor,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
