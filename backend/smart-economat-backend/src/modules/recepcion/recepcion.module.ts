import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Recepcion } from './recepcion.entity/recepcion.entity';
import { Usuario } from '../usuario/usuario.entity/usuario.entity';
import { RecepcionController } from './controller/recepcion.controller';
import { RecepcionService } from './service/recepcion.service';

@Module({
  imports: [TypeOrmModule.forFeature([Recepcion, Usuario])],
  controllers: [RecepcionController],
  providers: [RecepcionService],
  exports: [RecepcionService],
})
export class RecepcionModule {}
