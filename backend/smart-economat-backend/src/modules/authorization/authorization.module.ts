import { Module, Global, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { AuthorizationService } from './services/authorization.service';
import { PermisosGuard } from './guards/permisos.guard';
import { Usuario } from '../usuario/usuario.entity/usuario.entity';
import { Permiso } from '../permisos/entities/permiso.entity';
import { Rol } from '../roles/entities/rol.entity';
import { PlantillaRol } from '../plantillas-roles/entities/plantilla-rol.entity';
import { PermisosModule } from '../permisos/permisos.module';

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
    forwardRef(() => PermisosModule),
  ],
  providers: [AuthorizationService, PermisosGuard],
  exports: [AuthorizationService, PermisosGuard],
})
export class AuthorizationModule {}
