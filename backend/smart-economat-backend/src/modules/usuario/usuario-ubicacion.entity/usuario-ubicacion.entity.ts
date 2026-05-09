import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import type { Relation } from 'typeorm';
import type { Usuario } from '../usuario.entity/usuario.entity';
import type { Ubicacion } from '../../ubicacion/ubicacion.entity/ubicacion.entity';

/**
 * Pivot usuario ↔ ubicación: acceso granular (consulta / transferencia) y marcador UX
 * de ubicación predeterminada operativa — no implica ownership del nodo físico.
 *
 * Referencias por nombre de entidad para evitar imports circulares con `Usuario`.
 */
@Entity({ name: 'usuario_ubicacion' })
export class UsuarioUbicacion {
  @PrimaryColumn('uuid', { name: 'usuario_id' })
  usuarioId!: string;

  @PrimaryColumn('uuid', { name: 'ubicacion_id' })
  ubicacionId!: string;

  @ManyToOne('usuario', 'usuarioUbicaciones', {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'usuario_id' })
  usuario!: Relation<Usuario>;

  @ManyToOne('ubicacion', 'usuarioUbicaciones', {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'ubicacion_id' })
  ubicacion!: Relation<Ubicacion>;

  @Column({ name: 'puede_consultar', default: true })
  puedeConsultar!: boolean;

  @Column({ name: 'puede_transferir', default: true })
  puedeTransferir!: boolean;

  @Column({ name: 'es_ubicacion_predeterminada', default: false })
  esUbicacionPredeterminada!: boolean;

  @Column({ name: 'scope_metadatos', type: 'jsonb', nullable: true })
  scopeMetadatos?: Record<string, unknown> | null;
}
