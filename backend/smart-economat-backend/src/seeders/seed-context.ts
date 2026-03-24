import { BadRequestException, INestApplicationContext } from '@nestjs/common';
import { Type } from '@nestjs/common/interfaces';
import { plainToInstance, ClassConstructor } from 'class-transformer';
import { validate } from 'class-validator';
import {
  DataSource,
  EntityTarget,
  FindManyOptions,
  FindOneOptions,
  FindOptionsWhere,
  ObjectLiteral,
  QueryRunner,
} from 'typeorm';
import { Usuario } from '../modules/usuario/usuario.entity/usuario.entity';

export class SeedContext {
  constructor(
    public readonly app: INestApplicationContext,
    private readonly dataSource: DataSource
  ) {}

  get<T>(token: Type<T> | string | symbol): T {
    return this.app.get<T>(token);
  }

  getDataSource(): DataSource {
    return this.dataSource;
  }

  getRepository<T extends ObjectLiteral>(entity: EntityTarget<T>) {
    return this.dataSource.getRepository(entity);
  }

  async transaction<T>(
    callback: (queryRunner: QueryRunner) => Promise<T>
  ): Promise<T> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const result = await callback(queryRunner);
      await queryRunner.commitTransaction();
      return result;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async validateDto<T extends object>(
    dtoClass: ClassConstructor<T>,
    payload: unknown
  ): Promise<T> {
    const dto = plainToInstance(dtoClass, payload);
    const errors = await validate(dto as object, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    if (errors.length > 0) {
      const messages = errors.flatMap((error) =>
        Object.values(error.constraints ?? {})
      );
      throw new BadRequestException(
        messages.length > 0
          ? messages.join(' | ')
          : 'Payload de seeder inválido'
      );
    }

    return dto;
  }

  async find<T extends ObjectLiteral>(
    entity: EntityTarget<T>,
    options?: FindManyOptions<T>
  ): Promise<T[]> {
    return this.dataSource.getRepository(entity).find(options);
  }

  async findOne<T extends ObjectLiteral>(
    entity: EntityTarget<T>,
    options: FindOneOptions<T>
  ): Promise<T | null> {
    return this.dataSource.getRepository(entity).findOne(options);
  }

  async count<T extends ObjectLiteral>(
    entity: EntityTarget<T>,
    where?: FindOptionsWhere<T> | FindOptionsWhere<T>[]
  ): Promise<number> {
    return this.dataSource.getRepository(entity).count({ where: where as any });
  }

  async getSeedActorUserId(): Promise<string> {
    const preferredUsernames = ['superAdmin', 'admin'];

    for (const username of preferredUsernames) {
      const user = await this.findOne(Usuario, { where: { username } as any });
      if (user) {
        return user.id;
      }
    }

    const firstUser = await this.findOne(Usuario, {
      where: {} as any,
      order: { createdAt: 'ASC' } as any,
    });

    if (!firstUser) {
      throw new BadRequestException(
        'No existe un usuario actor para ejecutar seeders de dominio'
      );
    }

    return firstUser.id;
  }

  async close(): Promise<void> {
    await this.app.close();
  }
}
