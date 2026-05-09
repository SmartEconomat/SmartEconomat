import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { Exclude } from 'class-transformer';
import { BaseEntity } from '../../../common/entities/base.entity';
import { EstadoRecepcion } from '../enums/estado-recepcion.enum';
import { Usuario } from '../../usuario/usuario.entity/usuario.entity';
import { RecepcionPedido } from '../recepcion-pedido.entity/recepcion-pedido.entity';
import { RecepcionProducto } from '../recepcion-productos.entity/recepcion-producto.entity';

/**
 * Representa recepcion en el sistema.
 */
@Entity({ name: 'recepcion' })
@Index(['usuarioId'])
@Index(['fechaRecepcion'])
@Index(['estado'])
export class Recepcion extends BaseEntity {
  @Column({ name: 'usuario_id', nullable: true })
  usuarioId?: string;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @Exclude()
  @ManyToOne(() => Usuario, (usuario) => usuario.recepciones, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'usuario_id' })
  usuario?: Relation<Usuario>;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @Column({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
    name: 'fecha_recepcion',
  })
  fechaRecepcion!: Date;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @Column({
    type: 'enum',
    enum: EstadoRecepcion,
    default: EstadoRecepcion.COMPLETADA,
  })
  estado!: EstadoRecepcion;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @Column({ type: 'text', nullable: true })
  observaciones?: string;
  @Column({ default: false })
  incidencia: boolean;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @OneToMany(() => RecepcionPedido, (rp) => rp.recepcion, {
    cascade: true,
  })
  recepcionesPedidos!: Relation<RecepcionPedido[]>;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @OneToMany(() => RecepcionProducto, (rp) => rp.recepcion, {
    cascade: true,
  })
  recepcionProductos!: Relation<RecepcionProducto[]>;
}

export { EstadoRecepcion };
