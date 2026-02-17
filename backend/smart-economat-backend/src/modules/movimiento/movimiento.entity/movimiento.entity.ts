import { Entity, Column, ManyToOne, JoinColumn, Index, Check } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ColumnNumericTransformer } from '../../../common/transformers/column-numeric.transformer';
import { TipoMovimiento } from '../enums/movimiento.enums';
import { Usuario } from '../../usuario/usuario.entity/usuario.entity';

/**
 * Entidad Movimiento
 *
 * Representa una transacción de cambio en el inventario (Entrada, Salida, Ajuste).
 * Implementa un patrón de auditoría extendido registrando el usuario, tipo, y entidad origen.
 * Soporta polimorfismo referencial (entidad_id + entidad_tipo) para trazar el origen (Pedido, Recepción, Ajuste Manual).
 *
 * @class Movimiento
 * @extends {BaseEntity}
 */
@Entity({ name: 'movimiento' })
@Index('idx_movimiento_tipo', ['tipo'])
@Index('idx_movimiento_fecha', ['fecha'])
@Index('idx_movimiento_usuario', ['usuario'])
@Index('idx_movimiento_entidad_tipo', ['entidad', 'tipo'])
@Index('idx_movimiento_entidad_id', ['entidadId'])
@Check(`"cantidad" >= 0`)
export class Movimiento extends BaseEntity {
  /**
   * Tipo de movimiento (ENTRADA, SALIDA, DEVOLUCION, etc.).
   * Determina si suma o resta al inventario.
   * @type {TipoMovimiento}
   */
  @Column({ type: 'enum', enum: TipoMovimiento })
  tipo!: TipoMovimiento;

  /**
   * Cantidad de unidades movidas.
   * Siempre se almacena como valor absoluto positivo. La dirección depende del 'tipo'.
   * @type {number}
   */
  @Column({
    type: 'numeric',
    precision: 12,
    scale: 3,
    transformer: new ColumnNumericTransformer(),
  })
  cantidad!: number;

  /**
   * Usuario que realizó (o autorizó) el movimiento.
   * @type {Usuario | null}
   */
  @ManyToOne(() => Usuario, (usuario) => usuario.movimientos, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'id_usuario', referencedColumnName: 'id' })
  usuario?: Usuario | null;

  /**
   * Tipo de entidad origen que causó el movimiento ('Recepcion', 'Pedido', 'AjusteManual').
   * Parte del polimorfismo para trazabilidad.
   * @type {string}
   */
  @Column({ type: 'varchar', length: 50, name: 'entidad_tipo' })
  entidad!: string;

  /**
   * ID (UUID) de la entidad origen que causó el movimiento.
   * @type {string}
   */
  @Column({ type: 'uuid', name: 'entidad_id' })
  entidadId!: string;

  /**
   * Fecha y hora exacta del movimiento.
   * @type {Date}
   */
  @Column({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  fecha!: Date;

  /**
   * Descripción o justificación del movimiento.
   * @type {string | undefined}
   */
  @Column({ type: 'text', nullable: true })
  descripcion?: string;
}

export { TipoMovimiento };
