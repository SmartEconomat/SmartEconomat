import { I18nHelper } from '../../../common/helpers/i18n.helper';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Ubicacion } from '../ubicacion.entity/ubicacion.entity';
import { CreateUbicacionDto } from '../dto/create-ubicacion.dto';
import { UpdateUbicacionDto } from '../dto/update-ubicacion.dto';
import { BaseService } from '../../../common/base/base.service';

/**
 * Service responsible for managing warehouse location (Ubicacion) data.
 * Extends BaseService to inherit standard CRUD operations and adds a
 * soft-delete restore capability.
 *
 * @class UbicacionService
 */
@Injectable()
export class UbicacionService extends BaseService<
  Ubicacion,
  CreateUbicacionDto,
  UpdateUbicacionDto
> {
  /**
   * Creates an instance of UbicacionService.
   *
   * @param {Repository<Ubicacion>} repository - TypeORM repository for the Ubicacion entity.
   * @param {DataSource} dataSource - TypeORM data source passed through to BaseService.
   */
  constructor(
    @InjectRepository(Ubicacion)
    repository: Repository<Ubicacion>,
    dataSource: DataSource
  ) {
    super(repository, dataSource);
  }

  /**
   * Returns the localised error message used when a location is not found.
   * This overrides the abstract method from BaseService.
   *
   * @returns {string} Localised "not found" error message key.
   */
  protected getNotFoundMessage(): string {
    return I18nHelper.getError('UBICACI_N_NO_ENCONTRADA');
  }

  /**
   * Restores a soft-deleted Ubicacion record, making it active again.
   *
   * @param {string} id - UUID of the location to restore.
   * @returns {Promise<Ubicacion>} The recovered Ubicacion entity.
   * @throws {NotFoundException} If no location with the given ID exists (including deleted records).
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
