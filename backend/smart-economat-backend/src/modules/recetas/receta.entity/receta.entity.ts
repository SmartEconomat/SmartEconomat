import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
@Entity({ name: 'receta' })
export class Receta {
  @PrimaryGeneratedColumn('uuid', { name: 'id_receta' })
  id!: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  nombre!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  instrucciones?: string;

  @Column({ type: 'varchar', nullable: false })
  tiempoPreparacion!: string;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  CreatedAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  UpdatedAt!: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt?: Date;
}
