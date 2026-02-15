import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { ColumnNumericTransformer } from '../../../common/transformers/column-numeric.transformer';
import { Pedido } from '../pedido.entity/pedido.entity';
import { ProductoProveedor } from '../../producto/producto-proveedor.entity/producto-proveedor.entity';
import { RecepcionProducto } from '../../recepcion/recepcion-productos.entity/recepcion-producto.entity';

@Entity('pedido_productos')
export class PedidoProducto {
  @PrimaryColumn('uuid', {
    name: 'id_pedido_producto',
    default: () => 'uuid_generate_v7()',
  })
  readonly id!: string;

  @ManyToOne(() => Pedido, (pedido) => pedido.pedidoProductos, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_pedido' })
  pedido!: Pedido;

  @ManyToOne(() => ProductoProveedor, (pp) => pp.pedidoProductos, {
    nullable: false,
  })
  @JoinColumn({ name: 'id_producto_proveedor' })
  productoProveedor!: ProductoProveedor;

  @Column({
    type: 'numeric',
    precision: 10,
    scale: 2,
    nullable: false,
    transformer: new ColumnNumericTransformer(),
  })
  cantidad!: number;

  @Column({
    type: 'numeric',
    precision: 10,
    scale: 2,
    nullable: false,
    transformer: new ColumnNumericTransformer(),
  })
  precio_unitario!: number;

  @Column({ type: 'text', nullable: true })
  observaciones?: string;

  @OneToMany(() => RecepcionProducto, (rp) => rp.pedidoProducto)
  recepcionesProducto!: RecepcionProducto[];

  @CreateDateColumn({
    type: 'timestamptz',
    name: 'created_at',
  })
  createdAt!: Date;

  @UpdateDateColumn({
    type: 'timestamptz',
    name: 'updated_at',
  })
  updatedAt!: Date;

  @DeleteDateColumn({
    type: 'timestamptz',
    name: 'deleted_at',
  })
  deletedAt?: Date;
}
