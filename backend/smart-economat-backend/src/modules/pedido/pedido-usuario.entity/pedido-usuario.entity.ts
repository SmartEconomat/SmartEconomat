import {
  Check,
  Column,
  Entity,
  Generated,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ColumnNumericTransformer } from '../../../common/transformers/column-numeric.transformer';
import { Usuario } from '../../usuario/usuario.entity/usuario.entity';
import { Ubicacion } from '../../ubicacion/ubicacion.entity/ubicacion.entity';
import { EstadoPedidoUsuario } from '../enums/estado-pedido-usuario.enum';
import { Pedido } from '../pedido.entity/pedido.entity';
import { PedidoUsuarioLinea } from '../pedido-usuario-linea.entity/pedido-usuario-linea.entity';

/**
 * Represents a user-initiated purchase request stored in the `pedido_usuario` table.
 * A PedidoUsuario groups product request lines submitted by a user (e.g. a student or teacher)
 * and is later consolidated by an administrator into one or more Pedido purchase orders.
 *
 * State machine: BORRADOR → PENDIENTE → APROBADO → CONSOLIDADO | CANCELADO
 *
 * @class PedidoUsuario
 * @extends {BaseEntity}
 */
@Entity({ name: 'pedido_usuario' })
@Index(['usuarioId'])
@Index(['numeroGlobal'], { unique: true })
@Index(['estado'])
@Index(['fechaPedido'])
@Check(`"coste_total" >= 0`)
export class PedidoUsuario extends BaseEntity {
  /** Foreign key referencing the User who submitted the request. Nullable (SET NULL on delete). */
  @Column({ name: 'usuario_id', nullable: true })
  usuarioId?: string;

  /** Auto-incremented global sequential reference number for this user order. */
  @Column({ name: 'numero_global', type: 'bigint', unique: true })
  @Generated('increment')
  numeroGlobal!: string;

  /** Date and time when the order was submitted. Defaults to the current timestamp. */
  @Column({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
    name: 'fecha_pedido',
  })
  fechaPedido!: Date;

  /** Expected or requested delivery date. Optional. */
  @Column({ type: 'timestamptz', nullable: true, name: 'fecha_entrega' })
  fechaEntrega?: Date;

  /** Optional free-text notes or special instructions for the order. */
  @Column({ type: 'text', nullable: true, name: 'observaciones' })
  observaciones?: string;

  /**
   * Total estimated cost of all request lines.
   * Constraint: >= 0. Updated when lines are added, modified, or removed.
   */
  @Column({
    type: 'numeric',
    precision: 14,
    scale: 4,
    default: 0,
    name: 'coste_total',
    transformer: new ColumnNumericTransformer(),
  })
  costeTotal!: number;

  /** Current lifecycle state of the user order. */
  @Column({
    type: 'enum',
    enum: EstadoPedidoUsuario,
    enumName: 'estado_pedido_usuario',
    default: EstadoPedidoUsuario.PENDIENTE,
  })
  estado!: EstadoPedidoUsuario;

  /** Foreign key for the suggested delivery location. Nullable. */
  @Column({ name: 'ubicacion_entrega_sugerida_id', nullable: true })
  ubicacionEntregaSugeridaId?: string;

  /**
   * The user who submitted the request.
   * ON DELETE SET NULL preserves historical data if the user is removed.
   */
  @ManyToOne(() => Usuario, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'usuario_id' })
  usuario?: Relation<Usuario>;

  /**
   * Suggested delivery location for this order.
   * ON DELETE SET NULL keeps the order intact if the location is removed.
   */
  @ManyToOne(() => Ubicacion, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'ubicacion_entrega_sugerida_id' })
  ubicacionEntregaSugerida?: Relation<Ubicacion>;

  /** Product request lines belonging to this user order. Cascade insert/update. */
  @OneToMany(() => PedidoUsuarioLinea, (linea) => linea.pedidoUsuario, {
    cascade: true,
  })
  lineas!: Relation<PedidoUsuarioLinea[]>;

  /** Purchase orders (Pedidos) generated from this user request after consolidation. */
  @OneToMany(() => Pedido, (pedido) => pedido.pedidoUsuario)
  pedidos!: Relation<Pedido[]>;
}
