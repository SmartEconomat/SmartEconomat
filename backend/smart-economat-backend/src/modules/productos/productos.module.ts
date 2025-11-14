import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductosController } from './controller/productos.controller';
import { ProductosService } from './service/productos.service';
import { Producto } from './producto.entity/producto.entity';
import { ProductoRepository } from './repository/producto.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Producto])],
  controllers: [ProductosController],
  providers: [ProductosService, ProductoRepository],
  exports: [ProductosService, ProductoRepository],
})
export class ProductosModule {}
