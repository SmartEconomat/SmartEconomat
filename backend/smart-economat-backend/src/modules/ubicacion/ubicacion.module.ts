import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UbicacionService } from './service/ubicacion.service';
import { UbicacionAccesoPoliticaService } from './service/ubicacion-acceso-politica.service';
import { UbicacionController } from './controller/ubicacion.controller';
import { Ubicacion } from './ubicacion.entity/ubicacion.entity';
import { UsuarioUbicacion } from '../usuario/usuario-ubicacion.entity/usuario-ubicacion.entity';

/** Clase pública (UbicacionModule). Paquete: smart-economat-backend (Nest). */
@Module({
  imports: [TypeOrmModule.forFeature([Ubicacion, UsuarioUbicacion])],
  controllers: [UbicacionController],
  providers: [UbicacionService, UbicacionAccesoPoliticaService],
  exports: [UbicacionService, UbicacionAccesoPoliticaService, TypeOrmModule],
})
export class UbicacionModule {}
