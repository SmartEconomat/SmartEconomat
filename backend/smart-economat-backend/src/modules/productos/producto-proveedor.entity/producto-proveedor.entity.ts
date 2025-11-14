import {
  Column,
  Entity,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Producto } from '../producto.entity/producto.entity';
import { Proveedor } from 'src/modules/proveedor/proveedor.entity/proveedor.entity';
import { Pedido } from 'src/modules/pedidos/pedido.entity/pedido.entity';

@Unique(['producto', 'proveedor'])
@Entity({ name: 'producto_proveedor' })
export class ProductoProveedor {
  @PrimaryGeneratedColumn('uuid', { name: 'id_producto_proveedor' })
  id!: number;

  @ManyToOne(() => Producto, (producto) => producto.proveedores, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_producto', referencedColumnName: 'id' })
  producto!: Producto;

  @Column({
    type: 'varchar',
    length: '100',
    nullable: true,
  })
  marca?: string;

  @ManyToOne(() => Proveedor, (proveedor) => proveedor.productos, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_proveedor', referencedColumnName: 'id' })
  proveedor!: Proveedor;

  @ManyToMany(() => Pedido, (pedido) => pedido.productos)
  pedidos!: Pedido[];

  @Column({
    type: 'varchar',
    length: 130,
    nullable: true,
    name: 'codigo_barras',
  })
  codigoBarras?: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    name: 'precio_unitario',
  })
  precioUnitario?: number;
}
