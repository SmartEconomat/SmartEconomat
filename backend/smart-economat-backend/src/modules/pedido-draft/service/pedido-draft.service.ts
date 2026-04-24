import {
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import Redis from 'ioredis';
import { Repository } from 'typeorm';
import { PedidoDraft } from '../pedido-draft.entity/pedido-draft.entity';
import {
  PEDIDO_DRAFT_CACHE_PREFIX,
  PEDIDO_DRAFT_REDIS,
  PEDIDO_DRAFT_TTL_SECONDS,
} from '../constants/pedido-draft.constants';
import { UpsertPedidoDraftDto } from '../dto/upsert-pedido-draft.dto';
import { PedidoDraftRecord } from '../interfaces/pedido-draft-record.interface';
import { CreatePedidoUsuarioDto } from '../../pedido/dto/pedido-usuario.dto';
import { PedidoUsuario } from '../../pedido/pedido-usuario.entity/pedido-usuario.entity';
import { PedidoUsuarioService } from '../../pedido/service/pedido-usuario.service';

/**
 * Manages order draft persistence using a Redis-first, PostgreSQL-fallback strategy.
 *
 * Drafts are written to Redis with a TTL and asynchronously mirrored to PostgreSQL.
 * On Redis failure, the database acts as the source of truth. Optimistic-concurrency
 * conflicts are detected via a monotonically-increasing `version` field.
 */
@Injectable()
export class PedidoDraftService implements OnModuleDestroy {
  private readonly logger = new Logger(PedidoDraftService.name);

  constructor(
    @InjectRepository(PedidoDraft)
    private readonly pedidoDraftRepository: Repository<PedidoDraft>,
    @Inject(PEDIDO_DRAFT_REDIS)
    private readonly redisClient: Redis,
    @Inject(forwardRef(() => PedidoUsuarioService))
    private readonly pedidoUsuarioService: PedidoUsuarioService
  ) {}

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
   * Creates or updates a draft for the given user.
   *
   * Performs an optimistic-concurrency check: if `dto.version` is provided and
   * does not match the current stored version a {@link ConflictException} is thrown
   * and the existing draft is returned so the caller can resolve the conflict.
   *
   * @param userId - Owner of the draft.
   * @param dto - New payload and optional expected version.
   * @returns The saved draft record (source: 'redis' or 'database').
   * @throws {ConflictException} When the version does not match the stored draft.
   */
  async upsertDraft(
    userId: string,
    dto: UpsertPedidoDraftDto
  ): Promise<PedidoDraftRecord> {
    const currentDraft = await this.getLatestDraft(userId);

    if (
      currentDraft &&
      dto.version !== undefined &&
      dto.version !== currentDraft.version
    ) {
      throw new ConflictException({
        message:
          'El borrador de pedido fue actualizado desde otro dispositivo. Recarga o resuelve el conflicto antes de continuar.',
        draft: currentDraft,
      });
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + PEDIDO_DRAFT_TTL_SECONDS * 1000);

    const nextDraft: PedidoDraftRecord = {
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
        `No se pudo guardar el draft de pedido en Redis para el usuario ${userId}. Se usará PostgreSQL como fallback.`,
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
        `Error al sincronizar el draft de pedido del usuario ${userId} hacia PostgreSQL`,
        error instanceof Error ? error.stack : undefined
      );
    });

    return nextDraft;
  }

  /**
   * Retrieves the most recent valid draft for the user.
   *
   * Checks Redis first; on a cache miss (or Redis error) falls back to PostgreSQL
   * and re-warms the cache. Returns `null` when no non-expired draft exists.
   *
   * @param userId - Owner of the draft.
   */
  async getLatestDraft(userId: string): Promise<PedidoDraftRecord | null> {
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
          `No se pudo recalentar Redis con el draft de pedido del usuario ${userId}`,
          error instanceof Error ? error.stack : undefined
        );
      }
    }

    return fromDatabase;
  }

  /**
   * Removes the draft from both Redis and PostgreSQL (soft-delete in DB).
   * Uses `Promise.allSettled` so a Redis failure does not block the DB delete.
   *
   * @param userId - Owner of the draft.
   */
  async clearDraft(userId: string): Promise<void> {
    await Promise.allSettled([
      this.deleteDraftFromCache(userId),
      this.pedidoDraftRepository.softDelete({ usuarioId: userId }),
    ]);
  }

  /**
   * Finalizes the stored draft as a confirmed order.
   *
   * Reads the latest draft, submits it via {@link PedidoUsuarioService.create},
   * and clears the draft on success. Throws without clearing when the downstream
   * service fails so the draft is preserved for retry.
   *
   * @param userId - Owner of the draft.
   * @throws {NotFoundException} When no draft exists for the user.
   */
  async finalizeOrder(userId: string): Promise<PedidoUsuario> {
    const draft = await this.getLatestDraft(userId);
    if (!draft) {
      throw new NotFoundException(
        'No se encontró un borrador de pedido para finalizar.'
      );
    }

    const dto = draft.payload as unknown as CreatePedidoUsuarioDto;

    try {
      const result = await this.pedidoUsuarioService.create(dto, userId);
      await this.clearDraft(userId);
      return result;
    } catch (error: any) {
      this.logger.error(
        `Error al finalizar el pedido desde el draft para el usuario ${userId}: ${error.message}`,
        error instanceof Error ? error.stack : undefined
      );
      throw error;
    }
  }

  /**
   * Guarda los datos como borrador y luego intenta finalizar.
   * Si falla, los datos ya están persistidos en Redis/DB como borrador.
   */
  async saveAndFinalize(
    userId: string,
    dto: CreatePedidoUsuarioDto
  ): Promise<PedidoUsuario> {
    await this.upsertDraft(userId, {
      payload: dto as any,
    });

    try {
      const result = await this.pedidoUsuarioService.create(dto, userId);

      await this.clearDraft(userId);
      return result;
    } catch (error) {
      this.logger.error(
        `Fallo al crear pedido para el usuario ${userId}. Los datos se mantienen en el borrador por seguridad.`,
        error instanceof Error ? error.stack : undefined
      );
      throw error;
    }
  }

  private buildCacheKey(userId: string): string {
    return `${PEDIDO_DRAFT_CACHE_PREFIX}${userId}`;
  }

  private isExpired(expiresAt: string | null): boolean {
    return Boolean(expiresAt && new Date(expiresAt).getTime() <= Date.now());
  }

  private async getDraftFromCache(
    userId: string
  ): Promise<PedidoDraftRecord | null> {
    try {
      const cachedDraft = await this.redisClient.get(
        this.buildCacheKey(userId)
      );
      if (!cachedDraft) {
        return null;
      }

      const parsed = JSON.parse(cachedDraft) as PedidoDraftRecord;
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
        `Redis no disponible al leer el draft de pedido del usuario ${userId}`,
        error instanceof Error ? error.stack : undefined
      );
      return null;
    }
  }

  private async saveDraftToCache(draft: PedidoDraftRecord): Promise<void> {
    await this.redisClient.set(
      this.buildCacheKey(draft.userId),
      JSON.stringify(draft),
      'EX',
      PEDIDO_DRAFT_TTL_SECONDS
    );
  }

  private async deleteDraftFromCache(userId: string): Promise<void> {
    try {
      await this.redisClient.del(this.buildCacheKey(userId));
    } catch (error) {
      this.logger.warn(
        `Redis no disponible al eliminar el draft de pedido del usuario ${userId}`,
        error instanceof Error ? error.stack : undefined
      );
    }
  }

  private async getDraftFromDatabase(
    userId: string
  ): Promise<PedidoDraftRecord | null> {
    const draftEntity = await this.pedidoDraftRepository.findOne({
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
      await this.pedidoDraftRepository.softDelete({ id: draftEntity.id });
      return null;
    }

    return this.mapEntityToRecord(draftEntity, 'database');
  }

  private async persistDraftToDatabase(
    draft: PedidoDraftRecord
  ): Promise<PedidoDraftRecord> {
    const currentEntity = await this.pedidoDraftRepository.findOne({
      where: { usuarioId: draft.userId },
      order: { updatedAt: 'DESC' },
    });

    if (currentEntity && currentEntity.draftVersion > draft.version) {
      return this.mapEntityToRecord(currentEntity, 'database');
    }

    const entity = currentEntity
      ? this.pedidoDraftRepository.merge(currentEntity, {
          payload: draft.payload,
          draftVersion: draft.version,
          expiresAt: draft.expiresAt ? new Date(draft.expiresAt) : null,
          deletedAt: null,
          deletedBy: null,
        })
      : this.pedidoDraftRepository.create({
          usuarioId: draft.userId,
          payload: draft.payload,
          draftVersion: draft.version,
          expiresAt: draft.expiresAt ? new Date(draft.expiresAt) : null,
        });

    const saved = await this.pedidoDraftRepository.save(entity);
    return this.mapEntityToRecord(saved, 'database');
  }

  private mapEntityToRecord(
    entity: PedidoDraft,
    source: 'redis' | 'database'
  ): PedidoDraftRecord {
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
