import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Distribucion } from './distribucion.entity/distribucion.entity';
import { DistribucionLinea } from './distribucion-linea.entity/distribucion-linea.entity';
import { DistribucionController } from './controller/distribucion.controller';
import { DistribucionService } from './service/distribucion.service';
import { PedidoUsuario } from '../pedido/pedido-usuario.entity/pedido-usuario.entity';
import { RecepcionProducto } from '../recepcion/recepcion-productos.entity/recepcion-producto.entity';
import { Ubicacion } from '../ubicacion/ubicacion.entity/ubicacion.entity';
import { AlumnoSlot } from '../profesor/profesor.entity/alumno-slot.entity';
import { Inventario } from '../inventario/inventario.entity/inventario.entity';
import { Movimiento } from '../movimiento/movimiento.entity/movimiento.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Distribucion,
      DistribucionLinea,
      PedidoUsuario,
      RecepcionProducto,
      Ubicacion,
      AlumnoSlot,
      Inventario,
      Movimiento,
    ]),
  ],
  controllers: [DistribucionController],
  providers: [DistribucionService],
  exports: [DistribucionService],
})
export class DistribucionModule {}
