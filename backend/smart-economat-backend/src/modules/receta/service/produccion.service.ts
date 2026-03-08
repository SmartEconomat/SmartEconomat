import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { RecetaRepository } from '../repository/receta.repository';
import { EjecutarProduccionDto } from '../dto/ejecutar-produccion.dto';
import { ProduccionLote } from '../produccion-lote.entity/produccion-lote.entity';
import { Inventario } from '../../inventario/inventario.entity/inventario.entity';
import { Movimiento } from '../../movimiento/movimiento.entity/movimiento.entity';
import { ProductoProveedor } from '../../producto/producto-proveedor.entity/producto-proveedor.entity';
import { TipoMovimiento } from '../../movimiento/enums/movimiento.enums';
import { I18nHelper } from '../../../common/helpers/i18n.helper';

@Injectable()
export class ProduccionService {
  constructor(
    private readonly recetaRepository: RecetaRepository,
    private readonly dataSource: DataSource
  ) {}

  async ejecutarProduccion(
    dto: EjecutarProduccionDto,
    userId: string
  ): Promise<ProduccionLote> {
    const receta = await this.recetaRepository.findById(dto.recetaId);

    if (!receta) {
      throw new NotFoundException(I18nHelper.getError('RECIPE_NOT_FOUND'));
    }

    if (!receta.productoResultado) {
      throw new BadRequestException(
        I18nHelper.getError('RECIPE_NO_RESULT_PRODUCT')
      );
    }

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

    const productoResultadoId = receta.productoResultado.id;

    const productoProveedorResultado = await this.dataSource
      .getRepository(ProductoProveedor)
      .findOne({
        where: { producto: { id: productoResultadoId } },
        relations: ['producto'],
      });

    if (!productoProveedorResultado) {
      throw new BadRequestException(
        I18nHelper.getError('PRODUCT_PROVIDER_NOT_FOUND')
      );
    }

    return this.dataSource.transaction(async (manager) => {
      const multiplicador = dto.cantidadProducida / receta.rendimiento!;

      const productoIds = receta.ingredientes.map((i) => i.producto.id);

      const inventarios = await manager
        .createQueryBuilder(Inventario, 'inv')
        .innerJoinAndSelect('inv.productoProveedor', 'pp')
        .innerJoinAndSelect('pp.producto', 'prod')
        .where('pp.id_producto IN (:...productoIds)', { productoIds })
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
        const cantidadNeta = ing.cantidad * multiplicador;
        const merma = Number(ing.mermaAplicada ?? 0);
        const cantidadBruta =
          merma > 0 && merma < 100
            ? cantidadNeta / (1 - merma / 100)
            : cantidadNeta;

        let cantidadRequerida = cantidadBruta;

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

          const precioUnitario =
            inv.productoProveedor.precioUnitario != null
              ? Number(inv.productoProveedor.precioUnitario)
              : 0;
          costeTotalReal += precioUnitario * descontar;

          consumos.push({
            inv,
            descontar,
            pp: inv.productoProveedor,
            descripcion: `Producción: ${receta.nombre} — consumo de ${ing.producto.nombre}`,
          });
        }
      }

      await manager.save(Inventario, inventarios);

      let fechaCaducidad: Date | null = null;
      if (dto.fechaCaducidadManual) {
        fechaCaducidad = new Date(dto.fechaCaducidadManual);
      } else if (receta.diasCaducidad && receta.diasCaducidad > 0) {
        fechaCaducidad = new Date();
        fechaCaducidad.setDate(fechaCaducidad.getDate() + receta.diasCaducidad);
      }

      const lote = manager.create(ProduccionLote, {
        receta: { id: receta.id } as any,
        usuario: { id: userId } as any,
        cantidadProducida: dto.cantidadProducida,
        fechaProduccion: new Date(),
        fechaCaducidad,
        costeTotalReal,
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

      const inventarioResultado = manager.create(Inventario, {
        productoProveedor: productoProveedorResultado,
        cantidadActual: dto.cantidadProducida,
        cantidadMinima: 0,
        cantidadMaxima: null,
        ubicacion: { id: dto.ubicacionDestinoId } as any,
        fechaEntrada: new Date(),
        fechaCaducidad,
      });
      await manager.save(inventarioResultado);

      const movResultado = manager.create(Movimiento, {
        tipo: TipoMovimiento.PRODUCCION_RESULTADO,
        cantidad: dto.cantidadProducida,
        inventario: inventarioResultado,
        productoProveedor: productoProveedorResultado,
        entidad: 'ProduccionLote',
        entidadId: lote.id,
        descripcion: `Producción: ${receta.nombre} — resultado en inventario`,
        usuario: { id: userId } as any,
      });
      await manager.save(movResultado);

      const savedLote = await manager.findOne(ProduccionLote, {
        where: { id: lote.id },
        relations: ['receta', 'usuario'],
      });

      return savedLote!;
    });
  }

  async findAll(): Promise<ProduccionLote[]> {
    return this.dataSource.getRepository(ProduccionLote).find({
      relations: ['receta', 'usuario'],
      order: { fechaProduccion: 'DESC' },
    });
  }

  async findOne(id: string): Promise<ProduccionLote> {
    const lote = await this.dataSource.getRepository(ProduccionLote).findOne({
      where: { id },
      relations: ['receta', 'usuario'],
    });

    if (!lote) {
      throw new NotFoundException(
        I18nHelper.getError('PRODUCCION_LOTE_NOT_FOUND')
      );
    }

    return lote;
  }
}
