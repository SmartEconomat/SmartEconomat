import { Injectable, NotFoundException } from '@nestjs/common';
import { Receta } from '../receta.entity/receta.entity';
import { RecetaRepository } from '../repository/receta.repository';
import { CreateRecetaDto } from '../dto/create-receta.dto';
import { UpdateRecetaDto } from '../dto/update-receta.dto';
import { I18nHelper } from '../../../common/helpers/i18n.helper';

@Injectable()
export class RecetaService {
  constructor(private readonly recetaRepository: RecetaRepository) {}

  async create(createRecetaDto: CreateRecetaDto): Promise<Receta> {
    return this.recetaRepository.create(createRecetaDto);
  }

  async findAll(): Promise<Receta[]> {
    return this.recetaRepository.findAll();
  }

  async findOne(id: string): Promise<Receta> {
    const receta = await this.recetaRepository.findById(id);

    if (!receta) {
      throw new NotFoundException(I18nHelper.getError('RECIPE_NOT_FOUND'));
    }

    return receta;
  }

  async update(id: string, updateRecetaDto: UpdateRecetaDto): Promise<Receta> {
    await this.findOne(id);
    return this.recetaRepository.update(id, updateRecetaDto);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.recetaRepository.remove(id);
  }
}
