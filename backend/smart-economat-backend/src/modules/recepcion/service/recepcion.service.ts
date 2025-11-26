import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RecepcionRepository } from '../repository/recepcion.repository';
import { CreateRecepcionDto } from '../dto/create-recepcion.dto';
import { UpdateRecepcionDto } from '../dto/update-recepcion.dto';
import { Recepcion } from '../recepcion.entity/recepcion.entity';

@Injectable()
export class RecepcionService {
  constructor(
    @InjectRepository(RecepcionRepository)
    private recepcionRepository: RecepcionRepository
  ) {}

  async create(createRecepcionDto: CreateRecepcionDto): Promise<Recepcion> {
    const recepcion = this.recepcionRepository.create({
      ...createRecepcionDto,
      usuario: { id: createRecepcionDto.idUsuarioReceptor } as any,
    });
    return await this.recepcionRepository.save(recepcion);
  }

  async findAll(): Promise<Recepcion[]> {
    return await this.recepcionRepository.find({
      relations: ['usuario'],
    });
  }

  async findOne(id: number): Promise<Recepcion> {
    const recepcion = await this.recepcionRepository.findOne({
      where: { id },
      relations: ['usuario'],
    });

    if (!recepcion) {
      throw new NotFoundException(`Recepción con ID ${id} no encontrada`);
    }

    return recepcion;
  }

  async update(
    id: number,
    updateRecepcionDto: UpdateRecepcionDto
  ): Promise<Recepcion> {
    const recepcion = await this.findOne(id);

    Object.assign(recepcion, updateRecepcionDto);

    return await this.recepcionRepository.save(recepcion);
  }

  async remove(id: number): Promise<void> {
    const result = await this.recepcionRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Recepción con ID ${id} no encontrada`);
    }
  }
}
