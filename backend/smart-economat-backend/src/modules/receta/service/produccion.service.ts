import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProduccionLote } from '../produccion-lote.entity/produccion-lote.entity';
import { EjecutarProduccionDto } from '../dto/ejecutar-produccion.dto';
import { Receta } from '../receta.entity/receta.entity';

@Injectable()
export class ProduccionService {
  constructor(
    @InjectRepository(ProduccionLote)
    private readonly produccionRepo: Repository<ProduccionLote>,
    @InjectRepository(Receta)
    private readonly recetaRepo: Repository<Receta>
  ) {}

  async ejecutarProduccion(
    dto: EjecutarProduccionDto,
    userId: string
  ): Promise<ProduccionLote> {
    const receta = await this.recetaRepo.findOne({
      where: { id: dto.recetaId },
    });
    if (!receta) throw new NotFoundException('Receta no encontrada');

    const lote = this.produccionRepo.create({
      receta,
      cantidad: dto.cantidadProducida,
      responsable: { id: userId } as any,
      fechaProduccion: new Date(),
    });
    return this.produccionRepo.save(lote);
  }

  async findAll(): Promise<ProduccionLote[]> {
    return this.produccionRepo.find({
      relations: ['receta', 'responsable'],
    });
  }

  async findOne(id: string): Promise<ProduccionLote> {
    const result = await this.produccionRepo.findOne({
      where: { id },
      relations: ['receta', 'responsable'],
    });
    if (!result) throw new NotFoundException('Lote no encontrado');
    return result;
  }
}
