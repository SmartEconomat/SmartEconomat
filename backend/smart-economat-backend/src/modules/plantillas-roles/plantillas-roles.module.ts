import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlantillaRol } from './plantilla-rol.entity/plantilla-rol.entity';
import { PlantillaRolPermiso } from './plantilla-rol-permiso.entity/plantilla-rol-permiso.entity';
import { PlantillasRolesService } from './service/plantillas-roles.service';
import { PermisosModule } from '../permisos/permisos.module';
import { RolesModule } from '../roles/roles.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PlantillaRol, PlantillaRolPermiso]),
    PermisosModule,
    RolesModule,
  ],
  providers: [PlantillasRolesService],
  exports: [PlantillasRolesService, TypeOrmModule],
})
export class PlantillasRolesModule {}
