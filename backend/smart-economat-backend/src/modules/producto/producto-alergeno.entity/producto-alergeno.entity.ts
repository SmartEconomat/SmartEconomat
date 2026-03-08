import {
  Entity,
  PrimaryColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  VersionColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { Producto } from '../producto.entity/producto.entity';
import { Alergeno } from '../enums/producto.enums';

/**
 * ProductoAlergeno Entity
 *
 * Tabla puente entre Producto y alérgenos (composite PK)
 * No extiende BaseEntity porque usa composite primary key
 */
@Entity({ name: 'producto_alergeno' })
export class ProductoAlergeno {
  @PrimaryColumn('uuid', { name: 'producto_id' })
  productoId!: string;

  @PrimaryColumn({ type: 'enum', enum: Alergeno, name: 'alergeno' })
  alergeno!: Alergeno;

  @ManyToOne(() => Producto, (producto) => producto.alergenos, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'producto_id' })
  producto!: Relation<Producto>;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  readonly createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  readonly updatedAt!: Date;

  @DeleteDateColumn({ type: 'timestamptz', name: 'deleted_at', nullable: true })
  deletedAt?: Date | null;

  @VersionColumn({ name: 'version', default: 1 })
  version!: number;
}
