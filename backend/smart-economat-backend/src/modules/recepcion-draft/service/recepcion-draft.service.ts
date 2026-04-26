import {
  ConflictException,
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import Redis from 'ioredis';
import { Repository } from 'typeorm';
import { RecepcionDraft } from '../recepcion-draft.entity/recepcion-draft.entity';
import {
  RECEPCION_DRAFT_CACHE_PREFIX,
  RECEPCION_DRAFT_REDIS,
  RECEPCION_DRAFT_TTL_SECONDS,
} from '../constants/recepcion-draft.constants';
import { UpsertRecepcionDraftDto } from '../dto/upsert-recepcion-draft.dto';
import { RecepcionDraftRecord } from '../interfaces/recepcion-draft-record.interface';

/**
 * Documentación en español.
 */
@Injectable()
export class RecepcionDraftService implements OnModuleDestroy {
  private readonly logger = new Logger(RecepcionDraftService.name);

        /**
     * Documentación en español.
     */
  constructor(
    @InjectRepository(RecepcionDraft)
    private readonly recepcionDraftRepository: Repository<RecepcionDraft>,
    @Inject(RECEPCION_DRAFT_REDIS)
    private readonly redisClient: Redis
  ) {}

        /**
     * Documentación en español.
     */
  async onModuleDestroy(): Promise<void> {
    try {
      if (this.redisClient.status !== 'end') {
        await this.redisClient.quit();
      }
    } catch {
      this.redisClient.disconnect(false);
    }
  }

        /**
     * Documentación en español.
     */
  async upsertDraft(
    userId: string,
    dto: UpsertRecepcionDraftDto
  ): Promise<RecepcionDraftRecord> {
    const currentDraft = await this.getLatestDraft(userId);

    if (
      currentDraft &&
      dto.version !== undefined &&
      dto.version !== currentDraft.version
    ) {
      throw new ConflictException({
        message:
          'El borrador fue actualizado desde otro dispositivo. Recarga o resuelve el conflicto antes de continuar.',
        draft: currentDraft,
      });
    }

    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + RECEPCION_DRAFT_TTL_SECONDS * 1000
    );

    const nextDraft: RecepcionDraftRecord = {
      id: currentDraft?.id,
      userId,
      version: (currentDraft?.version ?? 0) + 1,
      payload: dto.payload,
      createdAt: currentDraft?.createdAt ?? now.toISOString(),
      updatedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      source: 'redis',
    };

    try {
      await this.saveDraftToCache(nextDraft);
    } catch (error) {
      this.logger.warn(
        `No se pudo guardar el draft en Redis para el usuario ${userId}. Se usará PostgreSQL como fallback.`,
        error instanceof Error ? error.stack : undefined
      );

      const persisted = await this.persistDraftToDatabase(nextDraft);
      return {
        ...persisted,
        source: 'database',
      };
    }

    void this.persistDraftToDatabase(nextDraft).catch((error: unknown) => {
      this.logger.error(
        `Error al sincronizar el draft de recepción del usuario ${userId} hacia PostgreSQL`,
        error instanceof Error ? error.stack : undefined
      );
    });

    return nextDraft;
  }

        /**
     * Documentación en español.
     */
  async getLatestDraft(userId: string): Promise<RecepcionDraftRecord | null> {
    const fromCache = await this.getDraftFromCache(userId);
    if (fromCache) {
      return fromCache;
    }

    const fromDatabase = await this.getDraftFromDatabase(userId);
    if (fromDatabase) {
      try {
        await this.saveDraftToCache(fromDatabase);
      } catch (error) {
        this.logger.warn(
          `No se pudo recalentar Redis con el draft del usuario ${userId}`,
          error instanceof Error ? error.stack : undefined
        );
      }
    }

    return fromDatabase;
  }

        /**
     * Documentación en español.
     */
  async clearDraft(userId: string): Promise<void> {
    await Promise.allSettled([
      this.deleteDraftFromCache(userId),
      this.recepcionDraftRepository.softDelete({ usuarioId: userId }),
    ]);
  }

        /**
     * Documentación en español.
     */
  private buildCacheKey(userId: string): string {
    return `${RECEPCION_DRAFT_CACHE_PREFIX}${userId}`;
  }

        /**
     * Documentación en español.
     */
  private isExpired(expiresAt: string | null): boolean {
    return Boolean(expiresAt && new Date(expiresAt).getTime() <= Date.now());
  }

        /**
     * Documentación en español.
     */
  private async getDraftFromCache(
    userId: string
  ): Promise<RecepcionDraftRecord | null> {
    try {
      const cachedDraft = await this.redisClient.get(
        this.buildCacheKey(userId)
      );
      if (!cachedDraft) {
        return null;
      }

      const parsed = JSON.parse(cachedDraft) as RecepcionDraftRecord;
      if (this.isExpired(parsed.expiresAt)) {
        await this.deleteDraftFromCache(userId);
        return null;
      }

      return {
        ...parsed,
        source: 'redis',
      };
    } catch (error) {
      this.logger.warn(
        `Redis no disponible al leer el draft de recepción del usuario ${userId}`,
        error instanceof Error ? error.stack : undefined
      );
      return null;
    }
  }

        /**
     * Documentación en español.
     */
  private async saveDraftToCache(draft: RecepcionDraftRecord): Promise<void> {
    await this.redisClient.set(
      this.buildCacheKey(draft.userId),
      JSON.stringify(draft),
      'EX',
      RECEPCION_DRAFT_TTL_SECONDS
    );
  }

        /**
     * Documentación en español.
     */
  private async deleteDraftFromCache(userId: string): Promise<void> {
    try {
      await this.redisClient.del(this.buildCacheKey(userId));
    } catch (error) {
      this.logger.warn(
        `Redis no disponible al eliminar el draft de recepción del usuario ${userId}`,
        error instanceof Error ? error.stack : undefined
      );
    }
  }

        /**
     * Documentación en español.
     */
  private async getDraftFromDatabase(
    userId: string
  ): Promise<RecepcionDraftRecord | null> {
    const draftEntity = await this.recepcionDraftRepository.findOne({
      where: { usuarioId: userId },
      order: { updatedAt: 'DESC' },
    });

    if (!draftEntity) {
      return null;
    }

    if (
      draftEntity.expiresAt &&
      draftEntity.expiresAt.getTime() <= Date.now()
    ) {
      await this.recepcionDraftRepository.softDelete({ id: draftEntity.id });
      return null;
    }

    return this.mapEntityToRecord(draftEntity, 'database');
  }

        /**
     * Documentación en español.
     */
  private async persistDraftToDatabase(
    draft: RecepcionDraftRecord
  ): Promise<RecepcionDraftRecord> {
    const currentEntity = await this.recepcionDraftRepository.findOne({
      where: { usuarioId: draft.userId },
      order: { updatedAt: 'DESC' },
    });

    if (currentEntity && currentEntity.draftVersion > draft.version) {
      return this.mapEntityToRecord(currentEntity, 'database');
    }

    const entity = currentEntity
      ? this.recepcionDraftRepository.merge(currentEntity, {
          payload: draft.payload,
          draftVersion: draft.version,
          expiresAt: draft.expiresAt ? new Date(draft.expiresAt) : null,
          deletedAt: null,
          deletedBy: null,
        })
      : this.recepcionDraftRepository.create({
          usuarioId: draft.userId,
          payload: draft.payload,
          draftVersion: draft.version,
          expiresAt: draft.expiresAt ? new Date(draft.expiresAt) : null,
        });

    const saved = await this.recepcionDraftRepository.save(entity);
    return this.mapEntityToRecord(saved, 'database');
  }

        /**
     * Documentación en español.
     */
  private mapEntityToRecord(
    entity: RecepcionDraft,
    source: 'redis' | 'database'
  ): RecepcionDraftRecord {
    return {
      id: entity.id,
      userId: entity.usuarioId,
      version: entity.draftVersion,
      payload: entity.payload,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
      expiresAt: entity.expiresAt ? entity.expiresAt.toISOString() : null,
      source,
    };
  }
}
