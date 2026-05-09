import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Profesor } from './profesor.entity/profesor.entity';
import { AlumnoSlot } from './profesor.entity/alumno-slot.entity';
import { AlumnoSlotUbicacion } from './profesor.entity/alumno-slot-ubicacion.entity';
import { ProfesorController } from './controller/profesor.controller';
import { ProfesorService } from './service/profesor.service';

/** Clase pública (ProfesorModule). Paquete: smart-economat-backend (Nest). */
@Module({
  imports: [
    TypeOrmModule.forFeature([Profesor, AlumnoSlot, AlumnoSlotUbicacion]),
  ],
  controllers: [ProfesorController],
  providers: [ProfesorService],
  exports: [ProfesorService],
})
export class ProfesorModule {}
