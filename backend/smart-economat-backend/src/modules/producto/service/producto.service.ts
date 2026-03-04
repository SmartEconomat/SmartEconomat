import { Injectable, NotFoundException } from '@nestjs/common';
import { Producto } from '../producto.entity/producto.entity';
import { ProductoRepository } from '../repository/producto.repository';
import { CreateProductoDto } from '../dto/create-producto.dto';
import { UpdateProductoDto } from '../dto/update-producto.dto';
import { ProductoListQueryDto } from '../dto/producto-list-query.dto';
import { I18nHelper } from '../../../common/helpers/i18n.helper';
import { MovimientoHelper } from '../../../common/helpers/movimiento.helper';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductoProveedor } from '../producto-proveedor.entity/producto-proveedor.entity';
import { ProductFilterDto } from '../dto/product-filter.dto';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';
import { ProductoProveedorDto } from '../dto/producto-proveedor.dto/producto-proveedor.dto';
import { ProductoAlergeno } from '../producto-alergeno.entity/producto-alergeno.entity';
import { AlergenoProducto } from '../enums/producto.enums';

@Injectable()
export class ProductoService {
  constructor(
    private readonly productoRepository: ProductoRepository,
    @InjectRepository(ProductoProveedor)
    private readonly productoProveedorRepository: Repository<ProductoProveedor>,
    @InjectRepository(ProductoAlergeno)
    private readonly productoAlergenoRepository: Repository<ProductoAlergeno>,
    private readonly movimientoHelper: MovimientoHelper
  ) {}

  async create(
    createProductoDto: CreateProductoDto,
    userId: string
  ): Promise<Producto> {
    const { alergenos, proveedores, ...rest } = createProductoDto;
    const producto = this.productoRepository.create(rest);

    if (alergenos && alergenos.length > 0) {
      producto.alergenos = alergenos.map((a) => ({
        alergeno: a,
      })) as any;
    }

    const savedProduct = await this.productoRepository.save(producto);

    const processedProduct = {
      ...savedProduct,
      alergenos: savedProduct.alergenos || [],
    };

    if (proveedores !== undefined) {
      await this.syncProveedores(processedProduct.id, proveedores);
    }

    await this.movimientoHelper.trackProductoCreation(
      userId,
      processedProduct.id,
      `Creación de producto: ${processedProduct.nombre}`
    );

    return this.findOne(processedProduct.id);
  }

  async findAll(
    query: ProductFilterDto
  ): Promise<PaginatedResponseDto<Producto>> {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);

    const queryBuilder = this.productoRepository
      .createQueryBuilder('producto')
      .leftJoinAndSelect('producto.proveedores', 'proveedores')
      .leftJoinAndSelect('proveedores.proveedor', 'proveedor')
      .leftJoinAndSelect('producto.alergenos', 'alergenos');

    if (query.codigoBarras) {
      queryBuilder.andWhere('producto.codigoBarras = :codigoBarras', {
        codigoBarras: query.codigoBarras,
      });
    } else if (query.searchTerm) {
      queryBuilder.andWhere('producto.nombre ILIKE :searchTerm', {
        searchTerm: `%${query.searchTerm}%`,
      });
    }

    if (query.categorias && query.categorias.length > 0) {
      queryBuilder.andWhere('producto.tipo IN (:...categorias)', {
        categorias: query.categorias,
      });
    }

    if (query.marcas && query.marcas.length > 0) {
      queryBuilder.andWhere('producto.marca IN (:...marcas)', {
        marcas: query.marcas,
      });
    }

    if (query.alergenos && query.alergenos.length > 0) {
      queryBuilder.innerJoin(
        'producto.alergenos',
        'alergenoFiltro',
        'alergenoFiltro.alergeno IN (:...alergenos)',
        { alergenos: query.alergenos }
      );
    }

    if (query.minStock) {
      queryBuilder.innerJoin(
        'proveedores.inventarios',
        'inventarios',
        'inventarios.cantidad_actual > 0'
      );
    }

    queryBuilder.orderBy('producto.nombre', 'ASC');

    queryBuilder.skip((page - 1) * limit).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    const processedData = data.map((producto) => ({
      ...producto,
      proveedores: producto.proveedores || [],
    }));

    const totalPages = Math.ceil(total / limit) || 1;
    return { data: processedData, total, page, limit, totalPages };
  }

  async findOne(id: string): Promise<Producto> {
    const producto = await this.productoRepository.findOne({
      where: { id },
      relations: ['proveedores', 'proveedores.proveedor', 'alergenos'],
    });
    if (!producto) {
      throw new NotFoundException(I18nHelper.getError('PRODUCT_NOT_FOUND'));
    }

    return {
      ...producto,
      proveedores: producto.proveedores || [],
    };
  }

  async update(
    id: string,
    updateProductoDto: UpdateProductoDto,
    userId: string
  ): Promise<Producto> {
    const { alergenos, proveedores, ...rest } = updateProductoDto;
    const producto = await this.findOne(id);

    this.productoRepository.merge(producto, rest);

    if (alergenos) {
      producto.alergenos = alergenos.map((a) => ({
        alergeno: a,
        idProducto: id,
      })) as any;
    }

    await this.productoRepository.save(producto);

    if (proveedores !== undefined) {
      await this.syncProveedores(id, proveedores);
    }

    await this.movimientoHelper.trackProductoUpdate(
      userId,
      id,
      `Actualización de producto: ${producto.nombre}`
    );
    return this.findOne(id);
  }

  async remove(id: string, userId: string): Promise<void> {
    const producto = await this.findOne(id);
    const result = await this.productoRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(I18nHelper.getError('PRODUCT_NOT_FOUND'));
    }

    await this.movimientoHelper.trackProductoDeletion(
      userId,
      id,
      `Eliminación de producto: ${producto.nombre}`
    );
  }

  private async syncProveedores(
    productoId: string,
    proveedores: ProductoProveedorDto[]
  ) {
    const existing = await this.productoProveedorRepository.find({
      where: { producto: { id: productoId } },
      relations: ['proveedor'],
    });

    const existingIds = existing.map((ep) => ep.proveedor.id);
    const newProveedores = proveedores.filter(
      (p) => !existingIds.includes(p.proveedorId)
    );
    const proveedoresToUpdate = proveedores.filter((p) =>
      existingIds.includes(p.proveedorId)
    );

    if (newProveedores.length > 0) {
      const newRelations = newProveedores.map((p) =>
        this.productoProveedorRepository.create({
          producto: { id: productoId } as any,
          proveedor: { id: p.proveedorId } as any,
          precioUnitario: p.precioUnitario ?? 0,
          marca: p.marca,
          codigoBarras: p.codigoBarras,
        })
      );
      await this.productoProveedorRepository.save(newRelations);
    }

    if (proveedoresToUpdate.length > 0) {
      for (const p of proveedoresToUpdate) {
        const toUpdate = existing.find((e) => e.proveedor.id === p.proveedorId);
        if (toUpdate) {
          toUpdate.precioUnitario = p.precioUnitario ?? toUpdate.precioUnitario;
          toUpdate.marca = p.marca ?? toUpdate.marca;
          toUpdate.codigoBarras = p.codigoBarras ?? toUpdate.codigoBarras;
          await this.productoProveedorRepository.save(toUpdate);
        }
      }
    }

    const currentProviderIds = proveedores.map((p) => p.proveedorId);
    const idsToRemove = existingIds.filter(
      (id) => !currentProviderIds.includes(id)
    );

    if (idsToRemove.length > 0) {
      for (const id of idsToRemove) {
        const toDelete = existing.find((e) => e.proveedor.id === id);
        if (toDelete) {
          await this.productoProveedorRepository.softDelete(toDelete.id);
        }
      }
    }
  }
}
