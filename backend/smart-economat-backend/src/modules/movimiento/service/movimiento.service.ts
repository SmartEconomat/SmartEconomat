import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Movimiento } from '../movimiento.entity/movimiento.entity';
import { MovimientoRepository } from '../repository/movimiento.repository';
import { CreateMovimientoDto } from '../dto/create-movimiento.dto';
import { UpdateMovimientoDto } from '../dto/update-movimiento.dto';

@Injectable()
export class MovimientoService {
  constructor(
    @InjectRepository(Movimiento)
    private readonly movimientoRepository: MovimientoRepository
  ) {}

  async create(createMovimientoDto: CreateMovimientoDto): Promise<Movimiento> {
    const { usuarioId, ...movimientoData } = createMovimientoDto;
    const movimiento = this.movimientoRepository.create({
      ...movimientoData,
      usuario: { id: usuarioId } as any,
    });
    return this.movimientoRepository.save(movimiento);
  }

  async findAll(): Promise<Movimiento[]> {
    return this.movimientoRepository.find();
  }

  async findOne(id: number): Promise<Movimiento> {
    const movimiento = await this.movimientoRepository.findOne({
      where: { id },
    });
    if (!movimiento) {
      throw new NotFoundException(`Movimiento with ID ${id} not found`);
    }
    return movimiento;
  }

  async update(
    id: number,
    updateMovimientoDto: UpdateMovimientoDto
  ): Promise<Movimiento> {
    const movimiento = await this.findOne(id);
    this.movimientoRepository.merge(movimiento, updateMovimientoDto);
    return this.movimientoRepository.save(movimiento);
  }

  async remove(id: number): Promise<void> {
    const result = await this.movimientoRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Movimiento with ID ${id} not found`);
    }
  }
}
