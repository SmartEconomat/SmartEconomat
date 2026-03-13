import { Repository, DataSource, EntityManager, ObjectLiteral } from 'typeorm';
import { ConflictException } from '@nestjs/common';

export abstract class BaseRepository<
  T extends ObjectLiteral,
> extends Repository<T> {
  constructor(entity: any, dataSource: DataSource) {
    super(entity, dataSource.createEntityManager());
  }

  async transactional<R>(
    operation: (manager: EntityManager) => Promise<R>,
    errorHandler?: (error: any) => never
  ): Promise<R> {
    return this.manager.transaction(async (manager) => {
      try {
        return await operation(manager);
      } catch (error) {
        if (errorHandler) {
          errorHandler(error);
        }
        throw new ConflictException(`Transaction failed: ${error.message}`);
      }
    });
  }
}
