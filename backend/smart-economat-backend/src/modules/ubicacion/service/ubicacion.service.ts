import { I18nHelper } from '../../../common/helpers/i18n.helper';
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Ubicacion } from '../ubicacion.entity/ubicacion.entity';
import { CreateUbicacionDto } from '../dto/create-ubicacion.dto';
import { UpdateUbicacionDto } from '../dto/update-ubicacion.dto';
import { BaseService } from '../../../common/base/base.service';
import { Inventario } from '../../inventario/inventario.entity/inventario.entity';
import {
  slugifyUbicacionCodigo,
  generarCodigoUbicacionRespaldo,
} from '../../../common/utils/codigo-ubicacion';
import { TipoUbicacion } from '../enums/tipo-ubicacion.enum';

/**
 * Servicio de dominio para ubicacion.
 */
@Injectable()
export class UbicacionService extends BaseService<
  Ubicacion,
  CreateUbicacionDto,
  UpdateUbicacionDto
> {
  /**
   * @param inventarioRepo Comprueba stock residuo antes de eliminar ubicaciones.
   */
  constructor(
    @InjectRepository(Ubicacion)
    repository: Repository<Ubicacion>,
    dataSource: DataSource
  ) {
    super(repository, dataSource);
  }

  /**
   * Creación extendida WMS con `codigo` único estable y defaults de tipo/flags.
   */
  async create(dto: CreateUbicacionDto): Promise<Ubicacion> {
    const slug = dto.codigo?.trim() || slugifyUbicacionCodigo(dto.nombre);
    let codigo = slug?.length ? slug : generarCodigoUbicacionRespaldo();

    let salt = 0;
    while (
      await this.repository.findOne({
        where: { codigo },
        withDeleted: true,
      })
    ) {
      salt += 1;
      codigo = `${slug?.length ? slug : 'ubicacion'}_${salt}`;
      if (salt > 200) {
        codigo = generarCodigoUbicacionRespaldo();
      }
    }

    const merged: Partial<Ubicacion> = {
      nombre: dto.nombre,
      descripcion: dto.descripcion,
      codigo,
      tipo: dto.tipo ?? TipoUbicacion.ALMACEN_GENERAL,
      esVirtual: dto.esVirtual ?? false,
      activa: dto.activa ?? true,
      parentId: dto.parentId ?? undefined,
      organizacionId: dto.organizacionId ?? undefined,
      metadata: dto.metadata ?? undefined,
    };

    const entity = this.repository.create(merged as Ubicacion);
    return this.repository.save(entity);
  }

  /**
   * No eliminar ubicación con inventario físico positivo pendiente en suma.
   */
  async remove(id: string): Promise<void> {
    const row = await this.dataSource
      .getRepository(Inventario)
      .createQueryBuilder('inv')
      .select('COALESCE(SUM(inv.cantidad_actual), 0)', 'total')
      .where('inv.ubicacion_id = :id', { id })
      .getRawOne<{ total: string }>();

    const total = Number(row?.total ?? 0);
    if (total > 0.000001) {
      throw new ConflictException(I18nHelper.getError('LOCATION_HAS_STOCK'));
    }
    return super.remove(id);
  }

  /**
   * Obtiene not found message.
   * @returns Valor resultante de la operación.
   */
  protected getNotFoundMessage(): string {
    return I18nHelper.getError('LOCATION_NOT_FOUND');
  }

  /**
   * Restaura ubicación borrada suavemente.
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
