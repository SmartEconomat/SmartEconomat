import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
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
import { Inventario } from '../../inventario/inventario.entity/inventario.entity';
import { Movimiento } from '../../movimiento/movimiento.entity/movimiento.entity';
import { TipoMovimiento } from '../../movimiento/enums/movimiento.enums';
import { I18nHelper } from '../../../common/helpers/i18n.helper';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';
import { Alergeno } from '../../producto/enums/producto.enums';

@Injectable()
export class RecetaService {
  constructor(
    private readonly recetaRepository: RecetaRepository,
    private readonly dataSource: DataSource
  ) {}

  async create(createRecetaDto: CreateRecetaDto): Promise<Receta> {
    const receta = await this.recetaRepository.create(createRecetaDto);
    return this.recalcularCostes(receta.id);
  }

  async findAll(
    query: PaginationQueryDto,
    userRole?: string
  ): Promise<PaginatedResponseDto<Receta>> {
    return this.recetaRepository.findAllPaginated(query, userRole);
  }

  async findOne(id: string, userRole?: string): Promise<Receta> {
    const receta = await this.recetaRepository.findById(id, userRole);

    if (!receta) {
      throw new NotFoundException(I18nHelper.getError('RECIPE_NOT_FOUND'));
    }

    return receta;
  }

  async update(id: string, updateRecetaDto: UpdateRecetaDto): Promise<Receta> {
    await this.findOne(id);
    await this.recetaRepository.update(id, updateRecetaDto);
    return this.recalcularCostes(id);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.recetaRepository.remove(id);
  }

  async duplicate(duplicateRecetaDto: DuplicateRecetaDto): Promise<Receta> {
    return this.recetaRepository.duplicate(
      duplicateRecetaDto.sourceId,
      duplicateRecetaDto.newName
    );
  }

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
      .leftJoinAndSelect('p.proveedores', 'pp')
      .leftJoinAndSelect('pp.proveedor', 'proveedor')
      .where('p.id IN (:...productoIds)', { productoIds })
      .getMany();

    const productosMap = new Map<string, Producto>();
    for (const p of productos) {
      productosMap.set(p.id, p);
    }

    let costoTotal = 0;
    const desglosePorIngrediente: IngredienteCostoDto[] = [];

    for (const ing of ingredientes) {
      const producto = productosMap.get(ing.productoId);
      if (!producto) continue;

      let precioUnitario = 0;

      if (ing.proveedorFavoritoId) {
        const favPP = producto.proveedores?.find(
          (pp) => pp.proveedorId === ing.proveedorFavoritoId
        );
        if (favPP && (favPP.precioUnitario ?? 0) > 0) {
          precioUnitario = favPP.precioUnitario!;
        }
      }

      if (precioUnitario === 0 && (producto.pmp ?? 0) > 0) {
        precioUnitario = producto.pmp;
      }

      if (precioUnitario === 0 && producto.proveedores?.length) {
        const preciosValidos = producto.proveedores
          .map((pp) => pp.precioUnitario)
          .filter((p): p is number => (p ?? 0) > 0);

        if (preciosValidos.length > 0) {
          precioUnitario =
            preciosValidos.reduce((sum, p) => sum + p, 0) /
            preciosValidos.length;
        }
      }

      const merma = Number(ing.mermaAplicada ?? 0) / 100;
      const cantidadReal =
        merma > 0 && merma < 1 ? ing.cantidad / (1 - merma) : ing.cantidad;

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

  async cocinar(id: string, dto: CocinarRecetaDto): Promise<void> {
    const cantidadRecetas = dto.cantidad || 1;
    const receta = await this.recetaRepository.findById(id);

    if (!receta) {
      throw new NotFoundException(I18nHelper.getError('RECIPE_NOT_FOUND'));
    }

    if (!receta.ingredientes || receta.ingredientes.length === 0) {
      return;
    }

    await this.dataSource.transaction(async (manager) => {
      const productoIds = receta.ingredientes.map((i) => i.producto.id);

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

      const movimientos: Movimiento[] = [];

      for (const ing of receta.ingredientes) {
        let cantidadRequerida = ing.cantidad * cantidadRecetas;

        const invsProducto = inventarios.filter(
          (inv) => inv.productoProveedor.producto.id === ing.producto.id
        );

        const totalStock = invsProducto.reduce(
          (sum, inv) => sum + Number(inv.cantidadActual),
          0
        );

        if (totalStock < cantidadRequerida) {
          throw new BadRequestException(
            I18nHelper.getError('NOT_ENOUGH_STOCK_FOR_INGREDIENT', {
              ingredient: ing.producto.nombre,
            })
          );
        }

        for (const inv of invsProducto) {
          if (cantidadRequerida <= 0) break;

          const disponible = Number(inv.cantidadActual);
          const descontar = Math.min(disponible, cantidadRequerida);

          inv.ajustarCantidad(-descontar);
          cantidadRequerida -= descontar;

          const movimiento = manager.create(Movimiento, {
            tipo: TipoMovimiento.SALIDA_ELABORACION,
            cantidad: descontar,
            inventario: inv,
            productoProveedor: inv.productoProveedor,
            entidad: 'Receta',
            entidadId: id,
            descripcion: 'Elaboración de receta: ' + receta.nombre,
          });
          movimientos.push(movimiento);
        }
      }

      await manager.save(Inventario, inventarios);
      await manager.save(Movimiento, movimientos);
    });
  }

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
