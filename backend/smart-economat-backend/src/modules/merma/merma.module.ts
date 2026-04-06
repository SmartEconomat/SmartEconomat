import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Producto } from '../producto/producto.entity/producto.entity';
import { ProduccionLote } from '../receta/produccion-lote.entity/produccion-lote.entity';
import { RecetaIngrediente } from '../receta/receta-ingrediente.entity/receta-ingrediente.entity';
import { MermaController } from './controller/merma.controller';
import { Merma } from './merma.entity/merma.entity';
import { MermaService } from './service/merma.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Merma,
      Producto,
      ProduccionLote,
      RecetaIngrediente,
    ]),
  ],
  controllers: [MermaController],
  providers: [MermaService],
  exports: [MermaService],
})
export class MermaModule {}
