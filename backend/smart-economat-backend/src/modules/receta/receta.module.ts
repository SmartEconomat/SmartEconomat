import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Receta } from './receta.entity/receta.entity';
import { RecetaIngrediente } from './receta-ingrediente.entity/receta-ingrediente.entity';
import { Producto } from '../producto/producto.entity/producto.entity';
import { RecetaService } from './service/receta.service';
import { RecetaController } from './controller/receta.controller';
import { RecetaRepository } from './repository/receta.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Receta, RecetaIngrediente, Producto])],
  controllers: [RecetaController],
  providers: [RecetaService, RecetaRepository],
  exports: [RecetaService, RecetaRepository],
})
export class RecetaModule {}
