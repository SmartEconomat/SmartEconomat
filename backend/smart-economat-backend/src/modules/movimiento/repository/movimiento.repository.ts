import { Repository } from 'typeorm';
import { Movimiento } from '../movimiento.entity/movimiento.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateMovimientoDto } from '../dto/create-movimiento.dto';
import { UpdateMovimientoDto } from '../dto/update-movimiento.dto';
import { MovimientoHistoryDto } from '../dto/movimiento-history.dto';

export class MovimientoRepository {
  constructor(
    @InjectRepository(Movimiento)
    private readonly repo: Repository<Movimiento>
  ) {}

  createMovimiento(data: CreateMovimientoDto) {
    const movimientoData = {
      ...data,
      usuario: { id: data.usuario },
      inventario: { id: data.inventario },
    };
    return this.repo.save(this.repo.create(movimientoData as any));
  }

  findAll() {
    return this.repo.find({ relations: ['usuario', 'inventario'] });
  }

  findById(id: number) {
    return this.repo.findOne({
      where: { id },
      relations: ['usuario', 'inventario'],
    });
  }

  updateMovimiento(id: number, data: UpdateMovimientoDto) {
    const movimientoData = {
      ...data,
      ...(data.usuario && { usuario: { id: data.usuario } }),
      ...(data.inventario && { inventario: { id: data.inventario } }),
    };
    return this.repo.update(id, movimientoData as any);
  }

  deleteMovimiento(id: number) {
    return this.repo.softDelete(id);
  }

  async findMovimientosByEntity(dto: MovimientoHistoryDto) {
    const { entityId, type, startDate, endDate } = dto;

    const query = this.repo
      .createQueryBuilder('movimiento')
      .leftJoinAndSelect('movimiento.usuario', 'usuario')
      .leftJoinAndSelect('movimiento.inventario', 'inventario')
      .where('movimiento.entidadId = :entityId', { entityId });

    if (type) {
      query.andWhere('movimiento.tipo = :type', { type });
    }

    if (startDate) {
      query.andWhere('movimiento.fecha >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('movimiento.fecha <= :endDate', { endDate });
    }

    query.orderBy('movimiento.fecha', 'DESC');

    return query.getMany();
  }
}
