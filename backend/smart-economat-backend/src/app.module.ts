import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PedidosModule } from './modules/pedidos/pedidos.module';
import { ProductosModule } from './modules/productos/productos.module';
import { dataSource } from './config/datasource';
@Module({
  imports: [TypeOrmModule.forRoot(dataSource), PedidosModule, ProductosModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
