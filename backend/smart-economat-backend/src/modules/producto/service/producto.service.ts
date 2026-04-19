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
import { ArchivoService } from '../../archivo/service/archivo.service';
import { HistorialPrecio } from '../historial-precio-proveedor.entity/historial.entity';
import { Inventario } from '../../inventario/inventario.entity/inventario.entity';
import { RecetaIngrediente } from '../../receta/receta-ingrediente.entity/receta-ingrediente.entity';

@Injectable()
export class ProductoService {
  constructor(
    private readonly productoRepository: ProductoRepository,
    @InjectRepository(ProductoProveedor)
    private readonly productoProveedorRepository: Repository<ProductoProveedor>,
    @InjectRepository(ProductoAlergeno)
    private readonly productoAlergenoRepository: Repository<ProductoAlergeno>,
    private readonly archivoService: ArchivoService,
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

      const producto = manager.create(Producto, {
        ...rest,
        pmp: 0,
      });

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
    query: ProductFilterDto,
    userRole?: string
  ): Promise<PaginatedResponseDto<Producto>> {
    const isAdmin =
      userRole?.toUpperCase() === 'ADMIN' ||
      userRole?.toUpperCase() === 'SUPER_ADMIN';
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

    if (query.soloEliminados) {
      queryBuilder.withDeleted().andWhere('producto.deleted_at IS NOT NULL');
    } else if (isAdmin) {
      queryBuilder.where('producto.deleted_at IS NULL');
    }

    if (query.codigoBarras) {
      queryBuilder.andWhere('producto.codigoBarras = :codigoBarras', {
        codigoBarras: query.codigoBarras,
      });
    } else if (query.searchTerm) {
      queryBuilder.andWhere(
        '(producto.nombre ILIKE :searchTerm OR producto.codigoBarras ILIKE :searchTerm OR producto.marca ILIKE :searchTerm OR proveedores.codigoBarras ILIKE :searchTerm OR proveedores.marca ILIKE :searchTerm)',
        {
          searchTerm: `%${query.searchTerm}%`,
        }
      );
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

  async findOne(id: string, _userRole?: string): Promise<Producto> {
    void _userRole;

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

    let previousImagePath: string | undefined;

    const updatedProduct = await this.dataSource.transaction(
      async (manager) => {
        const producto = await manager.findOne(Producto, {
          where: { id },
          relations: ['proveedores', 'proveedores.proveedor', 'alergenos'],
          withDeleted: true,
        });

        if (!producto) {
          throw new NotFoundException(I18nHelper.getError('PRODUCT_NOT_FOUND'));
        }

        previousImagePath = producto.pathImg;

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

        await manager.update(Producto, id, rest);

        Object.assign(producto, rest);

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
      }
    );

    if (previousImagePath && previousImagePath !== updatedProduct.pathImg) {
      await this.archivoService.cleanupByUrl(previousImagePath);
    }

    return updatedProduct;
  }

  async restore(id: string, userId: string): Promise<Producto> {
    const producto = await this.productoRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!producto) {
      throw new NotFoundException(I18nHelper.getError('PRODUCT_NOT_FOUND'));
    }

    if (!producto.deletedAt) {
      return producto;
    }

    producto.deletedAt = null;
    producto.deletedBy = null;
    producto.modifiedBy = userId;

    const restoredProduct = await this.productoRepository.save(producto);

    await this.movimientoHelper.trackProductoRestore(
      userId,
      id,
      `Restauración de producto: ${producto.nombre}`
    );

    return restoredProduct;
  }

  async remove(id: string, userId: string): Promise<void> {
    const producto = await this.findOne(id);

    const recipeUsageCount = await this.dataSource
      .getRepository(RecetaIngrediente)
      .count({ where: { productoId: id } });

    if (recipeUsageCount > 0) {
      throw new ConflictException(
        I18nHelper.getError('PRODUCT_IN_USE_BY_RECIPE')
      );
    }

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

    if (producto.pathImg) {
      await this.archivoService.cleanupByUrl(producto.pathImg);
    }
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

  async actualizarPMP(
    productoProveedorId: string,
    nuevaCantidad: number,
    nuevoPrecio: number,
    manager?: EntityManager
  ): Promise<number> {
    const em = manager || this.dataSource.manager;

    const pp = await em.findOne(ProductoProveedor, {
      where: { id: productoProveedorId },
      relations: ['producto'],
    });

    if (!pp) {
      return nuevoPrecio;
    }

    const inventariosPP = await em.find(Inventario, {
      where: { productoProveedorId },
    });

    const stockTotalPP = inventariosPP.reduce(
      (sum, inv) => sum + Number(inv.cantidadActual),
      0
    );
    const stockAnteriorPP = Math.max(0, stockTotalPP - nuevaCantidad);
    const pmpAnteriorPP = Number(pp.pmp) || 0;

    const divisorPP = stockAnteriorPP + nuevaCantidad;
    const nuevoPmpPP =
      divisorPP > 0
        ? (stockAnteriorPP * pmpAnteriorPP + nuevaCantidad * nuevoPrecio) /
          divisorPP
        : nuevoPrecio;

    const finalPmp = Number(nuevoPmpPP.toFixed(4));

    await em.update(
      ProductoProveedor,
      { id: productoProveedorId },
      { pmp: finalPmp }
    );
    pp.pmp = finalPmp;

    if (pp.producto) {
      await this.recalcularPmpProducto(pp.producto.id, em);
    }

    return pp.pmp;
  }

  /**
   * Recalcula el campo Producto.pmp como media ponderada del PMP de todos
   * sus ProductoProveedor activos, ponderada por el stock de cada uno.
   * Este campo es derivado y se usa para consultas rápidas y reportes.
   */
  private async recalcularPmpProducto(
    productoId: string,
    em: EntityManager
  ): Promise<void> {
    const producto = await em.findOne(Producto, {
      where: { id: productoId },
      relations: ['proveedores'],
    });
    if (!producto) return;

    const ppIds = producto.proveedores.map((p) => p.id);
    if (ppIds.length === 0) return;

    const todosInventarios = await em.find(Inventario, {
      where: { productoProveedorId: In(ppIds) },
    });

    let stockTotal = 0;
    let sumaPonderada = 0;

    for (const pp of producto.proveedores) {
      const invPP = todosInventarios.filter(
        (inv) => inv.productoProveedorId === pp.id
      );
      const stockPP = invPP.reduce(
        (sum, inv) => sum + Number(inv.cantidadActual),
        0
      );
      const pmpPP = Number(pp.pmp) || 0;
      stockTotal += stockPP;
      sumaPonderada += stockPP * pmpPP;
    }

    const pmpActualProducto = Number(producto.pmp) || 0;
    producto.pmp =
      stockTotal > 0
        ? Number((sumaPonderada / stockTotal).toFixed(4))
        : pmpActualProducto;

    await em.update(
      Producto,
      { id: productoId },
      {
        pmp: producto.pmp,
      }
    );
  }

  async getHistorialPrecios(
    productoId: string,
    proveedorId?: string
  ): Promise<HistorialPrecio[]> {
    const query = this.dataSource
      .getRepository(HistorialPrecio)
      .createQueryBuilder('historial')
      .innerJoinAndSelect('historial.productoProveedor', 'pp')
      .innerJoinAndSelect('pp.proveedor', 'proveedor')
      .where('pp.productoId = :productoId', { productoId });

    if (proveedorId) {
      query.andWhere('pp.proveedorId = :proveedorId', { proveedorId });
    }

    query.orderBy('historial.fecha', 'DESC');

    return query.getMany();
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

  private validatePrecioMayorQueCero(
    precioUnitario: number,
    proveedorId: string
  ): void {
    if (precioUnitario <= 0) {
      throw new BadRequestException(
        `El precio unitario del proveedor ${proveedorId} debe ser mayor que 0`
      );
    }
  }

  private async registrarPrecioYResolverPrecioActual(
    manager: EntityManager,
    productoProveedorId: string,
    precio: number
  ): Promise<number> {
    if (precio <= 0) {
      throw new BadRequestException(
        I18nHelper.getError('PRICE_MUST_BE_GREATER_THAN_ZERO')
      );
    }

    const historial = manager.create(HistorialPrecio, {
      productoProveedorId,
      precio,
      fecha: new Date(),
    });
    await manager.save(HistorialPrecio, historial);

    const latestHistorial = await manager.findOne(HistorialPrecio, {
      where: { productoProveedorId },
      order: { fecha: 'DESC', createdAt: 'DESC' },
    });

    if (!latestHistorial) {
      throw new InternalServerErrorException(
        'No se pudo resolver el precio vigente desde el historial de precios'
      );
    }

    return latestHistorial.precio;
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

      if (
        proveedor.precioUnitario !== undefined &&
        proveedor.precioUnitario !== null
      ) {
        this.validatePrecioMayorQueCero(
          proveedor.precioUnitario,
          proveedor.proveedorId
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

          precioUnitario: p.precioUnitario,
          marca: p.marcaEspecifica,
          codigoBarras: p.codigoBarras,
          pmp: 0,
        })
      );

      const savedNewRelations = await manager.save(
        ProductoProveedor,
        newRelations
      );

      for (const relation of savedNewRelations) {
        const payload = newProveedores.find(
          (proveedor) => proveedor.proveedorId === relation.proveedorId
        );

        if (
          !payload ||
          payload.precioUnitario === undefined ||
          payload.precioUnitario === null
        ) {
          continue;
        }

        const precioActual = await this.registrarPrecioYResolverPrecioActual(
          manager,
          relation.id,
          payload.precioUnitario
        );

        relation.precioUnitario = precioActual;
        await manager.update(
          ProductoProveedor,
          { id: relation.id },
          { precioUnitario: precioActual }
        );
      }
    }

    if (proveedoresToUpdate.length > 0) {
      for (const p of proveedoresToUpdate) {
        const toUpdate = existing.find((e) => e.proveedorId === p.proveedorId);
        if (toUpdate) {
          if (
            p.precioUnitario !== undefined &&
            p.precioUnitario !== null &&
            p.precioUnitario !== toUpdate.precioUnitario
          ) {
            toUpdate.precioUnitario =
              await this.registrarPrecioYResolverPrecioActual(
                manager,
                toUpdate.id,
                p.precioUnitario
              );
          }

          toUpdate.marca = p.marcaEspecifica ?? toUpdate.marca;
          toUpdate.codigoBarras = p.codigoBarras ?? toUpdate.codigoBarras;

          await manager.update(
            ProductoProveedor,
            { id: toUpdate.id },
            {
              precioUnitario: toUpdate.precioUnitario,
              marca: toUpdate.marca,
              codigoBarras: toUpdate.codigoBarras,
            }
          );
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
