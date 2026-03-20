import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Albaran } from '../albaran.entity/albaran.entity';
import { CreateAlbaranDto } from '../dto/create-albaran.dto';
import { UpdateAlbaranDto } from '../dto/update-albaran.dto';
import { I18nHelper } from '../../../common/helpers/i18n.helper';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';

@Injectable()
export class AlbaranService {
  constructor(
    @InjectRepository(Albaran)
    private readonly albaranRepository: Repository<Albaran>
  ) {}

  async create(dto: CreateAlbaranDto): Promise<Albaran> {
    const albaran = this.albaranRepository.create(dto);
    return await this.albaranRepository.save(albaran);
  }

  async findAll(
    query: PaginationQueryDto,
    userRole?: string
  ): Promise<PaginatedResponseDto<Albaran>> {
    const isAdmin =
      userRole?.toUpperCase() === 'ADMIN' ||
      userRole?.toUpperCase() === 'ADMINISTRADOR' ||
      userRole?.toUpperCase() === 'SUPER_ADMIN';
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 50);
    const sortBy = query.sortBy ?? 'fecha';
    const order = query.order ?? 'DESC';

    const [data, total] = await this.albaranRepository.findAndCount({
      relations: ['albaranPedidoRecepcion'],
      withDeleted: isAdmin,
      order: { [sortBy]: order },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async findOne(id: string, _userRole?: string): Promise<Albaran> {
    void _userRole;

    const albaran = await this.albaranRepository.findOne({
      where: { id },
      relations: ['albaranPedidoRecepcion'],
    });

    if (!albaran) {
      throw new NotFoundException(I18nHelper.getError('ALBARAN_NOT_FOUND'));
    }

    return albaran;
  }

  async update(id: string, dto: UpdateAlbaranDto): Promise<Albaran> {
    const albaran = await this.findOne(id);
    this.albaranRepository.merge(albaran, dto);
    return this.albaranRepository.save(albaran);
  }

  async remove(id: string): Promise<void> {
    const albaran = await this.findOne(id);
    await this.albaranRepository.softDelete(albaran.id);
  }
}
