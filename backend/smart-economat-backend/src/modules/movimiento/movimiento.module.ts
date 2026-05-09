import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Movimiento } from './movimiento.entity/movimiento.entity';
import { MovimientoController } from './controller/movimiento.controller';
import { MovimientoService } from './service/movimiento.service';
import { MovimientoRepository } from './repository/movimiento.repository';
import { Usuario } from '../usuario/usuario.entity/usuario.entity';
import { MovimientoAdapter } from './adapter/movimiento.adapter';
import { MovimientoPort } from './ports/movimiento.port';
import { MovimientoHelper } from '../../common/helpers/movimiento.helper';
import { AuditListener } from './listeners/audit.listener';

/** Clase pública (MovimientoModule). Paquete: smart-economat-backend (Nest). */
@Module({
  imports: [TypeOrmModule.forFeature([Movimiento, Usuario])],
  controllers: [MovimientoController],
  providers: [
    MovimientoService,
    MovimientoRepository,
    MovimientoAdapter,
    { provide: MovimientoPort, useClass: MovimientoAdapter },
    MovimientoHelper,
    AuditListener,
  ],
  exports: [MovimientoService, MovimientoPort, MovimientoHelper],
})
export class MovimientoModule {}
