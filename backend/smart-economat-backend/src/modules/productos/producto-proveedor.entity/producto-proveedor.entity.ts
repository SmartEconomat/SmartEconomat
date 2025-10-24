import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Producto } from '../producto.entity/producto.entity';

@Entity({ name: 'producto_proveedor' })
export class ProductoProveedor {
  @PrimaryGeneratedColumn('uuid', {
    name: 'id_producto_proveedor',
  })
  id: string;

  @PrimaryColumn({ name: 'id_proveedor', type: 'int' })
  id_proveedor: number;

  @ManyToOne(() => Producto, (p) => p.proveedores, { onDelete: 'CASCADE' })
  producto: Producto;

  @OneToMany(() => ProductoProveedor, (producto) => producto.id_proveedor)
  productos!: ProductoProveedor[];

  @Column({ type: 'varchar', length: 100, nullable: true })
  referencia?: string;
}
