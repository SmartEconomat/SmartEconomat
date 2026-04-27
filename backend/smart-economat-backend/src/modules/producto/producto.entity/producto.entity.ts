import { Entity, Column, OneToMany, Index, Check } from 'typeorm';
import type { Relation } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ColumnNumericTransformer } from '../../../common/transformers/column-numeric.transformer';
import { TipoProducto, UnidadMedida } from '../enums/producto.enums';
import { ProductoAlergeno } from '../producto-alergeno.entity/producto-alergeno.entity';
import { ProductoProveedor } from '../producto-proveedor.entity/producto-proveedor.entity';
import { Merma } from '../../merma/merma.entity/merma.entity';

/**
 * Documentación en español.
 */
@Entity({ name: 'producto' })
@Index(['nombre'])
@Index(['codigoBarras'])
@Check(`"fecha_caducidad" IS NULL OR "fecha_caducidad" > "created_at"`)
export class Producto extends BaseEntity {
  /**
   * Documentación en español.
   */
  @Column({ type: 'varchar', length: 100 })
  nombre!: string;

  /**
   * Documentación en español.
   */
  @Column({ type: 'varchar', length: 100, nullable: true })
  marca?: string;

  /**
   * Documentación en español.
   */
  @Column({ type: 'text', nullable: true })
  descripcion?: string;

  /**
   * Documentación en español.
   */
  @Column({ type: 'enum', enum: UnidadMedida, nullable: true })
  unidad?: UnidadMedida;

  /**
   * Documentación en español.
   */
  @Column({ type: 'timestamptz', nullable: true, name: 'fecha_caducidad' })
  fechaCaducidad?: Date;

  /**
   * Documentación en español.
   */
  @Column({ type: 'varchar', length: 200, nullable: true, name: 'path_img' })
  pathImg?: string;

  /**
   * Documentación en español.
   */
  @Column({ type: 'enum', enum: TipoProducto, nullable: true })
  tipo?: TipoProducto;

  /**
   * Documentación en español.
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
   * Documentación en español.
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
   * Documentación en español.
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
   * Documentación en español.
   */
  @OneToMany(() => ProductoAlergeno, (pa) => pa.producto, {
    cascade: true,
  })
  alergenos?: Relation<ProductoAlergeno[]>;

  /**
   * Documentación en español.
   */
  @OneToMany(() => ProductoProveedor, (pp) => pp.producto)
  proveedores!: Relation<ProductoProveedor[]>;

  /**
   * Documentación en español.
   */
  @OneToMany(() => Merma, (merma) => merma.producto)
  mermas?: Relation<Merma[]>;
}
