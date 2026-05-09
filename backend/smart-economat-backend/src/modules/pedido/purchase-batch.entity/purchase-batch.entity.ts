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
 * Representa purchase batch en el sistema.
 */
@Entity({ name: 'purchase_batch' })
@Index(['numeroGlobal'], { unique: true })
@Index(['referencia'], { unique: true })
@Index(['estado'])
@Index(['createdAt'])
@Index(['usuarioId'])
export class PurchaseBatch extends BaseEntity {
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @Column({ name: 'numero_global', type: 'bigint', unique: true })
  numeroGlobal!: string;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @Column({ name: 'referencia', type: 'varchar', length: 32, unique: true })
  referencia!: string;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  numeroLote?: string;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  referenciaLote?: string;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @Column({ name: 'usuario_id', nullable: true })
  usuarioId?: string;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @ManyToOne(() => Usuario, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'usuario_id' })
  usuario?: Relation<Usuario>;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @Column({ default: false, name: 'is_aprobado' })
  isAprobado: boolean;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @Column({ type: 'text', nullable: true, name: 'observaciones' })
  observaciones?: string;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @Column({
    type: 'enum',
    enum: ESTADO_LOTE_DB_VALUES,
    enumName: 'purchase_batch_estado_enum',
    default: EstadoLote.PENDIENTE,
  })
  estado!: EstadoLote;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @OneToMany(() => Pedido, (pedido) => pedido.batch, {
    cascade: true,
  })
  pedidos!: Relation<Pedido[]>;

  /* --- Lógica de Dominio --- */

  /**
   * Ejecuta la lógica de calcular estado lote dentro del flujo de la aplicación.
   *
   * @param pedidos Parámetro de entrada para la operación.
   * @returns Valor resultante de la operación.
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
