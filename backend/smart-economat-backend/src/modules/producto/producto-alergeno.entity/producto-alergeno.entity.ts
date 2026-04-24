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
import { Exclude } from 'class-transformer';
import { Producto } from '../producto.entity/producto.entity';
import { Alergeno } from '../enums/producto.enums';

/**
 * Represents the junction table between Producto and allergens, stored in `producto_alergeno`.
 * Uses a composite primary key (productoId + alergeno) instead of extending BaseEntity,
 * so each Producto–Alergeno pair is unique.
 *
 * @class ProductoAlergeno
 */
@Entity({ name: 'producto_alergeno' })
export class ProductoAlergeno {
  /** UUID of the product (part of the composite primary key). */
  @PrimaryColumn('uuid', { name: 'producto_id' })
  productoId!: string;

  /** Allergen type (part of the composite primary key). */
  @PrimaryColumn({ type: 'enum', enum: Alergeno, name: 'alergeno' })
  alergeno!: Alergeno;

  /**
   * Parent Product. Hidden from serialized responses (@Exclude).
   * ON DELETE CASCADE removes allergen rows when the product is deleted.
   */
  @Exclude()
  @ManyToOne(() => Producto, (producto) => producto.alergenos, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'producto_id' })
  producto!: Relation<Producto>;

  /** Timestamp when the allergen association was created. */
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  readonly createdAt!: Date;

  /** Timestamp of the last update to this record. */
  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  readonly updatedAt!: Date;

  /** Soft-delete timestamp. Null when the record is active. */
  @DeleteDateColumn({ type: 'timestamptz', name: 'deleted_at', nullable: true })
  deletedAt?: Date | null;

  /** Optimistic concurrency version counter. */
  @VersionColumn({ name: 'version', default: 1 })
  version!: number;
}
