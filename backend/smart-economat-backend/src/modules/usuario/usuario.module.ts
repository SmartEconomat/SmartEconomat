import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Usuario } from './usuario.entity/usuario.entity';
import { UsuarioController } from './controller/usuario.controller';
import { UsuarioService } from './service/usuario.service';
import { UsuarioRepository } from './repository/usuario.repository';
import { AuthModule } from '../auth/module/auth.module';
import { Permiso } from '../permisos/permiso.entity/permiso.entity';

import { Permiso } from '../permisos/entities/permiso.entity';
import { AuthorizationModule } from '../authorization/authorization.module';

@Module({
  imports: [TypeOrmModule.forFeature([Usuario, Permiso]), AuthModule],
  controllers: [UsuarioController],
  providers: [UsuarioService, UsuarioRepository],
  exports: [UsuarioService, TypeOrmModule],
})
export class UsuarioModule {}
