import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  OneToMany,
  OneToOne,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Usuario } from '../../usuario/usuario.entity/usuario.entity';
import { Recepcion } from '../../recepcion/recepcion.entity/recepcion.entity';
import { Pedido } from '../../pedido/pedido.entity/pedido.entity';
import { IncidenciaLinea } from '../incidencia-linea.entity/incidencia-linea.entity';
import { RecepcionProducto } from '../../recepcion/recepcion-productos.entity/recepcion-producto.entity';
import { EstadoIncidencia } from '../enums/incidencia.enums';

/**
 * Documentación en español.
 */
@Entity({ name: 'incidencia' })
@Index(['recepcionId'])
@Index(['pedidoId'])
@Index(['usuarioResolutorId'])
export class Incidencia extends BaseEntity {
  /**
   * Documentación en español.
   */
  estado?: EstadoIncidencia;
  resuelta?: boolean;

  @Column({ name: 'recepcion_id' })
  recepcionId!: string;

  @Column({ name: 'pedido_id', nullable: true })
  pedidoId?: string;

  @Column({ name: 'usuario_resolutor_id', nullable: true })
  usuarioResolutorId?: string;

  /**
   * Documentación en español.
   */
  @ManyToOne(() => Recepcion, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'recepcion_id' })
  recepcion!: Relation<Recepcion>;

  /**
   * Documentación en español.
   */
  @ManyToOne(() => Pedido, {
    onDelete: 'RESTRICT',
    nullable: true,
  })
  @JoinColumn({ name: 'pedido_id' })
  pedido?: Relation<Pedido>;

  /**
   * Documentación en español.
   */
  @ManyToOne(() => Usuario, (usuario) => usuario.incidenciasResueltas, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'usuario_resolutor_id' })
  usuarioResolutor?: Relation<Usuario>;

  /**
   * Documentación en español.
   */
  @OneToMany(() => IncidenciaLinea, (linea) => linea.incidencia, {
    cascade: true,
  })
  lineas!: Relation<IncidenciaLinea[]>;

  @OneToOne(
    () => RecepcionProducto,
    (recepcionProducto) => recepcionProducto.incidencia
  )
  recepcionProducto?: Relation<RecepcionProducto>;

  /**
   * Documentación en español.
   */
  @Column({ type: 'text', nullable: true, name: 'observaciones_recepcion' })
  observacionesRecepcion?: string;

  /**
   * Documentación en español.
   */
  @Column({ type: 'text', nullable: true, name: 'observaciones_resolucion' })
  observacionesResolucion?: string;

  /**
   * Documentación en español.
   */
  @Column({
    type: 'timestamptz',
    nullable: true,
    name: 'fecha_resolucion',
  })
  fechaResolucion?: Date | null;

  /* --- Métodos de Dominio --- */

  /**
   * Documentación en español.
   */
  resolver(usuarioId: string, observaciones?: string): void {
    this.fechaResolucion = new Date();
    this.usuarioResolutorId = usuarioId;
    if (observaciones) {
      this.observacionesResolucion = observaciones;
    }
  }

  /**
   * Documentación en español.
   */
  estaResuelta(): boolean {
    return this.fechaResolucion !== null && this.fechaResolucion !== undefined;
  }
}
