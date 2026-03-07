import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Alumno } from './alumno.entity/alumno.entity';
import { AlumnoService } from './service/alumno.service';
import { AlumnoController } from './controller/alumno.controller';
import { Usuario } from '../usuario/usuario.entity/usuario.entity';
import { Profesor } from '../profesor/profesor.entity/profesor.entity';
import { AlumnoSlot } from '../profesor/profesor.entity/alumno-slot.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Alumno, Usuario, Profesor, AlumnoSlot])],
  controllers: [AlumnoController],
  providers: [AlumnoService],
  exports: [AlumnoService],
})
export class AlumnoModule {}
