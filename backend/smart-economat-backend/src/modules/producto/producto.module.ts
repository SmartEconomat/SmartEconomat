import { Module } from '@nestjs/common';
import { ProductoService } from './service/producto.service';
import { ProductoController } from './controller/producto.controller';
import { ProductoProveedorService } from './service/producto-proveedor.service';
import { ProductoProveedorController } from './controller/producto-proveedor.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Producto } from './producto.entity/producto.entity';
import { ProductoAlergeno } from './producto-alergeno.entity/producto-alergeno.entity';
import { ProductoRepository } from './repository/producto.repository';
import { ProductoProveedor } from './producto-proveedor.entity/producto-proveedor.entity';
import { HistorialPrecio } from './historial-precio-proveedor.entity/historial.entity';
import { MovimientoModule } from '../movimiento/movimiento.module';
import { MovimientoHelper } from '../../common/helpers/movimiento.helper';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Producto,
      ProductoProveedor,
      ProductoAlergeno,
      HistorialPrecio,
    ]),
    MovimientoModule,
  ],
  controllers: [ProductoController, ProductoProveedorController],
  providers: [
    ProductoService,
    ProductoRepository,
    ProductoProveedorService,
    MovimientoHelper,
  ],
  exports: [ProductoService, ProductoRepository, ProductoProveedorService],
})
export class ProductoModule {}
