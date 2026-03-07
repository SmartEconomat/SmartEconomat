import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './controller/admin.controller';
import { AdminService } from './service/admin.service';
import { Usuario } from '../usuario/usuario.entity/usuario.entity';
import { Profesor } from '../profesor/profesor.entity/profesor.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Usuario, Profesor])],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
