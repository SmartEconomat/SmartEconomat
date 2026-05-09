import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, EntityManager, In } from 'typeorm';
import { Inventario } from '../inventario.entity/inventario.entity';
import { Transferencia } from '../transferencia.entity/transferencia.entity';
import { TransferenciaLinea } from '../transferencia.entity/transferencia-linea.entity';
import { CrearTransferenciaInventarioDto } from '../dto/crear-transferencia-inventario.dto';
import { EstadoTransferencia } from '../enums/estado-transferencia.enum';
import { UbicacionAccesoPoliticaService } from '../../ubicacion/service/ubicacion-acceso-politica.service';
import { Movimiento } from '../../movimiento/movimiento.entity/movimiento.entity';
import { TipoMovimiento } from '../../movimiento/enums/movimiento.enums';
import { I18nHelper } from '../../../common/helpers/i18n.helper';
import { Ubicacion } from '../../ubicacion/ubicacion.entity/ubicacion.entity';

/**
 * Caso de uso enterprise: traslado ACID de saldos entre ubicaciones con
 * orden formal, filas bloqueadas y trazabilidad en `movimiento`.
 */
@Injectable()
export class InventarioTransferenciaStockService {
  /**
   * Servicio de aplicación para transferencias desde inventario.
   */
  constructor(
    private readonly dataSource: DataSource,
    private readonly accesoUbicacion: UbicacionAccesoPoliticaService
  ) {}

  /**
   * Ejecuta una transferencia inmediata (estado COMPLETADA).
   * Respeta idempotencia por `idempotenciaKey` repitiendo el mismo resultado lógico.
   */
  async ejecutarTransferenciaInmediata(
    dto: CrearTransferenciaInventarioDto,
    usuarioId: string | undefined,
    usuarioRol: string | undefined
  ): Promise<Transferencia> {
    const lineasOrdenadas = [...dto.lineas].sort((a, b) =>
      a.inventarioOrigenId.localeCompare(b.inventarioOrigenId)
    );

    return this.dataSource.transaction(async (manager) => {
      const keyTrim = dto.idempotenciaKey?.trim();
      if (keyTrim) {
        const prev = await manager.findOne(Transferencia, {
          where: { idempotenciaKey: keyTrim },
          relations: ['lineas'],
        });
        if (
          prev?.estado === EstadoTransferencia.COMPLETADA &&
          (prev.lineas?.length ?? 0) > 0
        ) {
          return prev;
        }
      }

      const ubicParaAcl = new Set<string>();

      for (const ln of lineasOrdenadas) {
        const invPeek = await manager.findOne(Inventario, {
          where: { id: ln.inventarioOrigenId },
        });
        if (!invPeek) {
          throw new NotFoundException(
            I18nHelper.getError('INVENTARIO_NOT_FOUND')
          );
        }
        if (invPeek.deletedAt) {
          throw new BadRequestException(
            I18nHelper.getError('INVENTARIO_DELETED_CANNOT_ADJUST')
          );
        }
        if (invPeek.ubicacionId) {
          ubicParaAcl.add(invPeek.ubicacionId);
        }
        ubicParaAcl.add(ln.ubicacionDestinoId);
      }

      await this.accesoUbicacion.assertPuedeTransferirEnUbicaciones(
        usuarioId,
        usuarioRol,
        [...ubicParaAcl]
      );

      const ubicCount = await manager.count(Ubicacion, {
        where: { id: In([...ubicParaAcl]) },
      });
      if (ubicCount !== ubicParaAcl.size) {
        throw new NotFoundException(I18nHelper.getError('LOCATION_NOT_FOUND'));
      }

      const transferencia = manager.create(Transferencia, {
        estado: EstadoTransferencia.COMPLETADA,
        usuarioId: usuarioId ?? null,
        observaciones: dto.observaciones ?? null,
        idempotenciaKey: keyTrim ?? null,
      });
      await manager.save(Transferencia, transferencia);

      for (const ln of lineasOrdenadas) {
        await this.procesarLinea(
          manager,
          transferencia.id,
          ln.inventarioOrigenId,
          ln.ubicacionDestinoId,
          ln.cantidad,
          usuarioId
        );
      }

      const completa = await manager.findOne(Transferencia, {
        where: { id: transferencia.id },
        relations: [
          'lineas',
          'lineas.inventarioOrigen',
          'lineas.inventarioDestino',
        ],
      });
      if (!completa) {
        throw new NotFoundException(
          I18nHelper.getError('INVENTARIO_NOT_FOUND')
        );
      }
      return completa;
    });
  }

  /**
   * Vuelve a leer inventario bloqueándolo para escritura.
   */
  private async recargarInventarioBloqueado(
    manager: EntityManager,
    id: string
  ): Promise<Inventario | null> {
    return manager
      .createQueryBuilder(Inventario, 'inv')
      .innerJoinAndSelect('inv.productoProveedor', 'pp')
      .where('inv.id = :id', { id })
      .setLock('pessimistic_write')
      .getOne();
  }

  /**
   * Aplica deltas de stock sobre origen y destino y registra línea + movimiento.
   */
  private async procesarLinea(
    manager: EntityManager,
    transferenciaId: string,
    inventarioOrigenId: string,
    ubicacionDestinoId: string,
    cantidadPedida: number,
    usuarioId: string | undefined
  ): Promise<void> {
    const origen = await this.recargarInventarioBloqueado(
      manager,
      inventarioOrigenId
    );

    if (!origen || origen.deletedAt) {
      throw new NotFoundException(I18nHelper.getError('INVENTARIO_NOT_FOUND'));
    }

    const origenUb = origen.ubicacionId ?? null;

    let destino = await this.buscarOBloquearDestino(
      manager,
      origen.productoProveedorId,
      ubicacionDestinoId,
      origen.fechaCaducidad ?? null
    );

    if (origenUb !== null && origenUb === ubicacionDestinoId) {
      throw new BadRequestException(I18nHelper.getError('TRANSFER_SAME_NODE'));
    }

    const qty = Number(cantidadPedida);
    const disponible = Number(origen.cantidadActual);
    if (!Number.isFinite(qty) || qty <= 0) {
      throw new BadRequestException(I18nHelper.getError('TRANSFER_BAD_QTY'));
    }
    if (qty > disponible) {
      throw new ConflictException(
        I18nHelper.getError('TRANSFER_INSUFFICIENT_STOCK', {
          tiene: disponible,
          solicitado: qty,
        })
      );
    }

    if (!destino) {
      const creado = manager.create(Inventario, {
        productoProveedorId: origen.productoProveedorId,
        ubicacionId: ubicacionDestinoId,
        cantidadActual: 0,
        cantidadMinima: origen.cantidadMinima,
        cantidadMaxima: origen.cantidadMaxima ?? null,
        fechaCaducidad: origen.fechaCaducidad ?? null,
      });
      await manager.save(Inventario, creado);
      destino = await this.buscarOBloquearDestino(
        manager,
        origen.productoProveedorId,
        ubicacionDestinoId,
        origen.fechaCaducidad ?? null
      );
    }

    if (!destino) {
      throw new ConflictException(
        I18nHelper.getError('INVENTARIO_DUPLICATE_GRAIN_RACE')
      );
    }

    origen.cantidadActual = disponible - qty;
    await manager.save(Inventario, origen);

    if (origen.cantidadActual === 0) {
      await manager.softDelete(Inventario, origen.id);
    }

    const destReload = await this.recargarInventarioBloqueado(
      manager,
      destino.id
    );
    if (!destReload || destReload.deletedAt) {
      throw new NotFoundException(I18nHelper.getError('INVENTARIO_NOT_FOUND'));
    }

    const cantidadDestinoPrevDb = Number(destReload.cantidadActual);
    destReload.cantidadActual = cantidadDestinoPrevDb + qty;
    await manager.save(Inventario, destReload);

    const linea = manager.create(TransferenciaLinea, {
      transferenciaId,
      inventarioOrigenId: origen.id,
      inventarioDestinoId: destReload.id,
      ubicacionOrigenId: origenUb,
      ubicacionDestinoId,
      productoProveedorId: origen.productoProveedorId,
      cantidad: qty,
    });
    const guardada = await manager.save(TransferenciaLinea, linea);

    await manager.save(
      Movimiento,
      manager.create(Movimiento, {
        tipo: TipoMovimiento.TRANSFERENCIA,
        cantidad: qty,
        inventarioId: origen.id,
        productoProveedorId: origen.productoProveedorId,
        entidad: 'TransferenciaLinea',
        entidadId: guardada.id,
        descripcion:
          origen.productoProveedor?.producto?.nombre != null
            ? `Transferencia (${origen.productoProveedor.producto.nombre}): ${origenUb ?? 'sin_ubicacion'} → ${ubicacionDestinoId}`
            : `Transferencia (${origen.productoProveedorId})`,
        ...(usuarioId ? { usuarioId } : {}),
        ubicacionOrigenId:
          typeof origenUb === 'string' && origenUb.length > 0
            ? origenUb
            : undefined,
        ubicacionDestinoId,
        transferenciaId,
        datosAntes: {
          cantidadOrigenPrev: disponible,
          cantidadDestinoPrev: cantidadDestinoPrevDb,
          inventarioOrigenId: origen.id,
        },
        datosDespues: {
          cantidadOrigenPost: origen.cantidadActual,
          cantidadDestinoPost: Number(destReload.cantidadActual),
          inventarioDestinoId: destReload.id,
        },
      })
    );
  }

  /** Busca fila inventario compatible (mismo PP + ubicación + caducidad) con bloqueo. */
  private async buscarOBloquearDestino(
    manager: EntityManager,
    productoProveedorId: string,
    ubicacionDestinoId: string,
    fechaCaducidad: Date | null
  ): Promise<Inventario | null> {
    const qb = manager
      .createQueryBuilder(Inventario, 'inv')
      .where('inv.productoProveedorId = :ppId', {
        ppId: productoProveedorId,
      })
      .andWhere('inv.ubicacionId = :uId', { uId: ubicacionDestinoId })
      .andWhere('inv.deletedAt IS NULL')
      .setLock('pessimistic_write');

    if (fechaCaducidad === null) {
      qb.andWhere('inv.fechaCaducidad IS NULL');
    } else {
      qb.andWhere('inv.fechaCaducidad = :fcd', { fcd: fechaCaducidad });
    }

    return qb.getOne();
  }
}
