import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Incidencia } from '../incidencia.entity/incidencia.entity';
import { Usuario } from '../../usuario/usuario.entity/usuario.entity';
import { TipoResolucion } from '../enums/incidencia.enums';

/**
 * Entidad IncidenciaResuelta
 *
 * Registra el detalle de la resolución de una incidencia.
 * Cada incidencia puede tener como máximo una resolución.
 * Mantiene el histórico del usuario responsable y el tipo de resolución aplicada.
 *
 * @class IncidenciaResuelta
 * @extends {BaseEntity}
 */
@Entity({ name: 'incidencia_resuelta' })
@Index('idx_incidencia_resuelta_incidencia', ['incidencia'])
@Index('idx_incidencia_resuelta_usuario', ['usuarioResolutor'])
export class IncidenciaResuelta extends BaseEntity {
  /**
   * Incidencia a la que pertenece esta resolución.
   * CASCADE onDelete: si se borra la incidencia, se elimina su resolución.
   */
  @ManyToOne(() => Incidencia, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'id_incidencia' })
  incidencia!: Incidencia;

  /**
   * Usuario que realizó la resolución.
   * SET NULL para mantener el histórico aunque el usuario sea eliminado.
   */
  @ManyToOne(() => Usuario, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'id_usuario_resolutor' })
  usuarioResolutor?: Usuario | null;

  /**
   * Tipo de resolución aplicada (aceptada, rechazada, parcial, devolución).
   */
  @Column({
    type: 'enum',
    enum: TipoResolucion,
    name: 'tipo_resolucion',
  })
  tipoResolucion!: TipoResolucion;

  /**
   * Fecha y hora en la que se registró la resolución.
   */
  @Column({
    type: 'timestamptz',
    name: 'fecha_resolucion',
  })
  fechaResolucion!: Date;

  /**
   * Observaciones opcionales sobre la resolución.
   */
  @Column({ type: 'text', nullable: true })
  observaciones?: string;
}
