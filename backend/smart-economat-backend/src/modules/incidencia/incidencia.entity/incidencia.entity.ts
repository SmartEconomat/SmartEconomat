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
import { Usuario } from '../../usuario/usuario.entity/usuario.entity';
import { Recepcion } from '../../recepcion/recepcion.entity/recepcion.entity';
import { Pedido } from '../../pedido/pedido.entity/pedido.entity';
import { IncidenciaLinea } from '../incidencia-linea.entity/incidencia-linea.entity';

/**
 * Entidad Incidencia
 *
 * Representa un problema o discrepancia detectada durante la recepción de un pedido.
 * Almacena una copia inmutable de los datos originales (JSONB) para auditoría.
 * Permite registrar la resolución y el usuario responsable.
 *
 * Optimización: Utiliza índice GIN en datos_originales para consultas eficientes sobre el JSON.
 *
 * @class Incidencia
 * @extends {BaseEntity}
 */
@Entity({ name: 'incidencia' })
@Index(['recepcionId'])
@Index(['pedidoId'])
@Index(['usuarioResolutorId'])
export class Incidencia extends BaseEntity {
  @Column({ name: 'recepcion_id' })
  recepcionId!: string;

  @Column({ name: 'pedido_id', nullable: true })
  pedidoId?: string;

  @Column({ name: 'usuario_resolutor_id', nullable: true })
  usuarioResolutorId?: string;

  /**
   * Recepción donde se generó la incidencia.
   * CASCADE onDelete: Si se borra la recepción, es lógico eliminar sus incidencias.
   */
  @ManyToOne(() => Recepcion, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'recepcion_id' })
  recepcion!: Relation<Recepcion>;

  /**
   * Pedido en el que se detectó la discrepancia.
   * Esto vincula la incidencia directamente con un proveedor.
   */
  @ManyToOne(() => Pedido, {
    onDelete: 'RESTRICT',
    nullable: true,
  })
  @JoinColumn({ name: 'pedido_id' })
  pedido?: Relation<Pedido>;

  /**
   * Usuario que resolvió la incidencia.
   * La relación es SET NULL para mantener el histórico de resolución.
   * @type {Usuario | null}
   */
  @ManyToOne(() => Usuario, (usuario) => usuario.incidenciasResueltas, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'usuario_resolutor_id' })
  usuarioResolutor?: Relation<Usuario>;

  /**
   * Líneas de discrepancia detectadas. Relación con IncidenciaLinea.
   */
  @OneToMany(() => IncidenciaLinea, (linea) => linea.incidencia, {
    cascade: true,
  })
  lineas!: Relation<IncidenciaLinea[]>;

  /**
   * Observaciones generales de la recepción relativas a esta incidencia.
   */
  @Column({ type: 'text', nullable: true, name: 'observaciones_recepcion' })
  observacionesRecepcion?: string;

  /**
   * Notas o comentarios añadidos al resolver la incidencia.
   * @type {string | undefined}
   */
  @Column({ type: 'text', nullable: true, name: 'observaciones_resolucion' })
  observacionesResolucion?: string;

  /**
   * Fecha y hora en la que se resolvió la incidencia.
   * Null indica que la incidencia está PENDIENTE.
   * @type {Date | null}
   */
  @Column({
    type: 'timestamptz',
    nullable: true,
    name: 'fecha_resolucion',
  })
  fechaResolucion?: Date | null;

  /* --- Métodos de Dominio --- */

  /**
   * Marca la incidencia como resuelta, asignando fecha, responsable y observaciones.
   *
   * @param {string} usuarioId - ID del usuario que resuelve.
   * @param {string} [observaciones] - Comentarios opcionales sobre la resolución.
   */
  resolver(usuarioId: string, observaciones?: string): void {
    this.fechaResolucion = new Date();
    this.usuarioResolutorId = usuarioId;
    if (observaciones) {
      this.observacionesResolucion = observaciones;
    }
  }

  /**
   * Verifica si la incidencia ya ha sido resuelta.
   * @returns {boolean} True si tiene fecha de resolución.
   */
  estaResuelta(): boolean {
    return this.fechaResolucion !== null && this.fechaResolucion !== undefined;
  }
}
