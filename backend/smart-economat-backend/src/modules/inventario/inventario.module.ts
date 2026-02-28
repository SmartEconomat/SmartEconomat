import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Inventario } from './inventario.entity/inventario.entity';
import { InventarioService } from './service/inventario.service';
import { InventarioController } from './controller/inventario.controller';
import { AlertaController } from './controller/alerta.controller';
import { InventarioRepository } from './repository/inventario.repository';
import { ProductoProveedor } from '../producto/producto-proveedor.entity/producto-proveedor.entity';
import { MovimientoModule } from '../movimiento/movimiento.module';
import { MovimientoHelper } from '../../common/helpers/movimiento.helper';

@Module({
  imports: [
    TypeOrmModule.forFeature([Inventario, ProductoProveedor]),
    MovimientoModule,
  ],
  controllers: [InventarioController, AlertaController],
  providers: [InventarioService, InventarioRepository, MovimientoHelper],
  exports: [InventarioService],
})
export class InventarioModule {}
