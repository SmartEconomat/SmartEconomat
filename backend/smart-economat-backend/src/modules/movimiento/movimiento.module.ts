import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Movimiento } from './movimiento.entity/movimiento.entity';
import { MovimientoController } from './controller/movimiento.controller';
import { MovimientoService } from './service/movimiento.service';
import { MovimientoRepository } from './repository/movimiento.repository';
import { Usuario } from '../usuario/usuario.entity/usuario.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Movimiento, Usuario])],
  controllers: [MovimientoController],
  providers: [MovimientoService, MovimientoRepository],
  exports: [MovimientoService],
})
export class MovimientoModule {}
