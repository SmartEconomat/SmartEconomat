import {
  Entity,
  OneToMany,
  PrimaryColumn,
  Column,
  Check,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { TipoProducto, UnidadProducto } from '../enums/producto.enums';
import { ProductoAlergeno } from '../producto-alergeno.entity/producto-alergeno.entity';
import { ProductoProveedor } from '../producto-proveedor.entity/producto-proveedor.entity';

@Entity({ name: 'producto' })
@Check(`"fecha_caducidad" IS NULL OR "fecha_caducidad" > "created_at"`)
export class Producto {
  @PrimaryColumn('uuid', {
    name: 'id_producto',
    default: () => 'uuid_generate_v7()',
  })
  readonly id!: string;

  @Column({ type: 'varchar', length: 100 })
  nombre!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  marca?: string;

  @Column({ type: 'text', nullable: true })
  descripcion?: string;

  @Column({ type: 'enum', enum: UnidadProducto, nullable: true })
  unidad?: UnidadProducto;

  @Column({ type: 'date', nullable: true, name: 'fecha_caducidad' })
  fechaCaducidad?: Date;

  @Column({ type: 'varchar', length: 200, nullable: true, name: 'path_img' })
  pathImg?: string;

  @Column({ type: 'enum', enum: TipoProducto, nullable: true })
  tipo?: TipoProducto;

  @Column({ type: 'integer', default: 0 })
  cantidad!: number;

  @Column({ type: 'varchar', length: 50, unique: true, nullable: true })
  codigoDeBarra?: string;

  @OneToMany(() => ProductoAlergeno, (pa: ProductoAlergeno) => pa.producto, {
    cascade: true,
  })
  alergenos?: ProductoAlergeno[];

  @OneToMany(() => ProductoProveedor, (pp: ProductoProveedor) => pp.producto, {
    cascade: true,
  })
  proveedores?: ProductoProveedor[];

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  readonly createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  readonly updatedAt!: Date;

  @DeleteDateColumn({ type: 'timestamptz', name: 'deleted_at' })
  deletedAt?: Date;
}
