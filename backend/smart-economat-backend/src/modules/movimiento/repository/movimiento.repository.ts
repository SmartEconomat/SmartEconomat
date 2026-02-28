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
    return this.repo.find({
      relations: ['usuario'],
      order: { createdAt: 'DESC' },
    });
  }

  findById(id: string) {
    return this.repo.findOne({
      where: { id },
      relations: ['usuario'],
    });
  }

  updateMovimiento(id: string, data: UpdateMovimientoDto) {
    const updateData: Partial<Movimiento> = {
      ...(data.tipo !== undefined && { tipo: data.tipo }),
      ...(data.cantidad !== undefined && { cantidad: data.cantidad }),
      ...(data.descripcion !== undefined && { descripcion: data.descripcion }),
      ...(data.usuario && { usuario: { id: data.usuario } as any }),
    };
    return this.repo.update(id, updateData);
  }

  deleteMovimiento(id: string) {
    return this.repo.softDelete(id);
  }

  async findMovimientosByEntity(dto: MovimientoHistoryDto) {
    const { entityId, type, startDate, endDate } = dto;

    const query = this.repo
      .createQueryBuilder('movimiento')
      .leftJoinAndSelect('movimiento.usuario', 'usuario')
      .where('movimiento.entidadId = :entityId', { entityId });

    if (type) {
      query.andWhere('movimiento.tipo = :type', { type });
    }

    if (startDate) {
      query.andWhere('movimiento.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('movimiento.createdAt <= :endDate', { endDate });
    }

    query.orderBy('movimiento.createdAt', 'DESC');

    return query.getMany();
  }
}
