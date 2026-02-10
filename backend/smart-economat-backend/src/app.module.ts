import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PedidoModule } from './modules/pedidos/pedidos.module';
import { ProductosModule } from './modules/producto/productos.module';
import { MovimientoModule } from './modules/movimiento/movimiento.module';
import { dataSource } from './config/datasource';
@Module({
  imports: [
    TypeOrmModule.forRoot(dataSource),
    PedidoModule,
    ProductosModule,
    MovimientoModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
