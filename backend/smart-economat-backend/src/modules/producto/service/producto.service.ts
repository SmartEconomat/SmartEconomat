import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Producto } from '../producto.entity/producto.entity';
import { ProductoRepository } from '../repository/producto.repository';
import { CreateProductoDto } from '../dto/create-producto.dto';
import { UpdateProductoDto } from '../dto/update-producto.dto';
import { I18nHelper } from '../../../common/helpers/i18n.helper';
import { MovimientoHelper } from '../../../common/helpers/movimiento.helper';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager, In } from 'typeorm';
import { ProductoProveedor } from '../producto-proveedor.entity/producto-proveedor.entity';
import { ProductFilterDto } from '../dto/product-filter.dto';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';
import { AddProveedorToProductoDto } from '../dto/producto-proveedor.dto/add-proveedor-to-producto.dto';
import { ProductoAlergeno } from '../producto-alergeno.entity/producto-alergeno.entity';
import { generateEan13 } from '../../../common/utils/ean13.util';
import { isValidBarcode as validateBarcode } from '../../../common/validators/barcode.validator';
import { buildFindManyOptions } from '../../../common/utils/typeorm-query.helper';
import { Proveedor } from '../../proveedor/proveedor.entity/proveedor.entity';

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
    const normalizedAlergenos = this.ensureUniqueAlergenos(alergenos);

    if (rest.codigoBarras) {
      if (!validateBarcode(rest.codigoBarras, 130)) {
        throw new BadRequestException(
          'El código de barras proporcionado no es válido'
        );
      }
      const exists = await this.productoRepository.existsByCodigoBarras(
        rest.codigoBarras
      );
      if (exists) {
        throw new ConflictException(
          'El código de barras del producto ya está registrado'
        );
      }
    } else {
      rest.codigoBarras = await this.generateUniqueEan13();
    }

    return await this.dataSource.transaction(async (manager) => {
      await this.validateProveedorPayload(manager, proveedores, true);

      const producto = manager.create(Producto, rest);

      const savedProduct = await manager.save(Producto, producto);

      if (normalizedAlergenos !== undefined) {
        await this.replaceAlergenosWithManager(
          manager,
          savedProduct.id,
          normalizedAlergenos
        );
      }

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
    const {
      skip,
      take,
      order: orderOptions,
    } = buildFindManyOptions<Producto>(query, 'nombre');
    const [sortBy, order] = Object.entries(orderOptions ?? {})[0] ?? [
      'nombre',
      'ASC',
    ];

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

    queryBuilder.orderBy(`producto.${sortBy}`, order as 'ASC' | 'DESC');

    queryBuilder.skip(skip ?? 0).take(take ?? 20);

    const [data, total] = await queryBuilder.getManyAndCount();

    const processedData = data.map((producto) => ({
      ...producto,
      proveedores: producto.proveedores || [],
    }));

    const limit = take ?? 20;
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
    const normalizedAlergenos =
      alergenos !== undefined
        ? this.ensureUniqueAlergenos(alergenos)
        : undefined;

    return await this.dataSource.transaction(async (manager) => {
      const producto = await manager.findOne(Producto, {
        where: { id },
        relations: ['proveedores', 'proveedores.proveedor', 'alergenos'],
      });

      if (!producto) {
        throw new NotFoundException(I18nHelper.getError('PRODUCT_NOT_FOUND'));
      }

      if (rest.codigoBarras && rest.codigoBarras !== producto.codigoBarras) {
        if (!validateBarcode(rest.codigoBarras, 130)) {
          throw new BadRequestException(
            'El código de barras proporcionado no es válido'
          );
        }

        const duplicatedBarcode = await manager.count(Producto, {
          where: { codigoBarras: rest.codigoBarras },
        });

        if (duplicatedBarcode > 0) {
          throw new ConflictException(
            'El código de barras del producto ya está registrado'
          );
        }
      }

      if (proveedores !== undefined) {
        await this.validateProveedorPayload(manager, proveedores);
      }

      manager.merge(Producto, producto, rest);
      await manager.save(Producto, producto);

      if (normalizedAlergenos !== undefined) {
        await this.replaceAlergenosWithManager(
          manager,
          id,
          normalizedAlergenos
        );
      }

      if (proveedores !== undefined) {
        await this.syncProveedoresWithManager(manager, id, proveedores);
      }

      await this.movimientoHelper.trackProductoUpdate(
        userId,
        id,
        `Actualización de producto: ${producto.nombre}`
      );

      return (await manager.findOne(Producto, {
        where: { id },
        relations: ['proveedores', 'proveedores.proveedor', 'alergenos'],
      })) as Producto;
    });
  }

  async remove(id: string, userId: string): Promise<void> {
    const producto = await this.findOne(id);

    await this.productoRepository.update(id, { deletedBy: userId });
    const result = await this.productoRepository.softDelete(id);

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

  private ensureUniqueAlergenos(
    alergenos?: ProductoAlergeno['alergeno'][]
  ): ProductoAlergeno['alergeno'][] | undefined {
    if (alergenos === undefined) {
      return undefined;
    }

    const uniqueAlergenos = [...new Set(alergenos)];

    if (uniqueAlergenos.length !== alergenos.length) {
      throw new ConflictException(
        'No se pueden repetir alérgenos en la misma solicitud'
      );
    }

    return uniqueAlergenos;
  }

  private async validateProveedorPayload(
    manager: EntityManager,
    proveedores?: AddProveedorToProductoDto[],
    requirePrecioUnitario = false
  ): Promise<void> {
    if (proveedores === undefined) {
      return;
    }

    const providerIds = proveedores.map((proveedor) => proveedor.proveedorId);
    const uniqueProviderIds = new Set(providerIds);

    if (uniqueProviderIds.size !== providerIds.length) {
      throw new ConflictException(
        'No se puede vincular el mismo proveedor más de una vez al producto'
      );
    }

    for (const proveedor of proveedores) {
      if (
        proveedor.codigoBarras &&
        !validateBarcode(proveedor.codigoBarras, 130)
      ) {
        throw new BadRequestException(
          `El código de barras del proveedor ${proveedor.proveedorId} no es válido`
        );
      }

      if (
        requirePrecioUnitario &&
        (proveedor.precioUnitario === undefined ||
          proveedor.precioUnitario === null)
      ) {
        throw new BadRequestException(
          `El precio unitario es obligatorio para el proveedor ${proveedor.proveedorId}`
        );
      }
    }

    if (providerIds.length === 0) {
      return;
    }

    const providerRepo = manager.getRepository(Proveedor);
    const existingProviders = await providerRepo.find({
      where: { id: In(providerIds) },
      select: { id: true },
    });

    const existingProviderIds = new Set(
      existingProviders.map((provider) => provider.id)
    );
    const missingProviderId = providerIds.find(
      (providerId) => !existingProviderIds.has(providerId)
    );

    if (missingProviderId) {
      throw new NotFoundException(
        `No existe el proveedor ${missingProviderId}`
      );
    }
  }

  private async replaceAlergenosWithManager(
    manager: EntityManager,
    productoId: string,
    alergenos: ProductoAlergeno['alergeno'][]
  ): Promise<void> {
    await manager
      .createQueryBuilder()
      .delete()
      .from(ProductoAlergeno)
      .where('producto_id = :productoId', { productoId })
      .execute();

    if (alergenos.length === 0) {
      return;
    }

    const relations = alergenos.map((alergeno) =>
      manager.create(ProductoAlergeno, {
        productoId,
        alergeno,
      })
    );

    await manager.save(ProductoAlergeno, relations);
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

    const existingIds = existing.map((ep) => ep.proveedorId);
    const newProveedores = proveedores.filter(
      (p) => !existingIds.includes(p.proveedorId)
    );
    const proveedoresToUpdate = proveedores.filter((p) =>
      existingIds.includes(p.proveedorId)
    );

    if (newProveedores.length > 0) {
      const newRelations = newProveedores.map((p) =>
        manager.create(ProductoProveedor, {
          productoId,
          proveedorId: p.proveedorId,
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
        const toUpdate = existing.find((e) => e.proveedorId === p.proveedorId);
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
}
