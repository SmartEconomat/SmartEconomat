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
import { EstadoPedidoUsuario } from '../enums/estado-pedido-usuario.enum';
import { Pedido } from '../pedido.entity/pedido.entity';
import { PedidoUsuarioLinea } from '../pedido-usuario-linea.entity/pedido-usuario-linea.entity';

@Entity({ name: 'pedido_usuario' })
@Index(['usuarioId'])
@Index(['numeroGlobal'], { unique: true })
@Index(['estado'])
@Index(['fechaPedido'])
@Check(`"coste_total" >= 0`)
export class PedidoUsuario extends BaseEntity {
  @Column({ name: 'usuario_id', nullable: true })
  usuarioId?: string;

  @Column({ name: 'numero_global', type: 'bigint', unique: true })
  @Generated('increment')
  numeroGlobal!: string;

  @Column({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
    name: 'fecha_pedido',
  })
  fechaPedido!: Date;

  @Column({ type: 'timestamptz', nullable: true, name: 'fecha_entrega' })
  fechaEntrega?: Date;

  @Column({ type: 'text', nullable: true, name: 'observaciones' })
  observaciones?: string;

  @Column({
    type: 'numeric',
    precision: 14,
    scale: 4,
    default: 0,
    name: 'coste_total',
    transformer: new ColumnNumericTransformer(),
  })
  costeTotal!: number;

  @Column({
    type: 'enum',
    enum: EstadoPedidoUsuario,
    default: EstadoPedidoUsuario.PENDIENTE,
  })
  estado!: EstadoPedidoUsuario;

  @ManyToOne(() => Usuario, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'usuario_id' })
  usuario?: Relation<Usuario>;

  @OneToMany(() => PedidoUsuarioLinea, (linea) => linea.pedidoUsuario, {
    cascade: true,
  })
  lineas!: Relation<PedidoUsuarioLinea[]>;

  @OneToMany(() => Pedido, (pedido) => pedido.pedidoUsuario)
  pedidos!: Relation<Pedido[]>;
}
