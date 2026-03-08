import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Rol } from './entities/rol.entity';
import { UsuarioRol } from './entities/usuario-rol.entity';
import { RolPermiso } from './entities/rol-permiso.entity';
import { RolesService } from './service/roles.service';
import { PermisosModule } from '../permisos/permisos.module';
import { UsuarioModule } from '../usuario/usuario.module';
import { AuthorizationModule } from '../authorization/authorization.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Rol, UsuarioRol, RolPermiso]),
    PermisosModule,
    forwardRef(() => UsuarioModule),
    forwardRef(() => AuthorizationModule),
  ],
  providers: [RolesService],
  exports: [RolesService, TypeOrmModule],
})
export class RolesModule {}
