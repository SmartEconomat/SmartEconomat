import {
  Repository,
  DataSource,
  EntityManager,
  ObjectLiteral,
  EntityTarget,
} from 'typeorm';
import { ConflictException } from '@nestjs/common';
import { I18nHelper } from '../helpers/i18n.helper';

/** Clase pública (BaseRepository). Paquete: smart-economat-backend (Nest). */
export abstract class BaseRepository<
  T extends ObjectLiteral,
> extends Repository<T> {
  /**
   * Construye la instancia configurada.
   * @undefined {EntityTarget<T>} entity - Entrada efectiva esperada por el contrato.
   * @undefined {DataSource} dataSource - Entrada efectiva esperada por el contrato.
   */
  constructor(entity: EntityTarget<T>, dataSource: DataSource) {
    super(entity, dataSource.createEntityManager());
  }

  /**
   * Expone "transactional" en smart-economat-backend (Nest).
   * @undefined {(manager: EntityManager) => Promise<R>} operation - Entrada efectiva esperada por el contrato.
   * @undefined {((error: unknown) => never) | undefined} errorHandler - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<R>} Datos efectivos después de ejecutar la operación.
   */
  async transactional<R>(
    operation: (manager: EntityManager) => Promise<R>,
    errorHandler?: (error: unknown) => never
  ): Promise<R> {
    return this.manager.transaction(async (manager) => {
      try {
        return await operation(manager);
      } catch (error: unknown) {
        if (errorHandler) {
          errorHandler(error);
        }
        throw new ConflictException(
          I18nHelper.getError('TRANSACTION_FAILED', {
            message: (error as any).message,
          })
        );
      }
    });
  }
}
