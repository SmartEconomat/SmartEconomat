import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Archivo } from './entities/archivo.entity';
import { ArchivoService } from './service/archivo.service';
import { ArchivoController } from './controller/archivo.controller';
import { Usuario } from '../usuario/usuario.entity/usuario.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Archivo, Usuario])],
  controllers: [ArchivoController],
  providers: [ArchivoService],
  exports: [ArchivoService],
})
export class ArchivoModule {}
