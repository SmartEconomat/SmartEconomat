import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Profesor } from './profesor.entity/profesor.entity';
import { AlumnoSlot } from './profesor.entity/alumno-slot.entity';
import { ProfesorController } from './controller/profesor.controller';
import { ProfesorService } from './service/profesor.service';
import { Ubicacion } from '../ubicacion/ubicacion.entity/ubicacion.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Profesor, AlumnoSlot, Ubicacion])],
  controllers: [ProfesorController],
  providers: [ProfesorService],
  exports: [ProfesorService],
})
export class ProfesorModule {}
