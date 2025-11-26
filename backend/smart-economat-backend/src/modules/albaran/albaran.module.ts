import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlbaranController } from './controller/albaran.controller';
import { AlbaranService } from './service/albaran.service';
import { Albaran } from './albaran.entity/albaran.entity';
import { AlbaranPedidoRecepcion } from './albaran-pedido-recepcion.entity/albaran-pedido-recepcion.entity';
import { AlbaranRepository } from './repository/albaran.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Albaran, AlbaranPedidoRecepcion])],
  controllers: [AlbaranController],
  providers: [AlbaranService, AlbaranRepository],
  exports: [AlbaranService, AlbaranRepository],
})
export class AlbaranModule {}
