import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Incidencia } from './incidencia.entity/incidencia.entity';
import { IncidenciaLinea } from './incidencia-linea.entity/incidencia-linea.entity';
import { IncidenciaResuelta } from './incidencia-resuelta.entity/incidencia-resuelta.entity';
import { IncidenciaRepository } from './repository/incidencia.repository';
import { IncidenciaResuelaRepository } from './repository/incidencia-resuelta.repository';
import { Recepcion } from '../recepcion/recepcion.entity/recepcion.entity';
import { MovimientoModule } from '../movimiento/movimiento.module';
import { PedidoModule } from '../pedido/pedido.module';
import { IncidenciaService } from './service/incidencia.service';
import { IncidenciaResuelaService } from './service/incidencia-resuelta.service';
import { IncidenciaController } from './controller/incidencia.controller';
import { IncidenciaResuelaController } from './controller/incidencia-resuelta.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Incidencia,
      IncidenciaLinea,
      IncidenciaResuelta,
      Recepcion,
    ]),
    MovimientoModule,
    PedidoModule,
  ],
  controllers: [IncidenciaController, IncidenciaResuelaController],
  providers: [
    IncidenciaService,
    IncidenciaRepository,
    IncidenciaResuelaService,
    IncidenciaResuelaRepository,
  ],
  exports: [IncidenciaService, IncidenciaResuelaService],
})
export class IncidenciaModule {}
