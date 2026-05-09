import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Permiso } from './permiso.entity/permiso.entity';
import { PermisosService } from './service/permisos.service';
import { PermisosController } from './controller/permisos.controller';

/** Clase pública (PermisosModule). Paquete: smart-economat-backend (Nest). */
@Module({
  imports: [TypeOrmModule.forFeature([Permiso])],
  controllers: [PermisosController],
  providers: [PermisosService],
  exports: [PermisosService, TypeOrmModule],
})
export class PermisosModule {}
