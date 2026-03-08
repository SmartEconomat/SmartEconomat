import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Receta } from './receta.entity/receta.entity';
import { RecetaIngrediente } from './receta-ingrediente.entity/receta-ingrediente.entity';
import { Producto } from '../producto/producto.entity/producto.entity';
import { RecetaService } from './service/receta.service';
import { RecetaController } from './controller/receta.controller';
import { RecetaRepository } from './repository/receta.repository';
import { ProduccionController } from './controller/produccion.controller';
import { ProduccionService } from './service/produccion.service';
import { ProduccionLote } from './produccion-lote.entity/produccion-lote.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Receta,
      RecetaIngrediente,
      Producto,
      ProduccionLote,
    ]),
  ],
  controllers: [RecetaController, ProduccionController],
  providers: [RecetaService, RecetaRepository, ProduccionService],
  exports: [RecetaService, RecetaRepository, ProduccionService],
})
export class RecetaModule {}
