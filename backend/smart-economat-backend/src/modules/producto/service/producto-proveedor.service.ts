import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ProductoProveedor } from '../producto-proveedor.entity/producto-proveedor.entity';
import { HistorialPrecio } from '../historial-precio-proveedor.entity/historial.entity';
import { UpdatePrecioProductoDto } from '../dto/update-precio-producto.dto';
import { I18nHelper } from '../../../common/helpers/i18n.helper';
import { SearchProductoProveedorDto } from '../dto/search-producto-proveedor.dto';

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
    query: import('../../../common/dto/pagination-query.dto').PaginationQueryDto
  ): Promise<
    import('../../../common/dto/paginated-response.dto').PaginatedResponseDto<HistorialPrecio>
  > {
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

  async search(dto: SearchProductoProveedorDto): Promise<
    Array<{
      id: string;
      productoId: string;
      productoNombre: string;
      proveedorId: string;
      proveedorNombre: string;
      marca?: string;
      codigoBarras?: string;
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
        'producto.id',
        'producto.nombre',
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

    return rows.map((pp: any) => ({
      id: pp.id,
      productoId: pp.producto?.id,
      productoNombre: pp.producto?.nombre,
      proveedorId: pp.proveedor?.id,
      proveedorNombre: pp.proveedor?.nombre,
      marca: pp.marca,
      codigoBarras: pp.codigoBarras,
    }));
  }
}
