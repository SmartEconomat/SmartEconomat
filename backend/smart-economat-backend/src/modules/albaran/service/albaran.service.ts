import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Albaran } from '../albaran.entity/albaran.entity';
import { CreateAlbaranDto } from '../dto/create-albaran.dto';
import { UpdateAlbaranDto } from '../dto/update-albaran.dto';
import { I18nHelper } from '../../../common/helpers/i18n.helper';

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

  async findAll(): Promise<Albaran[]> {
    return this.albaranRepository.find({
      relations: ['albaranPedidoRecepcion'],
      order: { fecha: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Albaran> {
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
    const result = await this.albaranRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(I18nHelper.getError('ALBARAN_NOT_FOUND'));
    }
  }
}
