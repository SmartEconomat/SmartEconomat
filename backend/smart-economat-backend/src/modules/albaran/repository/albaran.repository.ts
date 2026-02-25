import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Albaran } from '../albaran.entity/albaran.entity';

@Injectable()
export class AlbaranRepository extends Repository<Albaran> {
  constructor(private dataSource: DataSource) {
    super(Albaran, dataSource.createEntityManager());
  }
}
