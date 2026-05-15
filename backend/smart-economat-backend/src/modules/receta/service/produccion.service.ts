import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  Brackets,
  DataSource,
  EntityManager,
  ILike,
  In,
  QueryFailedError,
} from 'typeorm';
import { RecetaRepository } from '../repository/receta.repository';
import { EjecutarProduccionDto } from '../dto/ejecutar-produccion.dto';
import { ProduccionLote } from '../produccion-lote.entity/produccion-lote.entity';
import { Inventario } from '../../inventario/inventario.entity/inventario.entity';
import { Movimiento } from '../../movimiento/movimiento.entity/movimiento.entity';
import { ProductoProveedor } from '../../producto/producto-proveedor.entity/producto-proveedor.entity';
import { TipoMovimiento } from '../../movimiento/enums/movimiento.enums';
import { ProductoAlergeno } from '../../producto/producto-alergeno.entity/producto-alergeno.entity';
import { Producto } from '../../producto/producto.entity/producto.entity';
import { Alergeno, TipoProducto } from '../../producto/enums/producto.enums';
import { EstadoLote } from '../enums/receta.enums';
import { Ubicacion } from '../../ubicacion/ubicacion.entity/ubicacion.entity';
import { I18nHelper } from '../../../common/helpers/i18n.helper';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';
import { ValidarProduccionDto } from '../dto/validar-produccion.dto';
import { Receta } from '../receta.entity/receta.entity';
import { RecetaIngrediente } from '../receta-ingrediente.entity/receta-ingrediente.entity';
import {
  ConsumirProduccionDto,
  TipoConsumoProduccion,
} from '../dto/consumir-produccion.dto';

const CONSUMPTION_FLOAT_TOLERANCE = 0.000001;
const CONSUMPTION_PORTION_STEP = 0.5;

/**
 * Servicio de dominio para produccion.
 */
@Injectable()
export class ProduccionService {
  private readonly logger = new Logger(ProduccionService.name);

  /**
   * Construye la instancia configurada.
   * @undefined {RecetaRepository} recetaRepository - Entrada efectiva esperada por el contrato.
   * @undefined {DataSource} dataSource - Entrada efectiva esperada por el contrato.
   */
  constructor(
    private readonly recetaRepository: RecetaRepository,
    private readonly dataSource: DataSource
  ) {}

  /**
   * Traduce el coeficiente `cantidadAProducir` (escala de cocina, decimal permitido en este flujo)
   * en cantidad física de producto terminado. El factor de ingredientes se obtiene frente a `receta.rendimiento`.
   */
  resolverCantidadFisicaDesdePorcionesPreparacion(
    receta: Receta,
    cantidadAProducir: number
  ): number {
    if (!(cantidadAProducir > 0)) {
      throw new BadRequestException(
        I18nHelper.getError('PRODUCCION_CANTIDAD_PAYLOAD_INVALIDA')
      );
    }

    if (receta.tamanioRacion && Number(receta.tamanioRacion) > 0) {
      return cantidadAProducir * Number(receta.tamanioRacion);
    }

    const racionesReceta =
      receta.raciones && Number(receta.raciones) > 0
        ? Number(receta.raciones)
        : 1;
    const rendimientoBase =
      receta.rendimiento && Number(receta.rendimiento) > 0
        ? Number(receta.rendimiento)
        : racionesReceta;

    return (cantidadAProducir / racionesReceta) * rendimientoBase;
  }

  /**
   * Factor de escalado respecto a la receta base: cantidad física objetivo / rendimiento nominal.
   */
  resolverFactorEscaladoProduccion(
    receta: Receta,
    cantidadFisicaProducida: number
  ): number {
    if (!receta.rendimiento || receta.rendimiento <= 0) {
      throw new BadRequestException(
        I18nHelper.getError('RECIPE_NO_RENDIMIENTO')
      );
    }
    if (!(cantidadFisicaProducida > 0)) {
      throw new BadRequestException(
        I18nHelper.getError('PRODUCCION_CANTIDAD_PAYLOAD_INVALIDA')
      );
    }
    return cantidadFisicaProducida / Number(receta.rendimiento);
  }

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Expone "ejecutarProduccion" en smart-economat-backend (Nest).
   * @undefined {EjecutarProduccionDto} dto - Entrada efectiva esperada por el contrato.
   * @undefined {string} userId - Entrada efectiva esperada por el contrato.
   * @undefined {string | undefined} preparacionId - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<ProduccionLote>} Datos efectivos después de ejecutar la operación.
   */
  async ejecutarProduccion(
    dto: EjecutarProduccionDto,
    userId: string,
    preparacionId?: string,
    transactionManager?: EntityManager
  ): Promise<ProduccionLote> {
    const receta = await this.recetaRepository.findById(dto.recetaId);

    if (!receta) {
      throw new NotFoundException(I18nHelper.getError('RECIPE_NOT_FOUND'));
    }

    const fisicaExplicita =
      dto.cantidadProducida != null && Number(dto.cantidadProducida) > 0;
    const desdePorciones = dto.cantidadAProducir != null;

    if (fisicaExplicita === desdePorciones) {
      throw new BadRequestException(
        I18nHelper.getError('PRODUCCION_CANTIDAD_PAYLOAD_INVALIDA')
      );
    }

    const cantidadFisica = desdePorciones
      ? this.resolverCantidadFisicaDesdePorcionesPreparacion(
          receta,
          dto.cantidadAProducir!
        )
      : Number(dto.cantidadProducida);

    if (!receta.rendimiento || receta.rendimiento <= 0) {
      throw new BadRequestException(
        I18nHelper.getError('RECIPE_NO_RENDIMIENTO')
      );
    }

    if (!receta.ingredientes || receta.ingredientes.length === 0) {
      throw new BadRequestException(
        I18nHelper.getError('RECIPE_NO_INGREDIENTS')
      );
    }

    const multiplicadorPre = this.resolverFactorEscaladoProduccion(
      receta,
      cantidadFisica
    );

    const runWithManager = async (manager: EntityManager) => {
      const loteExistente = await this.findLoteByIdempotencyKey(
        dto.idempotencyKey,
        manager
      );
      if (loteExistente) {
        return loteExistente;
      }

      const productoElaborado =
        await this.recetaRepository.ensureProductoElaborado(manager, receta);

      const productoElaboradoId = productoElaborado.id;

      const productoProveedorResultado =
        await this.recetaRepository.findPreferredProveedorForProductoElaborado(
          manager,
          productoElaboradoId
        );

      if (!productoProveedorResultado) {
        throw new BadRequestException(
          I18nHelper.getError('PRODUCT_PROVIDER_NOT_FOUND')
        );
      }

      const multiplicador = multiplicadorPre;

      const productoIds = receta.ingredientes.map((i) => i.producto.id);

      this.logger.log(
        `Ejecutando producción: recetaId=${receta.id}, productoElaboradoId=${productoElaboradoId}, proveedorResultado=${!!productoProveedorResultado}`
      );

      const inventarios = await manager
        .createQueryBuilder(Inventario, 'inv')
        .innerJoinAndSelect('inv.productoProveedor', 'pp')
        .innerJoinAndSelect('pp.producto', 'prod')
        .where('pp.productoId IN (:...productoIds)', { productoIds })
        .andWhere('inv.cantidad_actual > 0')
        .orderBy('inv.fecha_caducidad', 'ASC', 'NULLS LAST')
        .addOrderBy('inv.fecha_entrada', 'ASC')
        .setLock('pessimistic_write')
        .getMany();

      let costeTotalReal = 0;

      type ConsumoEntry = {
        inv: Inventario;
        descontar: number;
        pp: ProductoProveedor;
        descripcion: string;
      };
      const consumos: ConsumoEntry[] = [];

      for (const ing of receta.ingredientes) {
        const cantidadRequerida = this.calculateIngredientRequiredQuantity(
          ing,
          multiplicador
        );

        const invsProducto = inventarios.filter(
          (inv) => inv.productoProveedor.producto.id === ing.producto.id
        );

        const totalStockInIngredientUnit =
          this.obtenerTotalStockEnUnidadIngrediente(invsProducto, ing.unidad);

        if (totalStockInIngredientUnit < cantidadRequerida) {
          throw new BadRequestException(
            I18nHelper.getError('NOT_ENOUGH_STOCK_FOR_INGREDIENT', {
              ingredient: ing.producto.nombre,
            })
          );
        }

        let remainingToDeductInIngredientUnit = cantidadRequerida;

        for (const inv of invsProducto) {
          if (remainingToDeductInIngredientUnit <= 0) break;

          this.logger.debug(
            `Consumiendo: ing="${ing.producto.nombre}" requerido=${cantidadRequerida} invId=${inv.id} stock=${inv.cantidadActual} unidad=${inv.productoProveedor.producto.unidad}`
          );
          const invUnit = inv.productoProveedor.producto.unidad;
          const disponibleInIngredientUnit =
            Number(inv.cantidadActual) *
            this.conversionFactor(invUnit, ing.unidad);

          const descontarInIngredientUnit = Math.min(
            disponibleInIngredientUnit,
            remainingToDeductInIngredientUnit
          );
          const factor = this.conversionFactor(ing.unidad, invUnit);
          const descontarInInventoryUnit = descontarInIngredientUnit * factor;

          this.logger.debug(
            `Descuento: disponible=${disponibleInIngredientUnit} descontar=${descontarInIngredientUnit} factor=${factor} descontarInvUnit=${descontarInInventoryUnit}`
          );

          inv.ajustarCantidad(-descontarInInventoryUnit);
          remainingToDeductInIngredientUnit -= descontarInIngredientUnit;

          const precioUnitario =
            inv.productoProveedor.precioUnitario != null
              ? Number(inv.productoProveedor.precioUnitario)
              : 0;

          const costAdd = precioUnitario * descontarInInventoryUnit;
          costeTotalReal += costAdd;
          this.logger.debug(
            `Coste: precio=${precioUnitario} costAdd=${costAdd} totalAcumulado=${costeTotalReal}`
          );

          consumos.push({
            inv,
            descontar: descontarInInventoryUnit,
            pp: inv.productoProveedor,
            descripcion: `Producción: ${receta.nombre} — consumo de ${ing.producto.nombre}`,
          });
        }
      }

      this.logger.log(
        `Producción completada: costeTotalReal=${costeTotalReal}`
      );
      await manager.save(Inventario, inventarios);

      let fechaCaducidad: Date | null = null;
      if (dto.fechaCaducidadManual) {
        fechaCaducidad = new Date(dto.fechaCaducidadManual);
      } else if (receta.diasCaducidad && receta.diasCaducidad > 0) {
        fechaCaducidad = new Date();
        fechaCaducidad.setDate(fechaCaducidad.getDate() + receta.diasCaducidad);
      }

      let porcionesProducidas: number;
      if (receta.tamanioRacion && Number(receta.tamanioRacion) > 0) {
        const porcionesExactas = cantidadFisica / Number(receta.tamanioRacion);
        porcionesProducidas = Math.round(porcionesExactas * 2) / 2;
      } else {
        const racionesReceta = receta.raciones || 1;
        const rendimientoBase =
          receta.rendimiento && Number(receta.rendimiento) > 0
            ? Number(receta.rendimiento)
            : racionesReceta;

        const porcionesExactas =
          (cantidadFisica / rendimientoBase) * racionesReceta;
        porcionesProducidas = Math.round(porcionesExactas * 2) / 2;
      }

      const lote = manager.create(ProduccionLote, {
        receta: { id: receta.id } as any,
        usuario: { id: userId } as any,
        preparacionId: preparacionId,
        cantidadProducida: cantidadFisica,
        fechaProduccion: new Date(),
        fechaCaducidad,
        costeTotalReal,
        porcionesProducidas,
        porcionesRestantes: porcionesProducidas,
        estado: EstadoLote.DISPONIBLE,
      });
      await manager.save(lote);

      const movimientosConsumo = consumos.map((c) =>
        manager.create(Movimiento, {
          tipo: TipoMovimiento.PRODUCCION_CONSUMO,
          cantidad: c.descontar,
          inventario: c.inv,
          productoProveedor: c.pp,
          entidad: 'ProduccionLote',
          entidadId: lote.id,
          descripcion: c.descripcion,
          usuario: { id: userId } as any,
        })
      );
      await manager.save(Movimiento, movimientosConsumo);

      let destinoId = dto.ubicacionDestinoId;
      if (!destinoId) {
        const defaultUbicacion = await manager
          .getRepository(Ubicacion)
          .findOne({ where: {} });
        if (!defaultUbicacion) {
          throw new BadRequestException(
            'No se han encontrado ubicaciones en el sistema'
          );
        }
        destinoId = defaultUbicacion.id;
      }

      const inventarioResultado = manager.create(Inventario, {
        productoProveedor: productoProveedorResultado,
        cantidadActual: cantidadFisica,
        cantidadMinima: 0,
        cantidadMaxima: null,
        ubicacion: { id: destinoId } as any,
        fechaEntrada: new Date(),
        fechaCaducidad,
      });
      await manager.save(inventarioResultado);

      const movResultado = manager.create(Movimiento, {
        tipo: TipoMovimiento.PRODUCCION_RESULTADO,
        cantidad: cantidadFisica,
        inventario: inventarioResultado,
        productoProveedor: productoProveedorResultado,
        idempotenciaKey: dto.idempotencyKey,
        entidad: 'ProduccionLote',
        entidadId: lote.id,
        descripcion: `Producción: ${receta.nombre} — resultado en inventario`,
        usuario: { id: userId } as any,
      });
      await manager.save(movResultado);

      const ingredientAllergens = new Set<Alergeno>();
      for (const ing of receta.ingredientes) {
        if (ing.producto.alergenos) {
          ing.producto.alergenos.forEach((pa) =>
            ingredientAllergens.add(pa.alergeno)
          );
        }
      }

      const existingAllergens = await manager.find(ProductoAlergeno, {
        where: { productoId: productoElaboradoId },
      });
      const existingAllergenSet = new Set(
        existingAllergens.map((a) => a.alergeno)
      );

      for (const ag of ingredientAllergens) {
        if (!existingAllergenSet.has(ag)) {
          await manager.save(
            manager.create(ProductoAlergeno, {
              productoId: productoElaboradoId,
              alergeno: ag,
            })
          );
        }
      }

      const nuevoCosteUnitario = costeTotalReal / cantidadFisica;
      await manager.update(Receta, receta.id, {
        costeUnitarioEstimado: nuevoCosteUnitario,
      });

      const savedLote = await manager.findOne(ProduccionLote, {
        where: { id: lote.id },
        relations: ['receta', 'usuario'],
      });

      return savedLote!;
    };

    try {
      if (transactionManager) {
        return await runWithManager(transactionManager);
      }

      return await this.dataSource.transaction(runWithManager);
    } catch (error: unknown) {
      if (this.isUniqueViolation(error)) {
        const loteExistente = await this.findLoteByIdempotencyKey(
          dto.idempotencyKey
        );
        if (loteExistente) {
          return loteExistente;
        }
      }

      throw error;
    }
  }

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Expone "findAll" en smart-economat-backend (Nest).
   * @undefined {PaginationQueryDto} query - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<PaginatedResponseDto<ProduccionLote>>} Datos efectivos después de ejecutar la operación.
   */
  async findAll(
    query: PaginationQueryDto
  ): Promise<PaginatedResponseDto<ProduccionLote>> {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 50);
    const sortBy = query.sortBy ?? 'fechaProduccion';
    const order = query.order ?? 'DESC';
    const estado = (query.estado || '').trim().toLowerCase();
    const searchTerm = (query.searchTerm || query.search || '').trim();
    const estadoNormalizado =
      estado === 'sin_consumo'
        ? EstadoLote.DISPONIBLE
        : estado === 'consumido'
          ? EstadoLote.AGOTADO
          : Object.values(EstadoLote).find((value) => String(value) === estado);
    const repository = this.dataSource.getRepository(ProduccionLote);
    const sortByMap: Record<string, string> = {
      fechaProduccion: 'lote.fechaProduccion',
      fechaAgotado: 'lote.fechaAgotado',
      cantidadProducida: 'lote.cantidadProducida',
      costeTotalReal: 'lote.costeTotalReal',
      porcionesProducidas: 'lote.porcionesProducidas',
      porcionesRestantes: 'lote.porcionesRestantes',
      estado: 'lote.estado',
      recetaNombre: 'receta.nombre',
      usuarioNombre: 'usuario.nombre',
      recetaId: 'receta.nombre',
      usuarioId: 'usuario.nombre',
      createdAt: 'lote.createdAt',
      updatedAt: 'lote.updatedAt',
    };
    const safeSortBy = sortByMap[sortBy] || 'lote.fechaProduccion';
    const safeOrder = order === 'ASC' ? 'ASC' : 'DESC';
    const queryBuilder = repository
      .createQueryBuilder('lote')
      .leftJoinAndSelect('lote.receta', 'receta')
      .leftJoinAndSelect('lote.usuario', 'usuario')
      .andWhere('lote.deleted_at IS NULL');

    if (estadoNormalizado) {
      queryBuilder.andWhere('lote.estado = :estado', {
        estado: estadoNormalizado,
      });
    }

    if (searchTerm) {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('receta.nombre ILIKE :search', {
            search: `%${searchTerm}%`,
          })
            .orWhere('usuario.nombre ILIKE :search', {
              search: `%${searchTerm}%`,
            })
            .orWhere('usuario.username ILIKE :search', {
              search: `%${searchTerm}%`,
            })
            .orWhere('CAST(lote.id AS text) ILIKE :search', {
              search: `%${searchTerm}%`,
            });
        })
      );
    }

    const [data, total] = await queryBuilder
      .orderBy(safeSortBy, safeOrder)
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    if (data.length > 0) {
      const recetaIds = Array.from(
        new Set(data.map((lote) => lote.recetaId).filter(Boolean))
      );

      if (recetaIds.length > 0) {
        const recetasConIngredientes = await this.dataSource
          .getRepository(Receta)
          .find({
            where: { id: In(recetaIds) },
            relations: ['ingredientes', 'ingredientes.producto'],
            withDeleted: true,
          });

        const recetasMap = new Map(
          recetasConIngredientes.map((receta) => [receta.id, receta])
        );

        data.forEach((lote) => {
          const recetaConIngredientes = recetasMap.get(lote.recetaId);
          if (recetaConIngredientes) {
            lote.receta = recetaConIngredientes;
          }
        });
      }
    }

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Expone "consumirPorciones" en smart-economat-backend (Nest).
   * @undefined {string} loteId - Entrada efectiva esperada por el contrato.
   * @undefined {ConsumirProduccionDto} dto - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<ProduccionLote>} Datos efectivos después de ejecutar la operación.
   */
  async consumirPorciones(
    loteId: string,
    dto: ConsumirProduccionDto,
    userId?: string
  ): Promise<ProduccionLote> {
    const loteExistente = await this.findLoteByIdempotencyKey(
      dto.idempotencyKey
    );
    if (loteExistente) {
      if (loteExistente.id !== loteId) {
        throw new BadRequestException(
          'La clave de idempotencia ya se utilizó para otro lote de producción.'
        );
      }
      return loteExistente;
    }

    try {
      return await this.dataSource.transaction(async (manager) => {
        const movimientoExistente = await manager.findOne(Movimiento, {
          where: {
            idempotenciaKey: dto.idempotencyKey,
            entidad: 'ProduccionLote',
          },
        });

        if (movimientoExistente?.entidadId) {
          if (movimientoExistente.entidadId !== loteId) {
            throw new BadRequestException(
              'La clave de idempotencia ya se utilizó para otro lote de producción.'
            );
          }

          const loteRepetido = await manager.findOne(ProduccionLote, {
            where: { id: movimientoExistente.entidadId },
            relations: ['receta', 'usuario'],
          });

          if (loteRepetido) {
            return loteRepetido;
          }
        }

        const lote = await manager.findOne(ProduccionLote, {
          where: { id: loteId },
          lock: { mode: 'pessimistic_write' },
        });

        if (!lote) {
          throw new NotFoundException(
            I18nHelper.getError('PRODUCCION_LOTE_NOT_FOUND')
          );
        }

        if (lote.estado === EstadoLote.AGOTADO) {
          throw new BadRequestException(
            I18nHelper.getError('BATCH_ALREADY_DEPLETED')
          );
        }

        const receta = await manager.findOne(Receta, {
          where: { id: lote.recetaId },
          withDeleted: true,
        });

        if (!receta) {
          throw new NotFoundException(I18nHelper.getError('RECIPE_NOT_FOUND'));
        }

        lote.receta = receta;

        const porciones = this.resolveConsumptionPortions(lote, dto);
        const actuales = Number(lote.porcionesRestantes);
        if (actuales + CONSUMPTION_FLOAT_TOLERANCE < porciones) {
          throw new BadRequestException(
            `No hay suficientes raciones disponibles. Actuales: ${Number(
              actuales.toFixed(3)
            )}`
          );
        }

        const cantidadConsumida = this.resolveConsumptionPhysicalQuantity(
          lote,
          porciones
        );
        const consumosResultado = await this.consumeInventarioProductoElaborado(
          manager,
          receta,
          cantidadConsumida
        );

        const nuevasRestantes = Math.round((actuales - porciones) * 2) / 2;
        lote.porcionesRestantes = nuevasRestantes;

        if (nuevasRestantes <= 0) {
          lote.estado = EstadoLote.AGOTADO;
          lote.fechaAgotado = new Date();
        } else {
          lote.fechaAgotado = null;
        }

        await manager.save(ProduccionLote, lote);

        const usuarioMovimientoId = userId || lote.usuarioId;
        const movimientosSalida = consumosResultado.map((consumo, index) =>
          manager.create(Movimiento, {
            tipo: TipoMovimiento.SALIDA_ELABORACION,
            cantidad: consumo.descontar,
            inventario: consumo.inv,
            productoProveedor: consumo.pp,
            idempotenciaKey: index === 0 ? dto.idempotencyKey : undefined,
            entidad: 'ProduccionLote',
            entidadId: lote.id,
            descripcion: `Consumo de producción: ${receta.nombre}`,
            usuario: usuarioMovimientoId
              ? ({ id: usuarioMovimientoId } as any)
              : undefined,
          })
        );
        await manager.save(Movimiento, movimientosSalida);

        const loteActualizado = await manager.findOne(ProduccionLote, {
          where: { id: lote.id },
          relations: ['receta', 'usuario'],
        });

        return loteActualizado ?? lote;
      });
    } catch (error: unknown) {
      if (this.isUniqueViolation(error)) {
        const loteRepetido = await this.findLoteByIdempotencyKey(
          dto.idempotencyKey
        );
        if (loteRepetido) {
          if (loteRepetido.id !== loteId) {
            throw new BadRequestException(
              'La clave de idempotencia ya se utilizó para otro lote de producción.'
            );
          }
          return loteRepetido;
        }
      }

      throw error;
    }
  }

  private resolveConsumptionPortions(
    lote: ProduccionLote,
    dto: ConsumirProduccionDto
  ): number {
    if (dto.tipo === TipoConsumoProduccion.RACIONES) {
      return dto.valor;
    }

    const recipe = lote.receta;
    if (!recipe) {
      throw new BadRequestException(
        I18nHelper.getError('COULD_NOT_RESOLVE_LOT_RECIPE')
      );
    }

    const cantidadPorRacion = this.resolveAmountPerPortion(recipe);

    if (!cantidadPorRacion || cantidadPorRacion <= 0) {
      throw new BadRequestException(
        'La receta no tiene definida una equivalencia válida por ración.'
      );
    }

    const cantidadPorPaso = cantidadPorRacion * CONSUMPTION_PORTION_STEP;
    const pasosExactos = dto.valor / cantidadPorPaso;
    const pasosRedondeados = Math.round(pasosExactos);

    if (
      Math.abs(pasosExactos - pasosRedondeados) > CONSUMPTION_FLOAT_TOLERANCE
    ) {
      const unidadResultado = recipe.unidadResultado?.trim() || 'unidad';
      const cantidadFormateada = Number(cantidadPorPaso.toFixed(3));

      throw new BadRequestException(
        `La cantidad a consumir debe ser múltiplo de ${cantidadFormateada} ${unidadResultado}.`
      );
    }

    return Number((pasosRedondeados * CONSUMPTION_PORTION_STEP).toFixed(3));
  }

  private resolveAmountPerPortion(recipe: Receta): number | null {
    if (recipe.tamanioRacion && Number(recipe.tamanioRacion) > 0) {
      return Number(recipe.tamanioRacion);
    }

    if (recipe.rendimiento && recipe.raciones && Number(recipe.raciones) > 0) {
      return Number(recipe.rendimiento) / Number(recipe.raciones);
    }

    return null;
  }

  private resolveConsumptionPhysicalQuantity(
    lote: ProduccionLote,
    porciones: number
  ): number {
    const recipe = lote.receta;
    if (!recipe) {
      throw new BadRequestException(
        I18nHelper.getError('COULD_NOT_RESOLVE_LOT_RECIPE')
      );
    }

    const cantidadPorRacion = this.resolveAmountPerPortion(recipe);
    if (!cantidadPorRacion || cantidadPorRacion <= 0) {
      throw new BadRequestException(
        'La receta no tiene definida una equivalencia válida por ración.'
      );
    }

    return Number((porciones * cantidadPorRacion).toFixed(6));
  }

  private async consumeInventarioProductoElaborado(
    manager: EntityManager,
    receta: Receta,
    cantidadConsumida: number
  ): Promise<
    Array<{ inv: Inventario; descontar: number; pp: ProductoProveedor }>
  > {
    const productoElaborado = await manager.findOne(Producto, {
      where: {
        nombre: ILike(receta.nombre.trim()),
        tipo: TipoProducto.ELABORADO,
      },
    });

    if (!productoElaborado) {
      throw new NotFoundException(I18nHelper.getError('PRODUCT_NOT_FOUND'));
    }

    const inventariosResultado = await manager
      .createQueryBuilder(Inventario, 'inv')
      .innerJoinAndSelect('inv.productoProveedor', 'pp')
      .innerJoinAndSelect('pp.producto', 'prod')
      .where('pp.producto_id = :productoId', {
        productoId: productoElaborado.id,
      })
      .andWhere('inv.cantidad_actual > 0')
      .orderBy('inv.fecha_caducidad', 'ASC', 'NULLS LAST')
      .addOrderBy('inv.fecha_entrada', 'ASC')
      .setLock('pessimistic_write')
      .getMany();

    const stockDisponible = inventariosResultado.reduce(
      (acc, inv) => acc + Number(inv.cantidadActual),
      0
    );

    if (stockDisponible + CONSUMPTION_FLOAT_TOLERANCE < cantidadConsumida) {
      throw new BadRequestException(
        I18nHelper.getError('NOT_ENOUGH_STOCK_FOR_INGREDIENT', {
          ingredient: receta.nombre,
        })
      );
    }

    let restante = cantidadConsumida;
    const consumos: Array<{
      inv: Inventario;
      descontar: number;
      pp: ProductoProveedor;
    }> = [];

    for (const inv of inventariosResultado) {
      if (restante <= CONSUMPTION_FLOAT_TOLERANCE) {
        break;
      }

      const disponible = Number(inv.cantidadActual);
      if (disponible <= 0) {
        continue;
      }

      const descontar = Math.min(disponible, restante);
      inv.ajustarCantidad(-descontar);
      restante -= descontar;

      consumos.push({
        inv,
        descontar,
        pp: inv.productoProveedor,
      });
    }

    if (restante > CONSUMPTION_FLOAT_TOLERANCE) {
      throw new BadRequestException(
        I18nHelper.getError('NOT_ENOUGH_STOCK_FOR_INGREDIENT', {
          ingredient: receta.nombre,
        })
      );
    }

    await manager.save(Inventario, inventariosResultado);
    return consumos;
  }

  private async findLoteByIdempotencyKey(
    idempotencyKey: string,
    manager?: EntityManager
  ): Promise<ProduccionLote | null> {
    const movimientoRepository = manager
      ? manager.getRepository(Movimiento)
      : this.dataSource.getRepository(Movimiento);

    const marker = await movimientoRepository.findOne({
      where: {
        idempotenciaKey: idempotencyKey,
        entidad: 'ProduccionLote',
      },
    });

    if (!marker?.entidadId) {
      return null;
    }

    const loteRepository = manager
      ? manager.getRepository(ProduccionLote)
      : this.dataSource.getRepository(ProduccionLote);

    return loteRepository.findOne({
      where: { id: marker.entidadId },
      relations: ['receta', 'usuario'],
    });
  }

  private isUniqueViolation(error: unknown): boolean {
    if (!(error instanceof QueryFailedError)) {
      return false;
    }

    const driverError = error.driverError as { code?: string } | undefined;
    return driverError?.code === '23505';
  }

  /**
   * Busca one.
   *
   * @param id Parámetro de entrada para la operación.
   * @returns Valor resultante de la operación.
   */
  async findOne(id: string): Promise<ProduccionLote> {
    const lote = await this.dataSource.getRepository(ProduccionLote).findOne({
      where: { id },
      relations: ['receta', 'usuario'],
      withDeleted: true,
    });

    if (!lote || lote.deletedAt) {
      throw new NotFoundException(I18nHelper.getError('LOTE_NO_ENCONTRADO'));
    }

    return lote;
  }

  /**
   * Ejecuta la lógica de validar multiple dentro del flujo de la aplicación.
   *
   * @param dto Parámetro de entrada para la operación.
   */
  /**
   * Expone "validarMultiple" en smart-economat-backend (Nest).
   * @undefined {ValidarProduccionDto} dto - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<{ ingredients: { productoId: any; nombre: string; requerido: number; disponible: number; unidad: string; isEnough: boolean; cheapestProveedorId: string; cheapestProveedorNombre: string; cheapestProductoProveedorId: string; cheapestPrecio: number | undefined; isFavorite: boolean; }[]; }>} Datos efectivos después de ejecutar la operación.
   */
  async validarMultiple(dto: ValidarProduccionDto): Promise<{
    ingredients: {
      productoId: string;
      nombre: string;
      requerido: number;
      disponible: number;
      unidad: string;
      isEnough: boolean;
      cheapestProveedorId?: string;
      cheapestProveedorNombre?: string;
      cheapestProductoProveedorId?: string;
      cheapestPrecio?: number;
      isFavorite: boolean;
    }[];
    itemsResumen: {
      recetaId: string;
      cantidadAProducir: number;
      rendimientoBase: number;
      racionesReceta: number;
      cantidadFisicaObjetivo: number;
      factorEscalado: number;
    }[];
  }> {
    const recipeIds = dto.items.map((it) => it.recetaId);
    const itemsResumen: {
      recetaId: string;
      cantidadAProducir: number;
      rendimientoBase: number;
      racionesReceta: number;
      cantidadFisicaObjetivo: number;
      factorEscalado: number;
    }[] = [];

    if (recipeIds.length === 0) return { ingredients: [], itemsResumen };

    const recetas = await this.recetaRepository.findByIds(recipeIds);
    const agregation: Record<
      string,
      {
        product: RecetaIngrediente['producto'];
        required: number;
        unit: string;
        name: string;
        proveedorFavoritoId?: string;
      }
    > = {};

    for (const item of dto.items) {
      const receta = recetas.find((r) => r.id === item.recetaId);
      if (!receta) continue;

      if (!receta.rendimiento || receta.rendimiento <= 0) {
        throw new BadRequestException(
          I18nHelper.getError('RECIPE_NO_RENDIMIENTO')
        );
      }

      if (!receta.ingredientes || receta.ingredientes.length === 0) {
        throw new BadRequestException(
          I18nHelper.getError('RECIPE_NO_INGREDIENTS')
        );
      }

      const cantidadFisicaObjetivo =
        this.resolverCantidadFisicaDesdePorcionesPreparacion(
          receta,
          item.cantidadAProducir
        );

      const multiplicador = this.resolverFactorEscaladoProduccion(
        receta,
        cantidadFisicaObjetivo
      );

      const racionesReceta =
        receta.raciones && Number(receta.raciones) > 0
          ? Number(receta.raciones)
          : 1;

      itemsResumen.push({
        recetaId: item.recetaId,
        cantidadAProducir: item.cantidadAProducir,
        rendimientoBase: Number(Number(receta.rendimiento).toFixed(6)),
        racionesReceta,
        cantidadFisicaObjetivo: Number(
          Number(cantidadFisicaObjetivo).toFixed(3)
        ),
        factorEscalado: Number(multiplicador.toFixed(6)),
      });

      for (const ing of receta.ingredientes) {
        const prodId = ing.producto.id;
        const qty = this.calculateIngredientRequiredQuantity(
          ing,
          multiplicador
        );

        if (!agregation[prodId]) {
          agregation[prodId] = {
            product: ing.producto,
            required: 0,
            unit: String(ing.unidad),
            name: ing.producto.nombre,
            proveedorFavoritoId: ing.proveedorFavoritoId,
          };
        }

        agregation[prodId].required +=
          qty * this.conversionFactor(ing.unidad, agregation[prodId].unit);
      }
    }

    const productIds = Object.keys(agregation);
    const inventarios = await this.dataSource.getRepository(Inventario).find({
      where: { productoProveedor: { producto: { id: In(productIds) } } },
      relations: ['productoProveedor', 'productoProveedor.producto'],
    });

    const proveedores = await this.dataSource
      .getRepository(ProductoProveedor)
      .find({
        where: { productoId: In(productIds) },
        relations: ['proveedor'],
      });

    const results = Object.values(agregation).map((req) => {
      const prodInvs = inventarios.filter(
        (inv) => inv.productoProveedor.producto.id === req.product.id
      );
      const totalStockInReqUnit = this.obtenerTotalStockEnUnidadIngrediente(
        prodInvs,
        req.unit
      );

      const prodProvs = proveedores.filter(
        (p) => p.productoId === req.product.id && p.precioUnitario !== null
      );

      let selected = prodProvs.find(
        (p) => p.proveedorId === req.proveedorFavoritoId
      );
      if (!selected) {
        selected = prodProvs.sort(
          (a, b) => Number(a.precioUnitario) - Number(b.precioUnitario)
        )[0];
      }

      return {
        productoId: req.product.id,
        nombre: req.name,
        requerido: Number(req.required.toFixed(3)),
        disponible: Number(totalStockInReqUnit.toFixed(3)),
        unidad: req.unit,
        isEnough: totalStockInReqUnit >= req.required - 0.0001,
        cheapestProveedorId: selected?.proveedorId,
        cheapestProveedorNombre: selected?.proveedor?.nombre,
        cheapestProductoProveedorId: selected?.id,
        cheapestPrecio: selected?.precioUnitario,
        isFavorite: !!(
          req.proveedorFavoritoId &&
          selected?.proveedorId === req.proveedorFavoritoId
        ),
      };
    });

    return { ingredients: results, itemsResumen };
  }

  private calculateIngredientRequiredQuantity(
    ing: RecetaIngrediente,
    multiplicador: number
  ): number {
    const cantidadNeta = Number(ing.cantidad) * multiplicador;
    const merma = Number(ing.mermaAplicada ?? 0);

    return merma > 0 && merma < 100
      ? cantidadNeta / (1 - merma / 100)
      : cantidadNeta;
  }

  private conversionFactor(fromUnit: unknown, toUnit: unknown): number {
    const from = this.normalizeUnit(fromUnit);
    const to = this.normalizeUnit(toUnit);

    if (!from || !to) {
      throw new BadRequestException(
        I18nHelper.getError('UNSUPPORTED_UNIT_CONVERSION', {
          from: this.formatUnitForError(fromUnit),
          to: this.formatUnitForError(toUnit),
        })
      );
    }

    if (from === to) return 1;

    const map: Record<string, number> = {
      'kg:g': 1000,
      'g:kg': 0.001,
      'l:ml': 1000,
      'ml:l': 0.001,
      'cda:cdta': 3,
      'cdta:cda': 1 / 3,
    };

    const conversionKey = `${from}:${to}`;
    const factor = map[conversionKey];
    if (factor) {
      return factor;
    }

    const fromFamily = this.getUnitFamily(from);
    const toFamily = this.getUnitFamily(to);
    if (fromFamily && toFamily && fromFamily === toFamily) {
      return 1;
    }

    throw new BadRequestException(
      I18nHelper.getError('UNSUPPORTED_UNIT_CONVERSION', {
        from,
        to,
      })
    );
  }

  private formatUnitForError(unit: unknown): string {
    if (
      typeof unit === 'string' ||
      typeof unit === 'number' ||
      typeof unit === 'boolean'
    ) {
      return String(unit);
    }

    return '';
  }

  private normalizeUnit(unit: unknown): string | null {
    const raw = this.formatUnitForError(unit).trim().toLowerCase();

    const aliases: Record<string, string> = {
      kg: 'kg',
      kilogramo: 'kg',
      kilogramos: 'kg',
      g: 'g',
      gr: 'g',
      gramo: 'g',
      gramos: 'g',
      l: 'l',
      litro: 'l',
      litros: 'l',
      ml: 'ml',
      mililitro: 'ml',
      mililitros: 'ml',
      unidad: 'pieza',
      unidades: 'pieza',
      ud: 'pieza',
      uds: 'pieza',
      pieza: 'pieza',
      piezas: 'pieza',
      cda: 'cda',
      cucharada: 'cda',
      cucharadas: 'cda',
      cdta: 'cdta',
      cucharadita: 'cdta',
      cucharaditas: 'cdta',
    };

    return aliases[raw] || null;
  }

  private getUnitFamily(
    unit: string
  ): 'masa' | 'volumen' | 'conteo' | 'cuchara' | null {
    if (unit === 'kg' || unit === 'g') return 'masa';
    if (unit === 'l' || unit === 'ml') return 'volumen';
    if (unit === 'pieza') return 'conteo';
    if (unit === 'cda' || unit === 'cdta') return 'cuchara';
    return null;
  }

  private obtenerTotalStockEnUnidadIngrediente(
    invs: Inventario[],
    targetUnit: any
  ): number {
    let sum = 0;
    for (const inv of invs) {
      const invUnit = inv.productoProveedor.producto.unidad;
      sum +=
        Number(inv.cantidadActual) * this.conversionFactor(invUnit, targetUnit);
    }
    return sum;
  }
}
