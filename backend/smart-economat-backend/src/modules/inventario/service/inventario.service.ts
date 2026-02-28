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
import { I18nHelper } from '../../../common/helpers/i18n.helper';

@Injectable()
export class InventarioService {
  constructor(
    private readonly inventarioRepository: InventarioRepository,
    @InjectRepository(ProductoProveedor)
    private readonly productoProveedorRepository: Repository<ProductoProveedor>
  ) {}

  async create(dto: CreateInventarioItemDto): Promise<Inventario> {
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
      ubicacionAlmacen: dto.ubicacionAlmacen,
      fechaCaducidad: dto.fechaCaducidad ? new Date(dto.fechaCaducidad) : null,
    });

    try {
      return await this.inventarioRepository.save(inventario);
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
      ],
    });
    if (!inventario) {
      throw new NotFoundException(I18nHelper.getError('INVENTARIO_NOT_FOUND'));
    }
    return inventario;
  }

  async update(id: string, dto: UpdateInventarioDto): Promise<Inventario> {
    const inventario = await this.findOne(id);

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
    if (dto.ubicacionAlmacen !== undefined)
      inventario.ubicacionAlmacen = dto.ubicacionAlmacen;
    if (dto.fechaCaducidad !== undefined)
      inventario.fechaCaducidad = dto.fechaCaducidad
        ? new Date(dto.fechaCaducidad)
        : null;

    try {
      await this.inventarioRepository.save(inventario);
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

  async remove(id: string): Promise<void> {
    const result = await this.inventarioRepository.softDelete(id);
    if (result.affected === 0) {
      throw new NotFoundException(I18nHelper.getError('INVENTARIO_NOT_FOUND'));
    }
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
}
