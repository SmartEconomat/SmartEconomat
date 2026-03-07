import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Receta } from './receta.entity/receta.entity';
import { RecetaIngrediente } from './receta-ingrediente.entity/receta-ingrediente.entity';
import { ProduccionLote } from './produccion-lote.entity/produccion-lote.entity';
import { Producto } from '../producto/producto.entity/producto.entity';
import { ProductoProveedor } from '../producto/producto-proveedor.entity/producto-proveedor.entity';
import { RecetaService } from './service/receta.service';
import { ProduccionService } from './service/produccion.service';
import { RecetaController } from './controller/receta.controller';
import { ProduccionController } from './controller/produccion.controller';
import { RecetaRepository } from './repository/receta.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Receta,
      RecetaIngrediente,
      ProduccionLote,
      Producto,
      ProductoProveedor,
    ]),
  ],
  controllers: [RecetaController, ProduccionController],
  providers: [RecetaService, ProduccionService, RecetaRepository],
  exports: [RecetaService, ProduccionService, RecetaRepository],
})
export class RecetaModule {}
