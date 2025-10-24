import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Producto } from '../producto.entity/producto.entity';
import { Proveedor } from 'src/modules/proveedor/proveedor.entity/proveedor.entity';

@Unique(['producto', 'proveedor'])
@Entity({ name: 'producto_proveedor' })
export class ProductoProveedor {
  @PrimaryGeneratedColumn('uuid', { name: 'id_producto_proveedor' })
  id: number;

  @ManyToOne(() => Producto, (producto) => producto.proveedores, {
    onDelete: 'CASCADE',
  })
  producto: Producto;

  @Column({
    type: 'varchar',
    length: '100',
  })
  marca?: string;

  @ManyToOne(() => Proveedor, (proveedor) => proveedor.productos, {
    onDelete: 'CASCADE',
  })
  proveedor: Proveedor;

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
