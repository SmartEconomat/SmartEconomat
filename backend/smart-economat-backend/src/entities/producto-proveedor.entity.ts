import { Entity, ManyToOne, PrimaryColumn, Column } from 'typeorm';
import { Producto } from './producto.entity';
import { Proveedor } from './proveedor.entity';

@Entity({ name: 'producto_proveedor' })
export class ProductoProveedor {
  @PrimaryColumn({ name: 'id_producto', type: 'int' })
  id_producto: number;

  @PrimaryColumn({ name: 'id_proveedor', type: 'int' })
  id_proveedor: number;

  @ManyToOne(() => Producto, (p) => p.proveedores, { onDelete: 'CASCADE' })
  producto: Producto;

  @ManyToOne(() => Proveedor, (prov) => prov.productos, { onDelete: 'CASCADE' })
  proveedor: Proveedor;

  @Column({ type: 'varchar', length: 100, nullable: true })
  referencia?: string;
}
