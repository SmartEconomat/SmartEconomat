import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import Redis from 'ioredis';
import { RecepcionDraftService } from './service/recepcion-draft.service';
import { RecepcionDraft } from './recepcion-draft.entity/recepcion-draft.entity';
import { RECEPCION_DRAFT_REDIS } from './constants/recepcion-draft.constants';
import { createInMemoryRedisClient } from '../../common/testing/in-memory-redis';

/**
 * Providers del borrador de recepción. El controlador se declara en RecepcionModule
 * **antes** de RecepcionController para que GET/DELETE `/recepciones/draft` no caigan en `:id`.
 */
@Module({
  imports: [TypeOrmModule.forFeature([RecepcionDraft])],
  controllers: [],
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
