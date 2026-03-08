import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { EstadoRecepcion } from '../enums/estado-recepcion.enum';
import { Usuario } from '../../usuario/usuario.entity/usuario.entity';
import { RecepcionPedido } from '../recepcion-pedido.entity/recepcion-pedido.entity';
import { RecepcionProducto } from '../recepcion-productos.entity/recepcion-producto.entity';

/**
 * Entidad Recepcion
 *
 * Representa el acto de recepción de mercancía en el almacén.
 * Actúa como AGGREGATE ROOT para la entrada de stock.
 * Puede corresponder a uno o varios pedidos (aunque típicamente uno).
 *
 * @class Recepcion
 * @extends {BaseEntity}
 */
@Entity({ name: 'recepcion' })
@Index(['usuarioId'])
@Index(['fechaRecepcion'])
@Index(['estado'])
export class Recepcion extends BaseEntity {
  @Column({ name: 'usuario_id', nullable: true })
  usuarioId?: string;

  /**
   * Usuario que realiza la recepción.
   * La relación es SET NULL para mantener el histórico.
   * @type {Usuario | null}
   */
  @ManyToOne(() => Usuario, (usuario) => usuario.recepciones, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'usuario_id' })
  usuario?: Relation<Usuario>;

  /**
   * Fecha y hora en que se recibió la mercancía.
   * @type {Date}
   */
  @Column({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
    name: 'fecha_recepcion',
  })
  fechaRecepcion!: Date;

  /**
   * Estado resultante de la recepción, calculado al finalizar la transacción.
   *
   * - COMPLETADA:      Todas las cantidades recibidas coinciden con lo pedido.
   * - PARCIAL:         Al menos un ítem recibido con cantidad inferior a la pedida.
   *                    El pedido vinculado permanece EN_PROCESO.
   * - CON_INCIDENCIAS: Al menos un ítem con diferencia (exceso, falta, cantidad=0).
   *                    Se generan registros en `incidencia` automáticamente.
   *
   * @type {EstadoRecepcion}
   */
  @Column({
    type: 'enum',
    enum: EstadoRecepcion,
    default: EstadoRecepcion.COMPLETADA,
  })
  estado!: EstadoRecepcion;

  /**
   * Observaciones generales sobre la recepción (ej: "Cajas golpeadas").
   * @type {string | undefined}
   */
  @Column({ type: 'text', nullable: true })
  observaciones?: string;

  /**
   * Relación con los pedidos que se están recepcionando.
   */
  @OneToMany(() => RecepcionPedido, (rp) => rp.recepcion, {
    cascade: true,
  })
  recepcionesPedidos!: Relation<RecepcionPedido[]>;

  /**
   * Detalle de los productos recibidos.
   */
  @OneToMany(() => RecepcionProducto, (rp) => rp.recepcion, {
    cascade: true,
  })
  recepcionProductos!: Relation<RecepcionProducto[]>;
}

export { EstadoRecepcion };
