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
 * Representa pedido en el sistema.
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
@Index(['idempotencyKey'], {
  unique: true,
  where: '"idempotency_key" IS NOT NULL',
})
@Check(`"coste_total" >= 0`)
export class Pedido extends BaseEntity {
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @Column({ name: 'numero_global', type: 'bigint', unique: true })
  numeroGlobal!: string;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @Column({ name: 'usuario_id', nullable: true })
  usuarioId?: string;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @Column({ name: 'proveedor_id', nullable: true })
  proveedorId?: string;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @Column({ name: 'batch_id', nullable: true })
  batchId?: string;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @Column({ name: 'pedido_usuario_id', nullable: true })
  pedidoUsuarioId?: string;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @ManyToOne(() => Usuario, (usuario) => usuario.pedidos, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'usuario_id' })
  usuario?: Relation<Usuario>;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @ManyToOne(() => Proveedor, (proveedor) => proveedor.pedidos, {
    nullable: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'proveedor_id' })
  proveedor?: Relation<Proveedor>;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @ManyToOne(() => PurchaseBatch, (batch) => batch.pedidos, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'batch_id' })
  batch?: Relation<PurchaseBatch>;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @ManyToOne(() => PedidoUsuario, (pedidoUsuario) => pedidoUsuario.pedidos, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'pedido_usuario_id' })
  pedidoUsuario?: Relation<PedidoUsuario>;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @Column({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
    name: 'fecha_pedido',
  })
  fechaPedido!: Date;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @Column({ type: 'timestamptz', nullable: true, name: 'fecha_entrega' })
  fechaEntrega?: Date;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @Column({ type: 'text', nullable: true, name: 'observaciones' })
  observaciones?: string;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
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
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @Column({
    type: 'enum',
    enum: ESTADO_PEDIDO_DB_VALUES,
    enumName: 'estado_pedido',
    default: EstadoPedido.PENDIENTE_DE_APROBACION,
  })
  estado!: EstadoPedido;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @OneToMany(() => PedidoProducto, (pp) => pp.pedido, {
    cascade: true,
  })
  pedidoProductos!: Relation<PedidoProducto[]>;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @OneToMany(() => RecepcionPedido, (rp) => rp.pedido)
  recepcionesPedido!: Relation<RecepcionPedido[]>;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @Column({ type: 'text', nullable: true, name: 'motivo_cancelacion' })
  motivoCancelacion?: string;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @Column({ type: 'text', nullable: true, name: 'motivo_incidencia' })
  motivoIncidencia?: string;

  /* --- Métodos de Dominio --- */

  /**
   * Ejecuta la lógica de calcular total dentro del flujo de la aplicación.
   * @returns Valor resultante de la operación.
   */
  /**
   * Expone "calcularTotal" en smart-economat-backend (Nest).
   * @undefined {number} Datos efectivos después de ejecutar la operación.
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
   * Ejecuta la lógica de marcar como recepcionado dentro del flujo de la aplicación.
   */
  /**
   * Expone "marcarComoRecepcionado" en smart-economat-backend (Nest).
   * @undefined {void} Datos efectivos después de ejecutar la operación.
   */
  marcarComoRecepcionado(): void {
    this.estado = EstadoPedido.RECEPCIONADO;
  }

  /**
   * Determina si cancelar.
   *
   * @param motivo Parámetro de entrada para la operación.
   */
  /**
   * Expone "cancelar" en smart-economat-backend (Nest).
   * @undefined {string} motivo - Entrada efectiva esperada por el contrato.
   * @undefined {void} Datos efectivos después de ejecutar la operación.
   */
  cancelar(motivo: string): void {
    this.estado = EstadoPedido.CANCELADO;
    this.motivoCancelacion = motivo;
  }

  /** Clave de idempotencia opcional. Si se envía, un segundo intento con la misma clave devuelve el pedido existente. */
  @Column({
    name: 'idempotency_key',
    type: 'uuid',
    nullable: true,
    unique: true,
  })
  idempotencyKey?: string;
}

export { EstadoPedido };
