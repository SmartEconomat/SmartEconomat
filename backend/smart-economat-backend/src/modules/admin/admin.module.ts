import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './controller/admin.controller';
import { AdminService } from './service/admin.service';
import { Usuario } from '../usuario/usuario.entity/usuario.entity';
import { Profesor } from '../profesor/profesor.entity/profesor.entity';
import { Rol } from '../roles/rol.entity/rol.entity';
import { RolesModule } from '../roles/roles.module';
import { Permiso } from '../permisos/permiso.entity/permiso.entity';
import { MovimientoModule } from '../movimiento/movimiento.module';

/** Clase pública (AdminModule). Paquete: smart-economat-backend (Nest). */
@Module({
  imports: [
    TypeOrmModule.forFeature([Usuario, Profesor, Rol, Permiso]),
    RolesModule,
    MovimientoModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
