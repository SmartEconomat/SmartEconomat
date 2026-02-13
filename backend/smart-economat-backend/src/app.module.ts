import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PedidoModule } from './modules/pedido/pedido.module';
import { ProductoModule } from './modules/producto/producto.module';
import { MovimientoModule } from './modules/movimiento/movimiento.module';
import { typeOrmConfig } from './config/database.config';
import { I18nConfigModule } from './config/i18n.module';
import { RecepcionModule } from './modules/recepcion/recepcion.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(typeOrmConfig),
    I18nConfigModule,
    PedidoModule,
    ProductoModule,
    MovimientoModule,
    RecepcionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
