import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Inventario } from './inventario.entity/inventario.entity';
import { InventarioService } from './service/inventario.service';
import { InventarioController } from './controller/inventario.controller';
import { InventarioRepository } from './repository/inventario.repository';
import { ProductoProveedor } from '../producto/producto-proveedor.entity/producto-proveedor.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Inventario, ProductoProveedor])],
  controllers: [InventarioController],
  providers: [InventarioService, InventarioRepository],
  exports: [InventarioService, InventarioRepository],
})
export class InventarioModule {}
