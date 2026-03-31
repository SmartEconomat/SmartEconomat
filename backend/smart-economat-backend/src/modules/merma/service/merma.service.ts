import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { I18nHelper } from '../../../common/helpers/i18n.helper';
import { Inventario } from '../../inventario/inventario.entity/inventario.entity';
import { Movimiento } from '../../movimiento/movimiento.entity/movimiento.entity';
import { TipoMovimiento } from '../../movimiento/enums/movimiento.enums';
import { Producto } from '../../producto/producto.entity/producto.entity';
import { CreateMermaDto } from '../dto/create-merma.dto';
import { Merma } from '../merma.entity/merma.entity';

const MERMA_UMBRAL_ALTO = 50;

@Injectable()
export class MermaService {
  private readonly logger = new Logger(MermaService.name);

  constructor(
    @InjectRepository(Merma)
    private readonly mermaRepository: Repository<Merma>,
    @InjectRepository(Producto)
    private readonly productoRepository: Repository<Producto>,
    private readonly dataSource: DataSource
  ) {}

  async create(dto: CreateMermaDto, userId: string): Promise<Merma> {
    const producto = await this.productoRepository.findOne({
      where: { id: dto.productoId },
    });

    if (!producto) {
      throw new NotFoundException(I18nHelper.getError('PRODUCT_NOT_FOUND'));
    }

    const merma = await this.dataSource.transaction(async (manager) => {
      const inventarios = await manager
        .createQueryBuilder(Inventario, 'inv')
        .innerJoinAndSelect('inv.productoProveedor', 'pp')
        .innerJoinAndSelect('pp.producto', 'prod')
        .where('pp.productoId = :productoId', { productoId: dto.productoId })
        .andWhere('inv.cantidad_actual > 0')
        .orderBy('inv.fecha_caducidad', 'ASC', 'NULLS LAST')
        .addOrderBy('inv.fecha_entrada', 'ASC')
        .setLock('pessimistic_write')
        .getMany();

      const stockTotal = inventarios.reduce(
        (sum, inv) => sum + Number(inv.cantidadActual),
        0
      );

      if (stockTotal < dto.cantidad) {
        throw new BadRequestException(
          I18nHelper.getError('NOT_ENOUGH_STOCK_FOR_INGREDIENT', {
            ingredient: producto.nombre,
          })
        );
      }

      const consumos: Array<{ inv: Inventario; descontar: number }> = [];
      let cantidadPendiente = dto.cantidad;

      for (const inv of inventarios) {
        if (cantidadPendiente <= 0) {
          break;
        }

        const descontar = Math.min(
          Number(inv.cantidadActual),
          cantidadPendiente
        );

        inv.ajustarCantidad(-descontar);
        cantidadPendiente -= descontar;
        consumos.push({ inv, descontar });
      }

      await manager.save(Inventario, inventarios);

      const nuevaMerma = manager.create(Merma, {
        producto: { id: dto.productoId } as Producto,
        usuario: { id: userId } as any,
        cantidad: dto.cantidad,
        motivo: dto.motivo,
        notas: dto.notas,
      });
      await manager.save(Merma, nuevaMerma);

      const movimientos = consumos.map(({ inv, descontar }) =>
        manager.create(Movimiento, {
          tipo: TipoMovimiento.MERMA,
          cantidad: descontar,
          inventario: inv,
          productoProveedor: inv.productoProveedor,
          entidad: 'Merma',
          entidadId: nuevaMerma.id,
          descripcion: `Merma de ${producto.nombre} — motivo: ${dto.motivo}`,
          usuario: { id: userId } as any,
        })
      );
      await manager.save(Movimiento, movimientos);

      return nuevaMerma;
    });

    if (dto.cantidad >= MERMA_UMBRAL_ALTO) {
      this.logger.warn(
        `[SECURITY] Merma de alto valor registrada: productoId=${dto.productoId} cantidad=${dto.cantidad} motivo=${dto.motivo} usuarioId=${userId} mermaId=${merma.id}`
      );
    }

    return merma;
  }

  async findAll(
    query: PaginationQueryDto
  ): Promise<PaginatedResponseDto<Merma>> {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 50);
    const sortBy = query.sortBy ?? 'createdAt';
    const order = query.order ?? 'DESC';

    const [data, total] = await this.mermaRepository.findAndCount({
      relations: ['producto', 'usuario'],
      order: { [sortBy]: order },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async findOne(id: string): Promise<Merma> {
    const merma = await this.mermaRepository.findOne({
      where: { id },
      relations: ['producto', 'usuario'],
    });

    if (!merma) {
      throw new NotFoundException(I18nHelper.getError('MERMA_NOT_FOUND'));
    }

    return merma;
  }

  async getStats(): Promise<{ porMotivo: unknown[]; porProducto: unknown[] }> {
    const porMotivo = await this.mermaRepository
      .createQueryBuilder('m')
      .select('m.motivo', 'motivo')
      .addSelect('COUNT(*)', 'totalRegistros')
      .addSelect('SUM(m.cantidad)', 'totalCantidad')
      .where('m.deleted_at IS NULL')
      .groupBy('m.motivo')
      .orderBy('"totalCantidad"', 'DESC')
      .getRawMany();

    const porProducto = await this.mermaRepository
      .createQueryBuilder('m')
      .innerJoin('m.producto', 'p')
      .select('m.producto_id', 'productoId')
      .addSelect('p.nombre', 'productoNombre')
      .addSelect('COUNT(*)', 'totalRegistros')
      .addSelect('SUM(m.cantidad)', 'totalCantidad')
      .where('m.deleted_at IS NULL')
      .groupBy('m.producto_id')
      .addGroupBy('p.nombre')
      .orderBy('"totalCantidad"', 'DESC')
      .getRawMany();

    return { porMotivo, porProducto };
  }
}
