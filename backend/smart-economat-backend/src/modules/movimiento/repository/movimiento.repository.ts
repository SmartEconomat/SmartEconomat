import { Repository } from 'typeorm';
import { Movimiento } from '../movimiento.entity/movimiento.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateMovimientoDto } from '../dto/create-movimiento.dto';
export class MovimientoRepository {
  constructor(
    @InjectRepository(Movimiento)
    private readonly repo: Repository<Movimiento>
  ) {}

  createMovimiento(data: CreateMovimientoDto) {
    return this.repo.save(this.repo.create(data));
  }

  findAll() {
    return this.repo.find({ relations: ['usuario'] });
  }

  findById(id: number) {
    return this.repo.findOne({ where: { id }, relations: ['usuario'] });
  }

  updateMovimiento(id: number, data: Partial<Movimiento>) {
    return this.repo.update(id, data);
  }

  deleteMovimiento(id: number) {
    return this.repo.delete(id);
  }
}
