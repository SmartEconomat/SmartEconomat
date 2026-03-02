import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { IncidenciaResuelta } from '../incidencia-resuelta.entity/incidencia-resuelta.entity';

@Injectable()
export class IncidenciaResuelaRepository extends Repository<IncidenciaResuelta> {
  constructor(private dataSource: DataSource) {
    super(IncidenciaResuelta, dataSource.createEntityManager());
  }

  findByIncidencia(idIncidencia: string): Promise<IncidenciaResuelta | null> {
    return this.findOne({
      where: { incidencia: { id: idIncidencia } },
      relations: ['incidencia', 'usuarioResolutor'],
    });
  }
}
