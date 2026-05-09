import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import type { Relation } from 'typeorm';
import type { AlumnoSlot } from './alumno-slot.entity';
import type { Ubicacion } from '../../ubicacion/ubicacion.entity/ubicacion.entity';

/**
 * Contexto educativo: ubicaciones relacionadas con un slot de clase
 * para prácticas, picking o filtros desde el mundo logístico.
 */
@Entity({ name: 'alumno_slot_ubicacion' })
export class AlumnoSlotUbicacion {
  @PrimaryColumn('uuid', { name: 'alumno_slot_id' })
  alumnoSlotId!: string;

  @PrimaryColumn('uuid', { name: 'ubicacion_id' })
  ubicacionId!: string;

  @ManyToOne('alumno_slot', 'slotUbicaciones', {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'alumno_slot_id' })
  alumnoSlot!: Relation<AlumnoSlot>;

  @ManyToOne('ubicacion', 'alumnoSlotUbicaciones', {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'ubicacion_id' })
  ubicacion!: Relation<Ubicacion>;

  @Column({ name: 'puede_consultar', default: true })
  puedeConsultar!: boolean;

  @Column({ name: 'scope_metadatos', type: 'jsonb', nullable: true })
  scopeMetadatos?: Record<string, unknown> | null;
}
