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

/**
 * Servicio para la gestión de permisos del sistema.
 * CRUD completo de permisos dinámicos.
 */
@Injectable()
export class PermisosService {
  constructor(
    @InjectRepository(Permiso)
    private readonly permisoRepo: Repository<Permiso>
  ) {}

  /**
   * Crear un nuevo permiso
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
   * Crear múltiples permisos en batch (útil para seeders)
   */
  async createMany(dtos: CreatePermisoDto[]): Promise<Permiso[]> {
    const permisos = dtos.map((dto) => this.permisoRepo.create(dto));
    return this.permisoRepo.save(permisos);
  }

  /**
   * Listar todos los permisos con paginación
   */
  async findAll(
    query: PaginationQueryDto
  ): Promise<PaginatedResponseDto<Permiso>> {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 10, 50);
    const sortBy = query.sortBy ?? 'modulo';
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
   * Obtener todos los permisos sin paginación (para selectores)
   */
  async findAllNoPagination(): Promise<Permiso[]> {
    return this.permisoRepo.find({
      where: { activo: true },
      order: { modulo: 'ASC', accion: 'ASC' },
    });
  }

  /**
   * Obtener permisos agrupados por módulo
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
   * Obtener un permiso por ID
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
   * Obtener un permiso por código
   */
  async findByCodigo(codigo: string): Promise<Permiso | null> {
    return this.permisoRepo.findOne({ where: { codigo } });
  }

  /**
   * Obtener múltiples permisos por sus códigos
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
   * Actualizar un permiso
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
   * Eliminar un permiso (soft delete)
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
