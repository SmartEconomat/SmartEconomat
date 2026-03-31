import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, ILike, In, Repository, EntityManager } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { Receta } from '../receta.entity/receta.entity';
import { RecetaIngrediente } from '../receta-ingrediente.entity/receta-ingrediente.entity';
import { Producto } from '../../producto/producto.entity/producto.entity';
import { CreateRecetaDto } from '../dto/create-receta.dto';
import { UpdateRecetaDto } from '../dto/update-receta.dto';
import { I18nHelper } from '../../../common/helpers/i18n.helper';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';
import {
  TipoProducto,
  UnidadMedida,
} from '../../producto/enums/producto.enums';
import { UnidadIngrediente } from '../enums/receta.enums';
import { Proveedor } from '../../proveedor/proveedor.entity/proveedor.entity';
import { ProductoProveedor } from '../../producto/producto-proveedor.entity/producto-proveedor.entity';
import { ProductoAlergeno } from '../../producto/producto-alergeno.entity/producto-alergeno.entity';

const INGREDIENTES_RELATIONS = [
  'ingredientes',
  'ingredientes.producto',
  'ingredientes.producto.alergenos',
  'ingredientes.proveedorFavorito',
] as const;

@Injectable()
export class RecetaRepository {
  constructor(
    @InjectRepository(Receta)
    private readonly recetaRepo: Repository<Receta>,

    private readonly dataSource: DataSource
  ) {}

  async create(dto: CreateRecetaDto): Promise<Receta> {
    return this.dataSource.transaction(async (manager) => {
      const productoIds = dto.ingredientes.map((ing) => ing.productoId);

      if (new Set(productoIds).size !== productoIds.length) {
        throw new BadRequestException(
          I18nHelper.getError('DUPLICATE_INGREDIENT')
        );
      }

      const productos = await manager.find(Producto, {
        where: { id: In(productoIds) },
        relations: ['proveedores', 'proveedores.proveedor'],
      });
      const productosMap = new Map(
        productos.map((p) => [p.id.toLowerCase(), p])
      );

      const missingId = productoIds.find(
        (id) => !productosMap.has(id.toLowerCase())
      );
      if (missingId) {
        throw new BadRequestException(I18nHelper.getError('PRODUCT_NOT_FOUND'));
      }

      const receta = manager.create(Receta, {
        nombre: dto.nombre,
        instrucciones: dto.instrucciones,
        tiempoEstimadoMinutos: dto.tiempoEstimadoMinutos,
        dificultad: dto.dificultad,
        ...(dto.rendimiento !== undefined && { rendimiento: dto.rendimiento }),
        ...(dto.unidadResultado !== undefined && {
          unidadResultado: dto.unidadResultado,
        }),
        ...(dto.diasCaducidad !== undefined && {
          diasCaducidad: dto.diasCaducidad,
        }),
        ...(dto.pathImg !== undefined && { pathImg: dto.pathImg }),
        ...(dto.pathImgOptimized !== undefined && {
          pathImgOptimized: dto.pathImgOptimized,
        }),
        ...(dto.raciones !== undefined && { raciones: dto.raciones }),
        ...(dto.tamanioRacion !== undefined && {
          tamanioRacion: dto.tamanioRacion,
        }),
      });

      await manager.save(receta);

      const ingredientes = dto.ingredientes.map((ing) =>
        manager.create(RecetaIngrediente, {
          cantidad: ing.cantidad,
          unidad: ing.unidad,
          mermaAplicada: ing.mermaAplicada ?? 0,
          proveedorFavoritoId: this.resolveProveedorFavoritoId(
            productosMap.get(ing.productoId.toLowerCase()),
            ing.proveedorFavoritoId
          ),
          receta,
          producto: productosMap.get(ing.productoId.toLowerCase()),
        })
      );
      await manager.save(ingredientes);

      const saved = await manager.findOne(Receta, {
        where: { id: receta.id },
        relations: [...INGREDIENTES_RELATIONS],
      });

      if (!saved) {
        throw new NotFoundException(I18nHelper.getError('RECIPE_NOT_FOUND'));
      }

      return saved;
    });
  }

  async findAllPaginated(
    query: PaginationQueryDto,
    userRole?: string
  ): Promise<PaginatedResponseDto<Receta>> {
    const isAdmin =
      userRole?.toUpperCase() === 'ADMIN' ||
      userRole?.toUpperCase() === 'SUPER_ADMIN';
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 50);
    let sortBy = query.sortBy ?? 'nombre';
    const order = query.order ?? 'ASC';

    if (sortBy === 'tiempo' || sortBy === 'tiempoPreparacion') {
      sortBy = 'tiempoEstimadoMinutos';
    }

    const whereCondition = query.searchTerm
      ? [
          { nombre: ILike(`%${query.searchTerm}%`) },
          { instrucciones: ILike(`%${query.searchTerm}%`) },
        ]
      : {};

    const [data, total] = await this.recetaRepo.findAndCount({
      where: whereCondition,
      relations: [...INGREDIENTES_RELATIONS],
      order: { [sortBy]: order },
      skip: (page - 1) * limit,
      take: limit,
      withDeleted: isAdmin,
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async findByIds(ids: string[]): Promise<Receta[]> {
    return this.recetaRepo.find({
      where: { id: In(ids) },
      relations: [...INGREDIENTES_RELATIONS],
    });
  }

  async findById(id: string, userRole?: string): Promise<Receta | null> {
    const isAdmin =
      userRole?.toUpperCase() === 'ADMIN' ||
      userRole?.toUpperCase() === 'SUPER_ADMIN';

    const receta = await this.recetaRepo.findOne({
      where: { id },
      relations: [...INGREDIENTES_RELATIONS],
      withDeleted: isAdmin,
    });

    if (receta && (!receta.rendimiento || receta.rendimiento <= 0)) {
      receta.rendimiento = 1;
      if (!receta.unidadResultado) {
        receta.unidadResultado = UnidadIngrediente.PIEZA;
      }
      await this.recetaRepo.save(receta);
    }

    return receta;
  }

  async update(id: string, dto: UpdateRecetaDto): Promise<Receta> {
    return this.dataSource.transaction(async (manager) => {
      if (dto.ingredientes) {
        const productoIds = dto.ingredientes.map((ing) => ing.productoId);

        if (new Set(productoIds).size !== productoIds.length) {
          throw new BadRequestException(
            I18nHelper.getError('DUPLICATE_INGREDIENT')
          );
        }

        const productos = await manager.find(Producto, {
          where: { id: In(productoIds) },
          relations: ['proveedores', 'proveedores.proveedor'],
        });
        const productosMap = new Map(
          productos.map((p) => [p.id.toLowerCase(), p])
        );

        const missingId = productoIds.find(
          (pid) => !productosMap.has(pid.toLowerCase())
        );
        if (missingId) {
          throw new BadRequestException(
            I18nHelper.getError('PRODUCT_NOT_FOUND')
          );
        }

        await manager.delete(RecetaIngrediente, { receta: { id } });

        const ingredientes = dto.ingredientes.map((ing) =>
          manager.create(RecetaIngrediente, {
            cantidad: ing.cantidad,
            unidad: ing.unidad,
            mermaAplicada: ing.mermaAplicada ?? 0,
            proveedorFavoritoId: this.resolveProveedorFavoritoId(
              productosMap.get(ing.productoId.toLowerCase()),
              ing.proveedorFavoritoId
            ),
            receta: { id } as Receta,
            producto: productosMap.get(ing.productoId.toLowerCase()),
          })
        );
        await manager.save(ingredientes);
      }

      const updateData: QueryDeepPartialEntity<Receta> = {
        ...(dto.nombre !== undefined && { nombre: dto.nombre }),
        ...(dto.instrucciones !== undefined && {
          instrucciones: dto.instrucciones,
        }),
        ...(dto.tiempoEstimadoMinutos !== undefined && {
          tiempoEstimadoMinutos: dto.tiempoEstimadoMinutos,
        }),
        ...(dto.dificultad !== undefined && { dificultad: dto.dificultad }),
        ...(dto.rendimiento !== undefined && { rendimiento: dto.rendimiento }),
        ...(dto.unidadResultado !== undefined && {
          unidadResultado: dto.unidadResultado,
        }),
        ...(dto.diasCaducidad !== undefined && {
          diasCaducidad: dto.diasCaducidad,
        }),
        ...(dto.pathImg !== undefined && { pathImg: dto.pathImg }),
        ...(dto.pathImgOptimized !== undefined && {
          pathImgOptimized: dto.pathImgOptimized,
        }),
        ...(dto.raciones !== undefined && { raciones: dto.raciones }),
        ...(dto.tamanioRacion !== undefined && {
          tamanioRacion: dto.tamanioRacion,
        }),
      };

      if (Object.keys(updateData).length > 0) {
        await manager.update(Receta, id, updateData);
      }

      const updated = await manager.findOne(Receta, {
        where: { id },
        relations: [...INGREDIENTES_RELATIONS],
      });

      if (!updated) {
        throw new NotFoundException(I18nHelper.getError('RECIPE_NOT_FOUND'));
      }

      return updated;
    });
  }

  async remove(id: string): Promise<void> {
    const result = await this.recetaRepo.softDelete(id);
    if (result.affected === 0) {
      throw new NotFoundException(I18nHelper.getError('RECIPE_NOT_FOUND'));
    }
  }

  async duplicate(sourceId: string, newName: string): Promise<Receta> {
    const sourceReceta = await this.findById(sourceId);

    if (!sourceReceta) {
      throw new NotFoundException(I18nHelper.getError('RECIPE_NOT_FOUND'));
    }

    return this.dataSource.transaction(async (manager) => {
      const newReceta = manager.create(Receta, {
        nombre: newName,
        instrucciones: sourceReceta.instrucciones,
        tiempoEstimadoMinutos: sourceReceta.tiempoEstimadoMinutos,
        dificultad: sourceReceta.dificultad,
        ...(sourceReceta.rendimiento != null &&
          !isNaN(sourceReceta.rendimiento) && {
            rendimiento: sourceReceta.rendimiento,
          }),
        ...(sourceReceta.unidadResultado != null && {
          unidadResultado: sourceReceta.unidadResultado,
        }),
        ...(sourceReceta.diasCaducidad != null &&
          !isNaN(sourceReceta.diasCaducidad) && {
            diasCaducidad: sourceReceta.diasCaducidad,
          }),
        raciones: sourceReceta.raciones,
        tamanioRacion: sourceReceta.tamanioRacion,
      });

      await manager.save(newReceta);

      if (sourceReceta.ingredientes?.length) {
        const ingredientes = sourceReceta.ingredientes.map((ing) =>
          manager.create(RecetaIngrediente, {
            cantidad: ing.cantidad,
            unidad: ing.unidad,
            mermaAplicada: ing.mermaAplicada ?? 0,
            proveedorFavoritoId: ing.proveedorFavoritoId,
            receta: newReceta,
            producto: ing.producto,
          })
        );
        await manager.save(ingredientes);
      }

      const saved = await manager.findOne(Receta, {
        where: { id: newReceta.id },
        relations: [...INGREDIENTES_RELATIONS],
      });

      if (!saved) {
        throw new NotFoundException(I18nHelper.getError('RECIPE_NOT_FOUND'));
      }

      return saved;
    });
  }

  async ensureProductoElaborado(
    manager: EntityManager,
    receta: Pick<Receta, 'nombre' | 'unidadResultado' | 'ingredientes'>
  ): Promise<Producto> {
    const ingredientesProductos =
      receta.ingredientes
        ?.map((ingrediente) => ingrediente.producto)
        .filter((producto): producto is Producto => Boolean(producto)) ?? [];

    return this.resolveProductoElaborado(
      manager,
      receta.nombre,
      receta.unidadResultado || undefined,
      ingredientesProductos
    );
  }

  private resolveProveedorFavoritoId(
    producto?: Producto,
    proveedorFavoritoId?: string
  ): string | undefined {
    const proveedores = producto?.proveedores ?? [];

    if (!producto || proveedores.length === 0) {
      return proveedorFavoritoId;
    }

    if (
      proveedorFavoritoId &&
      proveedores.some(
        (proveedor) => proveedor.proveedorId === proveedorFavoritoId
      )
    ) {
      return proveedorFavoritoId;
    }

    const proveedoresConPrecio = proveedores.filter(
      (proveedor) => typeof proveedor.precioUnitario === 'number'
    );

    if (proveedoresConPrecio.length > 0) {
      return proveedoresConPrecio.reduce((cheapest, current) =>
        (current.precioUnitario ?? Number.POSITIVE_INFINITY) <
        (cheapest.precioUnitario ?? Number.POSITIVE_INFINITY)
          ? current
          : cheapest
      ).proveedorId;
    }

    return proveedores.find((proveedor) => proveedor.proveedorId)?.proveedorId;
  }

  private async resolveProductoElaborado(
    manager: EntityManager,
    recetaNombre: string,
    unidadResultado?: UnidadIngrediente,
    ingredientesProductos: Producto[] = []
  ): Promise<Producto> {
    const existing = await manager.findOne(Producto, {
      where: { nombre: ILike(recetaNombre.trim()) },
      relations: ['alergenos'],
    });

    if (existing) {
      await this.ensureInternalProviderLink(manager, existing.id);
      await this.syncAlergenosToProducto(
        manager,
        existing.id,
        ingredientesProductos
      );
      return existing;
    }

    const newProduct = manager.create(Producto, {
      nombre: recetaNombre,
      tipo: TipoProducto.ELABORADO,
      unidad: this.mapUnidadRecetaToMedida(
        unidadResultado || UnidadIngrediente.PIEZA
      ),
      contenido: 1,
    });

    const savedProduct = await manager.save(Producto, newProduct);

    await this.ensureInternalProviderLink(manager, savedProduct.id);

    if (ingredientesProductos.length > 0) {
      await this.syncAlergenosToProducto(
        manager,
        savedProduct.id,
        ingredientesProductos
      );
    }

    return savedProduct;
  }

  private async ensureInternalProviderLink(
    manager: EntityManager,
    productoId: string
  ): Promise<void> {
    const existingLink = await manager.findOne(ProductoProveedor, {
      where: { productoId },
    });

    if (existingLink) {
      return;
    }

    let internalProvider = await manager.findOne(Proveedor, {
      where: { nombre: ILike('Producción Propia') },
    });

    if (!internalProvider) {
      internalProvider = manager.create(Proveedor, {
        nombre: 'Producción Propia',
        email: 'produccion@economat.internal',
        nif: 'INTERNAL-PP-001',
        telefono: '000000000',
        direccion: 'Sede Central',
      });
      internalProvider = await manager.save(Proveedor, internalProvider);
    }

    const pp = manager.create(ProductoProveedor, {
      productoId,
      proveedorId: internalProvider.id,
      precioUnitario: 0,
      marca: 'Interna',
    });
    await manager.save(ProductoProveedor, pp);
  }

  private mapUnidadRecetaToMedida(unidad: UnidadIngrediente): UnidadMedida {
    const map: Record<string, UnidadMedida> = {
      [UnidadIngrediente.KILOGRAMO]: UnidadMedida.KG,
      [UnidadIngrediente.GRAMO]: UnidadMedida.G,
      [UnidadIngrediente.LITRO]: UnidadMedida.L,
      [UnidadIngrediente.MILILITRO]: UnidadMedida.ML,
      [UnidadIngrediente.PIEZA]: UnidadMedida.UNIDAD,
    };
    return map[unidad] || UnidadMedida.UNIDAD;
  }

  private async syncAlergenosToProducto(
    manager: EntityManager,
    productoId: string,
    ingredientesProductos: Producto[]
  ) {
    if (ingredientesProductos.length === 0) return;

    const alergenosSet = new Set<string>();
    for (const prod of ingredientesProductos) {
      if (prod.alergenos) {
        prod.alergenos.forEach((pa) => alergenosSet.add(pa.alergeno));
      }
    }

    if (alergenosSet.size === 0) return;

    await manager.delete(ProductoAlergeno, { productoId });

    const paRows = Array.from(alergenosSet).map((alergeno) =>
      manager.create(ProductoAlergeno, {
        productoId,
        alergeno: alergeno as any,
      })
    );
    await manager.save(ProductoAlergeno, paRows);
  }
}
