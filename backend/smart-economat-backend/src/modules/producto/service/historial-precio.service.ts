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

/**
 * Servicio de dominio para historial precio.
 */
@Injectable()
export class HistorialPrecioService {
  /**
   * Construye la instancia configurada.
   * @undefined {HistorialPrecioRepository} historialPrecioRepository - Entrada efectiva esperada por el contrato.
   * @undefined {DataSource} dataSource - Entrada efectiva esperada por el contrato.
   */
  constructor(
    private readonly historialPrecioRepository: HistorialPrecioRepository,
    private readonly dataSource: DataSource
  ) {}

  private validatePrecioMayorQueCero(precio: number): void {
    if (precio <= 0) {
      throw new BadRequestException(
        I18nHelper.getError('PRICE_MUST_BE_GREATER_THAN_ZERO')
      );
    }
  }

  private async syncPrecioActualDesdeHistorial(
    productoProveedorId: string,
    manager = this.dataSource.manager
  ): Promise<void> {
    const latestHistorial = await manager.findOne(HistorialPrecio, {
      where: { productoProveedorId },
      order: { fecha: 'DESC', createdAt: 'DESC' },
    });

    if (latestHistorial) {
      await manager.update(
        ProductoProveedor,
        { id: productoProveedorId },
        { precioUnitario: latestHistorial.precio }
      );
      return;
    }

    await manager
      .createQueryBuilder()
      .update(ProductoProveedor)
      .set({ precioUnitario: () => 'NULL' })
      .where('id = :productoProveedorId', { productoProveedorId })
      .execute();
  }

  /**
   * Crea recursos nuevos en base a las reglas de negocio.
   * @undefined {CreateHistorialPrecioDto} dto - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<HistorialPrecio>} Datos efectivos después de ejecutar la operación.
   */
  async create(dto: CreateHistorialPrecioDto): Promise<HistorialPrecio> {
    return this.dataSource.transaction(async (manager) => {
      const productoProveedor = await manager.findOne(ProductoProveedor, {
        where: { id: dto.productoProveedorId },
      });

      if (!productoProveedor) {
        throw new NotFoundException(
          I18nHelper.getError('PRODUCT_PROVIDER_NOT_FOUND')
        );
      }

      this.validatePrecioMayorQueCero(dto.precio);

      const historial = manager.create(HistorialPrecio, {
        productoProveedor,
        precio: dto.precio,
        ...(dto.fecha ? { fecha: dto.fecha } : {}),
      });

      const savedHistorial = await manager.save(HistorialPrecio, historial);
      await this.syncPrecioActualDesdeHistorial(productoProveedor.id, manager);

      return savedHistorial;
    });
  }

  /**
   * Expone "findAll" en smart-economat-backend (Nest).
   * @undefined {"ASC" | "DESC"} order - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<HistorialPrecio[]>} Datos efectivos después de ejecutar la operación.
   */
  async findAll(order: 'ASC' | 'DESC' = 'DESC'): Promise<HistorialPrecio[]> {
    return this.historialPrecioRepository.findAllWithRelations(order);
  }

  /**
   * Expone "findOne" en smart-economat-backend (Nest).
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<HistorialPrecio>} Datos efectivos después de ejecutar la operación.
   */
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

  /**
   * Persiste modificaciones válidas sobre entidades existentes.
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {UpdateHistorialPrecioDto} dto - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<HistorialPrecio>} Datos efectivos después de ejecutar la operación.
   */
  async update(
    id: string,
    dto: UpdateHistorialPrecioDto
  ): Promise<HistorialPrecio> {
    return this.dataSource.transaction(async (manager) => {
      const historial = await manager.findOne(HistorialPrecio, {
        where: { id },
      });

      if (!historial) {
        throw new NotFoundException(
          I18nHelper.getError('HISTORIAL_PRECIO_NOT_FOUND')
        );
      }

      const previousProductoProveedorId = historial.productoProveedorId;

      if (dto.productoProveedorId) {
        const productoProveedor = await manager.findOne(ProductoProveedor, {
          where: { id: dto.productoProveedorId },
        });

        if (!productoProveedor) {
          throw new NotFoundException(
            I18nHelper.getError('PRODUCT_PROVIDER_NOT_FOUND')
          );
        }

        historial.productoProveedor = productoProveedor;
        historial.productoProveedorId = productoProveedor.id;
      }

      if (dto.precio !== undefined) {
        if (dto.precio === null) {
          throw new BadRequestException(I18nHelper.getError('INVALID_DATA'));
        }

        this.validatePrecioMayorQueCero(dto.precio);
        historial.precio = dto.precio;
      }

      if (dto.fecha !== undefined) {
        historial.fecha = dto.fecha;
      }

      const savedHistorial = await manager.save(HistorialPrecio, historial);

      await this.syncPrecioActualDesdeHistorial(
        savedHistorial.productoProveedorId,
        manager
      );

      if (previousProductoProveedorId !== savedHistorial.productoProveedorId) {
        await this.syncPrecioActualDesdeHistorial(
          previousProductoProveedorId,
          manager
        );
      }

      return savedHistorial;
    });
  }

  /**
   * Expone "remove" en smart-economat-backend (Nest).
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<void>} Datos efectivos después de ejecutar la operación.
   */
  async remove(id: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const historial = await manager.findOne(HistorialPrecio, {
        where: { id },
      });

      if (!historial) {
        throw new NotFoundException(
          I18nHelper.getError('HISTORIAL_PRECIO_NOT_FOUND')
        );
      }

      const productoProveedorId = historial.productoProveedorId;
      await manager.softRemove(HistorialPrecio, historial);
      await this.syncPrecioActualDesdeHistorial(productoProveedorId, manager);
    });
  }
}
