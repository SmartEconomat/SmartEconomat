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
import { Inventario } from '../../inventario/inventario.entity/inventario.entity';
import { Movimiento } from '../../movimiento/movimiento.entity/movimiento.entity';
import { TipoMovimiento } from '../../movimiento/enums/movimiento.enums';
import { ProductoProveedor } from '../../producto/producto-proveedor.entity/producto-proveedor.entity';
import { I18nHelper } from '../../../common/helpers/i18n.helper';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';
import { Alergeno } from 'src/modules/producto/enums/producto.enums';

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

    const productoIds = receta.ingredientes.map((i) => i.producto.id);

    const productosProveedores = await this.dataSource
      .getRepository(ProductoProveedor)
      .createQueryBuilder('pp')
      .innerJoinAndSelect('pp.producto', 'producto')
      .leftJoinAndSelect('pp.historialPrecios', 'historial')
      .where('producto.id IN (:...productoIds)', { productoIds })
      .getMany();

    const ppMap = new Map<string, ProductoProveedor[]>();
    for (const pp of productosProveedores) {
      const pid = pp.producto.id;
      if (!ppMap.has(pid)) ppMap.set(pid, []);
      ppMap.get(pid)!.push(pp);
    }

    let costoTotal = 0;
    const desglosePorIngrediente: IngredienteCostoDto[] = [];

    for (const ing of receta.ingredientes) {
      const pps = ppMap.get(ing.producto.id) ?? [];

      const precios = pps
        .map((pp) => pp.precioUnitario)
        .filter((p): p is number => p !== null && p !== undefined && p > 0);

      let precioUnitario: number;

      if (precios.length > 0) {
        precioUnitario =
          precios.reduce((sum, p) => sum + p, 0) / precios.length;
      } else {
        const allHistorial = pps
          .flatMap((pp) => pp.historialPrecios ?? [])
          .sort(
            (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
          );
        precioUnitario = allHistorial.length > 0 ? allHistorial[0].precio : 0;
      }

      const merma = Number(ing.mermaAplicada ?? 0) / 100;
      const cantidadReal =
        merma > 0 && merma < 1 ? ing.cantidad / (1 - merma) : ing.cantidad;

      const costoIngrediente = precioUnitario * cantidadReal;
      costoTotal += costoIngrediente;

      desglosePorIngrediente.push({
        productoId: ing.producto.id,
        productoNombre: ing.producto.nombre,
        cantidad: ing.cantidad,
        cantidadReal,
        unidad: ing.unidad,
        precioUnitario,
        costoIngrediente,
      });
    }

    return {
      recetaId: receta.id,
      recetaNombre: receta.nombre,
      costoTotal,
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
