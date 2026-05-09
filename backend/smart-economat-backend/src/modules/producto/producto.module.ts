import { Module } from '@nestjs/common';
import { ProductoService } from './service/producto.service';
import { ProductoController } from './controller/producto.controller';
import { ProductoProveedorService } from './service/producto-proveedor.service';
import { ProductoProveedorController } from './controller/producto-proveedor.controller';
import { ProductoAlergenoService } from './service/producto-alergeno.service';
import { ProductoAlergenoController } from './controller/producto-alergeno.controller';
import { HistorialPrecioService } from './service/historial-precio.service';
import { HistorialPrecioController } from './controller/historial-precio.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Producto } from './producto.entity/producto.entity';
import { ProductoAlergeno } from './producto-alergeno.entity/producto-alergeno.entity';
import { ProductoRepository } from './repository/producto.repository';
import { HistorialPrecioRepository } from './repository/historial-precio.repository';
import { ProductoProveedor } from './producto-proveedor.entity/producto-proveedor.entity';
import { HistorialPrecio } from './historial-precio-proveedor.entity/historial.entity';
import { MovimientoModule } from '../movimiento/movimiento.module';
import { Proveedor } from '../proveedor/proveedor.entity/proveedor.entity';
import { ArchivoModule } from '../archivo/archivo.module';

/** Clase pública (ProductoModule). Paquete: smart-economat-backend (Nest). */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Producto,
      ProductoProveedor,
      ProductoAlergeno,
      HistorialPrecio,
      Proveedor,
    ]),
    ArchivoModule,
    MovimientoModule,
  ],
  controllers: [
    ProductoController,
    ProductoProveedorController,
    ProductoAlergenoController,
    HistorialPrecioController,
  ],
  providers: [
    ProductoService,
    ProductoRepository,
    ProductoProveedorService,
    ProductoAlergenoService,
    HistorialPrecioService,
    HistorialPrecioRepository,
  ],
  exports: [
    ProductoService,
    ProductoRepository,
    ProductoProveedorService,
    HistorialPrecioService,
  ],
})
export class ProductoModule {}
