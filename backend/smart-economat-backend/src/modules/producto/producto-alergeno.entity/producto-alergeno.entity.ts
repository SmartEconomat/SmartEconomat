import {
  Entity,
  PrimaryColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  VersionColumn,
  type Relation,
} from 'typeorm';
import type { Producto } from '../producto.entity/producto.entity';
import { Alergeno } from '../enums/producto.enums';

/**
 * ProductoAlergeno Entity
 *
 * Tabla puente entre Producto y alérgenos (composite PK)
 * No extiende BaseEntity porque usa composite primary key
 */
@Entity({ name: 'producto_alergeno' })
export class ProductoAlergeno {
  @PrimaryColumn('uuid', { name: 'id_producto' })
  idProducto!: string;

  @PrimaryColumn({ type: 'enum', enum: Alergeno, name: 'alergeno' })
  alergeno!: Alergeno;

  @ManyToOne('Producto', {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_producto', referencedColumnName: 'id' })
  producto!: Relation<Producto>;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  readonly createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  readonly updatedAt!: Date;

  @DeleteDateColumn({ type: 'timestamptz', name: 'deleted_at' })
  deletedAt?: Date;

  @VersionColumn({ name: 'version' })
  version!: number;
}
