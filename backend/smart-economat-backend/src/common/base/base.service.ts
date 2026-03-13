import { NotFoundException, ConflictException } from '@nestjs/common';
import { Repository, DataSource, EntityManager, ObjectLiteral } from 'typeorm';
import { PaginationQueryDto } from '../dto/pagination-query.dto';
import { PaginatedResponseDto } from '../dto/paginated-response.dto';

export abstract class BaseService<
  T extends ObjectLiteral,
  CreateDto = any,
  UpdateDto = any,
> {
  constructor(
    protected readonly repository: Repository<T>,
    protected readonly dataSource: DataSource
  ) {}

  async findOne(id: string, relations?: string[]): Promise<T> {
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
    relations?: string[]
  ): Promise<PaginatedResponseDto<T>> {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const [data, total] = await this.repository.findAndCount({
      relations,
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
    const entity = this.repository.create(dto as any);
    return (await this.repository.save(entity as any)) as T;
  }

  async update(id: string, dto: UpdateDto, relations?: string[]): Promise<T> {
    await this.findOne(id);
    await this.repository.update(id, dto as any);
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
        throw new ConflictException(`Transaction failed: ${error.message}`);
      }
    });
  }

  protected abstract getNotFoundMessage(): string;
}
