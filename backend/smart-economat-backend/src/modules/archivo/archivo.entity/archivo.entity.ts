import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import type { Relation } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Usuario } from '../../usuario/usuario.entity/usuario.entity';

@Entity({ name: 'archivo' })
export class Archivo extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  nombre!: string;

  @Column({ type: 'varchar', length: 500 })
  url!: string;

  @Column({ type: 'int' })
  tamano!: number;

  @Column({ type: 'varchar', length: 100 })
  mimeType!: string;

  @Index()
  @Column({ type: 'boolean', default: false, name: 'is_deleted' })
  isDeleted!: boolean;

  @Column({ name: 'usuario_id', nullable: true })
  usuarioId?: string;

  @ManyToOne(() => Usuario, (usuario) => usuario.archivos, {
    nullable: true,
  })
  @JoinColumn({ name: 'usuario_id' })
  usuario?: Relation<Usuario>;
}
