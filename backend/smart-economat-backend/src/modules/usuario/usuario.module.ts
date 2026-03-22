import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Usuario } from './usuario.entity/usuario.entity';
import { UsuarioController } from './controller/usuario.controller';
import { UsuarioService } from './service/usuario.service';
import { UsuarioRepository } from './repository/usuario.repository';
import { SherlockAuthModule } from '../sherlock-auth/module/sherlock-auth.module';
import { Permiso } from '../permisos/permiso.entity/permiso.entity';
import { Rol } from '../roles/rol.entity/rol.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Usuario, Permiso, Rol]),
    SherlockAuthModule,
  ],
  controllers: [UsuarioController],
  providers: [UsuarioService, UsuarioRepository],
  exports: [UsuarioService, TypeOrmModule],
})
export class UsuarioModule {}
