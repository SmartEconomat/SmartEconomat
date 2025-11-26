import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MovimientoController } from './controller/movimiento.controller';
import { MovimientoService } from './service/movimiento.service';
import { Movimiento } from './movimiento.entity/movimiento.entity';
import { MovimientoRepository } from './repository/movimiento.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Movimiento])],
  controllers: [MovimientoController],
  providers: [MovimientoService, MovimientoRepository],
  exports: [MovimientoService, MovimientoRepository],
})
export class MovimientoModule {}
