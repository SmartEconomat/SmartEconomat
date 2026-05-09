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
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
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
 * Servicio encargado de la lógica de negocio de los productos maestros.
 * Gestiona el ciclo de vida del producto, incluyendo la relación con múltiples proveedores,
 * el control de alérgenos, el cálculo automático de PMP (Precio Medio Ponderado)
 * y la persistencia de cambios de precio históricos.
 */
@Injectable()
export class ProductoService {
  /**
   * Crea una instancia de ProductoService.
   * @param productoRepository Repositorio personalizado para operaciones de base de datos de productos.
   * @param productoProveedorRepository Repositorio para la relación N:M entre productos y proveedores.
   * @param productoAlergenoRepository Repositorio para la asociación de alérgenos.
   * @param archivoService Servicio para la gestión de archivos adjuntos (imágenes).
   * @param movimientoHelper Ayudante para registrar trazas de auditoría.
   * @param dataSource Fuente de datos para gestión de transacciones manuales.
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
   * Crea un producto maestro junto con sus relaciones iniciales en una transacción atómica.
   * Si no se proporciona código de barras, se genera uno automáticamente.
   * @param createProductoDto Datos de creación del producto.
   * @param userId ID del usuario que realiza la acción (para auditoría).
   * @returns El producto persistido con sus relaciones cargadas.
   * @throws ConflictException Si el código de barras ya existe.
   * @throws BadRequestException Si el código de barras no es válido.
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

    if (
      rest.nombre &&
      (await this.productoRepository.existsActiveByNombreNormalized(
        rest.nombre
      ))
    ) {
      throw new ConflictException(
        I18nHelper.getError('PRODUCT_NAME_DUPLICATE')
      );
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
          proveedores,
          savedProduct.codigoBarras,
          savedProduct.marca
        );
      }

      await this.recalcularPmpProducto(savedProduct.id, manager);

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
   * Recupera una lista paginada de productos aplicando filtros dinámicos.
   * @param query Filtros de búsqueda (nombre, EAN, categoría, marca, alérgenos).
   * @param userRole Rol del usuario solicitante para aplicar reglas de visibilidad.
   * @returns Objeto con datos paginados y metadatos de paginación.
   */
  async findAll(
    query: ProductFilterDto,
    userRole?: string
  ): Promise<PaginatedResponseDto<Producto>> {
    void userRole;
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

    const queryBuilder = this.productoRepository.createQueryBuilder('producto');

    if (query.soloEliminados) {
      queryBuilder.withDeleted();
    }

    queryBuilder
      .leftJoinAndSelect('producto.proveedores', 'proveedores')
      .leftJoinAndSelect('proveedores.proveedor', 'proveedor')
      .leftJoinAndSelect('producto.alergenos', 'alergenos');

    if (query.soloEliminados) {
      queryBuilder.andWhere('producto.deleted_at IS NOT NULL');
    } else {
      queryBuilder
        .andWhere('producto.deleted_at IS NULL')
        .andWhere('producto.activo = :productoActivo', {
          productoActivo: true,
        });
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

  /**
   * Busca un producto por su UUID.
   * @param id Identificador único del producto.
   * @param _userRole (Opcional) Rol del usuario para futuras restricciones de visibilidad.
   * @returns El producto encontrado con proveedores y alérgenos.
   * @throws NotFoundException Si el producto no existe.
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
   * Actualiza los datos de un producto y sincroniza sus relaciones (alérgenos/proveedores).
   * Gestiona la limpieza de imágenes antiguas si han sido reemplazadas.
   * @param id UUID del producto a actualizar.
   * @param updateProductoDto Datos a modificar.
   * @param userId ID del usuario que realiza la acción.
   * @returns El producto actualizado.
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

        if (
          rest.nombre !== undefined &&
          rest.nombre.trim().toLowerCase() !==
            (producto.nombre ?? '').trim().toLowerCase() &&
          (await this.productoRepository.existsActiveByNombreNormalized(
            rest.nombre,
            id
          ))
        ) {
          throw new ConflictException(
            I18nHelper.getError('PRODUCT_NAME_DUPLICATE')
          );
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
          await this.syncProveedoresWithManager(
            manager,
            id,
            proveedores,
            producto.codigoBarras,
            producto.marca
          );
        }

        await this.recalcularPmpProducto(id, manager);

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
   * Restaura un producto que fue eliminado lógicamente.
   * @param id UUID del producto.
   * @param userId ID del usuario que restaura.
   * @returns El producto restaurado.
   */
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

    const nameConflict = await this.productoRepository
      .createQueryBuilder('p')
      .where('p.id != :id', { id })
      .andWhere('p.deletedAt IS NULL')
      .andWhere('LOWER(TRIM(p.nombre)) = LOWER(TRIM(:nombre))', {
        nombre: producto.nombre,
      })
      .getOne();

    if (nameConflict) {
      throw new ConflictException(
        I18nHelper.getError('PRODUCT_NAME_DUPLICATE')
      );
    }

    if (producto.codigoBarras) {
      const barcodeConflict = await this.productoRepository
        .createQueryBuilder('p')
        .where('p.id != :id', { id })
        .andWhere('p.deletedAt IS NULL')
        .andWhere('p.codigoBarras = :cb', { cb: producto.codigoBarras })
        .getOne();

      if (barcodeConflict) {
        throw new ConflictException(
          I18nHelper.getError('BARCODE_ALREADY_REGISTERED')
        );
      }
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
  /**
   * Elimina lógicamente un producto del sistema.
   * Valida que no esté siendo utilizado en ninguna receta activa.
   * @param id UUID del producto.
   * @param userId ID del usuario que elimina.
   * @throws ConflictException Si el producto está en uso por una receta.
   */
  /**
   * Expone "remove" en smart-economat-backend (Nest).
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {string} userId - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<void>} Datos efectivos después de ejecutar la operación.
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
   * Genera un código EAN-13 aleatorio y verifica su unicidad en la base de datos.
   * @returns Un código EAN-13 válido y único.
   * @throws InternalServerErrorException Si falla tras múltiples reintentos.
   */
  /**
   * Genera artefactos sintéticos a partir del estado conocido.
   * @undefined {Promise<string>} Datos efectivos después de ejecutar la operación.
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
      I18nHelper.getError('EAN13_GENERATION_FAILED')
    );
  }

  /**
   * Actualiza el Precio Medio Ponderado (PMP) de una variante de producto-proveedor.
   * Se dispara habitualmente tras una recepción de mercancía.
   * @param productoProveedorId ID de la relación producto-proveedor.
   * @param nuevaCantidad Cantidad recibida en la nueva entrada.
   * @param nuevoPrecio Precio unitario de la nueva entrada.
   * @param manager Manager de transacción (opcional).
   * @returns El nuevo PMP calculado para esa variante.
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
      lock: { mode: 'pessimistic_write' },
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
    const cantidadNormalizada = Math.max(0, Number(nuevaCantidad) || 0);
    const stockAnteriorPP = Math.max(0, stockTotalPP - cantidadNormalizada);
    let pmpAnteriorPP = Number(pp.pmp);

    if (pmpAnteriorPP <= 0) {
      pmpAnteriorPP = Number(pp.precioUnitario) || 0;
    }

    const divisorPP = stockAnteriorPP + cantidadNormalizada;
    const nuevoPmpPP =
      divisorPP > 0
        ? (stockAnteriorPP * pmpAnteriorPP +
            cantidadNormalizada * nuevoPrecio) /
          divisorPP
        : nuevoPrecio;

    const finalPmp = Number(nuevoPmpPP.toFixed(4));

    await em.update(
      ProductoProveedor,
      { id: productoProveedorId },
      { pmp: finalPmp }
    );
    pp.pmp = finalPmp;

    const productoId = pp.productoId || pp.producto?.id;
    if (productoId) {
      await this.recalcularPmpProducto(productoId, em);
    }

    return pp.pmp;
  }

  /**
   * Recalcula el PMP global de un producto basándose en el stock y PMP de todas sus variantes de proveedor.
   * @param productoId UUID del producto maestro.
   * @param em EntityManager para operaciones transaccionales.
   */
  private async recalcularPmpProducto(
    productoId: string,
    em: EntityManager
  ): Promise<void> {
    const producto = await em.findOne(Producto, {
      where: { id: productoId },
      lock: { mode: 'pessimistic_write' },
    });
    if (!producto) return;

    const ppRepo = em.getRepository(ProductoProveedor);
    const proveedores = await ppRepo.find({
      where: { productoId: producto.id },
    });

    if (proveedores.length === 0) return;

    const ppIds = proveedores.map((p) => p.id);

    const todosInventarios = await em.find(Inventario, {
      where: { productoProveedorId: In(ppIds) },
    });

    let stockTotal = 0;
    let sumaPonderada = 0;

    for (const pp of proveedores) {
      const invPP = todosInventarios.filter(
        (inv) => inv.productoProveedorId === pp.id
      );
      const stockPP = invPP.reduce(
        (sum, inv) => sum + Number(inv.cantidadActual),
        0
      );
      const pmpPP =
        Number(pp.pmp) > 0 ? Number(pp.pmp) : Number(pp.precioUnitario) || 0;
      stockTotal += stockPP;
      sumaPonderada += stockPP * pmpPP;
    }

    if (stockTotal <= 0) {
      /** Sin stock físico el PMP ponderado no existe; usamos la media de precios de referencia por proveedor. */
      const refs: number[] = [];
      for (const pp of proveedores) {
        const ref =
          Number(pp.pmp) > 0
            ? Number(pp.pmp)
            : Number(pp.precioUnitario) > 0
              ? Number(pp.precioUnitario)
              : 0;
        if (ref > 0) {
          refs.push(ref);
        }
      }
      if (refs.length === 0) {
        return;
      }
      const fallbackPmp = Number(
        (refs.reduce((a, b) => a + b, 0) / refs.length).toFixed(4)
      );
      await em.update(Producto, { id: productoId }, { pmp: fallbackPmp });
      return;
    }

    const nuevoPmp = Number((sumaPonderada / stockTotal).toFixed(4));

    await em.update(
      Producto,
      { id: productoId },
      {
        pmp: nuevoPmp,
      }
    );
  }

  /**
   * Recupera el histórico de variaciones de precio de un producto.
   * @param productoId UUID del producto.
   * @param proveedorId (Opcional) ID del proveedor para filtrar el historial.
   * @returns Lista cronológica de cambios de precio.
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
   * Garantiza que la lista de alérgenos no contenga duplicados.
   * @param alergenos Lista de alérgenos a validar.
   * @returns Lista de alérgenos únicos o undefined si no se proporcionaron.
   * @throws ConflictException Si se detectan alérgenos duplicados.
   */
  private ensureUniqueAlergenos(
    alergenos?: ProductoAlergeno['alergeno'][]
  ): ProductoAlergeno['alergeno'][] | undefined {
    if (alergenos === undefined) {
      return undefined;
    }

    const uniqueAlergenos = [...new Set(alergenos)];

    if (uniqueAlergenos.length !== alergenos.length) {
      throw new ConflictException(I18nHelper.getError('DUPLICATE_ALLERGENS'));
    }

    return uniqueAlergenos;
  }

  /**
   * Valida que el precio unitario sea estrictamente positivo.
   * @param precioUnitario Valor del precio a validar.
   * @param proveedorId ID del proveedor asociado (para el mensaje de error).
   * @throws BadRequestException Si el precio es <= 0.
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
   * Registra un nuevo precio en el historial y devuelve el precio vigente.
   * @param manager EntityManager para la transacción.
   * @param productoProveedorId ID de la relación producto-proveedor.
   * @param precio Nuevo precio a registrar.
   * @returns El precio confirmado del historial.
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
   * Valida la integridad del payload de proveedores (duplicados, existencia, precios).
   * @param manager EntityManager para consultas.
   * @param proveedores Lista de proveedores a validar.
   * @param requirePrecioUnitario Si es obligatorio que cada proveedor tenga precio.
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
      throw new ConflictException(I18nHelper.getError('DUPLICATE_SUPPLIER'));
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
   * Reemplaza todos los alérgenos de un producto por una nueva lista.
   * @param manager EntityManager para la transacción.
   * @param productoId ID del producto.
   * @param alergenos Nueva lista de alérgenos.
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
   * Sincroniza la relación entre el producto y sus proveedores.
   * Crea nuevas relaciones o actualiza las existentes (precios, marcas, EANs).
   * @param manager EntityManager para la transacción.
   * @param productoId ID del producto maestro.
   * @param proveedores Lista de proveedores sincronizar.
   */
  /**
   * Sincroniza la relación entre el producto y sus proveedores.
   * Crea nuevas relaciones, actualiza las existentes y elimina las que ya no están en la lista.
   * @param manager EntityManager para la transacción.
   * @param productoId ID del producto maestro.
   * @param proveedores Lista de proveedores a sincronizar.
   * @param productoBarcode Código de barras maestro del producto (para detección de herencia).
   */
  private async syncProveedoresWithManager(
    manager: EntityManager,
    productoId: string,
    proveedores: AddProveedorToProductoDto[],
    productoBarcode?: string,
    masterMarca?: string
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
          producto: { id: productoId } as any,
          proveedor: { id: p.proveedorId } as any,

          precioUnitario: p.precioUnitario,
          marca: p.marcaEspecifica === masterMarca ? null : p.marcaEspecifica,
          codigoBarras:
            p.codigoBarras === productoBarcode ? null : p.codigoBarras,
          pmp: 0,
        } as any)
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

          const payloadUpdate: QueryDeepPartialEntity<ProductoProveedor> = {
            precioUnitario: toUpdate.precioUnitario,
            marca:
              p.marcaEspecifica === masterMarca
                ? null
                : (p.marcaEspecifica ?? toUpdate.marca),
            codigoBarras:
              p.codigoBarras === productoBarcode ? null : p.codigoBarras,
          };

          await manager.update(
            ProductoProveedor,
            { id: toUpdate.id },
            payloadUpdate
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

    await this.recalcularPmpProducto(productoId, manager);
  }
}
