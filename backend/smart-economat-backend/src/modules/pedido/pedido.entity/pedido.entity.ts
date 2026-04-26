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
 * Documentación en español.
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
        /**
     * Documentación en español.
     */
  @Column({ name: 'numero_global', type: 'bigint', unique: true })
  numeroGlobal!: string;

        /**
     * Documentación en español.
     */
  @Column({ name: 'usuario_id', nullable: true })
  usuarioId?: string;

        /**
     * Documentación en español.
     */
  @Column({ name: 'proveedor_id', nullable: true })
  proveedorId?: string;

        /**
     * Documentación en español.
     */
  @Column({ name: 'batch_id', nullable: true })
  batchId?: string;

        /**
     * Documentación en español.
     */
  @Column({ name: 'pedido_usuario_id', nullable: true })
  pedidoUsuarioId?: string;

        /**
     * Documentación en español.
     */
  @ManyToOne(() => Usuario, (usuario) => usuario.pedidos, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'usuario_id' })
  usuario?: Relation<Usuario>;

        /**
     * Documentación en español.
     */
  @ManyToOne(() => Proveedor, (proveedor) => proveedor.pedidos, {
    nullable: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'proveedor_id' })
  proveedor?: Relation<Proveedor>;

        /**
     * Documentación en español.
     */
  @ManyToOne(() => PurchaseBatch, (batch) => batch.pedidos, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'batch_id' })
  batch?: Relation<PurchaseBatch>;

        /**
     * Documentación en español.
     */
  @ManyToOne(() => PedidoUsuario, (pedidoUsuario) => pedidoUsuario.pedidos, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'pedido_usuario_id' })
  pedidoUsuario?: Relation<PedidoUsuario>;

        /**
     * Documentación en español.
     */
  @Column({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
    name: 'fecha_pedido',
  })
  fechaPedido!: Date;

        /**
     * Documentación en español.
     */
  @Column({ type: 'timestamptz', nullable: true, name: 'fecha_entrega' })
  fechaEntrega?: Date;

        /**
     * Documentación en español.
     */
  @Column({ type: 'text', nullable: true, name: 'observaciones' })
  observaciones?: string;

        /**
     * Documentación en español.
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
     * Documentación en español.
     */
  @Column({
    type: 'enum',
    enum: ESTADO_PEDIDO_DB_VALUES,
    enumName: 'estado_pedido',
    default: EstadoPedido.PENDIENTE_DE_APROBACION,
  })
  estado!: EstadoPedido;

        /**
     * Documentación en español.
     */
  @OneToMany(() => PedidoProducto, (pp) => pp.pedido, {
    cascade: true,
  })
  pedidoProductos!: Relation<PedidoProducto[]>;

        /**
     * Documentación en español.
     */
  @OneToMany(() => RecepcionPedido, (rp) => rp.pedido)
  recepcionesPedido!: Relation<RecepcionPedido[]>;

        /**
     * Documentación en español.
     */
  @Column({ type: 'text', nullable: true, name: 'motivo_cancelacion' })
  motivoCancelacion?: string;

        /**
     * Documentación en español.
     */
  @Column({ type: 'text', nullable: true, name: 'motivo_incidencia' })
  motivoIncidencia?: string;

  /* --- Métodos de Dominio --- */

        /**
     * Documentación en español.
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
     * Documentación en español.
     */
  marcarComoRecepcionado(): void {
    this.estado = EstadoPedido.RECEPCIONADO;
  }

        /**
     * Documentación en español.
     */
  cancelar(motivo: string): void {
    this.estado = EstadoPedido.CANCELADO;
    this.motivoCancelacion = motivo;
  }
}

export { EstadoPedido };
