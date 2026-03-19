import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './controller/admin.controller';
import { AdminService } from './service/admin.service';
import { Usuario } from '../usuario/usuario.entity/usuario.entity';
import { Profesor } from '../profesor/profesor.entity/profesor.entity';
import { Rol } from '../roles/rol.entity/rol.entity';
import { RolesModule } from '../roles/roles.module';
<<<<<<< HEAD
import { Permiso } from '../permisos/permiso.entity/permiso.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Usuario, Profesor, Rol, Permiso]),
    RolesModule,
  ],
=======

@Module({
  imports: [TypeOrmModule.forFeature([Usuario, Profesor, Rol]), RolesModule],
>>>>>>> eb5618a (fix: errores de login/registro y visualizacion de estado activo/inactivo bucle infinito)
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
