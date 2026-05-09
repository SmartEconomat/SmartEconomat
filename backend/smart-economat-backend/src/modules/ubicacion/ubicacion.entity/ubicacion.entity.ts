import { Entity, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import type { Relation } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Inventario } from '../../inventario/inventario.entity/inventario.entity';
import { UsuarioUbicacion } from '../../usuario/usuario-ubicacion.entity/usuario-ubicacion.entity';
import { AlumnoSlotUbicacion } from '../../profesor/profesor.entity/alumno-slot-ubicacion.entity';
import { TipoUbicacion } from '../enums/tipo-ubicacion.enum';

/** Nodo logístico organizacional (almacén jerárquico, virtual o físico). */
@Entity({ name: 'ubicacion' })
export class Ubicacion extends BaseEntity {
  @Column({ type: 'varchar', length: 150, unique: true })
  nombre!: string;

  @Column({ type: 'varchar', length: 64, unique: true })
  codigo!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  descripcion?: string;

  @Column({ name: 'parent_id', nullable: true })
  parentId?: string | null;

  @ManyToOne(() => Ubicacion, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'parent_id' })
  parent?: Relation<Ubicacion>;

  @Column({ name: 'organizacion_id', type: 'uuid', nullable: true })
  organizacionId?: string | null;

  @Column({
    type: 'varchar',
    length: 40,
    default: TipoUbicacion.ALMACEN_GENERAL,
  })
  tipo!: TipoUbicacion;

  @Column({ name: 'es_virtual', default: false })
  esVirtual!: boolean;

  @Column({ default: true })
  activa!: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: object | null;

  @OneToMany(() => Inventario, (inventario) => inventario.ubicacion)
  inventarios!: Relation<Inventario[]>;

  @OneToMany(() => UsuarioUbicacion, (uu) => uu.ubicacion)
  usuarioUbicaciones?: Relation<UsuarioUbicacion[]>;

  @OneToMany(() => AlumnoSlotUbicacion, (su) => su.ubicacion)
  alumnoSlotUbicaciones?: Relation<AlumnoSlotUbicacion[]>;
}
