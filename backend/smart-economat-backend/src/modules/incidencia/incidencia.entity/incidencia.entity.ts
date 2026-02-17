import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Usuario } from '../../usuario/usuario.entity/usuario.entity';
import { Recepcion } from '../../recepcion/recepcion.entity/recepcion.entity';

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
@Index('idx_incidencia_recepcion', ['recepcion'])
@Index('idx_incidencia_usuario_resolutor', ['usuarioResolutor'])
export class Incidencia extends BaseEntity {
  /**
   * Recepción donde se generó la incidencia.
   * CASCADE onDelete: Si se borra la recepción, es lógico eliminar sus incidencias.
   */
  @ManyToOne(() => Recepcion, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'id_recepcion' })
  recepcion!: Recepcion;

  /**
   * Usuario que resolvió la incidencia.
   * La relación es SET NULL para mantener el histórico de resolución.
   * @type {Usuario | null}
   */
  @ManyToOne(() => Usuario, (usuario) => usuario.incidenciasResueltas, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'id_usuario_resolutor' })
  usuarioResolutor?: Usuario | null;

  /**
   * Instantánea de los datos que generaron la incidencia (discrepancias).
   * Almacenado como JSONB para flexibilidad y auditoría inmutable.
   * Estructura:
   * {
   *   productos: Array<{
   *     idPedidoProducto: string,
   *     cantidadPedida: number,
   *     cantidadRecibida: number,
   *     diferencia: number,
   *     observaciones?: string
   *   }>,
   *   observacionesRecepcion?: string
   * }
   */
  @Column({ type: 'jsonb', name: 'datos_originales' })
  datosOriginales!: {
    productos: {
      idPedidoProducto: string;
      cantidadPedida: number;
      cantidadRecibida: number;
      diferencia: number;
      observaciones?: string;
    }[];
    observacionesRecepcion?: string;
  };

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
    this.usuarioResolutor = { id: usuarioId } as Usuario;
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
