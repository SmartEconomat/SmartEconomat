import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PreparacionEntity } from './preparacion.entity';
import { Producto } from '../producto/producto.entity/producto.entity';
import { PreparacionService } from './service/preparacion.service';
import { PreparacionController } from './controller/preparacion.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PreparacionEntity, Producto])],
  providers: [PreparacionService],
  controllers: [PreparacionController],
  exports: [PreparacionService],
})
export class PreparacionModule {}
