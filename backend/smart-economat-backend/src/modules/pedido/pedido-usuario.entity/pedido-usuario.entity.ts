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
 * Documentación en español.
 */
@Entity({ name: 'pedido_usuario' })
@Index(['usuarioId'])
@Index(['numeroGlobal'], { unique: true })
@Index(['estado'])
@Index(['fechaPedido'])
@Check(`"coste_total" >= 0`)
export class PedidoUsuario extends BaseEntity {
  /**
   * Documentación en español.
   */
  @Column({ name: 'usuario_id', nullable: true })
  usuarioId?: string;

  /**
   * Documentación en español.
   */
  @Column({ name: 'numero_global', type: 'bigint', unique: true })
  @Generated('increment')
  numeroGlobal!: string;

  /**
   * Documentación en español.
   */
  @Column({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
    name: 'fecha_pedido',
  })
  fechaPedido!: Date;

  /**
   * Documentación en español.
   */
  @Column({ type: 'timestamptz', nullable: true, name: 'fecha_entrega' })
  fechaEntrega?: Date;

  /**
   * Documentación en español.
   */
  @Column({ type: 'text', nullable: true, name: 'observaciones' })
  observaciones?: string;

  /**
   * Documentación en español.
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

  /**
   * Documentación en español.
   */
  @Column({
    type: 'enum',
    enum: EstadoPedidoUsuario,
    enumName: 'estado_pedido_usuario',
    default: EstadoPedidoUsuario.PENDIENTE,
  })
  estado!: EstadoPedidoUsuario;

  /**
   * Documentación en español.
   */
  @Column({ name: 'ubicacion_entrega_sugerida_id', nullable: true })
  ubicacionEntregaSugeridaId?: string;

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
  @ManyToOne(() => Ubicacion, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'ubicacion_entrega_sugerida_id' })
  ubicacionEntregaSugerida?: Relation<Ubicacion>;

  /**
   * Documentación en español.
   */
  @OneToMany(() => PedidoUsuarioLinea, (linea) => linea.pedidoUsuario, {
    cascade: true,
  })
  lineas!: Relation<PedidoUsuarioLinea[]>;

  /**
   * Documentación en español.
   */
  @OneToMany(() => Pedido, (pedido) => pedido.pedidoUsuario)
  pedidos!: Relation<Pedido[]>;
}
