import { Entity, Column, ManyToOne, JoinColumn, Index, Check } from 'typeorm';
import type { Relation } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ColumnNumericTransformer } from '../../../common/transformers/column-numeric.transformer';
import { TipoMovimiento, AccionMovimiento } from '../enums/movimiento.enums';
import { Usuario } from '../../usuario/usuario.entity/usuario.entity';
import { Inventario } from '../../inventario/inventario.entity/inventario.entity';
import { ProductoProveedor } from '../../producto/producto-proveedor.entity/producto-proveedor.entity';
import { Ubicacion } from '../../ubicacion/ubicacion.entity/ubicacion.entity';
import { Transferencia } from '../../inventario/transferencia.entity/transferencia.entity';

/**
 * Entidad centralizada para trazabilidad y auditoría (Movimientos).
 * Registra tanto cambios de stock como acciones administrativas relevantes.
 */
@Entity({ name: 'movimiento' })
@Index(['tipo'])
@Index(['accion'])
@Index(['usuarioId'])
@Index(['entidad', 'tipo'])
@Index(['entidadId'])
@Index(['entidadId', 'entidad'])
@Index(['inventarioId'])
@Index(['productoProveedorId'])
@Index(['createdAt'])
@Check(`"cantidad" IS NULL OR "cantidad" >= 0`)
export class Movimiento extends BaseEntity {
  /**
   * Usuario que realizó la acción.
   */
  @Column({ name: 'usuario_id', nullable: true })
  usuarioId?: string;

  /**
   * ID del inventario afectado (opcional, para stock).
   */
  @Column({ name: 'inventario_id', nullable: true })
  inventarioId?: string;

  /**
   * ID del producto_proveedor afectado (opcional, para stock).
   */
  @Column({ name: 'producto_proveedor_id', nullable: true })
  productoProveedorId?: string;

  /**
   * Tipo de movimiento de stock (dirección/origen).
   */
  @Column({
    type: 'enum',
    enum: TipoMovimiento,
    default: TipoMovimiento.AUDITORIA,
  })
  tipo!: TipoMovimiento;

  /**
   * Acción realizada (para auditoría).
   */
  @Column({ type: 'enum', enum: AccionMovimiento, nullable: true })
  accion?: AccionMovimiento;

  /**
   * Cantidad afectada (para stock). Nullable para acciones puras de auditoría.
   */
  @Column({
    type: 'numeric',
    precision: 12,
    scale: 3,
    transformer: new ColumnNumericTransformer(),
    nullable: true,
  })
  cantidad?: number;

  /**
   * Relación con el usuario.
   */
  @ManyToOne(() => Usuario, (usuario) => usuario.movimientos, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'usuario_id' })
  usuario?: Relation<Usuario>;

  /**
   * Relación con el inventario.
   */
  @ManyToOne(() => Inventario, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'inventario_id' })
  inventario?: Relation<Inventario>;

  /**
   * Relación con el producto_proveedor.
   */
  @ManyToOne(() => ProductoProveedor, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'producto_proveedor_id' })
  productoProveedor?: Relation<ProductoProveedor>;

  @Column({ name: 'ubicacion_origen_id', nullable: true })
  ubicacionOrigenId?: string | null;

  @ManyToOne(() => Ubicacion, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'ubicacion_origen_id' })
  ubicacionOrigen?: Relation<Ubicacion>;

  @Column({ name: 'ubicacion_destino_id', nullable: true })
  ubicacionDestinoId?: string | null;

  @ManyToOne(() => Ubicacion, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'ubicacion_destino_id' })
  ubicacionDestino?: Relation<Ubicacion>;

  @Column({ name: 'transferencia_id', nullable: true })
  transferenciaId?: string | null;

  /** Cabecera de transferencia relacionada (trazabilidad denormalizada). */
  @ManyToOne(() => Transferencia, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'transferencia_id' })
  transferencia?: Relation<Transferencia>;

  @Column({
    name: 'idempotencia_key',
    type: 'varchar',
    length: 128,
    nullable: true,
    unique: true,
  })
  idempotenciaKey?: string | null;

  /**
   * Nombre de la entidad afectada (pedido, recepcion, inventario, etc.).
   */
  @Column({ type: 'varchar', length: 50, name: 'entidad_tipo' })
  entidad!: string;

  /**
   * UUID de la instancia de la entidad afectada.
   */
  @Column({ type: 'uuid', name: 'entidad_id' })
  entidadId!: string;

  /**
   * Descripción legible de la acción.
   */
  @Column({ type: 'text', nullable: true })
  descripcion?: string;

  /**
   * Estado de los datos antes de la acción (Snapshot JSON).
   */
  @Column({ type: 'jsonb', name: 'datos_antes', nullable: true })
  datosAntes?: any;

  /**
   * Estado de los datos después de la acción (Snapshot JSON).
   */
  @Column({ type: 'jsonb', name: 'datos_despues', nullable: true })
  datosDespues?: any;
}

export { TipoMovimiento, AccionMovimiento };
