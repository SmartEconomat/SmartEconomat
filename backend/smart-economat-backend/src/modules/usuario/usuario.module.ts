import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Usuario } from './usuario.entity/usuario.entity';
import { UsuarioController } from './controller/usuario.controller';
import { UsuarioPerfilController } from './controller/usuario-perfil.controller';
import { UsuarioService } from './service/usuario.service';
import { UsuarioRepository } from './repository/usuario.repository';
import { SherlockAuthModule } from '../sherlock-auth/module/sherlock-auth.module';
import { Permiso } from '../permisos/permiso.entity/permiso.entity';
import { Rol } from '../roles/rol.entity/rol.entity';
import { MovimientoModule } from '../movimiento/movimiento.module';
import { Ubicacion } from '../ubicacion/ubicacion.entity/ubicacion.entity';
import { UsuarioUbicacion } from './usuario-ubicacion.entity/usuario-ubicacion.entity';

/** Clase pública (UsuarioModule). Paquete: smart-economat-backend (Nest). */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Usuario,
      UsuarioUbicacion,
      Permiso,
      Rol,
      Ubicacion,
    ]),
    SherlockAuthModule,
    MovimientoModule,
  ],
  controllers: [UsuarioPerfilController, UsuarioController],
  providers: [UsuarioService, UsuarioRepository],
  exports: [UsuarioService, TypeOrmModule],
})
export class UsuarioModule {}
