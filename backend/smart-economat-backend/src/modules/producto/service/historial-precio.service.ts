import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { HistorialPrecioRepository } from '../repository/historial-precio.repository';
import { ProductoProveedor } from '../producto-proveedor.entity/producto-proveedor.entity';
import { HistorialPrecio } from '../historial-precio-proveedor.entity/historial.entity';
import { CreateHistorialPrecioDto } from '../dto/historial-precio.dto/create-historial-precio.dto';
import { UpdateHistorialPrecioDto } from '../dto/historial-precio.dto/update-historial-precio.dto';
import { I18nHelper } from '../../../common/helpers/i18n.helper';
import { DataSource } from 'typeorm';

@Injectable()
export class HistorialPrecioService {
  constructor(
    private readonly historialPrecioRepository: HistorialPrecioRepository,
    private readonly dataSource: DataSource
  ) {}

  async create(dto: CreateHistorialPrecioDto): Promise<HistorialPrecio> {
    const productoProveedor = await this.dataSource.manager.findOne(
      ProductoProveedor,
      { where: { id: dto.productoProveedorId } }
    );

    if (!productoProveedor) {
      throw new NotFoundException(
        I18nHelper.getError('PRODUCT_PROVIDER_NOT_FOUND')
      );
    }

    if (dto.precio < 0) {
      throw new BadRequestException(I18nHelper.getError('PRECIO_NO_NEGATIVO'));
    }

    const historial = this.historialPrecioRepository.create({
      productoProveedor,
      precio: dto.precio,
      ...(dto.fecha ? { fecha: dto.fecha } : {}),
    });

    return this.historialPrecioRepository.save(historial);
  }

  async findAll(order: 'ASC' | 'DESC' = 'DESC'): Promise<HistorialPrecio[]> {
    return this.historialPrecioRepository.findAllWithRelations(order);
  }

  async findOne(id: string): Promise<HistorialPrecio> {
    const historial =
      await this.historialPrecioRepository.findOneWithRelations(id);

    if (!historial) {
      throw new NotFoundException(
        I18nHelper.getError('HISTORIAL_PRECIO_NOT_FOUND')
      );
    }

    return historial;
  }

  async update(
    id: string,
    dto: UpdateHistorialPrecioDto
  ): Promise<HistorialPrecio> {
    const historial = await this.findOne(id);

    if (dto.precio !== undefined && dto.precio < 0) {
      throw new BadRequestException(I18nHelper.getError('PRECIO_NO_NEGATIVO'));
    }

    if (dto.productoProveedorId) {
      const productoProveedor = await this.dataSource.manager.findOne(
        ProductoProveedor,
        { where: { id: dto.productoProveedorId } }
      );

      if (!productoProveedor) {
        throw new NotFoundException(
          I18nHelper.getError('PRODUCT_PROVIDER_NOT_FOUND')
        );
      }

      historial.productoProveedor = productoProveedor;
    }

    if (dto.precio !== undefined) {
      historial.precio = dto.precio;
    }

    if (dto.fecha !== undefined) {
      historial.fecha = dto.fecha;
    }

    return this.historialPrecioRepository.save(historial);
  }

  async remove(id: string): Promise<void> {
    const historial = await this.findOne(id);
    await this.historialPrecioRepository.softRemove(historial);
  }
}
