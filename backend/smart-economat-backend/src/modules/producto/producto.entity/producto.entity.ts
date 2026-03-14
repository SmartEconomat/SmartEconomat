import { Entity, Column, OneToMany, Index, Check } from 'typeorm';
import type { Relation } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ColumnNumericTransformer } from '../../../common/transformers/column-numeric.transformer';
import { TipoProducto, UnidadMedida } from '../enums/producto.enums';
import { ProductoAlergeno } from '../producto-alergeno.entity/producto-alergeno.entity';
import { ProductoProveedor } from '../producto-proveedor.entity/producto-proveedor.entity';

/**
 * Entidad Producto
 *
 * Representa la definición base de un producto en el sistema (ficha técnica).
 * Un producto puede ser suministrado por múltiples proveedores (ver ProductoProveedor).
 *
 * @class Producto
 * @extends {BaseEntity}
 */
@Entity({ name: 'producto' })
@Index(['nombre'])
@Index(['codigoBarras'])
@Check(`"fecha_caducidad" IS NULL OR "fecha_caducidad" > "created_at"`)
export class Producto extends BaseEntity {
  /**
   * Nombre comercial del producto.
   * @type {string}
   */
  @Column({ type: 'varchar', length: 100 })
  nombre!: string;

  /**
   * Marca o fabricante del producto.
   * @type {string | undefined}
   */
  @Column({ type: 'varchar', length: 100, nullable: true })
  marca?: string;

  /**
   * Descripción detallada del producto (ingredientes, características).
   * @type {string | undefined}
   */
  @Column({ type: 'text', nullable: true })
  descripcion?: string;

  /**
   * Unidad de medida base del producto (KILOGRAMO, LITRO, UNIDAD).
   * Define cómo se interpreta el campo 'cantidad'.
   * @type {UnidadMedida | undefined}
   */
  @Column({ type: 'enum', enum: UnidadMedida, nullable: true })
  unidad?: UnidadMedida;

  /**
   * Fecha de caducidad del lote actual or referencia general.
   * Constraint: Debe ser mayor a la fecha de creación.
   * @type {Date | undefined}
   */
  @Column({ type: 'timestamptz', nullable: true, name: 'fecha_caducidad' })
  fechaCaducidad?: Date;

  /**
   * Ruta relativa o URL de la imagen del producto.
   * @type {string | undefined}
   */
  @Column({ type: 'varchar', length: 200, nullable: true, name: 'path_img' })
  pathImg?: string;

  /**
   * Categoría o tipo de producto (PERECEDERO, LIMPIEZA, etc.).
   * @type {TipoProducto | undefined}
   */
  @Column({ type: 'enum', enum: TipoProducto, nullable: true })
  tipo?: TipoProducto;

  /**
   * Código de barras único (EAN/UPC).
   * Identificador global del producto.
   * @type {string | undefined}
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
   * Cantidad numérica que, junto con la unidad, define el tamaño del producto.
   * Ejemplo: Si contenido=1 y unidad=KILOGRAMO -> 1kg.
   * @type {number}
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
   * Relación con los alérgenos que contiene el producto.
   */
  @OneToMany(() => ProductoAlergeno, (pa) => pa.producto, {
    cascade: true,
  })
  alergenos?: Relation<ProductoAlergeno[]>;

  /**
   * Relación con los proveedores que suministran este producto.
   */
  @OneToMany(() => ProductoProveedor, (pp) => pp.producto)
  proveedores!: Relation<ProductoProveedor[]>;
}
