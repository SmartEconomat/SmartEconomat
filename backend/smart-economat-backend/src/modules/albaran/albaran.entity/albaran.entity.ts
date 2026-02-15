import {
  Entity,
  PrimaryColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { AlbaranPedidoRecepcion } from '../albaran-pedido-recepcion.entity/albaran-pedido-recepcion.entity';

@Entity('albaran')
export class Albaran {
  @PrimaryColumn('uuid', {
    name: 'id_albaran',
    default: () => 'uuid_generate_v7()',
  })
  readonly id!: string;

  @Column({ name: 'n_albaran', type: 'varchar', length: 50 })
  nAlbaran: string;

  @Column({ type: 'boolean', nullable: true })
  concordancia: boolean;

  @Column({ type: 'date', nullable: true })
  fecha: Date;

  @OneToMany(() => AlbaranPedidoRecepcion, (apr) => apr.albaran)
  albaranPedidoRecepcion: AlbaranPedidoRecepcion[];

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  readonly createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  readonly updatedAt!: Date;

  @DeleteDateColumn({ type: 'timestamptz', name: 'deleted_at' })
  deletedAt?: Date;
}
