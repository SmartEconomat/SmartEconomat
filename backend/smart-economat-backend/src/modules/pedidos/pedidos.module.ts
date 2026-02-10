import {
  Column,
  ColumnType,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { ColumnNumericTransformer } from '../../common/transformers/column-numeric.transformer';
import { Usuario } from '../usuario/usuario.entity/usuario.entity';
import { PedidoProducto } from './pedido-producto.entity/pedido-producto.entity';
import { RecepcionPedido } from '../recepcion/recepcion-pedido.entity/recepcion-pedido.entity';
import { EstadoPedido } from './enums/estado-pedido.enum';

@Entity({ name: 'pedido' })
export class PedidoModule {
  @PrimaryGeneratedColumn('uuid', { name: 'id_pedido' })
  id!: string;

  @CreateDateColumn({
    type: 'timestamp',
    name: 'fecha_pedido',
    default: () => 'CURRENT_TIMESTAMP',
  })
  fechaPedido!: Date;

  @Column({
    type: 'timestampz' as ColumnType,
    name: 'fecha_entrega',
    nullable: true,
  })
  fechaEntrega?: Date;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    name: 'coste_total',
    default: 0,
    transformer: new ColumnNumericTransformer(),
  })
  costeTotal!: number;

  @Column({
    type: 'enum',
    enum: EstadoPedido,
    default: EstadoPedido.PENDIENTE,
  })
  estado!: EstadoPedido;

  @ManyToOne(() => Usuario, (usuario) => usuario.pedidos)
  @JoinColumn({ name: 'id_usuario' })
  usuario!: Usuario;

  @OneToMany(() => PedidoProducto, (pp) => pp.pedido, { cascade: true })
  productos!: PedidoProducto[];

  @OneToMany(() => RecepcionPedido, (recepcion) => recepcion.pedido)
  recepciones!: RecepcionPedido[];
}
