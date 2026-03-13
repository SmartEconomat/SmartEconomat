import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Producto } from '../producto.entity/producto.entity';
import { ProductoRepository } from '../repository/producto.repository';
import { CreateProductoDto } from '../dto/create-producto.dto';
import { UpdateProductoDto } from '../dto/update-producto.dto';
import { I18nHelper } from '../../../common/helpers/i18n.helper';
import { MovimientoHelper } from '../../../common/helpers/movimiento.helper';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { ProductoProveedor } from '../producto-proveedor.entity/producto-proveedor.entity';
import { ProductFilterDto } from '../dto/product-filter.dto';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';
import { AddProveedorToProductoDto } from '../dto/producto-proveedor.dto/add-proveedor-to-producto.dto';
import { ProductoAlergeno } from '../producto-alergeno.entity/producto-alergeno.entity';
import { generateEan13, validateEan13 } from '../../../common/utils/ean13.util';

@Injectable()
export class ProductoService {
  constructor(
    private readonly productoRepository: ProductoRepository,
    @InjectRepository(ProductoProveedor)
    private readonly productoProveedorRepository: Repository<ProductoProveedor>,
    @InjectRepository(ProductoAlergeno)
    private readonly productoAlergenoRepository: Repository<ProductoAlergeno>,
    private readonly movimientoHelper: MovimientoHelper,
    @InjectDataSource()
    private readonly dataSource: DataSource
  ) {}

  async create(
    createProductoDto: CreateProductoDto,
    userId: string
  ): Promise<Producto> {
    const { alergenos, proveedores, ...rest } = createProductoDto;

    if (rest.codigoBarras) {
      if (!validateEan13(rest.codigoBarras)) {
        throw new BadRequestException(
          'El código de barras proporcionado no es un EAN-13 válido'
        );
      }
      const exists = await this.productoRepository.existsByCodigoBarras(
        rest.codigoBarras
      );
      if (exists) {
        throw new BadRequestException(
          I18nHelper.getError('EL_C_DIGO_DE_BARRAS_YA_EST_REGISTRADO')
        );
      }
    } else {
      rest.codigoBarras = await this.generateUniqueEan13();
    }

    return await this.dataSource.transaction(async (manager) => {
      const producto = manager.create(Producto, rest);

      if (alergenos && alergenos.length > 0) {
        producto.alergenos = alergenos.map((a) =>
          manager.create(ProductoAlergeno, {
            alergeno: a,
          })
        );
      }

      const savedProduct = await manager.save(producto);

      if (proveedores !== undefined) {
        await this.syncProveedoresWithManager(
          manager,
          savedProduct.id,
          proveedores
        );
      }

      await this.movimientoHelper.trackProductoCreation(
        userId,
        savedProduct.id,
        `Creación de producto: ${savedProduct.nombre}`
      );

      return manager.findOne(Producto, {
        where: { id: savedProduct.id },
        relations: ['proveedores', 'proveedores.proveedor', 'alergenos'],
      }) as Promise<Producto>;
    });
  }

  async findAll(
    query: ProductFilterDto
  ): Promise<PaginatedResponseDto<Producto>> {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 50);
    const sortBy = query.sortBy ?? 'nombre';
    const order = query.order ?? 'ASC';

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

    queryBuilder.orderBy(`producto.${sortBy}`, order);

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

    if (rest.codigoBarras && rest.codigoBarras !== producto.codigoBarras) {
      if (!validateEan13(rest.codigoBarras)) {
        throw new BadRequestException(
          'El código de barras proporcionado no es un EAN-13 válido'
        );
      }
      const exists = await this.productoRepository.existsByCodigoBarras(
        rest.codigoBarras
      );
      if (exists) {
        throw new BadRequestException(
          I18nHelper.getError('EL_C_DIGO_DE_BARRAS_YA_EST_REGISTRADO')
        );
      }
    }

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

  async generateUniqueEan13(): Promise<string> {
    const MAX_RETRIES = 5;
    for (let i = 0; i < MAX_RETRIES; i++) {
      const code = generateEan13();
      const exists = await this.productoRepository.existsByCodigoBarras(code);
      if (!exists) {
        return code;
      }
    }
    throw new InternalServerErrorException(
      'No se pudo generar un código EAN-13 único después de varios intentos'
    );
  }

  private async syncProveedoresWithManager(
    manager: EntityManager,
    productoId: string,
    proveedores: AddProveedorToProductoDto[]
  ) {
    const existing = await manager.find(ProductoProveedor, {
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
        manager.create(ProductoProveedor, {
          producto: { id: productoId } as any,
          proveedor: { id: p.proveedorId } as any,
          precioUnitario: p.precioUnitario ?? 0,
          marca: p.marcaEspecifica,
          codigoBarras: p.codigoBarras,
        })
      );
      await manager.save(newRelations);
    }

    if (proveedoresToUpdate.length > 0) {
      for (const p of proveedoresToUpdate) {
        const toUpdate = existing.find((e) => e.proveedor.id === p.proveedorId);
        if (toUpdate) {
          toUpdate.precioUnitario = p.precioUnitario ?? toUpdate.precioUnitario;
          toUpdate.marca = p.marcaEspecifica ?? toUpdate.marca;
          toUpdate.codigoBarras = p.codigoBarras ?? toUpdate.codigoBarras;
          await manager.save(toUpdate);
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
          await manager.softDelete(ProductoProveedor, toDelete.id);
        }
      }
    }
  }

  private async syncProveedores(
    productoId: string,
    proveedores: AddProveedorToProductoDto[]
  ) {
    return this.syncProveedoresWithManager(
      this.dataSource.manager,
      productoId,
      proveedores
    );
  }
}
