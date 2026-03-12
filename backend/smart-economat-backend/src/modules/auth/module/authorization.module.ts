import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { AuthorizationService } from '../service/authorization.service';
import { PermisosGuard } from '../guards/permisos.guard';
import { Usuario } from '../../usuario/usuario.entity/usuario.entity';
import { Permiso } from '../../permisos/permiso.entity/permiso.entity';
import { Rol } from '../../roles/rol.entity/rol.entity';
import { PlantillaRol } from '../../plantillas-roles/plantilla-rol.entity/plantilla-rol.entity';
import { PermisosModule } from '../../permisos/permisos.module';

/**
 * Módulo global de autorización.
 * Proporciona el AuthorizationService y PermisosGuard a toda la aplicación.
 */
@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([Usuario, Permiso, Rol, PlantillaRol]),
    CacheModule.register({
      ttl: 300,
      max: 1000,
    }),
    PermisosModule,
  ],
  providers: [AuthorizationService, PermisosGuard],
  exports: [AuthorizationService, PermisosGuard],
})
export class AuthorizationModule {}
