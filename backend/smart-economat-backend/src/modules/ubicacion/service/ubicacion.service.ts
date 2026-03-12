import { I18nHelper } from '../../../common/helpers/i18n.helper';
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
      throw new BadRequestException(
        I18nHelper.getError('YA_EXISTE_UNA_UBICACI_N_CON_ESTE_NOMBRE')
      );
    }

    const nuevaUbicacion = this.ubicacionRepository.create(createUbicacionDto);
    return await this.ubicacionRepository.save(nuevaUbicacion);
  }

  async findAll(): Promise<Ubicacion[]> {
    return this.ubicacionRepository.find({
      order: { nombre: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Ubicacion> {
    const ubicacion = await this.ubicacionRepository.findOne({
      where: { id },
    });
    if (!ubicacion) {
      throw new NotFoundException(
        I18nHelper.getError('UBICACI_N_NO_ENCONTRADA')
      );
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
      throw new NotFoundException(
        I18nHelper.getError('UBICACI_N_NO_ENCONTRADA')
      );
    }
    return await this.ubicacionRepository.recover(ubicacion);
  }
}
