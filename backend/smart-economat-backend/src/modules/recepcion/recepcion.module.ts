import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecepcionController } from './controller/recepcion.controller';
import { RecepcionService } from './service/recepcion.service';
import { RecepcionRepository } from './repository/recepcion.repository';
import { Recepcion } from './recepcion.entity/recepcion.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Recepcion])],
  controllers: [RecepcionController],
  providers: [RecepcionService, RecepcionRepository],
  exports: [RecepcionService, RecepcionRepository],
})
export class RecepcionModule {}
