import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Incidencia } from '../incidencia.entity/incidencia.entity';

@Injectable()
export class IncidenciaRepository extends Repository<Incidencia> {
  constructor(private dataSource: DataSource) {
    super(Incidencia, dataSource.createEntityManager());
  }

  findOneWithRelations(id: string): Promise<Incidencia | null> {
    return this.findOne({
      where: { id },
      relations: [
        'recepcion',
        'pedido',
        'usuarioResolutor',
        'lineas',
        'lineas.pedidoProducto',
      ],
    });
  }

  findAllWithRelations(): Promise<Incidencia[]> {
    return this.find({
      relations: ['recepcion', 'pedido', 'usuarioResolutor', 'lineas'],
      order: { createdAt: 'DESC' },
    });
  }
}
