import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
  Check,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ColumnNumericTransformer } from '../../../common/transformers/column-numeric.transformer';
import {
  ESTADO_PEDIDO_DB_VALUES,
  EstadoPedido,
} from '../enums/estado-pedido.enum';
import { Usuario } from '../../usuario/usuario.entity/usuario.entity';
import { RecepcionPedido } from '../../recepcion/recepcion-pedido.entity/recepcion-pedido.entity';
import { PedidoProducto } from '../pedido-producto.entity/pedido-producto.entity';
import { Proveedor } from '../../proveedor/proveedor.entity/proveedor.entity';
import { PurchaseBatch } from '../purchase-batch.entity/purchase-batch.entity';
import { PedidoUsuario } from '../pedido-usuario.entity/pedido-usuario.entity';

/**
 * Entidad Pedido
 *
 * Representa una solicitud de compra de productos a proveedores.
 *
 * Flujo de estados:
 * 1. PENDIENTE_DE_APROBACION: Pedido interno creado y pendiente de validación.
 * 2. POR_RECEPCIONAR: Compra aprobada o consolidada, pendiente de recepción.
 * 3. PARCIAL: La recepción ha empezado pero aún no está cerrada.
 * 4. INCIDENCIA: Existe una incidencia abierta asociada al pedido.
 * 5. RECEPCIONADO: Mercancía recepcionada completamente.
 * 6. CANCELADO: Pedido anulado antes de cerrarse.
 *
 * @class Pedido
 * @extends {BaseEntity}
 */
@Entity({ name: 'pedido' })
@Index(['numeroGlobal'], { unique: true })
@Index(['estado'])
@Index(['fechaPedido'])
@Index(['usuarioId'])
@Index(['proveedorId'])
@Index(['batchId'])
@Index(['pedidoUsuarioId'])
@Index(['estado', 'createdAt'])
@Check(`"coste_total" >= 0`)
export class Pedido extends BaseEntity {
  @Column({ name: 'numero_global', type: 'bigint', unique: true })
  numeroGlobal!: string;

  @Column({ name: 'usuario_id', nullable: true })
  usuarioId?: string;

  @Column({ name: 'proveedor_id', nullable: true })
  proveedorId?: string;

  @Column({ name: 'batch_id', nullable: true })
  batchId?: string;

  @Column({ name: 'pedido_usuario_id', nullable: true })
  pedidoUsuarioId?: string;

  /**
   * Usuario que creó el pedido.
   * La relación es SET NULL para mantener histórico si el usuario se borra.
   * @type {Usuario | null}
   */
  @ManyToOne(() => Usuario, (usuario) => usuario.pedidos, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'usuario_id' })
  usuario?: Relation<Usuario>;

  /**
   * Proveedor al que se realiza el pedido.
   * Obligatorio para trazar reclamaciones y facturación.
   */
  @ManyToOne(() => Proveedor, (proveedor) => proveedor.pedidos, {
    nullable: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'proveedor_id' })
  proveedor?: Relation<Proveedor>;

  /**
   * Lote de compra al que pertenece este pedido.
   */
  @ManyToOne(() => PurchaseBatch, (batch) => batch.pedidos, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'batch_id' })
  batch?: Relation<PurchaseBatch>;

  @ManyToOne(() => PedidoUsuario, (pedidoUsuario) => pedidoUsuario.pedidos, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'pedido_usuario_id' })
  pedidoUsuario?: Relation<PedidoUsuario>;

  /**
   * Fecha de creación del pedido.
   * @type {Date}
   */
  @Column({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
    name: 'fecha_pedido',
  })
  fechaPedido!: Date;

  /**
   * Fecha prevista de entrega calculada automáticamente por regla de negocio.
   * @type {Date | undefined}
   */
  @Column({ type: 'timestamptz', nullable: true, name: 'fecha_entrega' })
  fechaEntrega?: Date;

  /**
   * Observaciones operativas del pedido.
   * @type {string | undefined}
   */
  @Column({ type: 'text', nullable: true, name: 'observaciones' })
  observaciones?: string;

  /**
   * Coste total del pedido sumando todas las líneas.
   * Se actualiza al modificar líneas o confirmar pedido.
   * Constraint: >= 0.
   * @type {number}
   */
  @Column({
    type: 'numeric',
    precision: 14,
    scale: 4,
    default: 0,
    name: 'coste_total',
    transformer: new ColumnNumericTransformer(),
  })
  costeTotal!: number;

  /**
   * Estado actual del pedido.
   * @type {EstadoPedido}
   */
  @Column({
    type: 'enum',
    enum: ESTADO_PEDIDO_DB_VALUES,
    enumName: 'estado_pedido',
    default: EstadoPedido.PENDIENTE_DE_APROBACION,
  })
  estado!: EstadoPedido;

  /**
   * Líneas de detalle del pedido (productos, cantidades, precios).
   */
  @OneToMany(() => PedidoProducto, (pp) => pp.pedido, {
    cascade: true,
  })
  pedidoProductos!: Relation<PedidoProducto[]>;

  /**
   * Relación con las recepciones que se han hecho de este pedido.
   * Puede haber múltiples recepciones para un solo pedido (entregas parciales).
   */
  @OneToMany(() => RecepcionPedido, (rp) => rp.pedido)
  recepcionesPedido!: Relation<RecepcionPedido[]>;

  /**
   * Motivo de cancelación (solo si estado === CANCELADO).
   * @type {string | undefined}
   */
  @Column({ type: 'text', nullable: true, name: 'motivo_cancelacion' })
  motivoCancelacion?: string;

  /**
   * Observaciones de incidencia asociadas al pedido interno.
   * El detalle funcional vive en el módulo de incidencias y el estado operativo pasa a INCIDENCIA.
   */
  @Column({ type: 'text', nullable: true, name: 'motivo_incidencia' })
  motivoIncidencia?: string;

  /* --- Métodos de Dominio --- */

  /**
   * Calcular coste total desde productos
   */
  calcularTotal(): number {
    if (!this.pedidoProductos || this.pedidoProductos.length === 0) {
      return 0;
    }
    return this.pedidoProductos.reduce((total, pp) => {
      return total + Number(pp.cantidad) * Number(pp.precioUnitario);
    }, 0);
  }

  /**
   * Marcar como recepcionado
   */
  marcarComoRecepcionado(): void {
    this.estado = EstadoPedido.RECEPCIONADO;
  }

  /**
   * Cancelar pedido con motivo
   */
  cancelar(motivo: string): void {
    this.estado = EstadoPedido.CANCELADO;
    this.motivoCancelacion = motivo;
  }
}

export { EstadoPedido };
