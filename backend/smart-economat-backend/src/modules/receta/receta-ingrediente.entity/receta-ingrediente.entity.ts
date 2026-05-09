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
 * Representa receta ingrediente en el sistema.
 */
@Entity('receta_ingrediente')
export class RecetaIngrediente extends BaseEntity {
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @Column({ name: 'receta_id' })
  recetaId!: string;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @Column({ name: 'producto_id' })
  productoId!: string;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @Column({
    type: 'numeric',
    precision: 12,
    scale: 4,
    transformer: new ColumnNumericTransformer(),
  })
  cantidad!: number;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @Column({ type: 'enum', enum: UnidadIngrediente })
  unidad!: UnidadIngrediente;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
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
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @Exclude()
  @ManyToOne(() => Receta, (receta) => receta.ingredientes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'receta_id' })
  receta!: Relation<Receta>;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @ManyToOne(() => Producto, { nullable: false })
  @JoinColumn({ name: 'producto_id' })
  producto!: Relation<Producto>;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @Column({ name: 'proveedor_favorito_id', nullable: true })
  proveedorFavoritoId?: string;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @ManyToOne(() => Proveedor, { nullable: true })
  @JoinColumn({ name: 'proveedor_favorito_id' })
  proveedorFavorito?: Relation<Proveedor>;
}
