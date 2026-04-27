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
 * Documentación en español.
 */
@Entity({ name: 'recepcion' })
@Index(['usuarioId'])
@Index(['fechaRecepcion'])
@Index(['estado'])
export class Recepcion extends BaseEntity {
  @Column({ name: 'usuario_id', nullable: true })
  usuarioId?: string;

  /**
   * Documentación en español.
   */
  @Exclude()
  @ManyToOne(() => Usuario, (usuario) => usuario.recepciones, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'usuario_id' })
  usuario?: Relation<Usuario>;

  /**
   * Documentación en español.
   */
  @Column({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
    name: 'fecha_recepcion',
  })
  fechaRecepcion!: Date;

  /**
   * Documentación en español.
   */
  @Column({
    type: 'enum',
    enum: EstadoRecepcion,
    default: EstadoRecepcion.COMPLETADA,
  })
  estado!: EstadoRecepcion;

  /**
   * Documentación en español.
   */
  @Column({ type: 'text', nullable: true })
  observaciones?: string;
  @Column({ default: false })
  incidencia: boolean;

  /**
   * Documentación en español.
   */
  @OneToMany(() => RecepcionPedido, (rp) => rp.recepcion, {
    cascade: true,
  })
  recepcionesPedidos!: Relation<RecepcionPedido[]>;

  /**
   * Documentación en español.
   */
  @OneToMany(() => RecepcionProducto, (rp) => rp.recepcion, {
    cascade: true,
  })
  recepcionProductos!: Relation<RecepcionProducto[]>;
}

export { EstadoRecepcion };
