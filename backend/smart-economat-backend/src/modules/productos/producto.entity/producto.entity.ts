import { Entity, OneToMany, PrimaryGeneratedColumn, Column } from 'typeorm';
import { IProductoProveedor } from '../interfaces/producto-proveedor.interface';
import { TipoProducto, UnidadProducto } from '../enums/product.enums';
import { ProductoAlergeno } from '../producto-alergeno.entity/producto-alergeno.entity';
import { ProductoProveedor } from '../producto-proveedor.entity/producto-proveedor.entity';

@Entity({ name: 'producto' })
export class Producto {
  @PrimaryGeneratedColumn('uuid', { name: 'id_producto' })
  id: string;

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

  @OneToMany(() => ProductoAlergeno, (pa: ProductoAlergeno) => pa.producto, {
    cascade: true,
  })
  alergenos: ProductoAlergeno[];

  @OneToMany(() => ProductoProveedor, (pp: ProductoProveedor) => pp.producto, {
    cascade: true,
  })
  proveedores: IProductoProveedor[];
}
