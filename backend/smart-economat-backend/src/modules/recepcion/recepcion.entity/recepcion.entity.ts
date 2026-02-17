import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
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
@Index('idx_recepcion_usuario', ['usuario'])
@Index('idx_recepcion_fecha', ['fechaRecepcion'])
export class Recepcion extends BaseEntity {
  /**
   * Usuario que realiza la recepción.
   * La relación es SET NULL para mantener el histórico.
   * @type {Usuario | null}
   */
  @ManyToOne(() => Usuario, (usuario) => usuario.recepciones, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'id_usuario', referencedColumnName: 'id' })
  usuario?: Usuario | null;

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
   * Observaciones generales sobre la recepción (ej: "Cajas golpeadas").
   * @type {string | undefined}
   */
  @Column({ type: 'text', nullable: true })
  observaciones?: string;

  /**
   * Relación con los pedidos que se están recepcionando.
   */
  @OneToMany(() => RecepcionPedido, (rp) => rp.recepcion, { cascade: true })
  recepcionesPedidos!: RecepcionPedido[];

  /**
   * Detalle de los productos recibidos.
   */
  @OneToMany(() => RecepcionProducto, (rp) => rp.recepcion, { cascade: true })
  recepcionProductos!: RecepcionProducto[];
}
