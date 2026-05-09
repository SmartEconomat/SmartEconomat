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
 * Representa pedido usuario en el sistema.
 */
@Entity({ name: 'pedido_usuario' })
@Index(['usuarioId'])
@Index(['numeroGlobal'], { unique: true })
@Index(['estado'])
@Index(['fechaPedido'])
@Check(`"coste_total" >= 0`)
export class PedidoUsuario extends BaseEntity {
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @Column({ name: 'usuario_id', nullable: true })
  usuarioId?: string;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @Column({ name: 'numero_global', type: 'bigint', unique: true })
  @Generated('increment')
  numeroGlobal!: string;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @Column({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
    name: 'fecha_pedido',
  })
  fechaPedido!: Date;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @Column({ type: 'timestamptz', nullable: true, name: 'fecha_entrega' })
  fechaEntrega?: Date;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @Column({ type: 'text', nullable: true, name: 'observaciones' })
  observaciones?: string;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
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
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @Column({
    type: 'enum',
    enum: EstadoPedidoUsuario,
    enumName: 'estado_pedido_usuario',
    default: EstadoPedidoUsuario.PENDIENTE,
  })
  estado!: EstadoPedidoUsuario;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @Column({ name: 'ubicacion_entrega_sugerida_id', nullable: true })
  ubicacionEntregaSugeridaId?: string;

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
  @ManyToOne(() => Ubicacion, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'ubicacion_entrega_sugerida_id' })
  ubicacionEntregaSugerida?: Relation<Ubicacion>;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @OneToMany(() => PedidoUsuarioLinea, (linea) => linea.pedidoUsuario, {
    cascade: true,
  })
  lineas!: Relation<PedidoUsuarioLinea[]>;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @OneToMany(() => Pedido, (pedido) => pedido.pedidoUsuario)
  pedidos!: Relation<Pedido[]>;
}
