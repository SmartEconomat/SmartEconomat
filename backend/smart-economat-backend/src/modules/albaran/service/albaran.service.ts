import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Albaran } from '../albaran.entity/albaran.entity';
import { AlbaranRepository } from '../repository/albaran.repository';
import { CreateAlbaranDto } from '../dto/create-albaran.dto';
import { UpdateAlbaranDto } from '../dto/update-albaran.dto';

@Injectable()
export class AlbaranService {
  constructor(
    @InjectRepository(Albaran)
    private readonly albaranRepository: AlbaranRepository
  ) {}

  async create(createAlbaranDto: CreateAlbaranDto): Promise<Albaran> {
    const albaran = this.albaranRepository.create(createAlbaranDto);
    return this.albaranRepository.save(albaran);
  }

  async findAll(): Promise<Albaran[]> {
    return this.albaranRepository.find();
  }

  async findOne(id: number): Promise<Albaran> {
    const albaran = await this.albaranRepository.findOne({ where: { id } });
    if (!albaran) {
      throw new NotFoundException(`Albaran with ID ${id} not found`);
    }
    return albaran;
  }

  async update(
    id: number,
    updateAlbaranDto: UpdateAlbaranDto
  ): Promise<Albaran> {
    const albaran = await this.findOne(id);
    this.albaranRepository.merge(albaran, updateAlbaranDto);
    return this.albaranRepository.save(albaran);
  }

  async remove(id: number): Promise<void> {
    const result = await this.albaranRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Albaran with ID ${id} not found`);
    }
  }
}
