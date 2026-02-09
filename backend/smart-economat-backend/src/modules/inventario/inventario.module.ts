import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Inventario } from './inventario.entity/inventario.entity';
import { InventarioService } from './service/inventario.service';
import { InventarioController } from './controller/inventario.controller';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'db',
      port: 5432,
      username: 'smarteconomat-user',
      password: 'mysecretpassword',
      database: 'smarteconomat',
      entities: [Inventario],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([Inventario]),
  ],
  controllers: [InventarioController],
  providers: [InventarioService],
})
export class InventarioModule {}
