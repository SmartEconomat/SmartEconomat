import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permiso } from '../permiso.entity/permiso.entity';
import { CreatePermisoDto } from '../dto/create-permiso.dto';
import { I18nHelper } from '../../../common/helpers/i18n.helper';
import { UpdatePermisoDto } from '../dto/update-permiso.dto';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';
import { SORTABLE_FIELDS } from '../../../common/constants/sortable-fields.constants';

/**
 * Servicio de dominio para permisos.
 */
@Injectable()
export class PermisosService {
  /**
   * Construye la instancia configurada.
   * @undefined {Repository<Permiso>} permisoRepo - Entrada efectiva esperada por el contrato.
   */
  constructor(
    @InjectRepository(Permiso)
    private readonly permisoRepo: Repository<Permiso>
  ) {}

  /**
   * Crea create.
   *
   * @param dto Parámetro de entrada para la operación.
   * @returns Valor resultante de la operación.
   */
  async create(dto: CreatePermisoDto): Promise<Permiso> {
    const existente = await this.permisoRepo.findOne({
      where: { codigo: dto.codigo },
    });

    if (existente) {
      throw new ConflictException(
        `Ya existe un permiso con el código "${dto.codigo}"`
      );
    }

    const permiso = this.permisoRepo.create(dto);
    return this.permisoRepo.save(permiso);
  }

  /**
   * Crea many.
   *
   * @param dtos Parámetro de entrada para la operación.
   * @returns Valor resultante de la operación.
   */
  async createMany(dtos: CreatePermisoDto[]): Promise<Permiso[]> {
    const permisos = dtos.map((dto) => this.permisoRepo.create(dto));
    return this.permisoRepo.save(permisos);
  }

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Expone "findAll" en smart-economat-backend (Nest).
   * @undefined {PaginationQueryDto} query - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<PaginatedResponseDto<Permiso>>} Datos efectivos después de ejecutar la operación.
   */
  async findAll(
    query: PaginationQueryDto
  ): Promise<PaginatedResponseDto<Permiso>> {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 10, 50);
    const requestedSort = query.sortBy ?? 'modulo';
    const sortBy = SORTABLE_FIELDS.permisos.includes(requestedSort)
      ? requestedSort
      : 'modulo';
    const order = query.order ?? 'ASC';

    const [data, total] = await this.permisoRepo.findAndCount({
      order: { [sortBy]: order },
      skip: (page - 1) * limit,
      take: limit,
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
   * Busca all no pagination.
   * @returns Valor resultante de la operación.
   */
  /**
   * Expone "findAllNoPagination" en smart-economat-backend (Nest).
   * @undefined {Promise<Permiso[]>} Datos efectivos después de ejecutar la operación.
   */
  async findAllNoPagination(): Promise<Permiso[]> {
    return this.permisoRepo.find({
      where: { activo: true },
      order: { modulo: 'ASC', accion: 'ASC' },
    });
  }

  /**
   * Busca grouped by module.
   * @returns Valor resultante de la operación.
   */
  /**
   * Expone "findGroupedByModule" en smart-economat-backend (Nest).
   * @undefined {Promise<Record<string, Permiso[]>>} Datos efectivos después de ejecutar la operación.
   */
  async findGroupedByModule(): Promise<Record<string, Permiso[]>> {
    const permisos = await this.permisoRepo.find({
      where: { activo: true },
      order: { modulo: 'ASC', accion: 'ASC' },
    });

    return permisos.reduce(
      (acc, permiso) => {
        if (!acc[permiso.modulo]) {
          acc[permiso.modulo] = [];
        }
        acc[permiso.modulo].push(permiso);
        return acc;
      },
      {} as Record<string, Permiso[]>
    );
  }

  /**
   * Busca one.
   *
   * @param id Parámetro de entrada para la operación.
   * @returns Valor resultante de la operación.
   */
  async findOne(id: string): Promise<Permiso> {
    const permiso = await this.permisoRepo.findOne({ where: { id } });

    if (!permiso) {
      throw new NotFoundException(
        I18nHelper.getError('PERMISSION_NOT_FOUND', { id })
      );
    }

    return permiso;
  }

  /**
   * Busca by codigo.
   *
   * @param codigo Parámetro de entrada para la operación.
   * @returns Valor resultante de la operación.
   */
  async findByCodigo(codigo: string): Promise<Permiso | null> {
    return this.permisoRepo.findOne({ where: { codigo } });
  }

  /**
   * Busca by codigos.
   *
   * @param codigos Parámetro de entrada para la operación.
   * @returns Valor resultante de la operación.
   */
  async findByCodigos(codigos: string[]): Promise<Permiso[]> {
    if (!codigos || codigos.length === 0) {
      return [];
    }

    return this.permisoRepo
      .createQueryBuilder('permiso')
      .where('permiso.codigo IN (:...codigos)', { codigos })
      .getMany();
  }

  /**
   * Actualiza update.
   *
   * @param id Parámetro de entrada para la operación.
   * @param dto Parámetro de entrada para la operación.
   * @returns Valor resultante de la operación.
   */
  async update(id: string, dto: UpdatePermisoDto): Promise<Permiso> {
    const permiso = await this.findOne(id);

    if (dto.codigo && dto.codigo !== permiso.codigo) {
      const existente = await this.permisoRepo.findOne({
        where: { codigo: dto.codigo },
      });

      if (existente) {
        throw new ConflictException(
          `Ya existe un permiso con el código "${dto.codigo}"`
        );
      }
    }

    Object.assign(permiso, dto);
    return this.permisoRepo.save(permiso);
  }

  /**
   * Elimina remove.
   *
   * @param id Parámetro de entrada para la operación.
   * @returns Valor resultante de la operación.
   */
  async remove(id: string): Promise<void> {
    const rolesCount = await this.permisoRepo
      .createQueryBuilder('permiso')
      .leftJoin('permiso.roles', 'rol')
      .where('permiso.id = :id', { id })
      .select('COUNT(DISTINCT rol.id)', 'count')
      .getRawOne<{ count: string }>();

    const count = parseInt((rolesCount?.count as string) || '0', 10);

    if (count > 0) {
      throw new BadRequestException(
        `No se puede eliminar el permiso. Está siendo usado por ${count} rol(es)`
      );
    }

    await this.permisoRepo.softDelete(id);
  }
}
