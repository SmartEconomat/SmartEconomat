import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import type { Relation } from 'typeorm';
import { Exclude } from 'class-transformer';
import { Receta } from '../receta.entity/receta.entity';
import { Producto } from '../../producto/producto.entity/producto.entity';
import { Proveedor } from '../../proveedor/proveedor.entity/proveedor.entity';
import { UnidadIngrediente } from '../enums/receta.enums';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ColumnNumericTransformer } from '../../../common/transformers/column-numeric.transformer';

/**
 * Represents an ingredient line within a Recipe, stored in the `receta_ingrediente` table.
 * Links a Producto to a Receta with the required quantity, unit, and optional waste percentage.
 *
 * @class RecetaIngrediente
 * @extends {BaseEntity}
 */
@Entity('receta_ingrediente')
export class RecetaIngrediente extends BaseEntity {
  /** Foreign key referencing the parent Receta. */
  @Column({ name: 'receta_id' })
  recetaId!: string;

  /** Foreign key referencing the ingredient Producto. */
  @Column({ name: 'producto_id' })
  productoId!: string;

  /**
   * Net quantity of the ingredient required by the recipe.
   * The gross quantity consumed is derived as: cantidadBruta = cantidad / (1 - mermaAplicada / 100).
   */
  @Column({
    type: 'numeric',
    precision: 12,
    scale: 4,
    transformer: new ColumnNumericTransformer(),
  })
  cantidad!: number;

  /** Unit of measure for the ingredient quantity (g, kg, l, ml, pieza, etc.). */
  @Column({ type: 'enum', enum: UnidadIngrediente })
  unidad!: UnidadIngrediente;

  /**
   * Percentage of waste (merma) applied to this ingredient (0–99).
   * Represents the expected loss during preparation (e.g. peeling, trimming).
   * Formula: cantidadBruta = cantidad / (1 - mermaAplicada / 100).
   */
  @Column({
    type: 'numeric',
    precision: 5,
    scale: 2,
    default: 0,
    name: 'merma_aplicada',
    transformer: new ColumnNumericTransformer(),
  })
  mermaAplicada!: number;

  /**
   * Parent Recipe. Hidden from serialized responses (@Exclude).
   * ON DELETE CASCADE removes ingredient lines when the recipe is deleted.
   */
  @Exclude()
  @ManyToOne(() => Receta, (receta) => receta.ingredientes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'receta_id' })
  receta!: Relation<Receta>;

  /** The Producto used as ingredient. Cannot be null. */
  @ManyToOne(() => Producto, { nullable: false })
  @JoinColumn({ name: 'producto_id' })
  producto!: Relation<Producto>;

  /** Optional foreign key for the preferred supplier of this ingredient. */
  @Column({ name: 'proveedor_favorito_id', nullable: true })
  proveedorFavoritoId?: string;

  /** Preferred supplier for sourcing this ingredient. May be null if no preference is set. */
  @ManyToOne(() => Proveedor, { nullable: true })
  @JoinColumn({ name: 'proveedor_favorito_id' })
  proveedorFavorito?: Relation<Proveedor>;
}
