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
 * Servicio encargado de gestionar los borradores (drafts) de recepción de mercancía.
 * Implementa una estrategia de persistencia dual: caché rápida en Redis y persistencia
 * duradera en PostgreSQL como fallback y sincronización.
 */
@Injectable()
export class RecepcionDraftService implements OnModuleDestroy {
  private readonly logger = new Logger(RecepcionDraftService.name);

  /**
  /**
   * Crea una instancia de RecepcionDraftService.
   * @param recepcionDraftRepository Repositorio para persistencia en PostgreSQL.
   * @param redisClient Cliente de Redis para acceso rápido.
   */
  constructor(
    @InjectRepository(RecepcionDraft)
    private readonly recepcionDraftRepository: Repository<RecepcionDraft>,
    @Inject(RECEPCION_DRAFT_REDIS)
    private readonly redisClient: Redis
  ) {}

  /**
  /**
   * Cierra las conexiones activas de Redis al destruir el módulo.
   */
  /**
   * Expone "onModuleDestroy" en smart-economat-backend (Nest).
   * @undefined {Promise<void>} Datos efectivos después de ejecutar la operación.
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
  /**
   * Crea o actualiza un borrador de recepción para un usuario.
   * Gestiona el versionado para evitar sobrescrituras accidentales (concurrencia).
   * 
   * @param userId ID del usuario propietario del borrador.
   * @param dto Datos del borrador (payload JSON).
   * @returns El registro del borrador creado/actualizado.
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
  /**
   * Obtiene el borrador más reciente de un usuario, priorizando la caché de Redis.
   * Si no está en caché, lo recupera de la base de datos y recalienta la caché.
   * 
   * @param userId ID del usuario.
   * @returns El borrador encontrado o null si no existe o ha expirado.
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
  /**
   * Elimina de forma lógica y física el borrador de un usuario en todos los niveles de persistencia.
   * @param userId ID del usuario.
   */
  /**
   * Expone "clearDraft" en smart-economat-backend (Nest).
   * @undefined {string} userId - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<void>} Datos efectivos después de ejecutar la operación.
   */
  async clearDraft(userId: string): Promise<void> {
    await Promise.allSettled([
      this.deleteDraftFromCache(userId),
      this.recepcionDraftRepository.softDelete({ usuarioId: userId }),
    ]);
  }

  /**
  /**
   * Construye la clave única de Redis para el borrador del usuario.
   */
  private buildCacheKey(userId: string): string {
    return `${RECEPCION_DRAFT_CACHE_PREFIX}${userId}`;
  }

  /**
  /**
   * Verifica si la fecha de expiración de un borrador ha sido alcanzada.
   */
  private isExpired(expiresAt: string | null): boolean {
    return Boolean(expiresAt && new Date(expiresAt).getTime() <= Date.now());
  }

  /**
  /**
   * Recupera el borrador directamente desde Redis.
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
  /**
   * Guarda el borrador en la caché de Redis con un tiempo de vida (TTL) definido.
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
  /**
   * Elimina la clave del borrador en Redis.
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
  /**
   * Recupera el borrador persistido en la base de datos PostgreSQL.
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
  /**
   * Sincroniza el estado del borrador hacia la base de datos.
   * Implementa una guarda de versión para no sobrescribir datos más recientes en la DB.
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
  /**
   * Mapea una entidad RecepcionDraft a una interfaz de registro normalizada.
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
