import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Preparacion } from '../preparacion.entity/preparacion.entity';
import { CreatePreparacionDto } from '../dto/create-preparacion.dto';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';
import { I18nHelper } from '../../../common/helpers/i18n.helper';
import { UpdatePreparacionDto } from '../dto/update-preparacion.dto';

@Injectable()
export class PreparacionRepository {
  constructor(
    @InjectRepository(Preparacion)
    private readonly preparacionRepo: Repository<Preparacion>,
    private readonly dataSource: DataSource
  ) {}

  async create(
    dto: CreatePreparacionDto,
    userId: string
  ): Promise<Preparacion> {
    const preparacion = this.preparacionRepo.create({
      ...dto,
      usuarioId: userId,
      fechaProgramada: dto.fechaProgramada
        ? new Date(dto.fechaProgramada)
        : null,
    });
    return this.preparacionRepo.save(preparacion);
  }

  async findAllPaginated(
    query: PaginationQueryDto,
    userRole?: string
  ): Promise<PaginatedResponseDto<Preparacion>> {
    const isAdmin =
      userRole?.toUpperCase() === 'ADMIN' ||
      userRole?.toUpperCase() === 'SUPER_ADMIN';
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 50);
    const sortBy = query.sortBy ?? 'createdAt';
    const order = query.order ?? 'DESC';

    const [data, total] = await this.preparacionRepo.findAndCount({
      relations: ['receta', 'usuario'],
      order: { [sortBy]: order },
      skip: (page - 1) * limit,
      take: limit,
      withDeleted: isAdmin,
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async findById(id: string, userRole?: string): Promise<Preparacion | null> {
    const isAdmin =
      userRole?.toUpperCase() === 'ADMIN' ||
      userRole?.toUpperCase() === 'SUPER_ADMIN';

    return this.preparacionRepo.findOne({
      where: { id },
      relations: [
        'receta',
        'receta.ingredientes',
        'receta.ingredientes.producto',
        'usuario',
      ],
      withDeleted: isAdmin,
    });
  }

  async update(id: string, dto: UpdatePreparacionDto): Promise<Preparacion> {
    await this.preparacionRepo.update(id, {
      ...dto,
      ...(dto.fechaProgramada && {
        fechaProgramada: new Date(dto.fechaProgramada),
      }),
      ...(dto.fechaInicio && { fechaInicio: new Date(dto.fechaInicio) }),
      ...(dto.fechaFinalizacion && {
        fechaFinalizacion: new Date(dto.fechaFinalizacion),
      }),
    });

    const updated = await this.findById(id);
    if (!updated) {
      throw new NotFoundException(I18nHelper.getError('PREPARACION_NOT_FOUND'));
    }
    return updated;
  }

  async remove(id: string): Promise<void> {
    const result = await this.preparacionRepo.softDelete(id);
    if (result.affected === 0) {
      throw new NotFoundException(I18nHelper.getError('PREPARACION_NOT_FOUND'));
    }
  }

  async save(preparacion: Preparacion): Promise<Preparacion> {
    return this.preparacionRepo.save(preparacion);
  }
}
