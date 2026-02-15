import { Module } from '@nestjs/common';
import { ProductoService } from './service/producto.service';
import { ProductoController } from './controller/producto.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Producto } from './producto.entity/producto.entity';
import { ProductoRepository } from './repository/producto.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Producto])],
  controllers: [ProductoController],
  providers: [ProductoService, ProductoRepository],
  exports: [ProductoService, ProductoRepository],
})
export class ProductoModule {}
