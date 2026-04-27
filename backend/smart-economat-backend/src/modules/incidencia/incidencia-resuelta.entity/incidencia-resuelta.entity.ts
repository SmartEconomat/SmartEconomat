import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import type { Relation } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Incidencia } from '../incidencia.entity/incidencia.entity';
import { Usuario } from '../../usuario/usuario.entity/usuario.entity';
import { TipoResolucion } from '../enums/incidencia.enums';

/**
 * Documentación en español.
 */
@Entity({ name: 'incidencia_resuelta' })
@Index(['incidenciaId'])
@Index(['usuarioResolutorId'])
export class IncidenciaResuelta extends BaseEntity {
  @Column({ name: 'incidencia_id' })
  incidenciaId!: string;

  @Column({ name: 'usuario_resolutor_id', nullable: true })
  usuarioResolutorId?: string;

  /**
   * Documentación en español.
   */
  @ManyToOne(() => Incidencia, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'incidencia_id' })
  incidencia!: Relation<Incidencia>;

  /**
   * Documentación en español.
   */
  @ManyToOne(() => Usuario, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'usuario_resolutor_id' })
  usuarioResolutor?: Relation<Usuario>;

  /**
   * Documentación en español.
   */
  @Column({
    type: 'enum',
    enum: TipoResolucion,
    name: 'tipo_resolucion',
  })
  tipoResolucion!: TipoResolucion;

  /**
   * Documentación en español.
   */
  @Column({
    type: 'timestamptz',
    name: 'fecha_resolucion',
  })
  fechaResolucion!: Date;

  /**
   * Documentación en español.
   */
  @Column({ type: 'text', nullable: true })
  observaciones?: string;
}
