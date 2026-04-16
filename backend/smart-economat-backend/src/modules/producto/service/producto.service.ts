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

/**
 * Service responsible for managing product (Producto) data, including
 * creation, retrieval, update, removal, barcode generation, allergen
 * management, supplier relationships, and weighted average cost (PMP)
 * calculations.
 *
 * @class ProductoService
 */
@Injectable()
export class ProductoService {
  /**
   * Crea una instancia de ProductoService.
   *
   * @param {ProductoRepository} productoRepository - Custom repository for Producto entity.
   * @param {Repository<ProductoProveedor>} productoProveedorRepository - Repository for ProductoProveedor entity.
   * @param {Repository<ProductoAlergeno>} productoAlergenoRepository - Repository for ProductoAlergeno entity.
   * @param {ArchivoService} archivoService - Service for managing file/image cleanup.
   * @param {MovimientoHelper} movimientoHelper - Helper for tracking stock movement audit events.
   * @param {DataSource} dataSource - TypeORM data source for transactions.
   */
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

  /**
   * Crea un nuevo product with optional allergens and supplier associations
   * in a single transactional operation. Valida or auto-generates the barcode.
   *
   * @param {CreateProductoDto} createProductoDto - DTO containing product creation data.
   * @param {string} userId - ID of the user performing the creation.
   * @returns {Promise<Producto>} The newly created product with relations loaded.
   * @throws {BadRequestException} If the provided barcode is invalid.
   * @throws {ConflictException} If the barcode is already registered.
   * @throws {NotFoundException} If any referenced supplier does not exist.
   */
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

  /**
   * Retrieves a paginated list of products with optional filters such as
   * barcode, search term, categories, brands, allergens, and minimum stock.
   * Admin users also receive soft-deleted records.
   *
   * @param {ProductFilterDto} query - Filtering, sorting, and pagination parameters.
   * @param {string} [userRole] - Role of the requesting user; los administradores ven registros eliminados.
   * @returns {Promise<PaginatedResponseDto<Producto>>} Paginated list of products.
   */
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

    if (isAdmin) {
      queryBuilder.withDeleted();
    }

    if (query.codigoBarras) {
      queryBuilder.andWhere('producto.codigoBarras = :codigoBarras', {
        codigoBarras: query.codigoBarras,
      });
    } else if (query.searchTerm) {
      queryBuilder.andWhere(
        '(producto.nombre ILIKE :searchTerm OR producto.codigoBarras ILIKE :searchTerm OR producto.marca ILIKE :searchTerm)',
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

  /**
   * Retrieves a single product by its ID, including supplier and allergen relations.
   *
   * @param {string} id - UUID of the product to retrieve.
   * @param {string} [_userRole] - Role of the requesting user (reserved for future use).
   * @returns {Promise<Producto>} The found product entity.
   * @throws {NotFoundException} If no product with the given ID exists.
   */
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

  /**
   * Actualiza an existing product's scalar fields, allergens, and supplier
   * associations in a single transaction. Cleans up the old image if replaced.
   *
   * @param {string} id - UUID of the product to update.
   * @param {UpdateProductoDto} updateProductoDto - DTO with the fields to update.
   * @param {string} userId - ID of the user performing the update.
   * @returns {Promise<Producto>} The updated product with all relations loaded.
   * @throws {NotFoundException} If the product does not exist.
   * @throws {BadRequestException} If the new barcode is invalid.
   * @throws {ConflictException} If the new barcode is already in use by another product.
   */
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

  /**
   * Soft-deletes a product after verifying it is not used in any recipe.
   * Also removes the associated image file if present.
   *
   * @param {string} id - UUID of the product to remove.
   * @param {string} userId - ID of the user performing the deletion.
   * @returns {Promise<void>}
   * @throws {NotFoundException} If the product does not exist.
   * @throws {ConflictException} If the product is referenced by one or more recipes.
   */
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

  /**
   * Genera a unique EAN-13 barcode by retrying up to a maximum number
   * of attempts until a non-colliding code is found.
   *
   * @returns {Promise<string>} A unique EAN-13 barcode string.
   * @throws {InternalServerErrorException} If a unique code cannot be generated after the maximum retries.
   */
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

  /**
   * Recalculates and persists the weighted average price (PMP) for a given
   * ProductoProveedor record, then propagates the change to the parent Producto.
   *
   * @param {string} productoProveedorId - UUID of the ProductoProveedor record.
   * @param {number} nuevaCantidad - Quantity being added in the current operation.
   * @param {number} nuevoPrecio - Unit price of the incoming stock.
   * @param {EntityManager} [manager] - Optional transaction entity manager.
   * @returns {Promise<number>} The updated PMP value for the ProductoProveedor.
   */
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
   *
   * @param {string} productoId - UUID of the parent Producto.
   * @param {EntityManager} em - Entity manager to use for database operations.
   * @returns {Promise<void>}
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

    await em.update(Producto, { id: productoId }, { pmp: producto.pmp });
  }

  /**
   * Devuelve el historial de precios for a product, opcionalmente filtrados por proveedor.
   *
   * @param {string} productoId - UUID of the product.
   * @param {string} [proveedorId] - Optional UUID of a specific supplier to filter by.
   * @returns {Promise<HistorialPrecio[]>} Array of price history records ordered by date descending.
   */
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

  /**
   * Deduplicates an allergen array and throws if duplicates are detected.
   *
   * @param {ProductoAlergeno['alergeno'][]} [alergenos] - Array of allergen values to validate.
   * @returns {ProductoAlergeno['alergeno'][] | undefined} Deduplicated array or undefined if not provided.
   * @throws {ConflictException} If the input array contains duplicate allergen entries.
   */
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

  /**
   * Valida that the given unit price is strictly greater than zero.
   *
   * @param {number} precioUnitario - The unit price to validate.
   * @param {string} proveedorId - UUID of the supplier, used in the error message.
   * @returns {void}
   * @throws {BadRequestException} If the price is zero or negative.
   */
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

  /**
   * Records a new price entry in the HistorialPrecio table and returns
   * the latest effective price for the given ProductoProveedor relationship.
   *
   * @param {EntityManager} manager - Entity manager for the current transaction.
   * @param {string} productoProveedorId - UUID of the ProductoProveedor record.
   * @param {number} precio - Price to record.
   * @returns {Promise<number>} The most recent price resolved from the history.
   * @throws {BadRequestException} If the price is not greater than zero.
   * @throws {InternalServerErrorException} If the price cannot be resolved from history.
   */
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

  /**
   * Valida the supplier payload before creating or updating product-supplier
   * associations: checks for duplicate supplier IDs, validates barcodes, verifies
   * that required prices are present, and confirms all referenced suppliers exist in DB.
   *
   * @param {EntityManager} manager - Entity manager for the current transaction.
   * @param {AddProveedorToProductoDto[]} [proveedores] - Array of supplier association DTOs.
   * @param {boolean} [requirePrecioUnitario=false] - si a unit price is mandatory.
   * @returns {Promise<void>}
   * @throws {ConflictException} If the same supplier appears more than once.
   * @throws {BadRequestException} If a barcode is invalid or a required price is missing.
   * @throws {NotFoundException} If any supplier ID does not exist in the database.
   */
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

  /**
   * Replaces all allergen associations for a product by deleting existing
   * records and inserting the new set within the current transaction.
   *
   * @param {EntityManager} manager - Entity manager for the current transaction.
   * @param {string} productoId - UUID of the product whose allergens are being replaced.
   * @param {ProductoAlergeno['alergeno'][]} alergenos - New list of allergen values.
   * @returns {Promise<void>}
   */
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

  /**
   * Synchronises the supplier associations for a product within the current
   * transaction: inserts new relationships, updates changed prices/metadata,
   * and soft-deletes removed ones.
   *
   * @param {EntityManager} manager - Entity manager for the current transaction.
   * @param {string} productoId - UUID of the product being synchronised.
   * @param {AddProveedorToProductoDto[]} proveedores - Desired final set of supplier associations.
   * @returns {Promise<void>}
   */
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
