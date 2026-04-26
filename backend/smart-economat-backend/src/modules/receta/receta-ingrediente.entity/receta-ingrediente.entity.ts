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
 * Documentación en español.
 */
@Entity('receta_ingrediente')
export class RecetaIngrediente extends BaseEntity {
        /**
     * Documentación en español.
     */
  @Column({ name: 'receta_id' })
  recetaId!: string;

        /**
     * Documentación en español.
     */
  @Column({ name: 'producto_id' })
  productoId!: string;

        /**
     * Documentación en español.
     */
  @Column({
    type: 'numeric',
    precision: 12,
    scale: 4,
    transformer: new ColumnNumericTransformer(),
  })
  cantidad!: number;

        /**
     * Documentación en español.
     */
  @Column({ type: 'enum', enum: UnidadIngrediente })
  unidad!: UnidadIngrediente;

        /**
     * Documentación en español.
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
     * Documentación en español.
     */
  @Exclude()
  @ManyToOne(() => Receta, (receta) => receta.ingredientes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'receta_id' })
  receta!: Relation<Receta>;

        /**
     * Documentación en español.
     */
  @ManyToOne(() => Producto, { nullable: false })
  @JoinColumn({ name: 'producto_id' })
  producto!: Relation<Producto>;

        /**
     * Documentación en español.
     */
  @Column({ name: 'proveedor_favorito_id', nullable: true })
  proveedorFavoritoId?: string;

        /**
     * Documentación en español.
     */
  @ManyToOne(() => Proveedor, { nullable: true })
  @JoinColumn({ name: 'proveedor_favorito_id' })
  proveedorFavorito?: Relation<Proveedor>;
}
