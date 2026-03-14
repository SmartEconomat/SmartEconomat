import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Permiso } from './permiso.entity/permiso.entity';
import { PermisosService } from './service/permisos.service';

@Module({
  imports: [TypeOrmModule.forFeature([Permiso])],
  providers: [PermisosService],
  exports: [PermisosService, TypeOrmModule],
})
export class PermisosModule {}
