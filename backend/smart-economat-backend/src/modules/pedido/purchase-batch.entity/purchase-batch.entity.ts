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
 * Documentación en español.
 */
@Entity({ name: 'purchase_batch' })
@Index(['numeroGlobal'], { unique: true })
@Index(['referencia'], { unique: true })
@Index(['estado'])
@Index(['createdAt'])
@Index(['usuarioId'])
export class PurchaseBatch extends BaseEntity {
        /**
     * Documentación en español.
     */
  @Column({ name: 'numero_global', type: 'bigint', unique: true })
  numeroGlobal!: string;

        /**
     * Documentación en español.
     */
  @Column({ name: 'referencia', type: 'varchar', length: 32, unique: true })
  referencia!: string;

        /**
     * Documentación en español.
     */
  numeroLote?: string;

        /**
     * Documentación en español.
     */
  referenciaLote?: string;

        /**
     * Documentación en español.
     */
  @Column({ name: 'usuario_id', nullable: true })
  usuarioId?: string;

        /**
     * Documentación en español.
     */
  @ManyToOne(() => Usuario, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'usuario_id' })
  usuario?: Relation<Usuario>;

        /**
     * Documentación en español.
     */
  @Column({ default: false, name: 'is_aprobado' })
  isAprobado: boolean;

        /**
     * Documentación en español.
     */
  @Column({ type: 'text', nullable: true, name: 'observaciones' })
  observaciones?: string;

        /**
     * Documentación en español.
     */
  @Column({
    type: 'enum',
    enum: ESTADO_LOTE_DB_VALUES,
    enumName: 'purchase_batch_estado_enum',
    default: EstadoLote.PENDIENTE,
  })
  estado!: EstadoLote;

        /**
     * Documentación en español.
     */
  @OneToMany(() => Pedido, (pedido) => pedido.batch, {
    cascade: true,
  })
  pedidos!: Relation<Pedido[]>;

  /* --- Lógica de Dominio --- */

        /**
     * Documentación en español.
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
