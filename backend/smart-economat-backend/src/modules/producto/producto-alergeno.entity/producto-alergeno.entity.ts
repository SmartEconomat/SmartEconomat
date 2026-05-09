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
 * Representa producto alergeno en el sistema.
 */
@Entity({ name: 'producto_alergeno' })
export class ProductoAlergeno {
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @PrimaryColumn('uuid', { name: 'producto_id' })
  productoId!: string;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @PrimaryColumn({ type: 'enum', enum: Alergeno, name: 'alergeno' })
  alergeno!: Alergeno;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @Exclude()
  @ManyToOne(() => Producto, (producto) => producto.alergenos, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'producto_id' })
  producto!: Relation<Producto>;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  readonly createdAt!: Date;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  readonly updatedAt!: Date;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @DeleteDateColumn({ type: 'timestamptz', name: 'deleted_at', nullable: true })
  deletedAt?: Date | null;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @VersionColumn({ name: 'version', default: 1 })
  version!: number;
}
