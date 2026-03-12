import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { Inventario } from '../inventario.entity/inventario.entity';
import { InventarioRepository } from '../repository/inventario.repository';
import { ProductoProveedor } from '../../producto/producto-proveedor.entity/producto-proveedor.entity';
import { CreateInventarioItemDto } from '../dto/create-InventarioItem.dto';
import { UpdateInventarioDto } from '../dto/update-inventario.dto';
import { AlertaStockDTO } from '../dto/alertaStock.dto';
import { AlertaCaducidadDTO } from '../dto/alertaCaducidad.dto';
import { InventoryQueryDto } from '../dto/inventory-query.dto';
import {
  StockConsolidadoDto,
  StockPorUbicacionDto,
} from '../dto/stock-result.dto';
import { I18nHelper } from '../../../common/helpers/i18n.helper';
import { MovimientoHelper } from '../../../common/helpers/movimiento.helper';
import { TipoMovimiento } from '../../movimiento/enums/movimiento.enums';

@Injectable()
export class InventarioService {
  constructor(
    private readonly inventarioRepository: InventarioRepository,
    @InjectRepository(ProductoProveedor)
    private readonly productoProveedorRepository: Repository<ProductoProveedor>,
    private readonly movimientoHelper: MovimientoHelper
  ) {}

  async create(
    dto: CreateInventarioItemDto,
    userId: string
  ): Promise<Inventario> {
    const productoProveedor = await this.productoProveedorRepository.findOne({
      where: { id: dto.productoProveedorId },
    });
    if (!productoProveedor) {
      throw new NotFoundException(
        I18nHelper.getError('PRODUCT_PROVIDER_NOT_FOUND')
      );
    }

    const inventario = this.inventarioRepository.create({
      productoProveedor,
      cantidadActual: dto.cantidadActual,
      cantidadMinima: dto.cantidadMinima,
      cantidadMaxima: dto.cantidadMaxima ?? null,
      ubicacion: { id: dto.ubicacionId } as any,
      fechaCaducidad: dto.fechaCaducidad ? new Date(dto.fechaCaducidad) : null,
    });

    try {
      const savedInventario = await this.inventarioRepository.save(inventario);

      await this.movimientoHelper.trackInventarioMovimiento(
        userId,
        savedInventario.id,
        TipoMovimiento.ENTRADA,
        dto.cantidadActual,
        dto.productoProveedorId,
        'Inventario',
        savedInventario.id,
        `Creación de inventario: ${productoProveedor.producto.nombre}`
      );

      return savedInventario;
    } catch (err) {
      if (err instanceof QueryFailedError) {
        throw new BadRequestException(
          I18nHelper.getError('INVENTARIO_CONSTRAINT_VIOLATION')
        );
      }
      throw err;
    }
  }

  async findAll(): Promise<Inventario[]> {
    return this.inventarioRepository.find({
      relations: [
        'productoProveedor',
        'productoProveedor.producto',
        'productoProveedor.proveedor',
        'ubicacion',
      ],
    });
  }

  async findOne(id: string): Promise<Inventario> {
    const inventario = await this.inventarioRepository.findOne({
      where: { id },
      relations: [
        'productoProveedor',
        'productoProveedor.producto',
        'productoProveedor.proveedor',
        'ubicacion',
      ],
    });
    if (!inventario) {
      throw new NotFoundException(I18nHelper.getError('INVENTARIO_NOT_FOUND'));
    }
    return inventario;
  }

  async update(
    id: string,
    dto: UpdateInventarioDto,
    userId: string
  ): Promise<Inventario> {
    const inventario = await this.findOne(id);
    const oldCantidad = inventario.cantidadActual;

    if (dto.productoProveedorId !== undefined) {
      const productoProveedor = await this.productoProveedorRepository.findOne({
        where: { id: dto.productoProveedorId },
      });
      if (!productoProveedor) {
        throw new NotFoundException(
          I18nHelper.getError('PRODUCT_PROVIDER_NOT_FOUND')
        );
      }
      inventario.productoProveedor = productoProveedor;
    }

    if (dto.cantidadActual !== undefined)
      inventario.cantidadActual = dto.cantidadActual;
    if (dto.cantidadMinima !== undefined)
      inventario.cantidadMinima = dto.cantidadMinima;
    if (dto.cantidadMaxima !== undefined)
      inventario.cantidadMaxima = dto.cantidadMaxima ?? null;
    if (dto.ubicacionId !== undefined)
      inventario.ubicacion = { id: dto.ubicacionId } as any;
    if (dto.fechaCaducidad !== undefined)
      inventario.fechaCaducidad = dto.fechaCaducidad
        ? new Date(dto.fechaCaducidad)
        : null;

    try {
      await this.inventarioRepository.save(inventario);

      if (
        dto.cantidadActual !== undefined &&
        dto.cantidadActual !== oldCantidad
      ) {
        const cantidad = Math.abs(dto.cantidadActual - oldCantidad);
        const tipo =
          dto.cantidadActual > oldCantidad
            ? TipoMovimiento.ENTRADA
            : TipoMovimiento.SALIDA;

        await this.movimientoHelper.trackInventarioMovimiento(
          userId,
          id,
          tipo,
          cantidad,
          inventario.productoProveedor.id,
          'Inventario',
          id,
          `Ajuste de inventario: ${inventario.productoProveedor.producto.nombre} (${oldCantidad} -> ${dto.cantidadActual})`
        );
      }
    } catch (err) {
      if (err instanceof QueryFailedError) {
        throw new BadRequestException(
          I18nHelper.getError('INVENTARIO_CONSTRAINT_VIOLATION')
        );
      }
      throw err;
    }

    return this.findOne(id);
  }

  async remove(id: string, userId: string): Promise<void> {
    const inventario = await this.findOne(id);
    const result = await this.inventarioRepository.softDelete(id);
    if (result.affected === 0) {
      throw new NotFoundException(I18nHelper.getError('INVENTARIO_NOT_FOUND'));
    }

    await this.movimientoHelper.trackInventarioMovimiento(
      userId,
      id,
      TipoMovimiento.SALIDA,
      inventario.cantidadActual,
      inventario.productoProveedor.id,
      'Inventario',
      id,
      `Eliminación de inventario: ${inventario.productoProveedor.producto.nombre}`
    );
  }

  async obtenerAlertasCaducidad(): Promise<AlertaCaducidadDTO[]> {
    const productos = await this.inventarioRepository.findCaducidadProxima();
    return productos
      .filter((p) => p.fechaCaducidad !== null)
      .map((p) => ({
        id: p.id,
        fechaCaducidad: p.fechaCaducidad!.toISOString(),
      }));
  }

  async obtenerAlertasStock(): Promise<AlertaStockDTO[]> {
    const productos = await this.inventarioRepository.findStockBajo();
    return productos.map((p) => ({
      id: p.id,
      cantidadActual: p.cantidadActual,
      cantidadMinima: p.cantidadMinima,
    }));
  }

  async queryStock(
    dto: InventoryQueryDto
  ): Promise<StockPorUbicacionDto[] | StockConsolidadoDto[]> {
    return this.inventarioRepository.queryStock(dto);
  }
}
