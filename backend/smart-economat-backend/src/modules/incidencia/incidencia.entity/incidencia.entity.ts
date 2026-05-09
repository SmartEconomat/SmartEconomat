import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  OneToMany,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Expose } from 'class-transformer';
import { Usuario } from '../../usuario/usuario.entity/usuario.entity';
import { Recepcion } from '../../recepcion/recepcion.entity/recepcion.entity';
import { Pedido } from '../../pedido/pedido.entity/pedido.entity';
import { Proveedor } from '../../proveedor/proveedor.entity/proveedor.entity';
import { IncidenciaLinea } from '../incidencia-linea.entity/incidencia-linea.entity';
import { EstadoIncidencia } from '../enums/incidencia.enums';

/**
 * Entidad que representa una incidencia agrupada por pedido y proveedor.
 */
@Entity({ name: 'incidencia' })
@Index(['recepcionId'])
@Index(['pedidoId'])
@Index(['proveedorId'])
@Index(['usuarioResolutorId'])
export class Incidencia extends BaseEntity {
  @Column({
    type: 'enum',
    enum: EstadoIncidencia,
    default: EstadoIncidencia.ABIERTA,
  })
  estado!: EstadoIncidencia;

  @Column({ name: 'recepcion_id' })
  recepcionId!: string;

  @Column({ name: 'pedido_id' })
  pedidoId!: string;

  @Column({ name: 'proveedor_id', nullable: true })
  proveedorId?: string;

  @Column({ name: 'usuario_resolutor_id', nullable: true })
  usuarioResolutorId?: string;

  /**
   * Recepción que originó la incidencia.
   */
  @ManyToOne(() => Recepcion, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'recepcion_id' })
  recepcion!: Relation<Recepcion>;

  /**
   * Pedido relacionado con la incidencia.
   */
  @ManyToOne(() => Pedido, {
    onDelete: 'RESTRICT',
    nullable: false,
  })
  @JoinColumn({ name: 'pedido_id' })
  pedido!: Relation<Pedido>;

  /**
   * Proveedor relacionado con la incidencia.
   */
  @ManyToOne(() => Proveedor, {
    onDelete: 'RESTRICT',
    nullable: false,
  })
  @JoinColumn({ name: 'proveedor_id' })
  proveedor!: Relation<Proveedor>;

  /**
   * Usuario que resolvió la incidencia.
   */
  @ManyToOne(() => Usuario, (usuario) => usuario.incidenciasResueltas, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'usuario_resolutor_id' })
  usuarioResolutor?: Relation<Usuario>;

  /**
   * Líneas de detalle de la incidencia (una por producto).
   */
  @OneToMany(() => IncidenciaLinea, (linea) => linea.incidencia, {
    cascade: true,
  })
  lineas!: Relation<IncidenciaLinea[]>;

  /**
   * Observaciones capturadas durante la recepción.
   */
  @Column({ type: 'text', nullable: true, name: 'observaciones_recepcion' })
  observacionesRecepcion?: string;

  /**
   * Observaciones añadidas durante la resolución.
   */
  @Column({ type: 'text', nullable: true, name: 'observaciones_resolucion' })
  observacionesResolucion?: string;

  /**
   * Fecha en la que se marcó como resuelta.
   */
  @Column({
    type: 'timestamptz',
    nullable: true,
    name: 'fecha_resolucion',
  })
  fechaResolucion?: Date | null;

  @Expose()
  get proveedorNombre(): string | undefined {
    return this.proveedor?.nombre;
  }

  @Expose()
  get resuelta(): boolean {
    return this.estaResuelta();
  }

  @Expose()
  get motivoIncidencia(): string {
    return this.observacionesRecepcion || '';
  }

  @Expose()
  get cantidadPedidaTotal(): number {
    return (this.lineas || []).reduce(
      (acc, l) => acc + (Number(l.cantidadPedida) || 0),
      0
    );
  }

  @Expose()
  get cantidadRecibidaTotal(): number {
    return (this.lineas || []).reduce(
      (acc, l) => acc + (Number(l.cantidadRecibida) || 0),
      0
    );
  }

  @Expose()
  get cantidadPendienteTotal(): number {
    const total = this.cantidadPedidaTotal - this.cantidadRecibidaTotal;
    return total > 0 ? total : 0;
  }

  /* --- Métodos de Dominio --- */

  /**
   * Marca la incidencia como resuelta.
   */
  /**
   * Expone "resolver" en smart-economat-backend (Nest).
   * @undefined {string} usuarioId - Entrada efectiva esperada por el contrato.
   * @undefined {string | undefined} observaciones - Entrada efectiva esperada por el contrato.
   * @undefined {void} Datos efectivos después de ejecutar la operación.
   */
  resolver(usuarioId: string, observaciones?: string): void {
    this.fechaResolucion = new Date();
    this.usuarioResolutorId = usuarioId;
    this.estado = EstadoIncidencia.RESUELTA;
    if (observaciones) {
      this.observacionesResolucion = observaciones;
    }
  }

  /**
   * Verifica si la incidencia está resuelta.
   */
  /**
   * Expone "estaResuelta" en smart-economat-backend (Nest).
   * @undefined {boolean} Datos efectivos después de ejecutar la operación.
   */
  estaResuelta(): boolean {
    return this.estado === EstadoIncidencia.RESUELTA;
  }
}
