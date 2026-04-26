import { Entity, Column, ManyToOne, JoinColumn, Index, Check } from 'typeorm';
import type { Relation } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ColumnNumericTransformer } from '../../../common/transformers/column-numeric.transformer';
import { ProductoProveedor } from '../../producto/producto-proveedor.entity/producto-proveedor.entity';
import { Ubicacion } from '../../ubicacion/ubicacion.entity/ubicacion.entity';

/**
 * Documentación en español.
 */
@Entity({ name: 'inventario' })
@Index(['productoProveedorId'])
@Index(['ubicacionId'])
@Index(['fechaCaducidad'])
@Index(['ubicacionId', 'fechaCaducidad'])
@Check(`"cantidad_actual" >= 0`)
@Check(`"cantidad_minima" >= 0`)
@Check(`"cantidad_maxima" IS NULL OR "cantidad_maxima" >= "cantidad_minima"`)
export class Inventario extends BaseEntity {
        /**
     * Documentación en español.
     */
  @Column({ name: 'producto_proveedor_id' })
  productoProveedorId!: string;

        /**
     * Documentación en español.
     */
  @Column({ name: 'ubicacion_id' })
  ubicacionId!: string;

        /**
     * Documentación en español.
     */
  @ManyToOne(() => ProductoProveedor, (pp) => pp.inventarios, {
    onDelete: 'RESTRICT',
    nullable: false,
  })
  @JoinColumn({ name: 'producto_proveedor_id' })
  productoProveedor!: Relation<ProductoProveedor>;

        /**
     * Documentación en español.
     */
  @Column({
    type: 'numeric',
    precision: 12,
    scale: 3,
    name: 'cantidad_actual',
    transformer: new ColumnNumericTransformer(),
  })
  cantidadActual!: number;

        /**
     * Documentación en español.
     */
  @Column({
    type: 'numeric',
    precision: 12,
    scale: 3,
    name: 'cantidad_minima',
    transformer: new ColumnNumericTransformer(),
  })
  cantidadMinima!: number;

        /**
     * Documentación en español.
     */
  @Column({
    type: 'numeric',
    precision: 12,
    scale: 3,
    nullable: true,
    name: 'cantidad_maxima',
    transformer: new ColumnNumericTransformer(),
  })
  cantidadMaxima?: number | null;

        /**
     * Documentación en español.
     */
  @ManyToOne(() => Ubicacion, (ubicacion) => ubicacion.inventarios, {
    onDelete: 'RESTRICT',
    nullable: false,
  })
  @JoinColumn({ name: 'ubicacion_id' })
  ubicacion!: Relation<Ubicacion>;

        /**
     * Documentación en español.
     */
  @Column({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
    name: 'fecha_entrada',
  })
  fechaEntrada!: Date;

        /**
     * Documentación en español.
     */
  @Column({
    type: 'timestamptz',
    nullable: true,
    name: 'fecha_caducidad',
  })
  fechaCaducidad?: Date | null;

  /* --- Métodos de Dominio --- */

        /**
     * Documentación en español.
     */
  ajustarCantidad(delta: number): void {
    this.cantidadActual = Number(this.cantidadActual) + delta;
    if (this.cantidadActual < 0) {
      throw new Error(
        `Stock insuficiente. Actual: ${this.cantidadActual}, Delta: ${delta}`
      );
    }
  }

        /**
     * Documentación en español.
     */
  esBajoStock(): boolean {
    return Number(this.cantidadActual) < Number(this.cantidadMinima);
  }

        /**
     * Documentación en español.
     */
  proximoACaducar(diasUmbral: number = 7): boolean {
    if (!this.fechaCaducidad) return false;
    const umbralFecha = new Date();
    umbralFecha.setDate(umbralFecha.getDate() + diasUmbral);
    return this.fechaCaducidad <= umbralFecha;
  }
}
