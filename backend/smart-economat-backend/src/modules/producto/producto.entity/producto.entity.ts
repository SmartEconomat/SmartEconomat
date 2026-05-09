import { Entity, Column, OneToMany, Index, Check } from 'typeorm';
import type { Relation } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ColumnNumericTransformer } from '../../../common/transformers/column-numeric.transformer';
import { TipoProducto, UnidadMedida } from '../enums/producto.enums';
import { ProductoAlergeno } from '../producto-alergeno.entity/producto-alergeno.entity';
import { ProductoProveedor } from '../producto-proveedor.entity/producto-proveedor.entity';
import { Merma } from '../../merma/merma.entity/merma.entity';

/**
 * Representa producto en el sistema.
 */
@Entity({ name: 'producto' })
@Index(['nombre'])
@Index(['codigoBarras'])
@Check(`"fecha_caducidad" IS NULL OR "fecha_caducidad" > "created_at"`)
export class Producto extends BaseEntity {
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @Column({ type: 'varchar', length: 100 })
  nombre!: string;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @Column({ type: 'varchar', length: 100, nullable: true })
  marca?: string;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @Column({ type: 'text', nullable: true })
  descripcion?: string;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @Column({ type: 'enum', enum: UnidadMedida, nullable: true })
  unidad?: UnidadMedida;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @Column({ type: 'timestamptz', nullable: true, name: 'fecha_caducidad' })
  fechaCaducidad?: Date;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @Column({ type: 'varchar', length: 200, nullable: true, name: 'path_img' })
  pathImg?: string;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @Column({ type: 'enum', enum: TipoProducto, nullable: true })
  tipo?: TipoProducto;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @Column({
    type: 'varchar',
    length: 130,
    unique: true,
    nullable: true,
    name: 'codigo_barras',
  })
  codigoBarras?: string;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */

  @Column({
    type: 'numeric',
    precision: 10,
    scale: 2,
    default: 0,
    name: 'contenido',
    transformer: new ColumnNumericTransformer(),
  })
  contenido!: number;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @Column({
    type: 'numeric',
    precision: 5,
    scale: 2,
    default: 0,
    name: 'merma_porcentaje',
    transformer: new ColumnNumericTransformer(),
  })
  mermaPorcentaje!: number;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @Column({
    type: 'numeric',
    precision: 10,
    scale: 4,
    default: 0,
    name: 'pmp',
    transformer: new ColumnNumericTransformer(),
  })
  pmp!: number;

  /**
   * Si es false, el producto no aparece en el catálogo operativo (`findAll` activos) pero no está soft-deleted.
   * La pestaña «Eliminados» solo incluye filas con `deleted_at`; inactivos sin borrar no se listan ahí.
   */
  @Column({ type: 'boolean', name: 'activo', default: true })
  activo!: boolean;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @OneToMany(() => ProductoAlergeno, (pa) => pa.producto, {
    cascade: true,
  })
  alergenos?: Relation<ProductoAlergeno[]>;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @OneToMany(() => ProductoProveedor, (pp) => pp.producto)
  proveedores!: Relation<ProductoProveedor[]>;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @OneToMany(() => Merma, (merma) => merma.producto)
  mermas?: Relation<Merma[]>;
}
