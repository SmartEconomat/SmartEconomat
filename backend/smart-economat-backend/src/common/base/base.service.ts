import { NotFoundException, ConflictException } from '@nestjs/common';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { PaginationQueryDto } from '../dto/pagination-query.dto';
import { PaginatedResponseDto } from '../dto/paginated-response.dto';
import { DeepPartial } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { BaseEntity } from '../entities/base.entity';
import { isSherlockElevatedRole } from '../../modules/sherlock-auth/utils/access.utils';
import { I18nHelper } from '../helpers/i18n.helper';

export abstract class BaseService<
  T extends BaseEntity,
  CreateDto extends DeepPartial<T> = DeepPartial<T>,
  UpdateDto extends QueryDeepPartialEntity<T> = QueryDeepPartialEntity<T>,
> {
  constructor(
    protected readonly repository: Repository<T>,
    protected readonly dataSource: DataSource
  ) {}

  async findOne(
    id: string,
    relations?: string[],
    _userRole?: string
  ): Promise<T> {
    void _userRole;

    const entity = await this.repository.findOne({
      where: { id } as any,
      relations,
    });
    if (!entity) {
      throw new NotFoundException(this.getNotFoundMessage());
    }
    return entity;
  }

  async findAll(
    query: PaginationQueryDto,
    relations?: string[],
    userRole?: string
  ): Promise<PaginatedResponseDto<T>> {
    const isAdmin = isSherlockElevatedRole(userRole);
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const [data, total] = await this.repository.findAndCount({
      relations,
      withDeleted: isAdmin,
      skip: (page - 1) * limit,
      take: limit,
      order: { id: 'DESC' } as any,
    });
    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async create(dto: CreateDto): Promise<T> {
    const entity = this.repository.create(dto);
    return await this.repository.save(entity);
  }

  async update(id: string, dto: UpdateDto, relations?: string[]): Promise<T> {
    await this.findOne(id);
    await this.repository.update(id, dto);
    return this.findOne(id, relations);
  }

  async remove(id: string): Promise<void> {
    const entity = await this.findOne(id);
    await this.repository.softRemove(entity);
  }

  async transactional<R>(
    operation: (manager: EntityManager) => Promise<R>
  ): Promise<R> {
    return this.dataSource.transaction(async (manager) => {
      try {
        return await operation(manager);
      } catch (error) {
        throw new ConflictException(
          I18nHelper.getError('TRANSACTION_FAILED', { message: error.message })
        );
      }
    });
  }

  protected abstract getNotFoundMessage(): string;
}
