import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import Redis from 'ioredis';
import { RecepcionDraftController } from './controller/recepcion-draft.controller';
import { RecepcionDraftService } from './service/recepcion-draft.service';
import { RecepcionDraft } from './recepcion-draft.entity/recepcion-draft.entity';
import { RECEPCION_DRAFT_REDIS } from './constants/recepcion-draft.constants';
import { createInMemoryRedisClient } from '../../common/testing/in-memory-redis';

/** Clase pública (RecepcionDraftModule). Paquete: smart-economat-backend (Nest). */
@Module({
  imports: [TypeOrmModule.forFeature([RecepcionDraft])],
  controllers: [RecepcionDraftController],
  providers: [
    RecepcionDraftService,
    {
      provide: RECEPCION_DRAFT_REDIS,
      inject: [ConfigService],
      useFactory: (configService: ConfigService): Redis => {
        if (process.env.NODE_ENV === 'test') {
          return createInMemoryRedisClient() as unknown as Redis;
        }

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
  exports: [RecepcionDraftService],
})
export class RecepcionDraftModule {}
