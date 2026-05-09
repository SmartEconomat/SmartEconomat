import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Inventario } from './inventario.entity/inventario.entity';
import { InventarioService } from './service/inventario.service';
import { InventarioController } from './controller/inventario.controller';
import { AlertaController } from './controller/alerta.controller';
import { InventarioRepository } from './repository/inventario.repository';
import { ProductoProveedor } from '../producto/producto-proveedor.entity/producto-proveedor.entity';
import { MovimientoModule } from '../movimiento/movimiento.module';
import { InventarioTransferenciaStockService } from './service/inventario-transferencia-stock.service';
import { Transferencia } from './transferencia.entity/transferencia.entity';
import { TransferenciaLinea } from './transferencia.entity/transferencia-linea.entity';
import { UbicacionModule } from '../ubicacion/ubicacion.module';

/** Clase pública (InventarioModule). Paquete: smart-economat-backend (Nest). */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Inventario,
      ProductoProveedor,
      Transferencia,
      TransferenciaLinea,
    ]),
    MovimientoModule,
    UbicacionModule,
  ],
  controllers: [InventarioController, AlertaController],
  providers: [
    InventarioService,
    InventarioRepository,
    InventarioTransferenciaStockService,
  ],
  exports: [InventarioService],
})
export class InventarioModule {}
