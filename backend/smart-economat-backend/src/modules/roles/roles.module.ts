import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Rol } from './rol.entity/rol.entity';
import { UsuarioRol } from './usuario-rol.entity/usuario-rol.entity';
import { RolPermiso } from './rol-permiso.entity/rol-permiso.entity';
import { RolesService } from './service/roles.service';
import { RolesController } from './controller/roles.controller';
import { PermisosModule } from '../permisos/permisos.module';
import { UsuarioModule } from '../usuario/usuario.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Rol, UsuarioRol, RolPermiso]),
    PermisosModule,
    forwardRef(() => UsuarioModule),
  ],
  controllers: [RolesController],
  providers: [RolesService],
  exports: [RolesService, TypeOrmModule],
})
export class RolesModule {}
