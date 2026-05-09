import { Entity, Column, ManyToOne, JoinColumn, Index, Check } from 'typeorm';
import type { Relation } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ColumnNumericTransformer } from '../../../common/transformers/column-numeric.transformer';
import { NullableColumnNumericTransformer } from '../../../common/transformers/nullable-column-numeric.transformer';
import { ProductoProveedor } from '../../producto/producto-proveedor.entity/producto-proveedor.entity';
import { Ubicacion } from '../../ubicacion/ubicacion.entity/ubicacion.entity';

/**
 * Representa inventario en el sistema.
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
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @Column({ name: 'producto_proveedor_id' })
  productoProveedorId!: string;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @Column({ name: 'ubicacion_id', nullable: true })
  ubicacionId?: string | null;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @ManyToOne(() => ProductoProveedor, (pp) => pp.inventarios, {
    onDelete: 'RESTRICT',
    nullable: false,
  })
  @JoinColumn({ name: 'producto_proveedor_id' })
  productoProveedor!: Relation<ProductoProveedor>;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
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
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
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
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @Column({
    type: 'numeric',
    precision: 12,
    scale: 3,
    nullable: true,
    name: 'cantidad_maxima',
    transformer: new NullableColumnNumericTransformer(),
  })
  cantidadMaxima?: number | null;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @ManyToOne(() => Ubicacion, (ubicacion) => ubicacion.inventarios, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'ubicacion_id' })
  ubicacion!: Relation<Ubicacion>;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @Column({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
    name: 'fecha_entrada',
  })
  fechaEntrada!: Date;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @Column({
    type: 'timestamptz',
    nullable: true,
    name: 'fecha_caducidad',
  })
  fechaCaducidad?: Date | null;

  /* --- Métodos de Dominio --- */

  /**
   * Ejecuta la lógica de ajustar cantidad dentro del flujo de la aplicación.
   *
   * @param delta Parámetro de entrada para la operación.
   */
  /**
   * Expone "ajustarCantidad" en smart-economat-backend (Nest).
   * @undefined {number} delta - Entrada efectiva esperada por el contrato.
   * @undefined {void} Datos efectivos después de ejecutar la operación.
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
   * Ejecuta la lógica de es bajo stock dentro del flujo de la aplicación.
   * @returns Valor resultante de la operación.
   */
  /**
   * Expone "esBajoStock" en smart-economat-backend (Nest).
   * @undefined {boolean} Datos efectivos después de ejecutar la operación.
   */
  esBajoStock(): boolean {
    return Number(this.cantidadActual) < Number(this.cantidadMinima);
  }

  /**
   * Ejecuta la lógica de proximo acaducar dentro del flujo de la aplicación.
   *
   * @param diasUmbral Parámetro de entrada para la operación. Opcional.
   * @returns Valor resultante de la operación.
   */
  proximoACaducar(diasUmbral: number = 7): boolean {
    if (!this.fechaCaducidad) return false;
    const umbralFecha = new Date();
    umbralFecha.setDate(umbralFecha.getDate() + diasUmbral);
    return this.fechaCaducidad <= umbralFecha;
  }
}
