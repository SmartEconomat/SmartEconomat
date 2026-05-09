import { NotFoundException, ConflictException } from '@nestjs/common';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { PaginationQueryDto } from '../dto/pagination-query.dto';
import { PaginatedResponseDto } from '../dto/paginated-response.dto';
import { DeepPartial } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { BaseEntity } from '../entities/base.entity';
import { isSherlockElevatedRole } from '../../modules/sherlock-auth/utils/access.utils';
import { I18nHelper } from '../helpers/i18n.helper';

/** Clase pública (BaseService). Paquete: smart-economat-backend (Nest). */
export abstract class BaseService<
  T extends BaseEntity,
  CreateDto extends DeepPartial<T> = DeepPartial<T>,
  UpdateDto extends QueryDeepPartialEntity<T> = QueryDeepPartialEntity<T>,
> {
  /**
   * Construye la instancia configurada.
   * @undefined {Repository<T>} repository - Entrada efectiva esperada por el contrato.
   * @undefined {DataSource} dataSource - Entrada efectiva esperada por el contrato.
   */
  constructor(
    protected readonly repository: Repository<T>,
    protected readonly dataSource: DataSource
  ) {}

  /**
   * Expone "findOne" en smart-economat-backend (Nest).
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {string[] | undefined} relations - Entrada efectiva esperada por el contrato.
   * @undefined {string | undefined} _userRole - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<T>} Datos efectivos después de ejecutar la operación.
   */
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

  /**
   * Expone "findAll" en smart-economat-backend (Nest).
   * @undefined {PaginationQueryDto} query - Entrada efectiva esperada por el contrato.
   * @undefined {string[] | undefined} relations - Entrada efectiva esperada por el contrato.
   * @undefined {string | undefined} userRole - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<PaginatedResponseDto<T>>} Datos efectivos después de ejecutar la operación.
   */
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

  /**
   * Crea recursos nuevos en base a las reglas de negocio.
   * @undefined {CreateDto} dto - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<T>} Datos efectivos después de ejecutar la operación.
   */
  async create(dto: CreateDto): Promise<T> {
    const entity = this.repository.create(dto);
    return await this.repository.save(entity);
  }

  /**
   * Persiste modificaciones válidas sobre entidades existentes.
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {UpdateDto} dto - Entrada efectiva esperada por el contrato.
   * @undefined {string[] | undefined} relations - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<T>} Datos efectivos después de ejecutar la operación.
   */
  async update(id: string, dto: UpdateDto, relations?: string[]): Promise<T> {
    await this.findOne(id);
    await this.repository.update(id, dto);
    return this.findOne(id, relations);
  }

  /**
   * Expone "remove" en smart-economat-backend (Nest).
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<void>} Datos efectivos después de ejecutar la operación.
   */
  async remove(id: string): Promise<void> {
    const entity = await this.findOne(id);
    await this.repository.softRemove(entity);
  }

  /**
   * Expone "transactional" en smart-economat-backend (Nest).
   * @undefined {(manager: EntityManager) => Promise<R>} operation - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<R>} Datos efectivos después de ejecutar la operación.
   */
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

  /**
   * Obtiene valores o vistas materializadas.
   * @undefined {string} Datos efectivos después de ejecutar la operación.
   */
  protected abstract getNotFoundMessage(): string;
}
