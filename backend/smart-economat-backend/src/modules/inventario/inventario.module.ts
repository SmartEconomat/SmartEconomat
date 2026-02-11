import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Inventario } from './inventario.entity/inventario.entity';
import { InventarioService } from './service/inventario.service';
import { InventarioController } from './controller/inventario.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Inventario])],
  controllers: [InventarioController],
  providers: [InventarioService],
})
export class InventarioModule {}
