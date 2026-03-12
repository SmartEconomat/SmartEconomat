import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ubicacion } from '../ubicacion.entity/ubicacion.entity';
import { CreateUbicacionDto } from '../dto/create-ubicacion.dto';
import { UpdateUbicacionDto } from '../dto/update-ubicacion.dto';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';

@Injectable()
export class UbicacionService {
  constructor(
    @InjectRepository(Ubicacion)
    private readonly ubicacionRepository: Repository<Ubicacion>
  ) {}

  async create(createUbicacionDto: CreateUbicacionDto): Promise<Ubicacion> {
    const existing = await this.ubicacionRepository.findOne({
      where: { nombre: createUbicacionDto.nombre },
    });
    if (existing) {
      throw new BadRequestException('Ya existe una ubicación con este nombre');
    }

    const nuevaUbicacion = this.ubicacionRepository.create(createUbicacionDto);
    return await this.ubicacionRepository.save(nuevaUbicacion);
  }

  async findAll(
    query: PaginationQueryDto
  ): Promise<PaginatedResponseDto<Ubicacion>> {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 50);
    const sortBy = query.sortBy ?? 'nombre';
    const order = query.order ?? 'ASC';

    const [data, total] = await this.ubicacionRepository.findAndCount({
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

  async findOne(id: string): Promise<Ubicacion> {
    const ubicacion = await this.ubicacionRepository.findOne({
      where: { id },
    });
    if (!ubicacion) {
      throw new NotFoundException('Ubicación no encontrada');
    }
    return ubicacion;
  }

  async update(
    id: string,
    updateUbicacionDto: UpdateUbicacionDto
  ): Promise<Ubicacion> {
    const ubicacion = await this.findOne(id);
    this.ubicacionRepository.merge(ubicacion, updateUbicacionDto);
    return await this.ubicacionRepository.save(ubicacion);
  }

  async remove(id: string): Promise<void> {
    const ubicacion = await this.findOne(id);
    await this.ubicacionRepository.softRemove(ubicacion);
  }

  async restore(id: string): Promise<Ubicacion> {
    const ubicacion = await this.ubicacionRepository.findOne({
      where: { id },
      withDeleted: true,
    });
    if (!ubicacion) {
      throw new NotFoundException('Ubicación no encontrada');
    }
    return await this.ubicacionRepository.recover(ubicacion);
  }
}
