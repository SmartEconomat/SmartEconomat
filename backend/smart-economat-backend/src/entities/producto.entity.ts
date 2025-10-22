import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
} from 'typeorm';
import { UnidadProducto, TipoProducto } from './product.enums';
import { ProductoAlergeno } from './producto-alergeno.entity';
import { ProductoProveedor } from './producto-proveedor.entity';

@Entity({ name: 'producto' })
export class Producto {
  @PrimaryGeneratedColumn({ name: 'id_producto' })
  id: number;

  @Column({ type: 'varchar', length: 100 })
  nombre: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  marca?: string;

  @Column({ type: 'text', nullable: true })
  descripcion?: string;

  @Column({ type: 'enum', enum: UnidadProducto, nullable: true })
  unidad?: UnidadProducto;

  @Column({ type: 'date', nullable: true })
  caducidad?: Date;

  @Column({ type: 'varchar', length: 200, nullable: true, name: 'path_img' })
  pathImg?: string;

  @Column({ type: 'enum', enum: TipoProducto, nullable: true })
  tipo?: TipoProducto;

  @OneToMany(() => ProductoAlergeno, (pa) => pa.producto, { cascade: true })
  alergenos: ProductoAlergeno[];

  @OneToMany(() => ProductoProveedor, (pp) => pp.producto, { cascade: true })
  proveedores: ProductoProveedor[];
}
