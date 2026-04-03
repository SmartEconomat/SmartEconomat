import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ESTADO_LOTE_DB_VALUES, EstadoLote } from '../enums/estado-lote.enum';
import { EstadoPedido } from '../enums/estado-pedido.enum';
import { Usuario } from '../../usuario/usuario.entity/usuario.entity';
import { Pedido } from '../pedido.entity/pedido.entity';

/**
 * Entidad PurchaseBatch (Lote de Compra)
 *
 * Representa una compra agrupada que puede incluir varios pedidos del mismo día,
 * siempre manteniendo un único proveedor por pedido.
 */
@Entity({ name: 'purchase_batch' })
@Index(['estado'])
@Index(['createdAt'])
@Index(['usuarioId'])
export class PurchaseBatch extends BaseEntity {
  @Column({ name: 'usuario_id', nullable: true })
  usuarioId?: string;

  /**
   * Usuario que creó el lote de pedidos.
   */
  @ManyToOne(() => Usuario, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'usuario_id' })
  usuario?: Relation<Usuario>;

  /**
   * Indica si el lote ha sido aprobado por un responsable.
   */
  @Column({ default: false, name: 'is_aprobado' })
  isAprobado: boolean;

  /**
   * Observaciones generales para el lote.
   */
  @Column({ type: 'text', nullable: true, name: 'observaciones' })
  observaciones?: string;

  /**
   * Estado agregado del lote en función de sus pedidos.
   */
  @Column({
    type: 'enum',
    enum: ESTADO_LOTE_DB_VALUES,
    enumName: 'purchase_batch_estado_enum',
    default: EstadoLote.PENDIENTE,
  })
  estado!: EstadoLote;

  /**
   * Lista de pedidos que componen este lote.
   */
  @OneToMany(() => Pedido, (pedido) => pedido.batch, {
    cascade: true,
  })
  pedidos!: Relation<Pedido[]>;

  /* --- Lógica de Dominio --- */

  /**
   * Calcula el estado agregado basado en el estado de los pedidos vinculados.
   *
   * @param {Pedido[]} pedidos - Lista opcional de pedidos (si ya están cargados).
   * @returns {EstadoLote} - El estado calculado.
   */
  static calcularEstadoLote(pedidos: Pedido[]): EstadoLote {
    if (!pedidos || pedidos.length === 0) {
      return EstadoLote.PENDIENTE;
    }

    const estados = pedidos.map((p) => p.estado);
    const estadosFinales = new Set<EstadoPedido>([
      EstadoPedido.RECEPCIONADO,
      EstadoPedido.CANCELADO,
    ]);

    if (estados.every((estado) => estado === EstadoPedido.CANCELADO)) {
      return EstadoLote.CANCELADO;
    }

    if (estados.some((estado) => estado === EstadoPedido.INCIDENCIA)) {
      return EstadoLote.INCIDENCIA;
    }

    if (estados.every((estado) => estadosFinales.has(estado))) {
      return EstadoLote.COMPLETADO;
    }

    if (
      estados.some(
        (estado) =>
          estado === EstadoPedido.PARCIAL ||
          estado === EstadoPedido.RECEPCIONADO
      )
    ) {
      return EstadoLote.PARCIAL;
    }

    return EstadoLote.PENDIENTE;
  }
}
