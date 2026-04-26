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
 * Documentación en español.
 */
@Entity({ name: 'producto_alergeno' })
export class ProductoAlergeno {
        /**
     * Documentación en español.
     */
  @PrimaryColumn('uuid', { name: 'producto_id' })
  productoId!: string;

        /**
     * Documentación en español.
     */
  @PrimaryColumn({ type: 'enum', enum: Alergeno, name: 'alergeno' })
  alergeno!: Alergeno;

        /**
     * Documentación en español.
     */
  @Exclude()
  @ManyToOne(() => Producto, (producto) => producto.alergenos, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'producto_id' })
  producto!: Relation<Producto>;

        /**
     * Documentación en español.
     */
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  readonly createdAt!: Date;

        /**
     * Documentación en español.
     */
  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  readonly updatedAt!: Date;

        /**
     * Documentación en español.
     */
  @DeleteDateColumn({ type: 'timestamptz', name: 'deleted_at', nullable: true })
  deletedAt?: Date | null;

        /**
     * Documentación en español.
     */
  @VersionColumn({ name: 'version', default: 1 })
  version!: number;
}
