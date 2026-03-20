import { forwardRef, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import Redis from 'ioredis';
import { PedidoDraftService } from './service/pedido-draft.service';
import { PedidoDraft } from './pedido-draft.entity/pedido-draft.entity';
import { PEDIDO_DRAFT_REDIS } from './constants/pedido-draft.constants';
import { PedidoModule } from '../pedido/pedido.module';
import { PedidoDraftController } from './controller/pedido-draft.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([PedidoDraft]),
    forwardRef(() => PedidoModule),
  ],
  controllers: [PedidoDraftController],
  providers: [
    PedidoDraftService,
    {
      provide: PEDIDO_DRAFT_REDIS,
      inject: [ConfigService],
      useFactory: (configService: ConfigService): Redis => {
        const redisUrl = configService.get<string>('REDIS_URL');

        if (redisUrl) {
          return new Redis(redisUrl, {
            lazyConnect: true,
            maxRetriesPerRequest: 1,
            enableReadyCheck: false,
          });
        }

        return new Redis({
          host: configService.get<string>('REDIS_HOST', 'redis'),
          port: Number(configService.get<string>('REDIS_PORT', '6379')),
          password: configService.get<string>('REDIS_PASSWORD') || undefined,
          db: Number(configService.get<string>('REDIS_DB', '0')),
          lazyConnect: true,
          maxRetriesPerRequest: 1,
          enableReadyCheck: false,
        });
      },
    },
  ],
  exports: [PedidoDraftService],
})
export class PedidoDraftModule {}
