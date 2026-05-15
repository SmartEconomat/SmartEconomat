import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DataSource } from 'typeorm';
import { Receta } from '../receta.entity/receta.entity';
import { RecetaRepository } from '../repository/receta.repository';
import { CreateRecetaDto } from '../dto/create-receta.dto';
import { UpdateRecetaDto } from '../dto/update-receta.dto';
import { DuplicateRecetaDto } from '../dto/duplicate-receta.dto';
import {
  DetalleRecetaDto,
  IngredienteDetalleDto,
} from '../dto/detalle-receta.dto';
import { CocinarRecetaDto } from '../dto/cocinar-receta.dto';
import {
  IngredienteCostoDto,
  RecetaCostResponseDto,
} from '../dto/receta-cost-response.dto';
import { RecetaPreviewCostDto } from '../dto/receta-preview-cost.dto';
import { Producto } from '../../producto/producto.entity/producto.entity';
import { ProductoProveedor } from '../../producto/producto-proveedor.entity/producto-proveedor.entity';
import { Inventario } from '../../inventario/inventario.entity/inventario.entity';
import { I18nHelper } from '../../../common/helpers/i18n.helper';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';
import { Alergeno } from '../../producto/enums/producto.enums';
import { RecetaListQueryDto } from '../dto/receta-list-query.dto';
import { ProduccionService } from './produccion.service';

/**
 * Servicio de dominio para receta.
 */
@Injectable()
export class RecetaService {
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  constructor(
    private readonly recetaRepository: RecetaRepository,
    private readonly dataSource: DataSource,
    private readonly produccionService: ProduccionService
  ) {}

  /**
   * Crea create.
   *
   * @param createRecetaDto Parámetro de entrada para la operación.
   * @returns Valor resultante de la operación.
   */
  async create(createRecetaDto: CreateRecetaDto): Promise<Receta> {
    const receta = await this.recetaRepository.create(createRecetaDto);
    return this.recalcularCostes(receta.id);
  }

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Expone "findAll" en smart-economat-backend (Nest).
   * @undefined {RecetaListQueryDto} query - Entrada efectiva esperada por el contrato.
   * @undefined {string | undefined} userRole - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<PaginatedResponseDto<Receta>>} Datos efectivos después de ejecutar la operación.
   */
  async findAll(
    query: RecetaListQueryDto,
    userRole?: string
  ): Promise<PaginatedResponseDto<Receta>> {
    return this.recetaRepository.findAllPaginated(query, userRole);
  }

  /**
   * Busca one.
   *
   * @param id Parámetro de entrada para la operación.
   * @param userRole Parámetro de entrada para la operación. Opcional.
   * @returns Valor resultante de la operación.
   */
  async findOne(id: string, userRole?: string): Promise<Receta> {
    const receta = await this.recetaRepository.findById(id, userRole);

    if (!receta) {
      throw new NotFoundException(I18nHelper.getError('RECIPE_NOT_FOUND'));
    }

    return receta;
  }

  /**
   * Actualiza update.
   *
   * @param id Parámetro de entrada para la operación.
   * @param updateRecetaDto Parámetro de entrada para la operación.
   * @returns Valor resultante de la operación.
   */
  async update(id: string, updateRecetaDto: UpdateRecetaDto): Promise<Receta> {
    await this.findOne(id);
    await this.recetaRepository.update(id, updateRecetaDto);
    return this.recalcularCostes(id);
  }

  /**
   * Elimina remove.
   *
   * @param id Parámetro de entrada para la operación.
   * @returns Valor resultante de la operación.
   */
  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.recetaRepository.remove(id);
  }

  /**
   * Ejecuta la lógica de duplicate dentro del flujo de la aplicación.
   *
   * @param duplicateRecetaDto Parámetro de entrada para la operación.
   * @returns Valor resultante de la operación.
   */
  async duplicate(duplicateRecetaDto: DuplicateRecetaDto): Promise<Receta> {
    return this.recetaRepository.duplicate(
      duplicateRecetaDto.sourceId,
      duplicateRecetaDto.newName
    );
  }

  /**
   * Obtiene detalle.
   *
   * @param id Parámetro de entrada para la operación.
   * @returns Valor resultante de la operación.
   */
  async getDetalle(id: string): Promise<DetalleRecetaDto> {
    const receta = await this.recetaRepository.findById(id);

    if (!receta) {
      throw new NotFoundException(I18nHelper.getError('RECIPE_NOT_FOUND'));
    }

    const productoIds = receta.ingredientes?.map((i) => i.producto.id) || [];
    let stocks: { productoId: string; totalStock: string | number }[] = [];

    if (productoIds.length > 0) {
      stocks = await this.dataSource
        .getRepository(Inventario)
        .createQueryBuilder('inv')
        .innerJoin('inv.productoProveedor', 'pp')
        .where('pp.producto_id IN (:...productoIds)', { productoIds })
        .select('pp.producto_id', 'productoId')
        .addSelect('SUM(inv.cantidad_actual)', 'totalStock')
        .groupBy('pp.producto_id')
        .getRawMany();
    }

    const stockMap = new Map<string, number>(
      stocks.map((s) => [s.productoId, Number(s.totalStock)])
    );

    const alergenosSet = new Set<Alergeno>();
    const detalleIngredientes: IngredienteDetalleDto[] = [];

    if (receta.ingredientes) {
      for (const ing of receta.ingredientes) {
        const stockActual = stockMap.get(ing.producto.id) || 0;
        const cantidadFaltante = Math.max(0, ing.cantidad - stockActual);

        detalleIngredientes.push({
          cantidadNecesaria: ing.cantidad,
          stockActual,
          cantidadFaltante,
          unidad: ing.unidad,
          productoId: ing.producto.id,
          productoNombre: ing.producto.nombre,
        });

        if (ing.producto.alergenos) {
          ing.producto.alergenos.forEach((pa) => {
            if (pa.alergeno) {
              alergenosSet.add(pa.alergeno);
            }
          });
        }
      }
    }

    return {
      receta,
      detalleIngredientes,
      alergenosConsolidados: Array.from(alergenosSet).filter(
        (a) => a !== null && a !== undefined
      ),
    };
  }

  /**
   * Ejecuta la lógica de calcular escandallo dentro del flujo de la aplicación.
   *
   * @param id Parámetro de entrada para la operación.
   * @returns Valor resultante de la operación.
   */
  async calcularEscandallo(id: string): Promise<RecetaCostResponseDto> {
    const receta = await this.recetaRepository.findById(id);

    if (!receta) {
      throw new NotFoundException(I18nHelper.getError('RECIPE_NOT_FOUND'));
    }

    if (!receta.ingredientes || receta.ingredientes.length === 0) {
      return {
        recetaId: receta.id,
        recetaNombre: receta.nombre,
        costoTotal: 0,
        desglosePorIngrediente: [],
      };
    }

    const itemsDto = receta.ingredientes.map((ing) => ({
      productoId: ing.producto.id,
      cantidad: ing.cantidad,
      unidad: ing.unidad,
      mermaAplicada: ing.mermaAplicada,
      proveedorFavoritoId: ing.proveedorFavoritoId,
    }));

    const result = await this.calculatePreviewCost({
      ingredientes: itemsDto,
      rendimiento: receta.rendimiento || undefined,
    });

    return {
      ...result,
      recetaId: receta.id,
      recetaNombre: receta.nombre,
    };
  }

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Expone "calculatePreviewCost" en smart-economat-backend (Nest).
   * @undefined {RecetaPreviewCostDto} dto - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<RecetaCostResponseDto>} Datos efectivos después de ejecutar la operación.
   */
  async calculatePreviewCost(
    dto: RecetaPreviewCostDto
  ): Promise<RecetaCostResponseDto> {
    const { ingredientes, rendimiento: rendimientoDto } = dto;

    if (!ingredientes || ingredientes.length === 0) {
      return {
        recetaId: '',
        recetaNombre: 'Preview',
        costoTotal: 0,
        desglosePorIngrediente: [],
      };
    }

    const productoIds = ingredientes.map((i) => i.productoId);

    const productos = await this.dataSource
      .getRepository(Producto)
      .createQueryBuilder('p')
      .where('p.id IN (:...productoIds)', { productoIds })
      .getMany();

    const productosMap = new Map<string, Producto>();
    for (const p of productos) {
      productosMap.set(p.id, p);
    }

    const providersRaw = await this.dataSource
      .getRepository(ProductoProveedor)
      .createQueryBuilder('pp')
      .where('pp.productoId IN (:...productoIds)', { productoIds })
      .select('pp.productoId', 'productoId')
      .addSelect('pp.proveedorId', 'proveedorId')
      .addSelect('pp.precioUnitario', 'precioUnitario')
      .getRawMany<{
        productoId: string;
        proveedorId: string;
        precioUnitario: string | number | null;
      }>();

    const providersByProducto = new Map<
      string,
      Array<{ proveedorId: string; precioUnitario: number }>
    >();

    for (const provider of providersRaw) {
      const parsedPrecio = Number(provider.precioUnitario);
      if (
        !provider.productoId ||
        !provider.proveedorId ||
        !Number.isFinite(parsedPrecio) ||
        parsedPrecio <= 0
      ) {
        continue;
      }

      const existing = providersByProducto.get(provider.productoId) ?? [];
      existing.push({
        proveedorId: provider.proveedorId,
        precioUnitario: parsedPrecio,
      });
      providersByProducto.set(provider.productoId, existing);
    }

    let costoTotal = 0;
    const desglosePorIngrediente: IngredienteCostoDto[] = [];

    for (const ing of ingredientes) {
      const producto = productosMap.get(ing.productoId);
      if (!producto) continue;

      const providerPrices = providersByProducto.get(ing.productoId) ?? [];

      const preferredProviderPrice = ing.proveedorFavoritoId
        ? providerPrices.find(
            (provider) => provider.proveedorId === ing.proveedorFavoritoId
          )
        : undefined;

      const cheapestProviderPrice =
        preferredProviderPrice ||
        (providerPrices.length > 0
          ? providerPrices.reduce((cheapest, current) =>
              current.precioUnitario < cheapest.precioUnitario
                ? current
                : cheapest
            )
          : undefined);

      const fallbackPmp = Number(producto.pmp);
      const precioUnitario =
        cheapestProviderPrice?.precioUnitario ??
        (Number.isFinite(fallbackPmp) && fallbackPmp > 0 ? fallbackPmp : 0);

      const mermaBaseProducto = this.normalizarMerma(producto.mermaPorcentaje);
      const mermaIngrediente = this.normalizarMerma(ing.mermaAplicada);
      const mermaEfectiva =
        mermaIngrediente > 0 ? mermaIngrediente : mermaBaseProducto;

      const factorUtilizable = 1 - mermaEfectiva / 100;
      const cantidadReal =
        factorUtilizable > 0 ? ing.cantidad / factorUtilizable : ing.cantidad;

      const costoIngrediente = precioUnitario * cantidadReal;
      costoTotal += costoIngrediente;

      desglosePorIngrediente.push({
        productoId: producto.id,
        productoNombre: producto.nombre,
        cantidad: ing.cantidad,
        cantidadReal,
        unidad: ing.unidad,
        precioUnitario,
        costoIngrediente,
      });
    }

    const rendimiento = rendimientoDto || 1;
    const costoUnitarioEstimado =
      rendimiento > 0 ? costoTotal / rendimiento : costoTotal;

    return {
      recetaId: '',
      recetaNombre: 'Preview',
      costoTotal,
      costoUnitarioEstimado,
      desglosePorIngrediente,
    };
  }

  private normalizarMerma(value?: number | null): number {
    if (value === null || value === undefined) {
      return 0;
    }

    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return 0;
    }

    return Math.min(parsed, 99.99);
  }

  /**
   * Ejecuta la lógica de cocinar dentro del flujo de la aplicación.
   *
   * @param id Parámetro de entrada para la operación.
   * @param dto Parámetro de entrada para la operación.
   * @returns Valor resultante de la operación.
   */
  async cocinar(
    id: string,
    dto: CocinarRecetaDto,
    userId: string
  ): Promise<void> {
    await this.produccionService.ejecutarProduccion(
      {
        recetaId: id,
        cantidadAProducir: dto.cantidad || 1,
        idempotencyKey: randomUUID(),
      },
      userId
    );
  }

  /**
   * Ejecuta la lógica de recalcular costes dentro del flujo de la aplicación.
   *
   * @param id Parámetro de entrada para la operación.
   * @returns Valor resultante de la operación.
   */
  async recalcularCostes(id: string): Promise<Receta> {
    const receta = await this.recetaRepository.findById(id);

    if (!receta) {
      throw new NotFoundException(I18nHelper.getError('RECIPE_NOT_FOUND'));
    }

    const { costoTotal } = await this.calcularEscandallo(id);

    const safeCostoTotal = Number.isFinite(costoTotal) ? costoTotal : 0;
    const safeRendimiento =
      receta.rendimiento &&
      receta.rendimiento > 0 &&
      Number.isFinite(receta.rendimiento)
        ? receta.rendimiento
        : 0;

    const costeUnitarioEstimado =
      safeRendimiento > 0 ? safeCostoTotal / safeRendimiento : safeCostoTotal;

    const safeCosteUnitarioEstimado = Number.isFinite(costeUnitarioEstimado)
      ? costeUnitarioEstimado
      : 0;

    await this.dataSource
      .getRepository(Receta)
      .update(id, { costeUnitarioEstimado: safeCosteUnitarioEstimado });

    const updated = await this.recetaRepository.findById(id);
    return updated!;
  }
}
