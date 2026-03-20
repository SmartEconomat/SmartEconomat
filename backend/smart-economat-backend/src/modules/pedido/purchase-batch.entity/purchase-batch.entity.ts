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
import { EstadoLote } from '../enums/estado-lote.enum';
import { EstadoPedido } from '../enums/estado-pedido.enum';
import { Usuario } from '../../usuario/usuario.entity/usuario.entity';
import { Pedido } from '../pedido.entity/pedido.entity';

/**
 * Entidad PurchaseBatch (Lote de Compra)
 *
 * Agrupa múltiples pedidos creados en una misma operación para su trazabilidad conjunta.
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
   * Observaciones generales para el lote.
   */
  @Column({ type: 'text', nullable: true, name: 'observaciones' })
  observaciones?: string;

  /**
   * Estado agregado del lote en función de sus pedidos.
   */
  @Column({
    type: 'enum',
    enum: EstadoLote,
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
    if (!pedidos || pedidos.length === 0) return EstadoLote.PENDIENTE;

    const estados = pedidos.map((p) => p.estado);

    if (estados.every((e) => e === EstadoPedido.PENDIENTE)) {
      return EstadoLote.PENDIENTE;
    }

    const estadosFinales = [
      EstadoPedido.RECIBIDO,
      EstadoPedido.CANCELADO,
      EstadoPedido.INCIDENCIA,
    ];
    if (estados.every((e) => estadosFinales.includes(e))) {
      return EstadoLote.COMPLETADO;
    }

    return EstadoLote.PARCIAL;
  }
}
