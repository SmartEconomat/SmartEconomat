import { I18nHelper } from '../../../common/helpers/i18n.helper';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Ubicacion } from '../ubicacion.entity/ubicacion.entity';
import { CreateUbicacionDto } from '../dto/create-ubicacion.dto';
import { UpdateUbicacionDto } from '../dto/update-ubicacion.dto';
import { BaseService } from '../../../common/base/base.service';

/**
 * Documentación en español.
 */
@Injectable()
export class UbicacionService extends BaseService<
  Ubicacion,
  CreateUbicacionDto,
  UpdateUbicacionDto
> {
  /**
   * Documentación en español.
   */
  constructor(
    @InjectRepository(Ubicacion)
    repository: Repository<Ubicacion>,
    dataSource: DataSource
  ) {
    super(repository, dataSource);
  }

  /**
   * Documentación en español.
   */
  protected getNotFoundMessage(): string {
    return I18nHelper.getError('LOCATION_NOT_FOUND');
  }

  /**
   * Documentación en español.
   */
  async restore(id: string): Promise<Ubicacion> {
    const ubicacion = await this.repository.findOne({
      where: { id } as any,
      withDeleted: true,
    });
    if (!ubicacion) {
      throw new NotFoundException(this.getNotFoundMessage());
    }
    return await this.repository.recover(ubicacion);
  }
}
