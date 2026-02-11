import {
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  Column,
  Check,
} from 'typeorm';
import { TipoProducto, UnidadProducto } from '../enums/producto.enums';
import { ProductoAlergeno } from '../producto-alergeno.entity/producto-alergeno.entity';
import { ProductoProveedor } from '../producto-proveedor.entity/producto-proveedor.entity';

@Check(`"caducidad" IS NULL OR "caducidad" >= CURRENT_DATE`)
@Entity({ name: 'producto' })
export class Producto {
  @PrimaryGeneratedColumn('uuid', { name: 'id_producto' })
  id!: string;

  @Column({ type: 'varchar', length: 100 })
  nombre!: string;

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

  @Column({ type: 'float', default: 0 })
  cantidad!: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  codigo!: string;

  @OneToMany(() => ProductoAlergeno, (pa: ProductoAlergeno) => pa.producto, {
    cascade: true,
  })
  alergenos?: ProductoAlergeno[];

  @OneToMany(() => ProductoProveedor, (pp: ProductoProveedor) => pp.producto, {
    cascade: true,
  })
  proveedores?: ProductoProveedor[];
}
