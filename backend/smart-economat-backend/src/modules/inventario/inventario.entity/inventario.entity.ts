import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  Check,
  type Relation,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ColumnNumericTransformer } from '../../../common/transformers/column-numeric.transformer';
import type { ProductoProveedor } from '../../producto/producto-proveedor.entity/producto-proveedor.entity';
import { localInventario } from '../enums/inventario.enums';

/**
 * Entidad Inventario
 *
 * Representa el stock físico de un ProductoProveedor en una ubicación específica.
 * Controla las cantidades actuales, mínimas y máximas, así como la caducidad.
 *
 * Características de integridad:
 * - Version column para concurrencia optimista (alta contención en actualizaciones de stock).
 * - CHECK constraints para asegurar cantidades no negativas y coherencia (max >= min).
 *
 * @class Inventario
 * @extends {BaseEntity}
 */
@Entity({ name: 'inventario' })
@Index('idx_inventario_producto_proveedor', ['productoProveedor'])
@Index('idx_inventario_ubicacion', ['ubicacionAlmacen'])
@Index('idx_inventario_fecha_caducidad', ['fechaCaducidad'])
@Index('idx_inventario_ubicacion_caducidad', [
  'ubicacionAlmacen',
  'fechaCaducidad',
])
@Check(`"cantidad_actual" >= 0`)
@Check(`"cantidad_minima" >= 0`)
@Check(`"cantidad_maxima" IS NULL OR "cantidad_maxima" >= "cantidad_minima"`)
export class Inventario extends BaseEntity {
  /**
   * ProductoProveedor asociado al inventario.
   * Representa qué producto concreto (de qué proveedor) está almacenado.
   * Constraint: RESTRICT evita orphan records si se intenta borrar el proveedor.
   */
  @ManyToOne('ProductoProveedor', (pp: ProductoProveedor) => pp.inventarios, {
    onDelete: 'RESTRICT',
    nullable: false,
  })
  @JoinColumn({ name: 'id_producto_proveedor' })
  productoProveedor!: Relation<ProductoProveedor>;

  /**
   * Cantidad actual disponible en esta ubicación.
   * Se actualiza automáticamente mediante Recepciones o Movimientos.
   * Constraint: No puede ser negativa (CHECK >= 0).
   * @type {number}
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
   * Cantidad mínima deseada (Stock de Seguridad).
   * Utilizada para generar alertas de reabastecimiento.
   * @type {number}
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
   * Capacidad máxima de almacenamiento en esta ubicación.
   * Constraint: Debe ser mayor o igual a la cantidad mínima.
   * @type {number | undefined}
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
   * Ubicación física dentro del almacén (Pasillo, Estantería, etc. o Zona genérica).
   * @type {localInventario}
   */
  @Column({
    type: 'enum',
    enum: localInventario,
    name: 'ubicacion_almacen',
  })
  ubicacionAlmacen!: localInventario;

  /**
   * Fecha en la que este lote entró al inventario.
   * @type {Date}
   */
  @Column({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
    name: 'fecha_entrada',
  })
  fechaEntrada!: Date;

  /**
   * Fecha de caducidad de este lote específico.
   * Fundamental para la rotación de stock (FEFO - First Expired, First Out).
   * @type {Date}
   */
  @Column({
    type: 'timestamptz',
    nullable: false,
    name: 'fecha_caducidad',
  })
  fechaCaducidad!: Date;

  /* --- Métodos de Dominio --- */

  /**
   * Ajusta la cantidad actual de stock de forma segura.
   * Lanza un error si el stock resultante sería negativo.
   *
   * @param {number} delta - Cantidad a sumar (positiva) o restar (negativa).
   * @throws {Error} Si el stock resultante es menor a 0.
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
   * Verifica si el stock actual está por debajo del nivel mínimo (punto de pedido).
   * @returns {boolean} True si se debe reabastecer.
   */
  esBajoStock(): boolean {
    return Number(this.cantidadActual) < Number(this.cantidadMinima);
  }

  /**
   * Verifica si el lote está próximo a caducar dentro de un umbral de días.
   * Utilizado para alertas de caducidad próxima.
   *
   * @param {number} [diasUmbral=7] - Número de días de margen.
   * @returns {boolean} True si caduca en 'diasUmbral' o menos (o ya ha caducado).
   */
  proximoACaducar(diasUmbral: number = 7): boolean {
    const umbralFecha = new Date();
    umbralFecha.setDate(umbralFecha.getDate() + diasUmbral);
    return this.fechaCaducidad <= umbralFecha;
  }
}
