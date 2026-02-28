import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
  Check,
  type Relation,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ColumnNumericTransformer } from '../../../common/transformers/column-numeric.transformer';
import { EstadoPedido } from '../enums/estado-pedido.enum';
import type { Usuario } from '../../usuario/usuario.entity/usuario.entity';
import type { RecepcionPedido } from '../../recepcion/recepcion-pedido.entity/recepcion-pedido.entity';
import type { PedidoProducto } from '../pedido-producto.entity/pedido-producto.entity';
import type { Proveedor } from '../../proveedor/proveedor.entity/proveedor.entity';

/**
 * Entidad Pedido
 *
 * Representa una solicitud de compra de productos a proveedores.
 *
 * Flujo de estados:
 * 1. PENDIENTE: Creado, en borrador.
 * 2. EN_PROCESO: Tramitado con el proveedor.
 * 3. RECIBIDO: Mercancía recepcionada correctamente y verificada.
 * 4. INCIDENCIA: Recibido con discrepancias (cantidad/calidad) pendientes de resolución.
 * 5. CANCELADO: Pedido anulado antes de completarse.
 *
 * @class Pedido
 * @extends {BaseEntity}
 */
@Entity({ name: 'pedido' })
@Index('idx_pedido_estado', ['estado'])
@Index('idx_pedido_fecha', ['fechaPedido'])
@Index('idx_pedido_usuario', ['usuario'])
@Index('idx_pedido_proveedor', ['proveedor'])
@Index('idx_pedido_estado_created', ['estado', 'createdAt'])
@Check(`"coste_total" >= 0`)
export class Pedido extends BaseEntity {
  /**
   * Usuario que creó el pedido.
   * La relación es SET NULL para mantener histórico si el usuario se borra.
   * @type {Usuario | null}
   */
  @ManyToOne('Usuario', (usuario: Usuario) => usuario.pedidos, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'id_usuario', referencedColumnName: 'id' })
  usuario?: Relation<Usuario> | null;

  /**
   * Proveedor al que se realiza el pedido.
   * Obligatorio para trazar reclamaciones y facturación.
   */
  @ManyToOne('Proveedor', (proveedor: Proveedor) => proveedor.pedidos, {
    nullable: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'id_proveedor', referencedColumnName: 'id' })
  proveedor?: Relation<Proveedor> | null;

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
   * Fecha esperada o real de entrega.
   * @type {Date | undefined}
   */
  @Column({ type: 'timestamptz', nullable: true, name: 'fecha_entrega' })
  fechaEntrega?: Date;

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
    enum: EstadoPedido,
    default: EstadoPedido.PENDIENTE,
  })
  estado!: EstadoPedido;

  /**
   * Líneas de detalle del pedido (productos, cantidades, precios).
   */
  @OneToMany('PedidoProducto', (pp: PedidoProducto) => pp.pedido, {
    cascade: true,
  })
  pedidoProductos!: Relation<PedidoProducto[]>;

  /**
   * Relación con las recepciones que se han hecho de este pedido.
   * Puede haber múltiples recepciones para un solo pedido (entregas parciales).
   */
  @OneToMany('RecepcionPedido', (rp: RecepcionPedido) => rp.pedido)
  recepcionesPedido!: Relation<RecepcionPedido[]>;

  /**
   * Motivo de cancelación (solo si estado === CANCELADO).
   * @type {string | undefined}
   */
  @Column({ type: 'text', nullable: true, name: 'motivo_cancelacion' })
  motivoCancelacion?: string;

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
   * Marcar como entregado
   */
  marcarComoEntregado(): void {
    this.estado = EstadoPedido.RECIBIDO;
    this.fechaEntrega = new Date();
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
