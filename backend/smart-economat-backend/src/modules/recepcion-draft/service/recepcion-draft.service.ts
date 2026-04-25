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
 * Service that manages the lifecycle of a user's reception draft (borrador de recepción).
 * Uses Redis as the primary cache with PostgreSQL as a persistent fallback.
 * Implements a cache-aside pattern: reads prefer Redis, writes go to Redis first and then
 * asynchronously sync to the database.
 *
 * @class RecepcionDraftService
 * @implements {OnModuleDestroy}
 */
@Injectable()
export class RecepcionDraftService implements OnModuleDestroy {
  private readonly logger = new Logger(RecepcionDraftService.name);

  /**
   * Constructs the RecepcionDraftService with its required dependencies.
   *
   * @param {Repository<RecepcionDraft>} recepcionDraftRepository - TypeORM repository for the RecepcionDraft entity.
   * @param {Redis} redisClient - Dedicated Redis client used as the draft cache.
   */
  constructor(
    @InjectRepository(RecepcionDraft)
    private readonly recepcionDraftRepository: Repository<RecepcionDraft>,
    @Inject(RECEPCION_DRAFT_REDIS)
    private readonly redisClient: Redis
  ) {}

  /**
   * Gracefully closes the Redis connection when the NestJS module is destroyed.
   * Falls back to a forced disconnect if a graceful quit fails.
   *
   * @returns {Promise<void>}
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
   * Creates or updates the draft for the given user.
   * If the incoming `dto.version` differs from the current draft version a
   * ConflictException is thrown to prevent silent overwrites from concurrent devices.
   * Writes to Redis first; if Redis is unavailable the draft is persisted directly
   * to PostgreSQL. On success the database is updated asynchronously in the background.
   *
   * @param {string} userId - The ID of the user who owns the draft.
   * @param {UpsertRecepcionDraftDto} dto - DTO containing the draft payload and optional version for optimistic concurrency.
   * @returns {Promise<RecepcionDraftRecord>} The saved draft record with source indicated (`redis` or `database`).
   * @throws {ConflictException} When `dto.version` does not match the current draft version, indicating a concurrent modification.
   * @example
   * const draft = await this.upsertDraft(userId, { payload: { items: [] }, version: 1 });
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
   * Retrieves the latest draft for a user, preferring Redis over the database.
   * If the draft is found in the database but not in Redis, it is written back to Redis
   * to warm the cache for subsequent reads.
   *
   * @param {string} userId - The ID of the user whose draft should be retrieved.
   * @returns {Promise<RecepcionDraftRecord | null>} The draft record, or `null` if none exists or all copies have expired.
   * @example
   * const draft = await this.getLatestDraft(userId);
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
   * Deletes the draft for a user from both Redis and the database simultaneously.
   * Uses `Promise.allSettled` so a failure in one store does not block the other.
   *
   * @param {string} userId - The ID of the user whose draft should be cleared.
   * @returns {Promise<void>}
   * @example
   * await this.clearDraft(userId);
   */
  async clearDraft(userId: string): Promise<void> {
    await Promise.allSettled([
      this.deleteDraftFromCache(userId),
      this.recepcionDraftRepository.softDelete({ usuarioId: userId }),
    ]);
  }

  /**
   * Builds the Redis cache key for a given user's draft.
   *
   * @param {string} userId - The ID of the user.
   * @returns {string} The namespaced Redis key for the user's draft.
   */
  private buildCacheKey(userId: string): string {
    return `${RECEPCION_DRAFT_CACHE_PREFIX}${userId}`;
  }

  /**
   * Determines whether a draft has passed its expiry time.
   *
   * @param {string | null} expiresAt - ISO 8601 expiry timestamp, or `null` if no expiry is set.
   * @returns {boolean} `true` if the current time is at or past the expiry timestamp.
   */
  private isExpired(expiresAt: string | null): boolean {
    return Boolean(expiresAt && new Date(expiresAt).getTime() <= Date.now());
  }

  /**
   * Reads the user's draft from the Redis cache.
   * Returns `null` if Redis is unavailable, the key does not exist, or the cached draft has expired.
   * Expired entries are deleted from the cache before returning `null`.
   *
   * @param {string} userId - The ID of the user whose draft should be read.
   * @returns {Promise<RecepcionDraftRecord | null>} The cached draft record with `source: 'redis'`, or `null`.
   * @example
   * const cached = await this.getDraftFromCache(userId);
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
   * Serialises and stores the given draft record in Redis with the configured TTL.
   *
   * @param {RecepcionDraftRecord} draft - The draft record to store.
   * @returns {Promise<void>}
   * @throws {Error} When the Redis SET command fails (propagated to the caller for fallback handling).
   * @example
   * await this.saveDraftToCache(nextDraft);
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
   * Deletes the user's draft entry from the Redis cache.
   * Failures are logged as warnings but do not propagate.
   *
   * @param {string} userId - The ID of the user whose cache entry should be deleted.
   * @returns {Promise<void>}
   * @example
   * await this.deleteDraftFromCache(userId);
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
   * Reads the most recently updated draft for a user from PostgreSQL.
   * Returns `null` if no record exists or if the found record has expired (which is then soft-deleted).
   *
   * @param {string} userId - The ID of the user whose draft should be read from the database.
   * @returns {Promise<RecepcionDraftRecord | null>} The database draft record with `source: 'database'`, or `null`.
   * @example
   * const dbDraft = await this.getDraftFromDatabase(userId);
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
   * Persists a draft record to PostgreSQL using an upsert strategy:
   * merges into the existing entity if one is found, or creates a new one.
   * If the existing database record has a higher version than the incoming draft,
   * the existing record is returned without modification (last-write-wins on version).
   *
   * @param {RecepcionDraftRecord} draft - The draft record to persist.
   * @returns {Promise<RecepcionDraftRecord>} The saved (or already-current) draft record with `source: 'database'`.
   * @example
   * const persisted = await this.persistDraftToDatabase(nextDraft);
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
   * Maps a RecepcionDraft TypeORM entity to a plain RecepcionDraftRecord interface object.
   *
   * @param {RecepcionDraft} entity - The entity to map.
   * @param {'redis' | 'database'} source - The storage source to annotate on the record.
   * @returns {RecepcionDraftRecord} The mapped plain record object.
   * @example
   * const record = this.mapEntityToRecord(savedEntity, 'database');
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
