import {
  Repository,
  DataSource,
  EntityManager,
  ObjectLiteral,
  EntityTarget,
} from 'typeorm';
import { ConflictException } from '@nestjs/common';
import { I18nHelper } from '../helpers/i18n.helper';

export abstract class BaseRepository<
  T extends ObjectLiteral,
> extends Repository<T> {
  constructor(entity: EntityTarget<T>, dataSource: DataSource) {
    super(entity, dataSource.createEntityManager());
  }

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
