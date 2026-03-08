import { Entity, Column, OneToMany } from 'typeorm';
import type { Relation } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Inventario } from '../../inventario/inventario.entity/inventario.entity';

@Entity({ name: 'ubicacion' })
export class Ubicacion extends BaseEntity {
  @Column({ type: 'varchar', length: 150, unique: true })
  nombre!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  descripcion?: string;

  @OneToMany(() => Inventario, (inventario) => inventario.ubicacion)
  inventarios!: Relation<Inventario[]>;
}
