import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ProductoProveedor } from '../producto-proveedor.entity/producto-proveedor.entity';
import { HistorialPrecio } from '../historial-precio-proveedor.entity/historial.entity';
import { UpdatePrecioProductoDto } from '../dto/update-precio-producto.dto';
import { UpdateMermaProveedorDto } from '../dto/update-merma-proveedor.dto';
import { I18nHelper } from '../../../common/helpers/i18n.helper';
import { SearchProductoProveedorDto } from '../dto/search-producto-proveedor.dto';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';

export interface ComparacionProveedorItem {
  productoProveedorId: string;
  proveedorId: string;
  proveedorNombre: string;
  marca?: string;
  precioUnitario: number;
  mermaEsperada: number;
  costeEfectivoUnitario: number;
  esOptimo: boolean;
  ahorroAbsoluto: number;
  ahorroAbsolutoPct: number;
}

export interface ComparacionProveedoresResponse {
  productoId: string;
  productoNombre: string;
  proveedores: ComparacionProveedorItem[];
}

@Injectable()
export class ProductoProveedorService {
  constructor(private readonly dataSource: DataSource) {}

  async updatePrecio(
    idProductoProveedor: string,
    updatePrecioDto: UpdatePrecioProductoDto
  ): Promise<ProductoProveedor> {
    const { nuevoPrecio } = updatePrecioDto;

    return await this.dataSource.transaction(async (manager) => {
      const productoProveedor = await manager.findOne(ProductoProveedor, {
        where: { id: idProductoProveedor },
      });

      if (!productoProveedor) {
        throw new NotFoundException(
          I18nHelper.getError('PRODUCT_PROVIDER_NOT_FOUND')
        );
      }

      if (productoProveedor.precioUnitario === nuevoPrecio) {
        throw new ConflictException(I18nHelper.getError('PRICE_NOT_CHANGED'));
      }

      const previousPrice = productoProveedor.precioUnitario;

      if (previousPrice !== undefined && previousPrice !== null) {
        const historial = new HistorialPrecio();
        historial.productoProveedor = productoProveedor;
        historial.precio = previousPrice;
        await manager.save(HistorialPrecio, historial);
      }

      productoProveedor.precioUnitario = nuevoPrecio;
      return await manager.save(ProductoProveedor, productoProveedor);
    });
  }

  async getHistorial(
    idProductoProveedor: string,
    query: PaginationQueryDto
  ): Promise<PaginatedResponseDto<HistorialPrecio>> {
    const repo = this.dataSource.getRepository(HistorialPrecio);

    const ppExists = await this.dataSource.manager.findOne(ProductoProveedor, {
      where: { id: idProductoProveedor },
    });
    if (!ppExists) {
      throw new NotFoundException(
        I18nHelper.getError('PRODUCT_PROVIDER_NOT_FOUND')
      );
    }

    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);

    const [data, total] = await repo.findAndCount({
      where: { productoProveedor: { id: idProductoProveedor } as any },
      order: { fecha: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit) || 1;
    return { data, total, page, limit, totalPages };
  }

  async updateMerma(
    idProductoProveedor: string,
    dto: UpdateMermaProveedorDto
  ): Promise<ProductoProveedor> {
    return await this.dataSource.transaction(async (manager) => {
      const productoProveedor = await manager.findOne(ProductoProveedor, {
        where: { id: idProductoProveedor },
      });

      if (!productoProveedor) {
        throw new NotFoundException(
          I18nHelper.getError('PRODUCT_PROVIDER_NOT_FOUND')
        );
      }

      if (productoProveedor.mermaEsperada === dto.nuevaMerma) {
        throw new ConflictException('La merma esperada es igual a la actual.');
      }

      productoProveedor.mermaEsperada = dto.nuevaMerma;
      return await manager.save(ProductoProveedor, productoProveedor);
    });
  }

  async compararProveedores(
    productoId: string
  ): Promise<ComparacionProveedoresResponse> {
    const repo = this.dataSource.getRepository(ProductoProveedor);

    const rows = await repo
      .createQueryBuilder('pp')
      .leftJoin('pp.producto', 'producto')
      .leftJoin('pp.proveedor', 'proveedor')
      .select([
        'pp.id',
        'pp.marca',
        'pp.precioUnitario',
        'pp.mermaEsperada',
        'producto.id',
        'producto.nombre',
        'proveedor.id',
        'proveedor.nombre',
      ])
      .where('pp.productoId = :productoId', { productoId })
      .andWhere('pp.precioUnitario IS NOT NULL')
      .getMany();

    if (rows.length === 0) {
      throw new NotFoundException(
        'No se encontraron proveedores con precio para este producto.'
      );
    }

    const productoNombre = rows[0].producto?.nombre ?? '';

    const conCoste = rows.map((pp) => {
      const precio = pp.precioUnitario ?? 0;
      const merma = pp.mermaEsperada ?? 0;
      const costeEfectivo = precio * (1 + merma / 100);
      return { pp, precio, merma, costeEfectivo };
    });

    const maxCoste = Math.max(...conCoste.map((r) => r.costeEfectivo));
    const minCoste = Math.min(...conCoste.map((r) => r.costeEfectivo));

    const proveedores: ComparacionProveedorItem[] = conCoste
      .sort((a, b) => a.costeEfectivo - b.costeEfectivo)
      .map(({ pp, precio, merma, costeEfectivo }) => {
        const ahorroAbsoluto =
          maxCoste > 0 ? parseFloat((maxCoste - costeEfectivo).toFixed(4)) : 0;
        const ahorroAbsolutoPct =
          maxCoste > 0
            ? parseFloat(((ahorroAbsoluto / maxCoste) * 100).toFixed(2))
            : 0;

        return {
          productoProveedorId: pp.id,
          proveedorId: pp.proveedor?.id,
          proveedorNombre: pp.proveedor?.nombre,
          marca: pp.marca,
          precioUnitario: precio,
          mermaEsperada: merma,
          costeEfectivoUnitario: parseFloat(costeEfectivo.toFixed(4)),
          esOptimo: costeEfectivo === minCoste,
          ahorroAbsoluto,
          ahorroAbsolutoPct,
        };
      });

    return { productoId, productoNombre, proveedores };
  }

  async search(dto: SearchProductoProveedorDto): Promise<
    Array<{
      id: string;
      productoId: string;
      productoNombre: string;
      unidad?: string;
      contenido?: number;
      proveedorId: string;
      proveedorNombre: string;
      marcaEspecifica?: string;
      codigoBarras?: string;
      precioUnitario?: number;
    }>
  > {
    const q = (dto.q ?? '').trim();
    const limit = dto.limit ?? 20;
    const offset = dto.offset ?? 0;

    const repo = this.dataSource.getRepository(ProductoProveedor);
    const qb = repo
      .createQueryBuilder('pp')
      .leftJoin('pp.producto', 'producto')
      .leftJoin('pp.proveedor', 'proveedor')
      .select([
        'pp.id',
        'pp.marca',
        'pp.codigoBarras',
        'pp.precioUnitario',
        'producto.id',
        'producto.nombre',
        'producto.unidad',
        'producto.contenido',
        'proveedor.id',
        'proveedor.nombre',
      ])
      .orderBy('producto.nombre', 'ASC')
      .addOrderBy('proveedor.nombre', 'ASC')
      .take(limit)
      .skip(offset);

    if (q.length > 0) {
      qb.where(
        '(producto.nombre ILIKE :q OR proveedor.nombre ILIKE :q OR pp.marca ILIKE :q OR pp.codigoBarras ILIKE :q)',
        { q: `%${q}%` }
      );
    }

    const rows = await qb.getMany();

    return rows.map((pp) => ({
      id: pp.id,
      productoId: pp.producto?.id,
      productoNombre: pp.producto?.nombre,
      unidad: pp.producto?.unidad,
      contenido: pp.producto?.contenido,
      proveedorId: pp.proveedor?.id,
      proveedorNombre: pp.proveedor?.nombre,
      marca: pp.marca,
      codigoBarras: pp.codigoBarras,
      precioUnitario: pp.precioUnitario,
    }));
  }
}
